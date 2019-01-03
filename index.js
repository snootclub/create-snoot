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
		describe: "the name of the snoot you'd like to enter"
	})

let arguments = yargs
	.command(["create", "new"], "create a new snoot", noop, createSnoot)
	.command(["ls", "list"], "list snoots", noop, ls)
	.command(
		"enter <snoot>",
		"enter a snoot's container",
		positionalSnoot,
		enterSnoot
	)
	.command("get <snoot> <key>", "get snoot data", yargs => {
		positionalSnoot(yargs)
			.positional("key", {
				describe: "the key for the data you'd like to see"
			})
	}, get)
	.command(
		"each <command>",
		"run a command in each snoot",
		yargs => yargs.positional(
			"command", {
				describe: "the command to run. the env variable SNOOT_NAME will be set with snoot's name"
			}
		),
		each
	)
	.command(
		"start <snoot>",
		"start a snoot's container",
		positionalSnoot,
		startSnoot
	)
	.command(
		"stop <snoot>",
		"stop a snoot's container",
		positionalSnoot,
		stopSnoot
	)
	.command(
		"exec <snoot> <command>",
		"run a command in a snoot's container",
		yargs =>
			positionalSnoot(yargs)
				.positional("command", {
					describe: "the command to run"
				}),
		stopSnoot
	)
	.demandCommand()
	.argv
