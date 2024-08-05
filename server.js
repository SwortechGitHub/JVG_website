require("dotenv").config();

const fastify = require("fastify")({logger: {level: "error"}});
const ejs = require("ejs");
const NodeCache = require("node-cache");
const path = require("path");
const fastifyStatic = require("@fastify/static");
const fastifyFormbody = require("@fastify/formbody");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Import the mongodb models
const Users = require("./schemas/user");
const Blogs = require("./schemas/blog");
const Pages = require("./schemas/page");

// Middleware
const isAuthorized = require("./middleware/authorization");
const isAuthenticated = require("./middleware/authentication");

// Website data
let serverStartTime = new Date();
const NOT_FOUND_ROUTES_LIMIT = 30;
let notFoundRoutes = [];
const requestCounts = [
	{title: "Home", oldviews: 0, views: 0, changes: 0, updated: ""},
	{title: "Par skolu", oldviews: 0, views: 0, changes: 0, updated: ""},
	{title: "Ziņas", oldviews: 0, views: 0, changes: 0, updated: ""},
	{title: "Mācības", oldviews: 0, views: 0, changes: 0, updated: ""},
	{title: "Darbinieki", oldviews: 0, views: 0, changes: 0, updated: ""},
	{title: "Skolēniem", oldviews: 0, views: 0, changes: 0, updated: ""},
];

// Connect to MongoDB database
mongoose
	.connect(process.env.MONGODB_URI)
	.then(() => {
		console.log("Connected to MongoDB");
	})
	.catch((e) => {
		console.error("Error connecting to MongoDB:", e);
		process.exit(1); // Exit the process if unable to connect to MongoDB
	});

// Initialize the cache
const cache = new NodeCache();

// Function to handle rendering and caching
const renderAndCache = async (reply, cacheKey, Section) => {
	const cachedHtml = cache.get(cacheKey);

	if (cachedHtml) {
		// Serve cached page
		reply.type("text/html").send(cachedHtml);
	} else {
		try {
			const pages = await Pages.find({Section}, "_id Order Title Text Type")
				.sort({Order: 1})
				.exec();
			// Render page and cache it
			ejs.renderFile("views/frame.ejs", {pages}, {}, (err, str) => {
				if (err) {
					reply.status(500).send(`Error rendering EJS: ${err}`);
				} else {
					cache.set(cacheKey, str);
					reply.type("text/html").send(str);
				}
			});
		} catch (err) {
			reply.status(500).send(`Error fetching pages: ${err}`);
		}
	}
};

// Serve static files
fastify.register(fastifyStatic, {
	root: path.join(__dirname, "public"),
	prefix: "/public/", // optional: default '/'
});

// Register the formbody plugin to parse URL-encoded form data
fastify.register(fastifyFormbody);

// Function to update view counts
function updateViewsCount(title) {
	const page = requestCounts.find((page) => page.title === title);
	if (page) {
		page.views++;
		// page.changes = views - oldViews;
	}
}

//-------------------------------------------------------------------------------------Define routes
fastify.get("/", (req, reply) => {
	updateViewsCount("Home");
	renderAndCache(reply, "Home", "Home");
});

fastify.get("/parskolu", (req, reply) => {
	updateViewsCount("Par skolu");
	renderAndCache(reply, "Par skolu", "Par skolu");
});

fastify.get("/macibas", (req, reply) => {
	updateViewsCount("Mācības");
	renderAndCache(reply, "Mācības", "Mācības");
});

fastify.get("/darbinieki", (req, reply) => {
	updateViewsCount("Darbinieki");
	renderAndCache(reply, "Darbinieki", "Darbinieki");
});

fastify.get("/skoleniem", (req, reply) => {
	updateViewsCount("Skolēniem");
	renderAndCache(reply, "Skolēniem", "Skolēniem");
});

fastify.get("/zinas/:id?", async (req, reply) => {
	try {
		const blogId = req.params.id;

		if (blogId) {
			// Fetch a specific blog by ID
			const blog = await Blogs.findById(blogId).exec();
			if (!blog) {
				console.log("Blog not found");
				return reply.status(404).send({message: "Blog not found"});
			}

			// Render the blog content
			ejs.renderFile("views/news_frame.ejs", {blog}, {}, (err, str) => {
				if (err) {
					reply.status(500).send(`Error rendering EJS: ${err}`);
				} else {
					reply.type("text/html").send(str);
				}
			});
		} else {
			// Render the list of blogs
			ejs.renderFile("views/news_frame.ejs", {}, {}, (err, str) => {
				if (err) {
					reply.status(500).send(`Error rendering EJS: ${err}`);
				} else {
					reply.type("text/html").send(str);
				}
			});
		}
	} catch (err) {
		console.error(err);
		reply.status(500).send("Internal Server Error");
	}
});

