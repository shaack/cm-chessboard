/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * License: MIT, see file 'LICENSE'
 */

const WebModuleLinker = require("web-module-linker")

const linker = new WebModuleLinker(__dirname)

linker.symlinkModuleSrc("svjs-svg")
