const findMyWay = require("find-my-way");
const http = require("http");
const ejs = require("ejs");
const NodeCache = require("node-cache");
const fastJsonStringify = require("fast-json-stringify");
const path = require("path");
const fs = require("fs");
const mime = require("mime-types");
// Testing
const {performance} = require("perf_hooks");
var ms = 0;
var requestCounter = 0;

// Initialize the router
const router = findMyWay();

// Initialize the cache
const cache = new NodeCache();

// Define a schema for JSON stringification
const stringify = fastJsonStringify({
	type: "object",
	properties: {hello: {type: "string"}},
});

// Function to handle rendering and caching
const renderAndCache = (res, cacheKey, templatePath, content) => {
	// Testing Start
	const start = performance.now();

	const cachedHtml = cache.get(cacheKey);

	if (cachedHtml) {
		// Serve cached page
		res.setHeader("Content-Type", "text/html");
		// Testing End
		const end = performance.now();
		ms += end - start;
		requestCounter++;
		console.log(`cacheKey: ${cacheKey}, ms avg ${ms / requestCounter}`);
		res.end(cachedHtml);
	} else {
		// Render page and cache it
		ejs.renderFile(templatePath, {content}, {}, (err, str) => {
			if (err) {
				res.statusCode = 500;
				res.end(`Error rendering EJS: ${err}`);
			} else {
				cache.set(cacheKey, str);
				res.setHeader("Content-Type", "text/html");
				//Testing End
				const end = performance.now();
				ms += end - start;
				requestCounter++;
				console.log(
					`cacheKey: ${cacheKey}, ms avg: ${
						ms / requestCounter
					}, requestCounter: ${requestCounter}, ms sum: ${ms}`,
				);
				res.end(str);
			}
		});
	}
};

// Middleware to serve static files
const serveStatic = (rootDir) => {
	return (req, res) => {
		const filePath = path.join(rootDir, req.url);
		fs.readFile(filePath, (err, data) => {
			if (err) {
				// File not found, continue with other routes
				router.lookup(req, res);
			} else {
				// Serve the file
				res.setHeader("Content-Type", mime.lookup(filePath));
				res.end(data);
			}
		});
	};
};

// Define routes
router.on("GET", "/", (req, res) => {
	renderAndCache(res, "homePage", "views/frame.ejs", "home");
});

router.on("GET", "/parskolu", (req, res) => {
	renderAndCache(res, "parskoluPage", "views/frame.ejs", "parskolu");
});

router.on("GET", "/zinas", (req, res) => {
	renderAndCache(res, "zinasPage", "views/frame.ejs", "zinas");
});

router.on("GET", "/macibas", (req, res) => {
	renderAndCache(res, "macibasPage", "views/frame.ejs", "macibas");
});

// Create the HTTP server
http
	.createServer((req, res) => {
		// Check for static files first
		const staticFilePath = path.join(__dirname, "public");
		serveStatic(staticFilePath)(req, res);
	})
	.listen(3000, () => {
		console.log("listening on port 3000");
	});
