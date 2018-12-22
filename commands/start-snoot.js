let snoots = require("../library/snoots.js")
let shell = require("../library/shell.js")

module.exports = ({snoot}) => {
	return shell.run("docker-compose up -d", {
		cwd: snoots.resolver(snoot).path,
		takeover: true
	})
}
