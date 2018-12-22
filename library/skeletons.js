let fs = require("fs-extra")
let os = require("os")

exports.files = {
	"snoot.json" ({snoot, webPort, sshPort, authorizedKeys}) {
		return JSON.stringify({
			snoot,
			webPort,
			sshPort,
			authorizedKeys
		}, null, "\t") + os.EOL
	},
	"nginx.conf" ({snoot, webPort}) {
		return `server {
	include /www/snoot.club/blocks/error_page.nginx;
	include /www/snoot.club/blocks/ssl.nginx;

	default_type text/plain;

	server_name ${snoot}.snoot.club;
	access_log /www/snoot.club/snoots/${snoot}/logs/access.ssl.log;
	error_log /www/snoot.club/snoots/${snoot}/logs/error.ssl.log;

	location / {
		include /www/snoot.club/blocks/cors.nginx;
		proxy_pass http://127.0.0.1:${webPort}/;
		proxy_set_header Host $http_host;
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header X-Forwarded-Proto $scheme;
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
	"docker-compose.yml" ({sshPort, webPort}) {
		return `version: "3"
services:
  snoot:
    image: "node:latest"
    working_dir: /application
    environment:
      - NODE_ENV=production
    volumes:
      - ./application/:/application
    ports:
      - "${sshPort}:22"
      - "${webPort}:80"
    restart: always
    command: "/application/.start.sh"
`
	},
	application: {
		"package.json" ({snoot}) {
			return `{
	"name": "${snoot}-application",
	"version": "1.0.0",
	"main": "index.js",
	"scripts": {
		"start": "micro -l tcp://0.0.0.0:\${SNOOT_MICRO_PORT-80}",
		"test": "micro-dev -l tcp://0.0.0.0:\${SNOOT_MICRO_PORT-80}"
	},
	"author": "${snoot} <${snoot}@snoot.club>",
	"license": "GPL-3.0+",
	"description": "${snoot} application on snoot.club",
	"dependencies": {
		"micro": "^9.3.3",
		"serve-handler": "^5.0.7"
	},
	"devDependencies": {
		"micro-dev": "^3.0.0"
	}
}
`
		},
		"index.js" () {
			return `const serve = require("serve-handler")

const serveOptions = {
	public: "website",
	cleanUrls: true,
	renderSingle: true
}

module.exports = async (request, response) =>
	await serve(request, response, serveOptions)
`
		},
		"ecosystem.config.js" () {
			return `module.exports = {
	apps : [{
		name: "snoot",
		script: "npm start",
		watch: true
  }]
}
`
		},
		".start.sh" () {
			return `#!/bin/sh
apt update
apt install -y vim-tiny mg openssh-server
/usr/sbin/sshd
mkdir -p /root/.ssh
mv /application/authorized_keys /root/.ssh/authorized_keys
chown -R root.root /root/.ssh
chmod 700 -R /root/.ssh
cd /application
npm install
npm i -g pm2
pm2 ecosystem.config.js
pm2 start --name "snoot" --watch npm -- start
tail -f /dev/null
`
		},
		"authorized_keys" ({authorizedKeys}) {
			return authorizedKeys
		},
		website: {
			"index.html" ({snoot, sshPort}) {
				return `<!doctype html>
<meta charset="utf-8">
<title>${snoot}'s a snoot</title>
<style>
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
	if you are <strong>${snoot}</strong>, then you have two choices:
</p>

<ul>
	<li>
		ssh into the application container
		<ul>
			<li><code>ssh root@snoot.club -p ${sshPort}</code></li>
			<li>this file is <code>/application/website/index.html</code>.</li>
		</ul>
	</li>
	<li>
		sftp into the website directory
		<ul>
			<li><code>sftp ${snoot}@snoot.club</code></li>
			<li>this file is <code>./website/index.html</code></li>
		</ul>
	</li>
</ul>

<hr>

<p>
	if you want to ssh in without remembering the port, adding
	the below to the <code>~/.ssh/config</code> on your local machine
	will let you access it by running <code>ssh snoot</code> in a terminal.
</p>

<pre>
<code>
Host snoot
	User root
	HostName snoot.club
	Port ${sshPort}
</code>
</pre>
`
			}
		}
	}
}

exports.write = async (directoryResolver, render, files = exports.files) => {
	for (let [key, value] of Object.entries(files)) {
		let resolver = directoryResolver(key)
		if (typeof value == "function") {
			await fs.outputFile(resolver.path, render(value))
		} else {
			await exports.write(resolver, render, value)
		}
	}
}
