let fs = require("fs-extra")
let createResolver = require("./create-path-resolver.js")
let unix = require("./unix.js")
let shell = require("./shell.js")
let skeletons = require("./skeletons.js")
let {shout} = require("./loggo.js")

let rootResolver = createResolver("/www/snoot.club")
let resolver = rootResolver("snoots")

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

async function fixSshPermissions (snoot) {
	let snootResolver = resolver(snoot)
	let sshDirectoryResolver = snootResolver(".ssh")
	let authorizedKeysPath = sshDirectoryResolver("authorized_keys").path

	let snootOwnedPaths = [
		sshDirectoryResolver.path,
		authorizedKeysPath,
		snootResolver.path
	]

	let snootId = await unix.getUserId(snoot)
	let commonId = await unix.getCommonGid()

	for (let path of snootOwnedPaths) {
		await fs.chmod(path, 0o750)
	}

	await fs.chmod(authorizedKeysPath, 0o644)

	for (let path of snootOwnedPaths) {
		await fs.chown(path, snootId, commonId)
	}
}

async function createUnixAccount (snoot) {
	return unix.createUser({
		user: snoot,
		groups: [unix.commonGroupName, unix.lowerGroupName],
		homeDirectory: createResolver("/")("snoots", snoot).path
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

async function createBaseApplication (snoot, data) {
	await skeletons.write({
		resolver: resolver(snoot),
		uid: await unix.getUserId(snoot),
		gid: await unix.getCommonGid(),
		render: compile => compile(snoot, data),
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
	applicationResolver,
	websiteResolver,
	createUnixAccount,
	createBaseApplication,
	fixSshPermissions,
	checkExists,
	validateName,
	getNames,
	demandExistence,
	createBareRepo,
	getAuthorizedKeys
}
