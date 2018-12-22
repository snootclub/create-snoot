let chalk = require("chalk")
let random = array => array[array.length * Math.random() | 0]

let colors = {
	log: [
		"#ff00ff",
		"#66ffcc",
		"#3399ff",
		"#abeabe",
		"#aabbee"
	],
	warn: [
		"#eeaa55",
		"#cccc00",
		"#cccc44",
		"#cc9911",
		"#ccaa00"
	],
	shout: [
		"#ff6677",
		"#ff2a50",
		"#ff6666",
		"#ff0000",
		"#cc3366"
	]
}

Object.entries(colors).forEach(([level, colors]) => {
	exports[level] = message => (
		console.log(chalk.hex(random(colors)).bold(message)),
		message
	)
})
