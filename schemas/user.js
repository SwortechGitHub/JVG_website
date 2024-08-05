// schemas/user.js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
	username: {type: String, required: true, unique: true},
	password: {type: String, required: true},
	email: {type: String, required: false, unique: true},
	role: {
		type: String,
		enum: ["admin", "klase", "int_izgl_sk"],
		required: true,
		default: "klase", // Default role can be set as needed
	},
	permissions: {
		canMakeUsers: {type: Boolean, default: false},
		canMakePages: {type: Boolean, default: false},
		canEditPages: {type: Boolean, default: false},
		canDeletePages: {type: Boolean, default: false},
		canMakeBlogs: {type: Boolean, default: false},
		canEditBlogs: {type: Boolean, default: false},
		canDeleteBlogs: {type: Boolean, default: false},
		canPublishBlogs: {type: Boolean, default: false},
	},
	// Additional field for AfterClass role to store the page they can edit
	editablePage: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Page",
		required: false,
	}, // Reference to the Page model
});

// Middleware to set permissions based on the role
userSchema.pre("save", function (next) {
	if (this.role === "admin") {
		// Admin can do anything
		this.permissions = {
			canMakePages: true,
			canEditPages: true,
			canDeletePages: true,
			canMakeBlogs: true,
			canEditBlogs: true,
			canPublishBlogs: true,
			canDeleteBlogs: true,
		};
	} else if (this.role === "klase") {
		// Class role permissions
		this.permissions = {
			canMakeBlogs: true,
			canEditBlogs: true,
		};
	} else if (this.role === "int_izgl_sk") {
		// AfterClass role permissions
		this.permissions = {
			canEditPages: true,
			canMakeBlogs: true,
			canEditBlogs: true,
		};
	}
	next();
});

userSchema.pre("save", async function (next) {
	if (!this.isModified("password")) return next();

	const salt = await bcrypt.genSalt(10);
	this.password = await bcrypt.hash(this.password, salt);
	next();
});
const Users = mongoose.model("User", userSchema);

module.exports = Users;
