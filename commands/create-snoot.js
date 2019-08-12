#!/usr/bin/env -S sudo node
let inquirer = require("inquirer")
let {log, warn, shout} = require("../library/loggo.js")
let unix = require("../library/unix.js")
let snoots = require("../library/snoots.js")
let shell = require("../library/shell.js")
let fetch = require("../library/fetch.js")
let fs = require("fs-extra")

let filterDuplicateLines = string => [
	...new Set(string.split("\n"))
].join("\n")

process.on("unhandledRejection", error => {
	console.error(error)
	process.exit(122)
})

process.on("uncaughtException", error => {
	console.error(error)
	process.exit(222)
})

async function getKeysFromGithub (githubUsername) {
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
			validate: snoots.validateName,
			default: name
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

	let existingKeys = snootAlreadyExists && (
		await snoots.getAuthorizedKeys(snoot)
	)

	let {
		githubUsername
	} = await inquirer.prompt([
		{
			type: "confirm",
			name: "useExistingKeys",
			message: "do you want to use the existing authorized_keys file they had?",
			when: () => existingKeys
		},
		{
			type: "confirm",
			name: "shouldGetGithubKeys",
			message: "do you want to get fresh keys from github?",
			when: ({existingKeys}) => existingKeys
		},
		{
			type: "input",
			name: "githubUsername",
			message: "           🐙     😻\nwhat is their github username?",
			when: ({existingKeys, shouldGetGithubKeys}) =>
				existingKeys
					? shouldGetGithubKeys
					: true
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
		default: filterDuplicateLines(githubKeys
			.concat(existingKeys || ""))
	})

	if (await unix.checkUserExists(snoot)) {
		warn(`there's already a user called "${snoot}"!! i hope that's ok!️︎ ♥️`)
	} else {
		log("ok! creating them a unix user 👤 account on the computer 🖥 ⌨️ 🖱")
		await snoots
			.createUnixAccount(snoot)
			.catch(error => {
				shout("couldnt create user!")
				shout(error)
			})
	}

	log("creating a bare git repo for them to live at /repo")
	await snoots.createBareRepo(snoot)

	log("fixing ssh permssions")
	await snoots.fixSshPermissions(snoot)

	log("generating their base application files! 📠 🎰")
	await snoots.createBaseApplication(snoot, {authorizedKeys})

	log("restarting nginx 🔂")
	await shell.run("/www/snoot.club/scripts/refresh.zsh /www/snoot.club/")
}

let beingRunDirectly = process.argv[1].match(/create-snoot($|\.js$)/)

if (beingRunDirectly) {
	module.exports()
}
