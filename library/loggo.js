let chalk = require("chalk")

exports.log = message => (
	console.log(chalk.cyan.bold(message)),
	message
)

exports.warn = message => (
	console.warn(chalk.yellow(message)),
	message
)

exports.shout = message => (
	console.error(chalk.red.bold(message)),
	message
)