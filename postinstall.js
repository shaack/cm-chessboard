const fs = require("fs");
const process = require("process");
process.chdir('./src');

symlinkModule("svjs-test");
symlinkModule("svjs-svg");

function symlinkModule(moduleName) {
    fs.symlink(resolveModulePath(moduleName), moduleName, "dir", () => {});
}
function resolveModulePath(moduleName) {
    const pathToMainJs = require.resolve(moduleName);
    return pathToMainJs.substr(0, pathToMainJs.lastIndexOf(moduleName) + moduleName.length);
}
