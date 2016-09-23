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

start = lines:line* { return `<ul>${ lines.join('') }</ul>`}

line 
	= tag:tag? text:text_node* EOL sublines:indented_line? {
		if (!sublines)
			sublines = [];
	
		if (tag) {
			return `
				<li class="${ tag }">
					<span class="tag">${ tag }</span> ${ text.join('') }
					<ul>${ sublines.join('') }</ul>
				</li>`;
		} else {
			return `
				<li>
					${ text.join('') }&nbsp;
					<ul>${ sublines.join('') }</ul>
				</li>`;
		}
	}
indented_line
	= indent lines:(!dedent line)* dedent {
		return lines.map(line => line[1])
	}

tag
	= "#" { return "header" }
	/ "-" { return "bullet" }
	/ $("\\" [a-zA-Z]+)
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