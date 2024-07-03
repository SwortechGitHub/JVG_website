const router = require("find-my-way")();
const http = require("http");
const ejs = require("ejs");
const NodeCache = require("node-cache");
const path = require("path");
const fs = require("fs");
const mime = require("mime-types");

// Initialize the cache
const cache = new NodeCache();

// Request counter
const requestCounter = {
	homePage: 0,
	parskoluPage: 0,
	zinasPage: 0,
	macibasPage: 0,
	darbiniekiPage: 0,
	skoleniemPage: 0,
};

// Function to handle rendering and caching
const renderAndCache = (res, cacheKey, templatePath, content) => {
	const cachedHtml = cache.get(cacheKey);

	if (cachedHtml) {
		// Serve cached page
		res.setHeader("Content-Type", "text/html");
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

router.on("GET", "/darbinieki", (req, res) => {
	renderAndCache(res, "darbiniekiPage", "views/frame.ejs", "darbinieki");
});

router.on("GET", "/skoleniem", (req, res) => {
	renderAndCache(res, "skoleniemPage", "views/frame.ejs", "skoleniem");
});

// router.on("GET", "/admin", (req, res) => {
// 	ejs.renderFile("views/admin.ejs", {content: "admin"}, {}, (err, str) => {
// 		if (err) {
// 			res.statusCode = 500;
// 			res.end(`Error rendering EJS: ${err}`);
// 		} else {
// 			res.setHeader("Content-Type", "text/html");
// 			res.end(str);
// 		}
// 	});
// });

// Catch-all route for 404
router.on("GET", "*", (req, res) => {
	res.statusCode = 404;
	console.log(req.url);
	renderAndCache(res, "404", "views/frame.ejs", "404");
});

// Create the HTTP server
const port = process.env.PORT || 3000;
http
	.createServer((req, res) => {
		// Check for static files first
		const staticFilePath = path.join(__dirname, "public");
		serveStatic(staticFilePath)(req, res);
	})
	.listen(port, () => {
		console.log(`Server listening on: http://localhost:${port}`);
	});
