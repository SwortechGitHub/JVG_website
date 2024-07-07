const mongoose = require("mongoose");

// Define schema for blog posts
const blogSchema = new mongoose.Schema({
	Title: {type: String, required: true},
	Img: {type: String},
	Text: {type: String, required: true},
	Published: {type: Boolean, default: false},
	EventDate: {type: Date},
	Date: {type: Date, default: Date.now},
	Type: {type: String, required: true},
	Author: {type: String, required: true},
});

// Create model from schema and export it
module.exports = mongoose.model("Blogs", blogSchema);
