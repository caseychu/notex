const http = require('http');
const fs = require('fs');
const open = require('open');
const retry = require('retry');
const url = require('url');
const ws = require('ws');
const ReactDOMServer = require('react-dom/server');

const Notex = require('./notex.js');
const NotexReact = require('./notex-react.js');

const file = process.argv[2];
const server = http.createServer(function (req, res) {
	
	switch (url.parse(req.url).pathname) {
		case '/':
			// Retry because readFile can fail if the file is being saved to
			const op = retry.operation();
			op.attempt(function () {
				fs.readFile(file, function (err, contents) {
					if (op.retry(err))
						return;
						
					res.writeHead(200, { 'Content-type': 'text/html' });
					res.end(renderHTML(contents.toString('utf8')));
				});
			}, { minTimeout: 50 });
			return;
		
		default:
			res.writeHead(404);
			res.end('Not found');
			return;
	}
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

function renderHTML(contents) {
	const parsed = Notex.parse(contents);
	return preamble + ReactDOMServer.renderToString(NotexReact.render(parsed)) + postscript;
}

const preamble = `<!DOCTYPE html>
	<meta charset="UTF-8" />
	<title></title>
	<link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.6.0/katex.min.css" />
	
	<style>
		body {
			font-family: serif;
			font-size: 14pt;
			line-height: 1.5em;
			
			max-width: 8in;
			margin: 0 auto;
		}
		
		body > ul {
			padding: 1em;
		}
		
		b > b { /* uh, ugly hack */
			font-weight: normal;
			font-style: italic;
		}
		ul {
			list-style: none;
		}
		h1, h2, h3, h4, h5, h6 {
			margin: 1em 0 0;
		}
		h1 { font-size: 1.5em; }
		h2 {
			font-size: 1.25em;
			/*border-bottom: 1px solid silver;
			padding-bottom: 5px;*/
		}
		h3 { font-size: 1em; }
		h4 { font-size: 1em; }
		h5 { font-size: 1em; }
		h6 { font-size: 1em; }
	
		.bullet-circle {
			list-style-type: circle;
		}
		.tag {
			color: #C80000;
			font-family: consolas;
			font-size: 0.8em;
			padding-right: 3px;
		}
		
		div.math {
			margin: -15px 0; 
		}
		.math {
			padding: 0 2px;
			color: blue;
		}
		.katex {
			font-size: 1em !important;
		}
	</style>`;
	
const postscript = `
	<script>
			var socket = new WebSocket('ws://' + location.host);
			socket.onerror = function () {
				console.log('fail');
			};
			socket.onmessage = function () {
				location.reload();
			};
		</script>
		<script src="http://smartquotesjs.com/src/smartquotes.min.js"></script>
`;