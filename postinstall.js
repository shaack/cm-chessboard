const fs = require("fs");
const process = require("process");

// link dependencies
process.chdir('./src');
symlinkModule("svjs-svg");

// copy assets
if (resolveModulePath("cm-chessboard") !== null) {
    process.chdir('..');
    fs.mkdirSync("assets");
    fs.mkdirSync("assets/images");
    fs.copyFileSync(resolveModulePath("cm-chessboard") + "/assets/images/chessboard-sprite.svg", "./assets/images/");
}

function symlinkModule(moduleName) {
    try {
        fs.symlinkSync(resolveModulePath(moduleName), moduleName, "dir");
    } catch (e) {
        console.log(e.message);
    }
}

function resolveModulePath(moduleName) {
    try {
        const pathToMainJs = require.resolve(moduleName);
        return pathToMainJs.substr(0, pathToMainJs.lastIndexOf(moduleName) + moduleName.length);
    } catch (e) {
        console.warn("module '" + moduleName + "' not found");
        return null;
    }
}
