#!/usr/bin/env node
let find = require('../index.js').find
find([...process.argv.slice(2)])