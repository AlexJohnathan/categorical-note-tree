#!/usr/bin/env node
let forward = require('../index.js').forward
forward([...process.argv.slice(2)])