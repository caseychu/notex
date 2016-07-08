const fs = require('fs');
const notex = require('./notex.js');

var pretty = require('pretty');


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

notex.inline = {
	//'\\*'
};


notex.commands = {
	'#{1,6}': (head, children, type) => `
		<h${type.length}>${ head.join('') }</h${type.length}>
		<div style="margin-left: 1em">${ children.join('') }</div>`,

	'-': (head, children) => `
		<div class="bullet">
			${ head.join('') }
			<div class="indent">${ children.join('') }</div>
		</div>`,
		
	'\\\\(thm|def|iff)': (head, children, type) => `
		<p class="${ type.substr(1) }">
			<b>${ type }:</b> ${ head.join('') }
			<div class="indent">${ children.join('') }</div>
		</p>`,

	'': (head, children) => `
		<p>
			${ head.join('') }
			<div class="indent">${ children.join('') }</div>
		</p>`
};

//notex.createNode = (type, children) => React.createElement(type, {}, children);
//notex.createNode = (type, { text, children }) => <type text={text}>{ children }</type>;

/*
tags.set(['*', '*'], (children, render) => `\\textbf{${ render(children) }}`);

tags.set('\\thm', (head, tail, render) => )*/

function toHTML(nodes) {
	if (!Array.isArray(nodes))
		return nodes;
	return nodes.map(node => {
		if (node.length === 3)
			return `
				<${node[0]}>
					<${node[0]}-head>${toHTML(node[1])}</${node[0]}-head>
					<${node[0]}-body>${toHTML(node[2])}</${node[0]}-body>
				</${node[0]}>`;
		if (node.length !== 2)
			throw new Error();
		return `
			<${node[0]}>${toHTML(node[1])}</${node[0]}>`;
	}).join('');
}

const tree = notex.parse(fs.readFileSync(process.argv[2]).toString());
console.log(`
	<style>
		.indent {
			margin-left: 2em;
		}
	</style>
`)
console.log(tree.join(''));
//console.log(JSON.stringify(tree, null, 2))