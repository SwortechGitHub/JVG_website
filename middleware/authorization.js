const Users = require("../schemas/user");
// middleware/authorization.js
const isAuthorized = (permissions) => {
	return async (req, reply, done) => {
		const user = req.session.user;

		if (!user) {
			return reply.status(403).send({error: "Not authenticated"});
		}

		try {
			const dbUser = await Users.findOne({username: user.username});

			if (!dbUser) {
				return reply.status(403).send({error: "User not found"});
			}

			const hasPermission = permissions.every(
				(permission) => dbUser.permissions[permission],
			);

			if (!hasPermission) {
				return reply.status(403).send({error: "Insufficient permissions"});
			}

			done();
		} catch (err) {
			reply.status(500).send({error: "Internal Server Error"});
		}
	};
};

module.exports = isAuthorized;
