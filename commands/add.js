#!/usr/bin/env node
let add = require('../index.js').add
add([...process.argv.slice(2)])
