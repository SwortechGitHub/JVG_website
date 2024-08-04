const isAuthenticated = (req, reply, done) => {
	if (req.session.user) {
		done();
	} else {
		reply.redirect("/login");
	}
};

module.exports = isAuthenticated;
