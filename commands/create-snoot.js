#!/usr/bin/env -S sudo node
let inquirer = require("inquirer")
let fetch = require("make-fetch-happen").defaults({
	cacheManager: "./.snootclub/fetch-cache"
})
let {log, warn, shout} = require("../library/loggo.js")
let unix = require("../library/unix.js")
let snoots = require("../library/snoots.js")
let shell = require("../library/shell.js")

process.on("unhandledRejection", error => {
	console.log(error)
	process.exit(122)
})

process.on("uncaughtException", error => {
	console.log(error)
	process.exit(222)
})

function getKeysFromGithub (githubUsername) {
	log("gonna get them an authorized_keys file from github")

	return fetch(`https://github.com/${githubUsername}.keys`)
		.then(response => response.text())
}

module.exports = async function createSnoot () {
	let hasPrivilege = unix.checkYourPrivilege()

	if (!hasPrivilege) {
		shout("oh no: not root")
		log("this program needs to be run as root, because it does different things as different snoots")
		process.exit(22)
		// log("this program needs elevated privileges, so i'll ask you for your password for sudo sometimes")
	}

	let {
		snoot
	} = await inquirer.prompt([
		{
			type: "input",
			name: "snoot",
			message: "oh, a new snoot? 💕 \nwhat's their name?",
			validate: snoots.validateName
		},
		{
			type: "list",
			choices: ["yes", "yes"],
			name: "isAGoodBoy",
			message: "a good boy? 💖💛",
			when: ({snoot}) => snoot == "abe"
		}
	])

	let snootAlreadyExists = await snoots.checkExists(snoot)

	let {shouldContinue = true} = await inquirer.prompt({
		type: "confirm",
		name: "shouldContinue",
		message: "🎺 whümf and wetch? this snoot already exists, should we continue?",
		when: () => snootAlreadyExists,
		default: false
	})

	if (!shouldContinue) {
		shout("cancelling for there already existed such a snoot")
		process.exit(2)
	}

	// let existingKeys = snootAlreadyExists && (
	// 	(await snoots.getConfig(snoot)).authorizedKeys
	// )

	let {
		githubUsername
	} = await inquirer.prompt([
		// {
		// 	type: "confirm",
		// 	name: useExistingKeys,
		// 	message: "do you want to use the existing authorized_keys file they had?",
		// 	when: () => existingKeys
		// },
		// {
		// 	type: "confirm",
		// 	name: getGithubKeys,
		// 	message: "do you want to get keys from github?"
		// },
		{
			type: "input",
			name: "githubUsername",
			message: "what is their github username? 🐙😻",
			// when: ({getGithubKeys}) => getGithubKeys
		}
	])

	let githubKeys = githubUsername
		? await getKeysFromGithub(githubUsername)
		: ""

	let {
		authorizedKeys
	} = await inquirer.prompt({
		type: "editor",
		name: "authorizedKeys",
		message: "edit their authorized_keys ✏️🔑",
		default: githubKeys
		// .concat(useExistingKeys ? existingKeys : "")
	})

	if (await unix.checkUserExists(snoot)) {
		warn(`there's already a user called "${snoot}"!! i hope that's ok! ♥`)
	} else {
		log("ok! creating them a unix user 👤 account on the computer 🖥 ⌨️ 🖱")
		await snoots
			.createUnixAccount(snoot)
			.catch(error => {
				shout("couldnt create user!")
				shout(error.toString())
				warn("creating them a directory 📂 📁 in /snoots as a backup 🦴")
				return unix.mkdir(snoots.chrootResolver(snoot).path)
			})
	}

	log("adding their authorized_keys ➕🔑 file so they can log in (:")
	await snoots.createChrootSshConfiguration(snoot, {authorizedKeys})

	log("generating their base application files! 📠 🎰")
	let {
		sshPort,
		webPort
	} = await snoots.getPorts(snoot)

	if (!snootAlreadyExists) {
		await snoots.createBaseApplication(snoot, {
			authorizedKeys,
			sshPort,
			webPort
		})

		log("updating next snoot port 🌸")
		await snoots.setNextPort(webPort + 1)
	}

	log("binding snoots 👀")
	await snoots.bind(snoot)

	log("booting snoot container 👢")
	await snoots.bootContainer(snoot)

	log("restarting nginx 🔂")
	await shell.run("nginx -s reload")
}

let beingRunDirectly = process.argv[1].endsWith("create-snoot.js")

if (beingRunDirectly) {
	module.exports()
}
