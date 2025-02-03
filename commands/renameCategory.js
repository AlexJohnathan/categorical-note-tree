#!/usr/bin/env node
let rename = require('../index.js').renameCateogry
rename([...process.argv.slice(2)])