require("dotenv").config();

const fastify = require("fastify")({logger: {level: "error"}});
const ejs = require("ejs");
const NodeCache = require("node-cache");
const path = require("path");
const fastifyStatic = require("@fastify/static");
const fastifyFormbody = require("@fastify/formbody");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const fs = require("fs");

// Import the MongoDB models
const Users = require("./schemas/user");
const Routes = require("./schemas/routes");

// Middleware
const isAuthorized = require("./middleware/authorization");
const isAuthenticated = require("./middleware/authentication");

// Website data
let serverStartTime = new Date();
const NOT_FOUND_ROUTES_LIMIT = 30;
let notFoundRoutes = [];

// Connect to MongoDB database
const connectWithRetry = () => {
	mongoose
		.connect(process.env.MONGODB_URI, {})
		.then(() => console.log("\x1b[32m", "Connected to MongoDB", "\x1b[37m"))
		.catch((err) => {
			console.error(
				"\x1b[31m",
				"Failed to connect to MongoDB",
				err,
				"\x1b[37m",
			);
		});
};
connectWithRetry();

// Initialize the cache
const cache = new NodeCache();

// Serve static files
fastify.register(fastifyStatic, {
	root: path.join(__dirname, "public"),
	prefix: "/public/", // optional: default '/'
});

// Register the formbody plugin to parse URL-encoded form data
fastify.register(fastifyFormbody);

// Helper function to render EJS templates
const renderEJS = (templateName, data) => {
	const templatePath = path.join(__dirname, "views", templateName);
	return new Promise((resolve, reject) => {
		ejs.renderFile(templatePath, data, {}, (err, str) => {
			if (err) {
				reject(err);
			} else {
				resolve(str);
			}
		});
	});
};

//---------------------------------------------------------------------------------------------Dynamic route

// Define routes
fastify.get("/", (request, reply) => {
	reply.redirect("/Home");
});

fastify.get("/:routeName", async (request, reply) => {
	const routeName = request.params.routeName;

	console.log(routeName);

	// Check if the route is in cache
	let routeData = cache.get(routeName);

	if (!routeData) {
		// Fetch from MongoDB if not in cache
		try {
			routeData = await Routes.findOne({
				Name: routeName,
				IsActive: true,
				IsDeleted: false,
			}).lean();

			if (!routeData) {
				return reply.code(404).send("Route not found");
			}

			// Store in cache
			cache.set(routeName, routeData);
		} catch (err) {
			request.log.error(err);
			return reply.code(500).send("An error occurred");
		}
	}

	// Render the page using EJS
	try {
		const routes = await Routes.find(
			{IsDeleted: false, IsActive: true},
			{Name: 1, _id: 0},
		);
		const html = await renderEJS("frame.ejs", {
			pageTitle: routeData.PageTitle,
			content: routeData.HTML,
			author: routeData.Author,
			routes: routes,
		});
		reply.type("text/html").send(html);
	} catch (err) {
		request.log.error(err);
		reply.code(500).send("An error occurred while rendering the page");
	}
});

//---------------------------------------------------------------------------------------------Admin session

// Admin routes
const fastifySecureSession = require("@fastify/secure-session");

// Define your session secret and options
const sessionSecret = process.env.SESSION_SECRET;

// Register the session plugin
fastify.register(fastifySecureSession, {
	cookie: {
		path: "/",
		httpOnly: true,
		secure: process.env.NODE_ENV === "production", // Set secure cookies only in production
	},
	expiry: 5 * 60 * 60, // Session expiry set to 5 hours
	secret: sessionSecret,
});

fastify.post("/logout", (request, reply) => {
	request.session.user = null;
	reply.redirect("/");
});

fastify.get("/login", async (request, reply) => {
	try {
		const html = await renderEJS("login.ejs", {});
		reply.type("text/html").send(html);
	} catch (err) {
		reply.status(500).send(`Error rendering EJS: ${err}`);
	}
});

fastify.post("/login", async (request, reply) => {
	const {username, password} = request.body;

	try {
		const user = await Users.findOne({username}).exec();
		if (!user) {
			return reply.status(401).send({error: "Invalid credentials"});
		}

		const passwordMatch = await bcrypt.compare(password, user.password);
		if (!passwordMatch) {
			return reply.status(401).send({error: "Invalid credentials"});
		}

		request.session.user = {
			id: user._id,
			username: user.username,
			role: user.role,
		};
		reply.redirect("/admin/Home");
	} catch (err) {
		console.error(err);
		reply.status(500).send({error: "Internal Server Error"});
	}
});
//---------------------------------------------------------------------------------------------Admin routes

