let fs = require("fs-extra")
let createResolver = require("./create-path-resolver.js")
let unix = require("./unix.js")
let shell = require("./shell.js")
let skeletons = require("./skeletons.js")
let {warn} = require("./loggo.js")
let getStream = require("get-stream")
let chmodr = require("chmodr")

let directory = "snoots"
let chrootDirectory = "/snoots"

let resolver = createResolver(directory)
let chrootResolver = createResolver(chrootDirectory)

let validNameRegex = /^[a-z][a-z0-9]{0,30}$/

let validateName = snoot =>
	validNameRegex.test(snoot)

let applicationResolver = (snoot, ...paths) =>
	resolver(snoot, "application", ...paths)

let websiteResolver = (snoot, ...paths) =>
	resolver(snoot, "application", "website", ...paths)

async function createChrootSshConfiguration (snoot, {authorizedKeys}) {
	let sshDirectoryResolver = resolver(snoot, ".ssh")

	await fs.outputFile(
		sshDirectoryResolver("authorized_keys").path,
		authorizedKeys
	)

	await fs.chmod(sshDirectoryResolver.path, 0o755)
	await fs.chown(sshDirectoryResolver.path, 0, 0)
}

async function createUnixAccount (snoot) {
	return unix.createUser({
		user: snoot,
		groups: ["common", "undercommon"],
		homeDirectory: chrootResolver("snoot").path
	}).catch(getStream)
}

async function createBaseApplication (snoot, options = {}) {
	let {
		authorizedKeys = "",
		sshPort = 22222,
		webPort = 22333
	} = options

	await skeletons.write(
		resolver(snoot),
		render => render({
			snoot,
			snootRoot: resolver.path,
			authorizedKeys,
			sshPort,
			webPort
		})
	)

		// HACK oh no could i put these in the definition somewhere?
	await (new Promise((resolve, reject) => {
		chmodr(
			applicationResolver(snoot).path,
			0o777,
			error => error ? reject(error) : resolve()
		)
	}))

	await unix.chown({
		path: websiteResolver(snoot).path,
		recurse: true,
		user: snoot,
		group: "common"
	})
}

function bootContainer (snoot) {
	let result = shell.run("docker-compose up -d", {
		cwd: resolver(snoot).path
	})

	result.stdout.pipe(process.stdout)

	return result.then(code => (
		code && warn("couldn't boot the snoot!"),
		result.stderr.pipe(process.stderr),
		code
	))
}

let nextPortPath = resolver(".next-port").path

async function getNextPort () {
	return await fs.pathExists(nextPortPath)
		? Number(await fs.readFile(nextPortPath))
		: 22222
}

async function setNextPort (port) {
	return fs.outputFile(nextPortPath, port)
}

function getConfigPath (snoot) {
	return resolver(snoot, "snoot.json").path
}

async function getNames () {
	let files = await fs.readdir(resolver.path)
	return files.filter(name => {
		validateName(name) && fs.pathExistsSync(getConfigPath(name))
	})
}

async function each (fn) {
	for (let snoot of await getNames()) {
		await fn(snoot)
	}
}

async function bind () {
	each(async snoot => {
		let websitePath = websiteResolver(snoot).path
		let chrootWebsitePath = chrootResolver(snoot, "website").path
		await fs.mkdirp(websitePath)
		await unix.unmount(chrootWebsitePath).catch(_ => _)
		await fs.pathExists(websitePath) &&
			await unix.bind(websitePath, chrootWebsitePath)
				.catch(({code}) => {
					warn("couldn't bind snoot, maybe not supported on os?")
				})
	})
}

async function checkExists (snoot) {
	let names = await getNames()
	return names.includes(snoot)
}

async function getConfig (snoot) {
	if (!await checkExists(snoot)) {
		return Promise.reject(`can't get config for no such snoot: ${snoot}`)
	}

	let configPath = getConfigPath(snoot)

	if (!await fs.pathExists(configPath)) {
		return Promise.reject(`can't get config for ${snoot}, no snoot.json`)
	}

	return fs.readFile(configPath)
}

async function getPorts (snoot) {
	if (await checkExists(snoot)) {
		let {
			sshPort,
			webPort
		} = await getConfig(snoot)

		return {
			sshPort,
			webPort
		}
	}

	let sshPort = await getNextPort()
	let webPort = sshPort + 1

	return {
		sshPort,
		webPort
	}
}

module.exports = {
	directory,
	chrootDirectory,
	resolver,
	chrootResolver,
	applicationResolver,
	websiteResolver,
	createChrootSshConfiguration,
	createUnixAccount,
	createBaseApplication,
	bootContainer,
	setNextPort,
	getNextPort,
	each,
	bind,
	checkExists,
	validateName,
	getNames,
	getConfig,
	getPorts
}
