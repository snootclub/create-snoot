let fs = require("fs-extra")
let os = require("os")
let inquirer = require("inquirer")

exports.files = {
	logs: {},
	"nginx.conf" (snoot) {
		return `server {
	include /www/snoot.club/blocks/error_page.nginx;
	include /www/snoot.club/blocks/ssl.nginx;

	default_type text/plain;

	server_name ${snoot}.snoot.club;
	access_log /www/snoot.club/snoots/logs/${snoot}.access.ssl.log;
	error_log /www/snoot.club/snoots/logs/${snoot}.error.ssl.log;

	location / {
		include /www/snoot.club/blocks/cors.nginx;
		proxy_pass http://unix:/www/snoot.club/snoots/${snoot}/application/sock:/;
		proxy_set_header Host $http_host;
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header X-Forwarded-Proto $scheme;
		include /www/snoot.club/blocks/proxy-cache.nginx;
		expires $expires;
		client_max_body_size 222m;
	}
}

server {
	listen 80;
	listen [::]:80;
	server_name ${snoot}.snoot.club;
	return 301 https://${snoot}.snoot.club$request_uri;
}
`
	},
	repo: {
		hooks: {
			"post-receive" () {
				return `#!/bin/sh
npx @snootclub/post-receive`
			}
		}
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

<p>
	if you are <strong>${snoot}</strong>, you can now ssh or ftp into your account!
</p>

<p>
	the page you are reading right now is the file located at
	<code>./application/website/index.html</code>
</p>

<p>
	the start script in your <code>package.json</code> will be run automatically.
	it needs to create a unix domain socket called <code>sock</code> in
	the application directory.
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
		gid,
		getPermissions = () => ({uid, gid, mode})
	} = options

	for (let [key, value] of Object.entries(files)) {
		let fileResolver = resolver(key)
		let fileType = typeof value == "function"
			? fileTypes.file
			: fileTypes.directory

		let filePath = fileResolver.path
		let permissions = getPermissions({filePath, fileType}) || {}

		out:
		if (fileType == fileTypes.file) {
			// this is a file node
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
			await fs.chmod(filePath, permissions.mode || 0o644)
		} else {
			// this is a directory node
			let files = value
			await fs.mkdirp(filePath)
			await fs.chmod(filePath, permissions.mode || 0o775)
			await write(merge(options, {
				resolver: fileResolver,
				files
			}))
		}

		await fs.chown(
			filePath,
			permissions.uid || uid,
			permissions.gid || gid
		)
	}
}
