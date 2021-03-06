const http = require('http');
const fs = require('fs');
const open = require('open');
const path = require('path');
const retry = require('retry');
const url = require('url');
const ws = require('ws');
const Notex = require('./notex.js');

const file = process.argv[2];
const server = http.createServer(function (req, res) {
	const pathname = url.parse(req.url).pathname;
	
	if (pathname === '/')
		read().then(function (contents) {
			res.writeHead(200, { 'Content-type': 'text/html' });
			res.end(renderHTML(contents));
		});
	
	else if (pathname.indexOf('/client/') === 0)
		serveStatic(__dirname + '/client', pathname.substr('/client/'.length), req, res);
	
	else if (pathname.indexOf('/katex/') === 0)
		serveStatic(path.dirname(require.resolve('katex')), pathname.substr('/katex/'.length), req, res);
		
	else {
		res.writeHead(404);
		res.end('Not found');
	}
});

const wss = new ws.Server({ server });
let emptyFileTimeout = null;
fs.watch(file, function () {
	read().then(function (contents) {

		// If the file is empty, wait a bit sending the empty file.
		if (!contents) {
			if (!emptyFileTimeout) {
				emptyFileTimeout = setTimeout(function () {
					emptyFileTimeout = null;
					wss.clients.forEach(function (client) {
						client.send(JSON.stringify(Notex.parse('')));
					});
				}, 1000);
			}
			return;
		}
		
		// Once the file is not empty, cancel the empty file timeout.
		if (emptyFileTimeout) {
			clearTimeout(emptyFileTimeout);
			emptyFileTimeout = null;
		}

		wss.clients.forEach(function (client) {
			client.send(JSON.stringify(Notex.parse(contents)));
		});
	});
});

server.listen(0, function () {
	console.log('http://localhost:' + server.address().port);
	open('http://localhost:' + server.address().port);
});

// Time out.
setInterval(function () {
	if (wss.clients.length === 0)
		process.exit();
}, 30000);


const mimeTypes = {
	'.css': 'text/css',
	'.js': 'text/javascript',
	'.eot': 'application/vnd.ms-fontobject',
	'.ttf': 'application/x-font-ttf',
	'.woff': 'application/font-woff',
	'.woff2': 'font/woff2'
};

function serveStatic(root, pathname, req, res) {
	root = path.resolve(root);
	const filename = path.resolve(path.join(root, pathname));
	
	if (filename.indexOf(root) !== 0) {	
		res.writeHead(403);
		res.end('Forbidden');
		return;
	}
	
	const stream = fs.createReadStream(filename);
	stream.once('error', function () {
		res.writeHead(404);
		res.end('Not found');
	});
	stream.once('readable', function () {
		res.writeHead(200, { 'Content-type': mimeTypes[path.extname(filename)] });
		stream.pipe(res);
	});
}

function read() {
	return new Promise(function (resolve, reject) {
		
		// Retry because readFile can fail if the file is being saved to
		const op = retry.operation();
		op.attempt(function () {
			fs.readFile(file, function (err, contents) {
				if (op.retry(err))
					return;
				resolve(contents.toString('utf8'));
			});
		}, { minTimeout: 50 });
	});
}

function renderHTML(contents) {
	return `<!DOCTYPE html>
		<html>
			<head>
				<meta charset="UTF-8" />
				<title></title>
				<link rel="stylesheet" type="text/css" href="/katex/katex.min.css" />
				<link rel="stylesheet" type="text/css" href="/client/style.css" />
			</head>
			<body>
				<div id="main"></div>
				<script src="/client/script.js"></script>
				<script>
					render(${JSON.stringify(Notex.parse(contents))});
				</script>
			</body>
		</html>`;
}
