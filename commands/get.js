let snoots = require("../library/snoots.js")
let {shout} = require("../library/loggo.js")

module.exports = async ({snoot, key}) => {
  await snoots.demandExistence(snoot)
  
  let config = await snoots.getConfig(snoot)

  if (!config[key]) {
    shout(`no such key: ${snoot}.${key}`)
    process.exit(18)
  }

  console.log(config[key])
}