const fs = require('fs');
const notex = require('./notex.js');

const katex = require('katex');

const tokens = notex.tokens;
notex.commands = [
	{
		tag: true,
		pattern: /#{1,6}/,
		render: ([type], contents, children) => `
			<h${ type.length }>${ contents.join('') }</h${ type.length }>
			${ children.join('') }`
	},

	{
		tag: true,
		pattern: /\\(thm|def)/,
		render: ([_, type], contents, children) => `
			<div class="paragraph">
				<b>${ type }:</b> ${ contents.join('') }
				<div class="indent">${ children.join('') }</div>
			</div>`
	},
		
	{
		tag: true,
		pattern: /(?:(-)|\\(iff|if|then))/,
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
/*
	{
		pattern: ['$', tokens.VERBATIM, '$'], 
		render: (_, [math]) => `
			<span class="math">
				${ katex.renderToString(math, { throwOnError: false }) }
			</span>`
	},
	
	{
		pattern: ['\\[', tokens.VERBATIM, '\\]'],
		render: (_, [math]) => `
			<div class="math">
				${ katex.renderToString(math, { throwOnError: false, displayMode: true }) }
			</div>`
	},
	
	{
		pattern: ['**', tokens.TEXT, '**'],
		render: (_, contents)  => `<strong>${ contents.join('') }</strong>`
	},
	
	{
		patterns: ['*', tokens.TEXT, '*'],
		render: (_, contents) => `<em>${ contents.join('') }</em>`
	},
	
	{
		patterns: ['[', tokens.TEXT, '](', tokens.VERBATIM, ')'],
		render: (_, contents, __, url) => `<a href="${url}">${ contents.join('') }</a>`
	}*/
];

const tree = notex.parse(fs.readFileSync(process.argv[2]).toString());
console.log(`
	<meta charset="utf-8" />
	<link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.6.0/katex.min.css" />
	<link rel="stylesheet" type="text/css" href="style.css" />
`)
console.log(tree.join(''));