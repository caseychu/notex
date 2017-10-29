// Run `npm run compile` to recompile

const React = require('react');
const katex = require('katex');
const smartquotes = require('smartquotes');

const macros = {
	'\\N': '\\mathbb{N}',
	'\\Z': '\\mathbb{Z}',
	'\\Q': '\\mathbb{Q}',
	'\\R': '\\mathbb{R}',
	'\\C': '\\mathbb{C}',
	'\\E': '\\mathbb{E}',
	'\\argmax': '\\mathop{\\mathrm{arg\\,max}}\\limits',
};

function NotexDocument(doc) {
	return <Lines doc={doc} nodes={doc} />
}

function Lines({ doc, nodes }) {
	if (nodes.length)
		return (
			<ul>
				{ nodes.map((line, i) => <Line {...line} key={i} doc={doc} />) }
			</ul>
		);
	return null;
}

function Line({ doc, tag, inline, sublines }) {
	switch (tag) {
		case null:
		case 'h1':
		case 'h2':
		case 'h3':
		case 'h4':
		case 'bullet':
			return (
				<li className={tag}>
					{ ['h2', 'h3', 'h4'].includes(tag) ? <a name={slugify(inline)} /> : null }
					<div className="inline">
						<InlineText nodes={inline} />
					</div>
					<Lines nodes={sublines} doc={doc} />
				</li>
			);

		case 'tableofcontents':
			return (
				<li>
					<TableOfContents doc={doc} />
				</li>
			);
			
		default:
			return (
				<li>
					<div className="inline">
						<span className="tag">\{ tag }</span>
						<InlineText nodes={inline} />
					</div>
					<Lines nodes={sublines} doc={doc} />
				</li>
			);
	}
}

function InlineText({ nodes }) {
	return (
		<span>
			{ nodes.map((node, i) => typeof node === 'string' ? smartquotes.string(node) : <InlineCommand {...node} key={i} />) }
		</span>
	);
}

function InlineCommand(command) {
	var tag = command.tag;
	switch (tag) {
		case 'html':
			return <span dangerouslySetInnerHTML={{__html: command.text}} />;
	
		case 'math-block':
		case 'math-inline':
			try {
				return (
					<span className={tag} dangerouslySetInnerHTML={{
						__html: katex.renderToString(command.text, {
							macros: macros,
							throwOnError: false,
							displayMode: tag === 'math-block',
							errorColor: '#C80000'
						})
					}} />);
			} catch (e) {
				return <span className={tag} style={{color: '#C80000'}}>{ e.message }</span>;
			}
		
		case 'b':
			return <b><InlineText nodes={command.text} /></b>;
		case 'i':
			return <i><InlineText nodes={command.text} /></i>;
			
		case 'link':
			return <a href={command.url} target="_blank" rel="noopener noreferrer"><InlineText nodes={command.text} /></a>;
	}
};

function TableOfContents({ doc }) {
	// Hacky. Ideally, we would call something like doc.getHierarchy()
	
	// Assume headers are on the first level of indents
	const headers = doc.filter(line => ['h2', 'h3', 'h4'].includes(line.tag));
	return (
		<div className="toc"> 
			<div className="header">Table of contents</div>
			<ul style={{ 'columnCount': headers.length >= 10 ? 2 : 1 }}>
				{ headers.map((line, i) => <TableOfContentsLine {...line} key={i} />) }
			</ul>
		</div>
	);
}

function TableOfContentsLine({ tag, inline }) {
	return (
		<li className={'toc-' + tag}>
			<a href={'#' + slugify(inline)}>
				<InlineText nodes={inline} />
			</a>
		</li>
	);
}

function slugify(nodes) {
	return nodes
		.filter(node => typeof node === 'string')
		.join('')
		.trim()
		.toLowerCase()
		.replace(/\W+/g, '-');
}

module.exports = NotexDocument;