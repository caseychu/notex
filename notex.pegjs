{
	const katex = require('katex');

	function trimIndentTags(str) {
		const lines = str.split('\n');
		let indentation = 0;
		return lines.map(function (line) {
			return line.replace(/^(\\indent|\\dedent)*/, function (match, type) {
				if (type === '\\indent')
					indentation += match.length / '\\indent'.length;
				else if (type === '\\dedent')
					indentation -= match.length / '\\dedent'.length;
				if (indentation < 0)
					indentation = 0;
				return '\t'.repeat(indentation);
			});
		}).join('\n');
	}
}

start = title:title? style:style? lines:line* {
	return `
		<title>${ title || 'Untitled' }</title>
		<meta charset="utf-8" />
		<link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.6.0/katex.min.css" />
		<style>
			body {
				font-family: serif;
				font-size: 16pt;
				line-height: 1.5em;
				
				max-width: 8in;
				margin: 0 auto;
			}
			
			body > ul {
				padding: 1em;
			}
			
			ul {
				list-style: none;
			}

			.tag {
				color: #C80000;
				font-family: consolas;
				font-size: 0.8em;
				padding-right: 3px;
			}

			.math {
				font-size: 0.8em;
				padding: 0 2px;
				color: blue;
			}

			div.math {
				text-align: center;
				padding: 0.5em;
			}
		</style>
		
		${ title ? `<h1>${ title }</h1>` : ''}
		<ul>${ lines.join('') }</ul>
		<script>
			var socket = new WebSocket('ws://' + location.host);
			socket.onerror = function () {
				console.log('fail');
			};
			socket.onmessage = function () {
				location.reload();
			};
		</script>
	`;
}

title = "\\title " title:$((!EOL .)*) { return title }
style = "\\style " style:$((!EOL .)*) { return style }

line 
	= tag:tag? text:text_node* EOL sublines:indented_line? {
		if (!sublines)
			sublines = [];
	
		switch (tag) {
			case null:
				return `
					<li>
						${ text.join('') || '<span style="line-height: 0.8em">&nbsp;</span>' }
						<ul>${ sublines.join('') }</ul>
					</li>`;
			
			case 'title':
				return `
					<title>{ text.join('') }</title>`;
			
			case 'header':
				return `
					<li>
						<h2>${ text.join('') }</h2>
						<ul>${ sublines.join('') }</ul>
					</li>`;
			
			case 'bullet':
				return `
					<li style="list-style-type: circle">
						${ text.join('') }
						<ul>${ sublines.join('') }</ul>
					</li>`;
				
			default:
				return `
					<li>
						<span class="tag">\\${ tag }</span> ${ text.join('') }
						<ul>${ sublines.join('') }</ul>
					</li>`;
		}
	}
indented_line
	= indent lines:(!dedent line:line { return line })* dedent { return lines }

tag
	= "#" { return "header" }
	/ "-" { return "bullet" }
	/ "\\" type:[a-zA-Z0-9]+ { return type.join('') }
text_node = inline_command / $((!inline_command !EOL .)+)
text_node_non_bold = inline_command / $((!"*" !inline_command !EOL .)+)

inline_command
	= "\\note" text_node
    / "\\html{{" html:$((!"}}" .)*) "}}" { return trimIndentTags(html) }
    / "\\[" math:$((!"\\]" .)*) "\\]" {
		return `
			<div class="math">
				${ katex.renderToString(trimIndentTags(math), { throwOnError: false }) }
			</div>`;
	}
    / "$" math:$((!"$" .)*) "$" {
		return `<span class="math">${ katex.renderToString(trimIndentTags(math), { throwOnError: false }) }</span>`;
	}
	/ "*" text:text_node_non_bold* "*" { return `<b>${ text.join('') }</b>`; }

EOL "end of line" = "\n"
indent "indent" = "\\indent"
dedent "dedent" = "\\dedent"