let shell = require("./shell.js")
let fs = require("fs-extra")
let unix = exports

exports.commonGroupName = "common"
exports.lowerGroupName = "undercommon"

exports.checkYourPrivilege = function () {
	return process.getuid() === 0
}

exports.getUserId = snoot => {
	try {
		return shell.run(`id -u ${snoot}`)
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
	return await unix.getUserId(snoot) != null
}

exports.createUser = async function createUser ({
		user,
		homeDirectory,
		groups
	}) {
		let command = [
			"useradd -M",
			"-d", homeDirectory,
			"-g", groups[0],
			"-G", groups.join(","),
			"-s /bin/bash",
			user
		].join(" ")

		return shell.run(command, {sudo: true})
			.then(code => code && Promise.reject(command))
}

exports.chmod = async function chmod ({mode, path, recurse = true}) {
	let r = recurse ? "-R" : ""

	return shell.run(
		`chmod ${r} ${mode} ${path}`,
		{sudo: true}
	)
}

exports.chown = async function chmod ({user, group, path, recurse = true}) {
	let r = recurse ? "-R" : ""

	return shell.run(
		`chown ${r} ${user}.${group} ${path}`,
		{sudo: true}
	)
}

exports.unmount = directory =>
	shell.run(
		`umount ${directory}`,
		{sudo: true}
	)

exports.ln = async function ln ({from, to, symbolic = true, sudo = true}) {
	let s = symbolic
		? "-s"
		: ""

	return shell.run(
		`ln ${s} ${to} ${from}`,
		{sudo}
	)
}
