const fastify = require("fastify")({logger: {level: "error"}});
const ejs = require("ejs");
const NodeCache = require("node-cache");
const path = require("path");
const fastifyStatic = require("@fastify/static");
const fastifyFormbody = require("@fastify/formbody");

// Initialize the cache
const cache = new NodeCache();

// Function to handle rendering and caching
const renderAndCache = (reply, cacheKey, templatePath, content) => {
	const cachedHtml = cache.get(cacheKey);

	if (cachedHtml) {
		// Serve cached page
		reply.type("text/html").send(cachedHtml);
	} else {
		// Render page and cache it
		ejs.renderFile(templatePath, {content}, {}, (err, str) => {
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
	renderAndCache(reply, "homePage", "views/frame.ejs", "home");
});

fastify.get("/parskolu", (req, reply) => {
	renderAndCache(reply, "parskoluPage", "views/frame.ejs", "parskolu");
});

fastify.get("/zinas", (req, reply) => {
	renderAndCache(reply, "zinasPage", "views/frame.ejs", "zinas");
});

fastify.get("/macibas", (req, reply) => {
	renderAndCache(reply, "macibasPage", "views/frame.ejs", "macibas");
});

fastify.get("/darbinieki", (req, reply) => {
	renderAndCache(reply, "darbiniekiPage", "views/frame.ejs", "darbinieki");
});

fastify.get("/skoleniem", (req, reply) => {
	renderAndCache(reply, "skoleniemPage", "views/frame.ejs", "skoleniem");
});

fastify.get("/admin", (req, reply) => {
	ejs.renderFile("views/admin.ejs", {content: "admin"}, {}, (err, str) => {
		if (err) {
			reply.status(500).send(`Error rendering EJS: ${err}`);
		} else {
			reply.type("text/html").send(str);
		}
	});
});

// Handle form submission
fastify.post("/submit-content", (req, reply) => {
	const {Title, Type, EDate, Date, Content, Publish} = req.body;
	console.log("Form Data:", {Title, Type, EDate, Date, Content, Publish});
	reply.send({success: true, message: "Form data received"});
});

// Catch-all route for 404
fastify.get("*", (req, reply) => {
	renderAndCache(reply, "404", "views/frame.ejs", "404");
});

// Start the server
const port = process.env.PORT || 3000;
const start = async () => {
	try {
		await fastify.listen({port: port});
		console.log(`Server listening on: http://localhost:${port}`);
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
};
start();
