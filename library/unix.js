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

let createOptionString = options =>
	Object.values(options).reduce((string, name, value) => {
		let key = name.length > 1
			? `--${name}`
			: `-${name}`
		return string.concat(`${key} ${value}`)
	}, "")

	unix.createUser = function createUser ({
		user,
		homeDirectory,
		groups
	}) {
		return shell.run([
			"useradd -m",
			createOptionString({
				d: homeDirectory,
				g: groups[0],
				G: groups.join(","),
				s: "/bin/no-login"
			}),
			user
		], {sudo: true})
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
