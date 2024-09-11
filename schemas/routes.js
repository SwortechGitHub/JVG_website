const mongoose = require("mongoose");

const routeSchema = new mongoose.Schema({
	PageTitle: {type: String, required: true},
	Name: {type: String, required: true},
	HTML: {type: String},
	Author: {type: String, default: "Dev"},
	IsActive: {type: Boolean, default: true},
	IsDeleted: {type: Boolean, default: false},
});

module.exports = mongoose.model("Routes", routeSchema);
