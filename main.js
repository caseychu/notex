const fs = require('fs');
const notex = require('./notex.js');

const katex = require('katex');

notex.commands = [
	
	[/#{1,6} /, ({ head, children, match }) => `
		<h${match[0].length}>${ head.join('') }</h${match[0].length}>
		${ children.join('') }`],
		
	[/\\(thm|def) /, ({ head, children, match }) => `
		<div class="paragraph">
			<b>${ match[1] }:</b> ${ head.join('') }
			<div class="indent">${ children.join('') }</div>
		</div>`],
		
	[/(-|\\(iff|if|then)) /, ({ head, children, match }) => `
		<div class="bullet">
			(${ match[1] }) ${ head.join('') }
			<div class="indent">${ children.join('') }</div>
		</div>`],

	['', ({ head, children }) => `
		<div class="paragraph">
			${ head.join('') }
			<div class="indent">${ children.join('') }</div>
		</div>`],
];

notex.inline = [
	[/\$([^\$]*)\$/, ({ match }) => katex.renderToString(match[1], { throwOnError: false })],
	[/\\\[([\s\S]*?)\\\]/, ({ match }) => katex.renderToString(match[1], { displayMode: true, throwOnError: false })],
	[/\\html\{([^}]*)\}/, ({ match }) => match[1]],
	
	['**', '**', ({ children }) => `<strong>${ children.join('') }</strong>`],
	['*', '*', ({ children }) => `<em>${ children.join('') }</em>`],
];

const tree = notex.parse(fs.readFileSync(process.argv[2]).toString());
console.log(`
	<meta charset="utf-8" />
	<link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.6.0/katex.min.css" />
	<style>
		.indent {
			margin-left: 2em;
		}
		.paragraph {
			margin: 1em 0;
		}
	</style>
`)
console.log(tree.join(''));