#!/usr/bin/env node
let feed = require('../index.js').feed
feed(process.argv.slice(2))