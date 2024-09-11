const isAuthenticated = (req, reply, done) => {
	// Check if the session and user object exist
	if (req.session && req.session.user) {
		// Optional: Add additional validation for user session
		if (validateSession(req.session.user)) {
			done(); // Continue to the next handler if authenticated
		} else {
			// Invalid session, destroy it and redirect to login
			reply.redirect("/login");
		}
	} else {
		// No valid session found, redirect to login
		reply.redirect("/login");
	}
};

// Example session validation function (customize this as needed)
function validateSession(user) {
	// Add any additional checks here, such as token validation, expiration checks, etc.
	return user && user.id && user.role; // Ensure the session contains necessary fields
}

module.exports = isAuthenticated;
