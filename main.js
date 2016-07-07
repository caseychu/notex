const fs = require('fs');
const notex = require('./notex.js');

console.log(JSON.stringify(notex(fs.readFileSync(process.argv[2]).toString()), null, 2));