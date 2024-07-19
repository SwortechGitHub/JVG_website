const fastify = require("fastify")({logger: {level: "error"}});
const ejs = require("ejs");
const NodeCache = require("node-cache");
const path = require("path");
const fastifyStatic = require("@fastify/static");
const fastifyFormbody = require("@fastify/formbody");
const mongoose = require("mongoose");
//System data
const os = require("os");

// Import the mongodb models
const Blogs = require("./schemas/blog");

// Connect to MongoDB database
mongoose
	.connect(
		"mongodb+srv://Server:D9sI5OujpRS3dMuu@schoolwen.ow8o4jw.mongodb.net/?retryWrites=true&w=majority&appName=SchoolWen",
	)
	.then(() => {
		console.log("Connected to MongoDB");
	})
	.catch((e) => {
		console.error("Error connecting to MongoDB:", e);
		server.close();
	});

// Initialize the cache
const cache = new NodeCache();

// Function to handle rendering and caching
const renderAndCache = (reply, cacheKey, content) => {
	const cachedHtml = cache.get(cacheKey);

	if (cachedHtml) {
		// Serve cached page
		reply.type("text/html").send(cachedHtml);
	} else {
		// Render page and cache it
		ejs.renderFile("views/frame.ejs", {content}, {}, (err, str) => {
			if (err) {
				reply.status(500).send(`Error rendering EJS: ${err}`);
			} else {
				cache.set(cacheKey, str);
				reply.type("text/html").send(str);
			}
		});
	}
};

// Serve static files
fastify.register(fastifyStatic, {
	root: path.join(__dirname, "public"),
	prefix: "/public/", // optional: default '/'
});

// Register the formbody plugin to parse URL-encoded form data
fastify.register(fastifyFormbody);

// Define routes
fastify.get("/", (req, reply) => {
	renderAndCache(reply, "homePage", "home");
});

fastify.get("/parskolu", (req, reply) => {
	renderAndCache(reply, "parskoluPage", "parskolu");
});

fastify.get("/zinas", async (req, reply) => {
	try {
		const cachedHtml = cache.get("zinasPage");

		if (cachedHtml) {
			// Serve cached page
			reply.type("text/html").send(cachedHtml);
		} else {
			// Render page and cache it
			ejs.renderFile("views/frame.ejs", {content: "zinas"}, {}, (err, str) => {
				if (err) {
					reply.status(500).send(`Error rendering EJS: ${err}`);
				} else {
					cache.set("zinasPage", str);
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
		const blogs = await Blogs.find({Published: true})
			.sort({Date: -1})
			.limit(5)
			.exec();

		reply.type("application/json").send(blogs);
	} catch (err) {
		console.error(err);
		reply.status(500).type("application/json").send("");
	}
});

// fastify.get("/zina/:id", async (req, reply) => {
// 	try {
// 		const blog = await Blogs.findById(req.params.id).exec();
// 		if (!blog) {
// 			return reply.status(404).send({message: "Blog not found"});
// 		}
// 		ejs.renderFile(
// 			"views/frame.ejs",
// 			{
// 				content: `
// 		<h2>${blog.Title}</h2>
// 		<div>${blog.Text}</div>
// 		<small>${blog.Date}</small>
// 	  `,
// 			},
// 			{},
// 			(err, str) => {
// 				if (err) {
// 					reply.status(500).send(`Error rendering EJS: ${err}`);
// 				} else {
// 					reply.type("text/html").send(str);
// 				}
// 			},
// 		);
// 	} catch (err) {
// 		reply.status(500).send({message: "Internal Server Error"});
// 	}
// });

fastify.get("/macibas", (req, reply) => {
	renderAndCache(reply, "macibasPage", "macibas");
});

fastify.get("/darbinieki", (req, reply) => {
	renderAndCache(reply, "darbiniekiPage", "darbinieki");
});

fastify.get("/skoleniem", (req, reply) => {
	renderAndCache(reply, "skoleniemPage", "skoleniem");
});

fastify.get("/a01d92m83i74n65/dashboard", (req, reply) => {
	ejs.renderFile(
		"views/admin.ejs",
		{content: "admin/dashboard"},
		{},
		(err, str) => {
			if (err) {
				reply.status(500).send(`Error rendering EJS: ${err}`);
			} else {
				reply.type("text/html").send(str);
			}
		},
	);
});

fastify.get("/a01d92m83i74n65/blogs", async (req, reply) => {
	try {
		// Fetch blogs with specified fields and sort by date in descending order
		const blogs = await Blogs.find({}, "Title Publish Date Type Author")
			.sort({Date: -1})
			.exec();

		// Render the EJS template with the blogs data
		ejs.renderFile(
			"views/admin.ejs",
			{content: "admin/blogs", blogs: blogs},
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
});

// Handle form submission
fastify.post("/a01d92m83i74n65/submit-content", (req, reply) => {
	const {Title, Type, EDate, Date, Image, Content, Publish} = req.body;
	const blog = new Blogs({
		Title: Title,
		Img: Image,
		Text: Content,
		Publish: Publish == "on",
		EventDate: EDate,
		Date: Date,
		Type: Type,
		Author: "me",
	});
	console.log(blog);
	blog.save();
	reply.send({success: true, message: "Form data received"});
});

fastify.get("/a01d92m83i74n65/api/cpus", (request, reply) => {
	const cpus = os.cpus().map((cpu) => cpu.speed);
	reply.send(cpus);
});

// Catch-all route for 404
fastify.get("*", (req, reply) => {
	renderAndCache(reply, "404", "404");
});

// Start the server
const port = process.env.PORT || 3000;
const start = async () => {
	try {
		await fastify.listen({port: port, host: "0.0.0.0"}); // Ensure host is set to '0.0.0.0'
		console.log(`Server listening on: http://localhost:${port}`);
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
};
start();
