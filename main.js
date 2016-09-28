const http = require('http');
const fs = require('fs');
const open = require('open');
const notex = require('./notex.js');

http.createServer(function (req, res) {
	res.writeHead(200, { 'Content-type': 'text/html' });
	res.end(notex.parse(fs.readFileSync(process.argv[2]).toString('utf8')));
}).listen(0, function () {
	console.log(this.address().port);
	//open('http://localhost:' + this.address().port);
});