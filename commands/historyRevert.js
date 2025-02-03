#!/usr/bin/env node
let revert = require('../index.js').revert
revert([...process.argv.slice(2)])