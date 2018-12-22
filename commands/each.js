let snoots = require("../library/snoots.js")
let shell = require("../library/shell.js")
let {log} = require("../library/loggo.js")

module.exports = ({command}) =>
	snoots.each(name => {
		log(`running "${command}" in ${name}`)
		return shell.run(command, {
			cwd: snoots.resolver(name).path,
			env: {
				SNOOT_NAME: name
			},
			stdio: ['pipe', 1, 'pipe'],
			shell: true
		})
	})
