const fs = require('fs');
const notex = require('./notex.js');

const katex = require('katex');


const htmlentities = text => text; // shh
const latex = text => text; // shh

//renderer.registerTag('*', '*', children => `<b>${ children.join('') }</b>`);
//renderer.registerTag('\\pred ', '\\n', children => `<b>${ children.join('') }</b>`);
/*
renderer.registerVerbatimTag('\\\\', '', _ => '\\');
renderer.registerVerbatimTag('$', '$', text => `<tt>${ latex(text) }</tt>`);
renderer.registerVerbatimTag('\\html{{', '}}', text => text);
renderer.registerVerbatimTag('\\html{', '}', text => text);
*/

notex.inline = [
	[/\*/, /\*/, children => `<b>${ children.join('') }</b>`]
];

notex.inlineVerbatim = [
	[/\$/, /\$/, katex.renderToString],
	[/\\html\{/, /}/, html => html],
];

notex.commands = [

	[/#{1,6}/, (head, children, match) => `
		<h${match[0].length}>${ head.join('') }</h${match[0].length}>
		${ children.join('') }`],
		
	[/\\(thm|def)/, (head, children, match) => `
		<div class="paragraph">
			<b>${ match[1] }:</b> ${ head.join('') }
			<div class="indent">${ children.join('') }</div>
		</div>`],
		
	[/-|\\(iff|if|then)/, (head, children, match) => `
		<div class="bullet">
			(${ match[0] }) ${ head.join('') }
			<div class="indent">${ children.join('') }</div>
		</div>`],

	[/()/, (head, children) => `
		<div class="paragraph">
			${ head.join('') }
			<div class="indent">${ children.join('') }</div>
		</div>`],
];

//notex.createNode = (type, children) => React.createElement(type, {}, children);
//notex.createNode = (type, { text, children }) => <type text={text}>{ children }</type>;

/*
tags.set(['*', '*'], (children, render) => `\\textbf{${ render(children) }}`);

tags.set('\\thm', (head, tail, render) => )*/

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
//console.log(JSON.stringify(tree, null, 2))