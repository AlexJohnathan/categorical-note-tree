#!/usr/bin/env node
let stateChange = require('../index.js').stateChange
stateChange(process.argv.slice(2))
