const mongoose = require("mongoose");

// Define schema for blog posts
const pageSchema = new mongoose.Schema({
	Title: {type: String, required: true},
	Section: {type: String, required: true},
	Type: {type: String, required: true},
	Order: {type: Number, required: true},
	Img: {type: String},
	Text: {type: String, required: true},
	Date: {type: Date, default: Date.now},
	Author: {type: String, required: true},
});

// Create model from schema and export it
module.exports = mongoose.model("Pages", pageSchema);
