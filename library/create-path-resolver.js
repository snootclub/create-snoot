let path = require("path")

module.exports = function createPathResolver (directory) {
	function resolver (...files) {
		let filepath = path.resolve(directory, ...files)
		if (files.length) {
			return createPathResolver(filepath)
		}
		return filepath
	}

	resolver.toString = function () {
		return path.resolve(directory)
	}

	Object.defineProperty(resolver, "path", {
		get () {
			return this.toString()
		}
	})

	return resolver
}