fastify.get(
	"/admin/:routeName",
	{preHandler: isAuthenticated},
	async (request, reply) => {
		const routeName = request.params.routeName;

		try {
			routeData = await Routes.findOne({
				Name: routeName,
				IsActive: true,
				IsDeleted: false,
			}).lean();

			if (!routeData) {
				return reply.code(404).send("Route not found");
			}
		} catch (err) {
			request.log.error(err);
			return reply.code(500).send("An error occurred");
		}

		// Render the page using EJS
		try {
			const routes = await Routes.find({IsDeleted: false}, {Name: 1, _id: 1});
			const html = await renderEJS("admin.ejs", {
				pageTitle: routeData.PageTitle,
				content: routeData.HTML,
				author: routeData.Author,
				routes: routes,
			});
			reply.type("text/html").send(html);
		} catch (err) {
			request.log.error(err);
			reply.code(500).send("An error occurred while rendering the page");
		}
	},
);
fastify.post(
	"/save-html",
	{preHandler: isAuthenticated},
	async (request, reply) => {
		const {pageTitle, routeName, content} = request.body;

		if (!routeName) {
			console.log("Route name is required");
			return reply.code(400).send({error: "Missing required fields"});
		}

		try {
			// Find if the route already exists, if so, update it
			let route = await Routes.findOne({Name: decodeURIComponent(routeName)});
			if (route) {
				if (!content) {
					console.log("Content is required");
					return reply.code(400).send({error: "Missing required fields"});
				}

				// Update the existing route
				route.PageTitle = pageTitle;
				route.HTML = content;
				route.Author = request.session.user.username;
				await route.save();
			} else {
				console.log("Route not found");
				return reply.code(400).send({error: "Route not found"});
			}

			// Clear cache for the updated route
			cache.del(routeName);

			// Optionally re-cache the updated content
			cache.set(routeName, route);

			// Send a success response
			reply.send({
				success: true,
				message: "Content saved and cache cleared successfully",
			});
		} catch (error) {
			console.error("Error saving content:", error);
			reply.code(500).send({error: "Failed to save content"});
		}
	},
);
fastify.post(
	"/add-route",
	{preHandler: isAuthenticated},
	async (request, reply) => {
		const {routeName} = request.body;

		// Validate required fields
		if (!routeName) {
			return reply.code(400).send({error: "Missing required field: routeName"});
		}

		try {
			// Check if the route already exists
			let existingRoute = await Routes.findOne({Name: routeName});

			if (existingRoute) {
				return reply.code(409).send({error: "Route already exists"});
			}

			// Create a new route
			const newRoute = new Routes({
				PageTitle: " ",
				Name: routeName,
				Author: request.session.user.username,
			});
			await newRoute.save();

			// Send success response
			return reply.send({
				success: true,
				message: "New route created successfully",
			});
		} catch (error) {
			console.error("Error creating route:", error);
			return reply.code(500).send({error: "Failed to create route"});
		}
	},
);
fastify.post(
	"/delete-route",
	{preHandler: isAuthenticated},
	async (req, reply) => {
		const {routeId} = req.body;

		if (!routeId) {
			return reply.code(400).send({error: "Missing required field: routeId"});
		}

		try {
			let Route = await Routes.findOne({_id: routeId});
			Route.IsDeleted = true;
			await Route.save();
		} catch (error) {
			console.error("Error deleting route:", error);
			return reply.code(500).send({error: "Failed to delete route"});
		}
	},
);

//---------------------------------------------------------------------------------------------Page not found

// 404 Route
fastify.get("/404", (req, reply) => {
	const routePath = req.url;
	if (!notFoundRoutes.includes(routePath)) {
		notFoundRoutes.push(routePath);
		if (notFoundRoutes.length > NOT_FOUND_ROUTES_LIMIT) {
			notFoundRoutes.shift(); // Remove the oldest entry
		}
	}
	renderEJS("frame.ejs", {
		pageTitle: "404",
		content:
			"<style>aside{display: none;}</style><p>The URL entered is incorrect. If it was once correct, don't worry, the admin has been notified.</p>",
		author: "Dev",
	})
		.then((html) => reply.type("text/html").send(html))
		.catch((err) => reply.status(500).send(`Error rendering EJS: ${err}`));
});

//---------------------------------------------------------------------------------------------Close server

// Graceful shutdown
const gracefulShutdown = async () => {
	try {
		console.log("\x1b[33m", "Initiating graceful shutdown...", "\x1b[37m");

		// Timeout to force shutdown if it takes too long
		const timeout = 5000; // 5 seconds
		const timeoutPromise = new Promise((resolve, reject) => {
			setTimeout(
				() => reject(new Error("\x1b[31m", "Shutdown timeout", "\x1b[37m")),
				timeout,
			);
		});

		// Close Fastify server
		const fastifyClosePromise = fastify.close();

		// Close MongoDB connection
		const mongooseClosePromise = mongoose.connection.close();

		await Promise.race([
			fastifyClosePromise,
			mongooseClosePromise,
			timeoutPromise,
		]);

		console.log("\x1b[32m", "Graceful shutdown complete.", "\x1b[37m");
		process.exit(0);
	} catch (err) {
		console.error(
			"\x1b[31m",
			"Error during graceful shutdown:",
			err,
			"\x1b[37m",
		);
		process.exit(1);
	}
};

// Register signal handlers for graceful shutdown
process.on("SIGINT", () => {
	console.log(
		"\x1b[33m",
		"SIGINT signal received. Closing server...",
		"\x1b[37m",
	);
	gracefulShutdown();
});

process.on("SIGTERM", () => {
	console.log(
		"\x1b[33m",
		"SIGTERM signal received. Closing server...",
		"\x1b[37m",
	);
	gracefulShutdown();
});

//---------------------------------------------------------------------------------------------Open server

// Start the server
const port = process.env.PORT || 3000;
const start = async () => {
	try {
		await fastify.listen({port: port, host: "0.0.0.0"}); // Ensure host is set to '0.0.0.0'
		console.log(`Server listening on: http://localhost:${port}`);
		console.log(`Server started at: ${serverStartTime}`);
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
};
start();
