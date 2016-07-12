const fs = require('fs');
const notex = require('./notex.js');

const katex = require('katex');

const tokens = notex.tokens;
notex.commands = [
	{
		tag: true,
		pattern: /#{1,6}\s*/,
		render: ([type], contents, children) => `
			<h${ type.length }>${ contents.join('') }</h${ type.length }>
			${ children.join('') }`
	},

	{
		tag: true,
		pattern: /\\(thm|def)\s+/,
		render: ([_, type], contents, children) => `
			<div class="paragraph">
				<b>${ type }:</b> ${ contents.join('') }
				<div class="indent">${ children.join('') }</div>
			</div>`
	},
		
	{
		tag: true,
		pattern: /(?:(-)|\\(iff|if|then))\s+/,
		render: ([type], contents, children) => `
			<div class="bullet">
				(${ type }) ${ contents.join('') }
				<div class="indent">${ children.join('') }</div>
			</div>`
	},

	{
		tag: true,
		render: (_, contents, children) => `
			<div class="paragraph">
				${ contents.join('') }
				<div class="indent">${ children.join('') }</div>
			</div>`
	},

	{
		pattern: ['$', tokens.VERBATIM, '$'], 
		render: (_, math) => `<tt style="color: red">${ math }</tt>`
		/*render: (_, math) => `
			<span class="math">
				${ katex.renderToString(math, { throwOnError: false }) }
			</span>`
		*/
	},

	{
		pattern: ['\\[', tokens.VERBATIM, '\\]'],
		render: (_, math) => `<div><tt style="color: red">${ math }</tt></div>`
		/*
		render: (_, math) => `
			<div class="math">
				${ katex.renderToString(math, { throwOnError: false, displayMode: true }) }
			</div>`
		*/
	},
	
	{
		pattern: ['**', tokens.TEXT, '**'],
		render: (_, contents)  => `<strong>${ contents.join('') }</strong>`
	},
	
	{
		pattern: ['*', tokens.TEXT, '*'],
		render: (_, contents) => `<em>${ contents.join('') }</em>`
	},
	
	{
		pattern: ['[', tokens.TEXT, '](', tokens.VERBATIM, ')'],
		render: (_, contents, __, url) => `<a href="${url}">${ contents.join('') }</a>`
	}
];

const tree = notex.parse(fs.readFileSync(process.argv[2]).toString('utf8'));
console.log(`
	<meta charset="utf-8" />
	<link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.6.0/katex.min.css" />
	<link rel="stylesheet" type="text/css" href="style.css" />
`)
if (typeof tree === 'string')
	console.log(tree)
else if (Array.isArray(tree))
	console.log(tree.join(''))
else
	console.log(JSON.stringify(tree, null, 2));