let fs = require("fs-extra")
let createResolver = require("./create-path-resolver.js")
let unix = require("./unix.js")
let shell = require("./shell.js")
let skeletons = require("./skeletons.js")
let {shout} = require("./loggo.js")

let rootResolver = createResolver("/www/snoot.club")
let resolver = rootResolver("snoots")
let homeResolver = createResolver("/snoots")

let validNameRegex = /^[a-z][a-z0-9]{0,30}$/

let validateName = snoot =>
	validNameRegex.test(snoot)

let applicationResolver = (snoot, ...paths) =>
	resolver(snoot, "application", ...paths)

let repoResolver = (snoot, ...paths) =>
	resolver(snoot, "repo", ...paths)

let websiteResolver = (snoot, ...paths) =>
	resolver(snoot, "application", "website", ...paths)

async function getAuthorizedKeys (snoot) {
	let snootResolver = resolver(snoot)
	let sshDirectoryResolver = snootResolver(".ssh")
	let authorizedKeysPath = sshDirectoryResolver("authorized_keys").path
	return fs.readFile(authorizedKeysPath, "utf-8")
}

async function createHomeSshConfiguration (snoot, {authorizedKeys}) {
	let snootHomeResolver = homeResolver(snoot)
	let snootResolver = resolver(snoot)
	let sshDirectoryResolver = snootResolver(".ssh")
	let authorizedKeysPath = sshDirectoryResolver("authorized_keys").path

	await fs.outputFile(
		authorizedKeysPath,
		authorizedKeys
	)

	let rootOwnedPaths = [
		homeResolver
	]

	let snootOwnedPaths = [
		sshDirectoryResolver.path,
		authorizedKeysPath,
		snootHomeResolver.path
	]

	await unix.ln({
		from: snootHomeResolver.path,
		to: snootResolver.path
	})

	let snootId = await unix.getUserId(snoot)
	let commonId = await unix.getCommonGid()

	for (let path of [...rootOwnedPaths, ...snootOwnedPaths]) {
		await fs.chmod(path, 0o755)
	}

	await fs.chmod(authorizedKeysPath, 0o644)

	for (let path of snootOwnedPaths) {
		await fs.chown(path, snootId, commonId)
	}

	for (let path of rootOwnedPaths) {
		await fs.chown(path, 0, 0)
	}
}

async function createHomeGitConfiguration (snoot) {
	let snootResolver = resolver(snoot)
	let gitconfigPath = snootResolver(".gitconfig").path

	let gitconfig = `[user]
	name = ${snoot}
	email ${snoot}@snoot.club
`

	await fs.outputFile(
		gitconfig,
		gitconfigPath
	)

	let snootId = await unix.getUserId(snoot)
	let commonId = await unix.getCommonGid()
	await fs.chown(gitconfigPath, snootId, commonId)
}

async function createUnixAccount (snoot) {
	return await unix.createUser({
		user: snoot,
		groups: [unix.commonGroupName, unix.lowerGroupName],
		homeDirectory: homeResolver(snoot).path
	})
}

async function createBareRepo (snoot) {
	let snootRepoResolver = repoResolver(snoot)
	await shell.run(`git init --bare ${snootRepoResolver.path}`)
	await unix.chown({
		user: await unix.getUserId(snoot),
		group: await unix.getCommonGid(),
		path: snootRepoResolver.path,
		recurse: true
	})
}

async function createBaseApplication (snoot) {
	await skeletons.write({
		resolver: resolver(snoot),
		uid: await unix.getUserId(snoot),
		gid: await unix.getCommonGid(),
		render: compile => compile(snoot),
		getPermissions ({filePath, fileType}) {
			if (fileType == skeletons.fileTypes.file) {
				let rwxr_xr_x = 0o755
				let postReceive = repoResolver(snoot, "hooks", "post-receive").path
				if (filePath == postReceive) {
					return {
						mode: rwxr_xr_x
					}
				}
			}
		}
	})
}

async function getNames () {
	let files = await fs.readdir(resolver.path)
	return files.filter(name =>
		validateName(name)
	)
}

async function each (fn) {
	for (let snoot of await getNames()) {
		await fn(snoot)
	}
}

async function checkExists (snoot) {
	let names = await getNames()
	return names.includes(snoot)
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
	homeResolver,
	applicationResolver,
	websiteResolver,
	createHomeSshConfiguration,
	createHomeGitConfiguration,
	createUnixAccount,
	createBaseApplication,
	each,
	checkExists,
	validateName,
	getNames,
	demandExistence,
	createBareRepo,
	getAuthorizedKeys
}
