const fs = require("fs");
const process = require('process');
process.chdir('./src');
fs.symlink("../node_modules/svjs-test/", "svjs-test", "dir", () => {});
fs.symlink("../node_modules/svjs-svg/", "svjs-svg", "dir", () => {});