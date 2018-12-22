#!/usr/bin/env -S sudo node
let yargs = require("yargs")
let createSnoot = require("./commands/create-snoot.js")
let enterSnoot = require("./commands/enter-snoot.js")
let stopSnoot = require("./commands/stop-snoot.js")
let get = require("./commands/get.js")

let positionalSnoot = yargs =>
	yargs.positional("snoot", {
		describe: "the name of the snoot you'd like to enter"
	})

let arguments = yargs
	.command(["create", "new"], "create a new snoot", () => {}, createSnoot)
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
		"stop <snoot>",
		"stop a snoot's container",
		positionalSnoot,
		stopSnoot
	)
	.demandCommand()
	.argv
