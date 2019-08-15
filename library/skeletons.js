let fs = require("fs-extra")
let inquirer = require("inquirer")

exports.files = {
	".ssh": {
		authorized_keys (_snoot, {authorizedKeys}) {
			return authorizedKeys
		}
	},
	".gitconfig" (snoot) {
		return `[user]
name = ${snoot}
email = ${snoot}@snoot.club`
	},
	application: {
		boops: {
			".gitkeep": () => "a polite request to git to keep this empty directory"
		},
		".gitignore" () {
			return `node_modules/
.cache/
`
		},
		"package.json" (snoot) {
			return `{
	"name": "${snoot}-application",
	"version": "1.0.0",
	"main": "index.js",
	"scripts": {
		"install": "boop",
		"watch": "boop",
		"build": "boop",
"start": "micro -l unix:sock"
	},
	"author": "${snoot} <${snoot}@snoot.club>",
	"license": "GPL-3.0+",
	"description": "${snoot} application on snoot.club",
	"dependencies": {
		"@snootclub/boop": "^0.0.14",
		"micro": "^9.3.3"
	}
}
`
		},
		"index.js" () {
			return `let boop = require("@snootclub/boop")

module.exports = (request, response) =>
	boop(request, response)
`
		},
		website: {
			"index.html" (snoot) {
				return `<!doctype html>
<meta charset="utf-8">
<title>${snoot}'s a snoot</title>
<style>
	* {
		scrollbar-color: #cc3669 #ffe9ed;
	}

	::selection {
		background: black;
		color: white;
	}

	body {
		background: #ffe9ed;
		color: #c36;
		font-size: 1.6em;
		line-height: 1.2;
		width: 80vw;
		margin: auto;
	}

	hr {
		height: 30px;
		border-style: solid;
		border-color: #c36;
		border-width: 0;
		border-top-width: 2px;
		border-radius: 10px;
		position: relative;
	}

	hr:before {
		display: block;
		content: "";
		height: 100%;
		transform: translateY(-100%);
		border-style: solid;
		border-color: #c36;
		border-width: 0;
		border-bottom-width: 2px;
		border-radius: inherit;
	}

	code {
		color: #4abe;
	}
</style>
<h1>
	Welcome to ${snoot}'s homepage
</h1>

<h2>getting started:</h2>

<p>
	if you are <strong>${snoot}</strong>, you can now ssh or ftp into your account!
</p>

<p>
	if you want to host a webpage, put files in the directory
	<code>application/website</code>
</p>

<p>
	the page you are reading right now is the file located at
	<code>./application/website/index.html</code>
</p>

<h2>advanced users:</h2>

<p>
	the start script in your <code>package.json</code> will be run automatically.
	you can replace it with anything, and as long as it creates and listens on a
	unix domain socket at <code>./application/sock</code>, it'll be served. the
	initial setup already does this, and serves files in
	<code>./application/website</code> and apps in
	<code>./application/boops</code> using <a
	href="https://github.com/snootclub/boop">boops</a>.
</p>
`
			}
		}
	}
}

let fileTypes = {
	directory: Symbol("directory"),
	file: Symbol("file")
}

exports.fileTypes = fileTypes

let merge = (a, b) =>
	Object.assign({}, a, b)

exports.write = async function write (options) {
	let {
		resolver,
		render,
		files = exports.files,
		uid,
		gid
	} = options

	for (let [key, value] of Object.entries(files)) {
		let fileResolver = resolver(key)
		let fileType = typeof value == "function"
			? fileTypes.file
			: fileTypes.directory

		let filePath = fileResolver.path

		out:
		if (fileType == fileTypes.file) { // if this is a file node
			let fileCreator = value
			if (await fs.pathExists(filePath)) {
				let {shouldContinue} = await inquirer.prompt({
					type: "confirm",
					name: "shouldContinue",
					message: `🎺 whümf and wetch? "${filePath}" already exists, should we overwrite?`,
					default: false
				})

				if (!shouldContinue) {
					break out
				}
			}
			await fs.outputFile(filePath, render(fileCreator))
			let rw_r__r__ = 0o644
			await fs.chmod(filePath,  rw_r__r__)
		} else {
			// this is a directory node
			let files = value
			let rwxrwxr_x = 0o775
			await fs.mkdirp(filePath)
			await fs.chmod(filePath, rwxrwxr_x)
			await write(merge(options, {
				resolver: fileResolver,
				files
			}))
		}

		await fs.chown(
			filePath,
			uid,
			gid
		)
	}
}
