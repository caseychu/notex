const http = require('http');
const fs = require('fs');
const open = require('open');
const retry = require('retry');
const ws = require('ws');

const notex = require('./notex.js');

const file = process.argv[2];
const server = http.createServer(function (req, res) {
	
	// Retry because readFile can fail if the file is being saved to
	const op = retry.operation();
	op.attempt(function () {
		fs.readFile(file, function (err, contents) {
			if (op.retry(err))
				return;
				
			res.writeHead(200, { 'Content-type': 'text/html' });
			res.end(notex.parse(contents.toString('utf8')));
		});
	}, { minTimeout: 50 });
	
});

const wss = new ws.Server({ server });
fs.watch(file, function () {
	wss.clients.forEach(function (client) {
		client.send('reload');
	});
});

server.listen(0, function () {
	open('http://localhost:' + server.address().port);
});

// Time out.
setInterval(function () {
	if (wss.clients.length === 0)
		process.exit();
}, 10000);