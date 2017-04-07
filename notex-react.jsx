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
	'\\E': '\\mathbb{E}'
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
					<div className="inline">
						<InlineText nodes={inline} />
					</div>
					<Lines nodes={sublines} doc={doc} />
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

function InlineCommand({ tag, text }) {
	switch (tag) {
		case 'html':
			return <span dangerouslySetInnerHTML={{__html: text}} />;
	
		case 'math-block':
		case 'math-inline':
			try {
				return (
					<span className={tag} dangerouslySetInnerHTML={{
						__html: katex.renderToString(text, {
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
			return <b><InlineText nodes={text} /></b>;
		case 'i':
			return <i><InlineText nodes={text} /></i>;
	}
};

module.exports = NotexDocument;