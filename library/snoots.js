let path = require("path")
let fs = require("fs-extra")
let createResolver = require("./create-path-resolver.js")
let unix = require("./unix.js")
let shell = require("./shell.js")
let skeletons = require("./skeletons.js")
let {warn, shout} = require("./loggo.js")
let getStream = require("get-stream")

let rootResolver = createResolver("/www/snoot.club")
let resolver = rootResolver("snoots")
let chrootResolver = createResolver("/snoots")

let validNameRegex = /^[a-z][a-z0-9]{0,30}$/

let validateName = snoot =>
	validNameRegex.test(snoot)

let applicationResolver = (snoot, ...paths) =>
	resolver(snoot, "application", ...paths)

let websiteResolver = (snoot, ...paths) =>
	resolver(snoot, "application", "website", ...paths)

async function createChrootSshConfiguration (snoot, {authorizedKeys}) {
	let snootChrootResolver = chrootResolver(snoot)
	let sshDirectoryResolver = snootChrootResolver(".ssh")
	let authorizedKeysPath = sshDirectoryResolver("authorized_keys").path

	await fs.outputFile(
		authorizedKeysPath,
		authorizedKeys
	)

	let rootOwnedPaths = [
		chrootResolver.path,
		snootChrootResolver.path,
	]

	let snootOwnedPaths = [
		sshDirectoryResolver.path,
		authorizedKeysPath
	]

	let snootId = unix.getUserId() || 1000
	let commonId = unix.getCommonGid() || 1473

	for (let path of [...rootOwnedPaths, ...snootOwnedPaths]) {
		await fs.chmod(path, 0o755)
	}

	for (let path of snootOwnedPaths) {
		await fs.chown(path, snootId, commonId)
	}

	for (let path of rootOwnedPaths) {
		await fs.chown(path, 0, 0)
	}
}

async function createUnixAccount (snoot) {
	return unix.createUser({
		user: snoot,
		groups: [unix.commonGroupName, unix.lowerGroupName],
		homeDirectory: chrootResolver(snoot).path
	})
}

async function createBaseApplication (snoot, options = {}) {
	let {
		authorizedKeys = "",
		sshPort = 22222,
		webPort = 22333
	} = options

	await skeletons.write({
		resolver: resolver(snoot),
		uid: unix.getUserId(snoot),
		gid: unix.getCommonGid(),
		render: compile => compile({
			snoot,
			snootRoot: resolver.path,
			authorizedKeys,
			sshPort,
			webPort
		})
	})

	// HACK oh no could i put this in the definition somewhere?
	await fs.chmod(applicationResolver(snoot, ".start.sh").path, 0o775)
}

function bootContainer (snoot) {
	let result = shell.run("docker-compose up -d", {
		cwd: resolver(snoot).path
	})

	result.stdout.pipe(process.stdout)

	return result.then(code => (
		code && warn(`couldn't boot the snoot! (${snoot})`),
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
	return files.filter(name =>
		validateName(name) && fs.pathExistsSync(getConfigPath(name))
	)
}

async function each (fn) {
	for (let snoot of await getNames()) {
		await fn(snoot)
	}
}

async function bind () {
	await each(async snoot => {
		let websitePath = websiteResolver(snoot).path
		let chrootWebsitePath = chrootResolver(snoot, "website").path
		await fs.mkdirp(websitePath)
		await unix.unmount(chrootWebsitePath).catch(_ => _)
		await fs.pathExists(websitePath) &&
			await unix.bind(websitePath, chrootWebsitePath)
				.catch(() => {
					warn(`couldn't bind snoot called "${snoot}", maybe not supported on os?`)
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

	return fs.readJson(configPath)
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

async function demandExistence (snoot) {
	let names = await getNames()
	
	if (!names.includes(snoot)) {
		shout(`no such snoot: ${snoot}`)
		process.exit(47)
	}
}

module.exports = {
	rootResolver,
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
	getPorts,
	demandExistence
}
