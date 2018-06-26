const fs = require("fs")
const process = require("process")
const path = require("path")

// link dependencies
process.chdir('./src')
symlinkModuleSrc("svjs-svg")


function symlinkModuleSrc(moduleName) {
    try {
        fs.symlinkSync(resolveModulePath(moduleName), moduleName, "dir")
    } catch (e) {
        console.log(e.message)
    }
}

function resolveModulePath(moduleName) {
    try {
        const pathToMainJs = require.resolve(moduleName)
        console.log("pathToMainJs", pathToMainJs)
        return pathToMainJs.substr(0, pathToMainJs.lastIndexOf(moduleName) + moduleName.length)
    } catch (e) {
        console.warn(e)
        return null
    }
}
