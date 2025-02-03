#!/usr/bin/env node
let addTree = require('../index.js').addTree
addTree([...process.argv.slice(2)])