let shell = require("./shell.js")
let fs = require("fs-extra")
let userid = require("userid")

let unix = exports

exports.commonGroupName = "common"
exports.lowerGroupName = "undercommon"

exports.checkYourPrivilege = function () {
	return process.getuid() === 0
}

exports.getUserId = snoot => {
	let child = shell.run(`id -u ${snoot}`)
	let id = []
	child.stdout.on("data", data => id.push(data))
	return child.then(code => code ? undefined : +Buffer.concat(id).toString("utf-8").trim())
}

exports.getCommonGid = () => {
	try {
		return userid.gid(unix.commonGroupName)
	} catch (error) {
		return undefined
	}
}

exports.checkUserExists = async function checkUserExists (snoot) {
	return await unix.getUserId(snoot) != null
}

exports.createUser = function createUser ({
		user,
		homeDirectory,
		groups
	}) {
		let command = [
			"useradd -m",
			"-d", homeDirectory,
			"-g", groups[0],
			"-G", groups.join(","),
			"-s /bin/no-login",
			user
		].join(" ")

		shell.run(command, {sudo: true})
			.then(code => code && Promise.reject(command))
}

exports.chmod = async function chmod ({mode, path, recurse = true}) {
	let r = recurse ? "-R" : ""

	return shell.run(
		`chmod ${r} ${mode} ${path}`,
		{sudo: true}
	)
}

exports.mkdir = async function mkdir ({path, createParents = true, sudo = true}) {
	let p = createParents
		? "-p"
		: ""

	return shell.run(
		`mkdir ${p} ${path}`,
		{sudo}
	)
}

exports.unmount = directory =>
	shell.run(
		`umount ${directory}`,
		{sudo: true}
	)

exports.bind = async (boy, bedposts) => {
	await fs.mkdirp(bedposts)
	return shell.run(
		`mount --bind ${boy} ${bedposts}`,
		{sudo: true}
	).then(code => code && Promise.reject("couldnt bind"))
}
