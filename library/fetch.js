let snoots = require("./snoots.js")

module.exports = require("make-fetch-happen").defaults({
	cacheManager: snoots.rootResolver(
    ".snootclub",
    "fetch-cache"
  ).path
})
