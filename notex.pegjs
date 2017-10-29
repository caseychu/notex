{
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

start = lines:line* { return lines }

line 
	= tag:tag? inline:inline_node* EOL sublines:indented_line? {
		return {
			tag: tag,
			inline: inline,
			sublines: sublines || []
		}
	}
indented_line
	= indent lines:(!dedent line:line { return line })* dedent { return lines }

tag
	= header:"#"+ { return 'h' + (1 + header.length) }
	/ "|" { return 'h1' }
	/ "-" { return "bullet" }
	/ "\\" tag:[a-zA-Z0-9]+ { return tag.join('') }
inline_node = inline_command / $((!inline_command !EOL .)+)
inline_node_non_bold = inline_command / $((!"*" !inline_command !EOL .)+)
inline_node_non_link = inline_command / $((!"]" !inline_command !EOL .)+)

inline_command
    = "\\html{{" html:$((!"}}" .)*) "}}" {
		return {
			tag: 'html',
			text: trimIndentTags(html)
		}
	}
    / "\\[" math:$((!"\\]" .)*) "\\]" {
		return {
			tag: 'math-block',
			text: trimIndentTags(math)
		}
	}
    / "$" math:$((!"$" .)*) "$" {
		return {
			tag: 'math-inline',
			text: trimIndentTags(math)
		}
	}
	/ "**" text:inline_node_non_bold+ "**" {
		return {
			tag: 'i',
			text: text
		}
	}
	/ "*" text:inline_node_non_bold+ "*" {
		return {
			tag: 'b',
			text: text
		}
	}
	/ "[" text:inline_node_non_link+ "](" url:$((!")" .)*) ")" {
		return {
			tag: 'link',
			text: text,
			url: url
		}
	}

EOL "end of line" = "\n"
indent "indent" = "\\indent"
dedent "dedent" = "\\dedent"