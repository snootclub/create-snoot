#!/usr/bin/env -S sudo node
let yargs = require("yargs")
let createSnoot = require("./commands/create-snoot.js")
let enterSnoot = require("./commands/enter-snoot.js")
let startSnoot = require("./commands/start-snoot.js")
let stopSnoot = require("./commands/stop-snoot.js")
let exec = require("./commands/exec.js")
let get = require("./commands/get.js")

let each = require("./commands/each.js")
let ls = require("./commands/ls.js")

let noop = Function.prototype

let positionalSnoot = yargs =>
	yargs.positional("snoot", {
		describe: "the name of the snoot you'd like",
	})

yargs
	.command(
		["create <snoot>", "new <snoot>"],
		"create a new snoot",
		positionalSnoot,
		createSnoot
	)
	.command(["ls", "list"], "list snoots", noop, ls)
	.command(
		"enter <snoot>",
		"enter a snoot's container",
		positionalSnoot,
		enterSnoot
	)
	.command(
		"get <snoot> <key>",
		"get snoot data",
		yargs => {
			positionalSnoot(yargs).positional("key", {
				describe: "the key for the data you'd like to see",
			})
		},
		get
	)
	.demandCommand().argv
