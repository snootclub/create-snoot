let sudoSpawn = require("sudo")
let spawn = require("child_process").spawn

exports.run = function run (command, options = {}) {
	let {
		sudoPrompt = "could i get your password for sudo pls?",
		sudo = false,
		cwd,
		env
	} = options

	let spawnOptions = {
		cwd,
		env
	}

	let sudoSpawnOptions = {
		cachePassword: true,
		prompt: sudoPrompt,
		spawnOptions
	}

	let [name, ...args] = typeof command == "string"
		? command.split(/\s+/)
		: command

	let child = sudo
		? sudoSpawn([name, ...args], sudoSpawnOptions)
		: spawn(name, args, spawnOptions)

	let promise = new Promise(resolve => {
		child.on("close", code => resolve(code))
	})

	promise.stdout = child.stdout
	promise.stderr = child.stderr
	promise.stdin = child.stdin
	promise.stdio = child.stdio

	return promise
}
