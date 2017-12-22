const fs = require("fs");
const process = require("process");
const path = require("path");

const projectRoot = path.dirname(require.main.filename);

// link dependencies
process.chdir('./src');
symlinkModule("svjs-svg");

// copy assets
if (resolveModulePath("cm-chessboard") !== null) {
    try {
        fs.mkdir(projectRoot + "/assets");
    } catch (e) {
        console.log(e.mesaage);
    }
    try {
        fs.mkdir(projectRoot + "/assets/images");
    } catch (e) {
        console.log(e.mesaage);
    }
    fs.copyFileSync(resolveModulePath("cm-chessboard") + "/assets/images/chessboard-sprite.svg",
        projectRoot + "/assets/images/");
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
