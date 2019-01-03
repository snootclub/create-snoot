let snoots = require("../library/snoots.js")
let shell = require("../library/shell.js")

module.exports = async ({snoot, command}) => {
	await snoots.demandExistence(snoot)
	return shell.run(`docker-compose exec snoot ${command}`, {
		cwd: snoots.resolver(snoot).path,
		takeover: true
	})
}