fastify.get("/zinas-data", async (req, reply) => {
	try {
		const page = parseInt(req.query.page, 10) || 1;
		const limit = parseInt(req.query.limit, 10) || 8;
		const skip = (page - 1) * limit;

		const blogs = await Blogs.find({Published: true})
			.sort({Date: -1})
			.skip(skip)
			.limit(limit)
			.exec();
		reply.type("application/json").send(blogs);
	} catch (err) {
		console.error(err);
		reply.status(500).type("application/json").send("");
	}
});

//--------------------------------------------------------------------------------------Admin routes
const fastifySecureSession = require("@fastify/secure-session");

// Define your session secret and options
const sessionSecret = process.env.SESSION_SECRET;

// Register the session plugin
fastify.register(fastifySecureSession, {
	cookie: {
		path: "/",
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
	},
	secret: sessionSecret,
	saveUninitialized: false,
	resave: false,
});

fastify.post("/logout", (req, reply) => {
	req.session.user = null;
	reply.redirect("/");
});

fastify.get("/login", (req, reply) => {
	ejs.renderFile("views/login.ejs", {}, {}, (err, str) => {
		if (err) {
			reply.status(500).send(`Error rendering EJS: ${err}`);
		} else {
			reply.type("text/html").send(str);
		}
	});
});

fastify.post("/login", async (req, reply) => {
	const {username, password} = req.body;

	try {
		const user = await Users.findOne({username}).exec();
		if (!user || !bcrypt.compare(password, user.password)) {
			reply.status(401).send({error: "Invalid credentials"});
			return;
		}

		req.session.user = user;
		reply.redirect("/a01d92m83i74n65/dashboard");
	} catch (err) {
		console.error(err);
		reply.status(500).send({error: "Internal Server Error"});
	}
});

fastify.get(
	"/a01d92m83i74n65/dashboard",
	{preHandler: isAuthenticated},
	(req, reply) => {
		ejs.renderFile(
			"views/admin.ejs",
			{
				content: "admin/dashboard",
				ServerUpdateDate: serverStartTime,
				errors: notFoundRoutes,
				pages: requestCounts,
			},
			{},
			(err, str) => {
				if (err) {
					reply.status(500).send(`Error rendering EJS: ${err}`);
				} else {
					reply.type("text/html").send(str);
				}
			},
		);
	},
);

fastify.get(
	"/a01d92m83i74n65/blogs",
	{preHandler: isAuthenticated},
	async (req, reply) => {
		try {
			const blogs = await Blogs.find({}, "_id Title Published Date Type Author")
				.sort({Date: -1})
				.exec();
			ejs.renderFile(
				"views/admin.ejs",
				{
					content: "admin/blogs",
					blogs: blogs,
				},
				{},
				(err, str) => {
					if (err) {
						reply.status(500).send(`Error rendering EJS: ${err}`);
					} else {
						reply.type("text/html").send(str);
					}
				},
			);
		} catch (err) {
			console.error(err);
			reply.status(500).send("Internal Server Error");
		}
	},
);

fastify.get(
	"/a01d92m83i74n65/pages",
	{preHandler: isAuthenticated},
	async (req, reply) => {
		try {
			const pages = await Pages.find(
				{},
				"_id Section Order Title Type Date Author",
			)
				.sort({Order: 1})
				.exec();
			const groupedPages = pages.reduce((acc, page) => {
				if (!acc[page.Section]) {
					acc[page.Section] = [];
				}
				acc[page.Section].push(page);
				return acc;
			}, {});
			ejs.renderFile(
				"views/admin.ejs",
				{
					content: "admin/pages",
					groupedPages,
				},
				{},
				(err, str) => {
					if (err) {
						reply.status(500).send(`Error rendering EJS: ${err}`);
					} else {
						reply.type("text/html").send(str);
					}
				},
			);
		} catch (err) {
			console.error(err);
			reply.status(500).send("Internal Server Error");
		}
	},
);

fastify.get(
	"/a01d92m83i74n65/users",
	{preHandler: isAuthenticated},
	async (req, reply) => {
		try {
			const users = await Users.find();
			const groupedUsers = users.reduce((acc, user) => {
				(acc[user.role] = acc[user.role] || []).push(user);
				return acc;
			}, {});
			ejs.renderFile(
				"views/admin.ejs",
				{
					content: "admin/users",
					groupedUsers,
				},
				{},
				(err, str) => {
					if (err) {
						reply.status(500).send(`Error rendering EJS: ${err}`);
					} else {
						reply.type("text/html").send(str);
					}
				},
			);
		} catch (err) {
			console.error(err);
			reply.status(500).send("Internal Server Error");
		}
	},
);

// Handle form submission
fastify.post("/a01d92m83i74n65/submit-blog", {
	preHandler: isAuthorized(["canMakeBlogs"]),
	handler: async (req, reply) => {
		const {Title, Type, EDate, Date, Image, Content, Publish} = req.body;
		const blog = new Blogs({
			Title: Title,
			Img: Image || "/public/files/images/none.webp",
			Text: Content,
			Published: Publish === "on",
			EventDate: EDate,
			Date: Date,
			Type: Type,
			Author: req.session.user.username,
		});
		try {
			console.log("save");
			await blog.save();
			reply.send({success: true, message: "Form data received"});
		} catch (err) {
			console.error(err);
			reply.status(500).send({error: "Failed to save blog"});
		}
	},
});

