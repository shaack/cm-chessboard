const WebModuleLinker = require("web-module-linker")

const linker = new WebModuleLinker(__dirname)

linker.symlinkModuleSrc("svjs-svg")
