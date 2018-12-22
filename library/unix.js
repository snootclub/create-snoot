let shell = require("./shell.js")

let unix = exports

exports.checkYourPrivilege = function () {
	return process.getuid() === 0
}

exports.getUserId = function getUserId (snoot) {
	let result = shell.run(`id -u ${snoot}`)
	let buffergoo = []
	result.stdout.on("data", data => buffergoo.push(data))

	return shell.run(`id -u ${snoot}`)
		.then(code =>
			code
				? null
				: Promise.resolve(Buffer.concat(buffergoo))
		)
}

exports.checkUserExists = async function checkUserExists (snoot) {
	return !(await unix.getUserId(snoot) == null)
}

let createOptionString = options =>
	Object.values(options).reduce((string, name, value) => {
		let key = name.length > 1
			? `--${name}`
			: `-${name}`
		return string.concat(`${key} ${value}`)
	}, "")

	unix.createUser = async function createUser ({
		user,
		homeDirectory,
		groups
	}) {
		let promise = shell.run(
			[
				"useradd -m",
				createOptionString({
					d: homeDirectory,
					g: groups[0],
					G: groups.join(","),
					s: "/bin/no-login"
				}),
				user
			],
			{sudo: true}
		)

		let code = await promise

		return code
			? Promise.reject(promise.stderr)
			: promise.stdout
}

exports.chown = async function chown ({path, user, group = user, recurse = true}) {
	let r = recurse ? "-R" : ""

	return shell.run(
		`chown ${r} ${user}.${group} ${path}`,
		{sudo: true}
	)
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

	console.log({path})

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

exports.bind = (boy, bedposts) =>
	shell.run(
		`mount --bind ${boy} ${bedposts}`,
		{sudo: true}
	).then(code => code && Promise.reject("couldnt bind"))