fastify.post("/a01d92m83i74n65/submit-page", {
	preHandler: isAuthorized(["canMakePages"]),
	handler: async (req, reply) => {
		const {Title, Section, Type, Image, Content} = req.body;
		try {
			const count = await Pages.countDocuments({Section});
			const order = count + 1;
			const page = new Pages({
				Title: Title,
				Section: Section,
				Type: Type,
				Order: order,
				Img: Image || "/public/files/images/none.webp",
				Text: Content,
				Author: req.session.user.username,
			});
			await page.save();
			cache.del(Section);
			reply.send({success: true, message: "Form data received"});
		} catch (err) {
			console.error(err);
			reply.status(500).send({error: "Failed to save page"});
		}
	},
});

fastify.post("/a01d92m83i74n65/submit-user", {
	preHandler: isAuthorized(["canMakeUsers"]),
	handler: async (request, reply) => {
		try {
			const newUser = new Users(request.body);
			await newUser.save();
			reply.send({success: true, message: "Form data received"});
		} catch (err) {
			reply.status(500).send({status: "error", message: err.message});
		}
	},
});

// Blogs API
fastify.post("/a01d92m83i74n65/api/publishBlog", {
	preHandler: isAuthorized(["canPublishBlogs"]),
	handler: async (req, reply) => {
		const {id, bool} = req.body;
		try {
			const blog = await Blogs.findByIdAndUpdate(
				id,
				{Published: !bool},
				{new: true},
			).exec();
			if (!blog) {
				return reply.status(404).send({message: "Blog not found"});
			}
			reply.send({message: "Blog published successfully", bool: !bool});
		} catch (err) {
			console.error(err);
			reply.status(500).send({message: "Internal Server Error"});
		}
	},
});

fastify.post("/a01d92m83i74n65/api/deleteBlog", {
	preHandler: isAuthorized(["canDeleteBlogs"]),
	handler: async (req, reply) => {
		const {id} = req.body;
		try {
			const blog = await Blogs.findByIdAndDelete(id).exec();
			if (!blog) {
				return reply.status(404).send({message: "Blog not found"});
			}
			reply.send({message: "Blog deleted successfully"});
		} catch (err) {
			console.error(err);
			reply.status(500).send({message: "Internal Server Error"});
		}
	},
});

fastify.post("/a01d92m83i74n65/api/getBlog", {
	preHandler: isAuthorized(["canEditBlogs"]),
	handler: async (req, reply) => {
		const {id} = req.body;
		try {
			const blog = await Blogs.findById(
				id,
				"Title Type EventDate Date Img Text Published",
			).exec();
			if (!blog) {
				return reply.status(404).send({message: "Blog not found"});
			}
			reply.status(200).send(blog);
		} catch (err) {
			console.error(err);
			reply.status(500).send({message: "Internal Server Error"});
		}
	},
});

fastify.post("/a01d92m83i74n65/api/updateBlog", {
	preHandler: isAuthorized(["canEditBlogs"]),
	handler: async (req, reply) => {
		const {id, Title, Type, EDate, Date, Image, Content, Publish} = req.body;
		try {
			const blog = await Blogs.findByIdAndUpdate(
				id,
				{
					Title: Title,
					Img: Image,
					Text: Content,
					Published: Publish === "on",
					EventDate: EDate,
					Date: Date,
					Type: Type,
					Author: req.session.user.username,
				},
				{new: false},
			).exec();
			if (!blog) {
				return reply.status(404).send({message: "Blog not found"});
			}
			reply.send({message: "Blog updated successfully"});
		} catch (err) {
			console.error(err);
			reply.status(500).send({message: "Internal Server Error"});
		}
	},
});

// Catch-all route for 404
fastify.get("*", (req, reply) => {
	const routePath = req.url;
	if (!notFoundRoutes.includes(routePath)) {
		notFoundRoutes.push(routePath);
		if (notFoundRoutes.length > NOT_FOUND_ROUTES_LIMIT) {
			notFoundRoutes.shift(); // Remove the oldest entry
		}
	}
	const pages = [
		{
			Title: "404",
			Text: "<style>aside{display: none;}</style><p>Ierakstītā adrese ir nepareiza. Ja adrese kādreiz bija pareiza, tad neuztraucies, jo adminstrātors ir ziņots.</p>",
		},
	];
	ejs.renderFile("views/frame.ejs", {pages}, {}, (err, str) => {
		if (err) {
			reply.status(500).send(`Error rendering EJS: ${err}`);
		} else {
			reply.type("text/html").send(str);
		}
	});
});

// Start the server
const port = process.env.PORT || 3000;
const start = async () => {
	try {
		fastify.listen({port: port, host: "0.0.0.0"}); // Ensure host is set to '0.0.0.0'
		console.log(`Server listening on: http://localhost:${port}`);
		console.log(`Server started at: ${serverStartTime}`);
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
};
start();
