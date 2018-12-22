let shell = require("./shell.js")
let userid = require("userid")
let fs = require("fs-extra")

let unix = exports

exports.commonGroupName = "common"
exports.lowerGroupName = "undercommon"

exports.checkYourPrivilege = function () {
	return process.getuid() === 0
}

exports.getUserId = snoot => {
	try {
		return userid.uid(snoot)
	} catch (error) {
		return undefined
	}
}

exports.getCommonGid = () => {
	try {
		return userid.gid(unix.commonGroupName)
	} catch (error) {
		return undefined
	}
}

exports.checkUserExists = async function checkUserExists (snoot) {
	return unix.getUserId(snoot) != null
}

exports.createUser = function createUser ({
		user,
		homeDirectory,
		groups
	}) {
		return shell.run([
			"useradd -m",
			"-d", homeDirectory,
			"-g", groups[0],
			"-G", groups,
			"-s /bin/no-login",
			user
		], {sudo: true})
		.then(code => code && Promise.reject())
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
