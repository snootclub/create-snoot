let chalk = require("chalk")
let random = array => array[array.length * Math.random() | 0]

let logColors = [
	"#ff00ff",
	"#66ffcc",
	"#3399ff",
	"#f7f7f7",
	"#feeefe",
	"#abeabe",
	"#aabbee"
]

let warnColors = [
	"#ffff00",
	"#ffee33",
	"#f7f344"
]

let shoutColors = [
	"#ff6677",
	"#ff2a50",
	"#ff6666",
	"#ff0000",
	"#cc3366"
]

exports.log = message => (
	console.log(chalk.hex(random(logColors)).bold(message)),
	message
)

exports.warn = message => (
	console.warn(chalk.hex(random(warnColors))(message)),
	message
)

exports.shout = message => (
	console.error(chalk.hex(random(shoutColors)).bold(message)),
	message
)