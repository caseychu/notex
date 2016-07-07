const EOL = '\r\n';

function notex(string) {
	let position = 0;

	function consume(substring) {
		const matched = string.substr(position, substring.length) === substring;
		if (matched)
			position += substring.length;
		return matched;
	}
	
	function consumeN(n) {
		const substring = string.substr(position, n);
		position += substring.length;
		return substring;
	}
	
	function consumeBlocks(tabs=0) {
		const objects = [];
		while (position < string.length) {
			if (consume('\t'.repeat(tabs)))
				objects.push([consumeInlineUntil(EOL), consumeBlocks(tabs + 1)]);
			
			// A new line.
			//else if (consume('fewer than tabs \t + \n'))
			//	objects.push(null);
			
			else 
				break;
		}
		
		return objects;
	}
	
	function consumeInlineUntil(until) {
		const objects = [];
		while (!consume(until)) {
			// Reached end of string.
			if (position >= string.length) {
				if (until === EOL)
					break;
				else
					throw new SyntaxError('Unexpected end of file: expected character ' + until);
			}
		
			// Math.
			if (consume('$'))
				objects.push(['MATH', consumeVerbatimUntil('$')]);
			
			else if (consume('\\['))
				objects.push(['MATH_INLINE', consumeVerbatimUntil('\\]')]);
			
			// Bold.
			else if (consume('*'))
				objects.push(['BOLD', consumeInlineUntil('*')]);
			
			// Tags.
			else if (consume('\\def ')) {
				objects.push(['DEF', consumeInlineUntil(until)]);
				break;
			}
			else if (consume('\\thm ')) {
				objects.push(['THM', consumeInlineUntil(until)]);
				break;
			}
			else if (consume('\\pred ')) {
				objects.push(['PRED', consumeInlineUntil(until)]);
				break;
			}
			else if (consume('\\iff ')) {
				objects.push(['IFF', consumeInlineUntil(until)]);
				break;
			}
			
			// Other.
			else {
				if (objects[objects.length - 1] && objects[objects.length - 1][0] === 'TEXT')
					objects[objects.length - 1][1] += consumeN(1);
				else
					objects.push(['TEXT', consumeN(1)]);
			}
		}
		return objects.length && objects;
	}
	
	function consumeVerbatimUntil(until) {
		const verbatim = consumeN(string.indexOf(until, position) - position);
		consume(until);
		return verbatim;
	}
	
	return consumeBlocks();
}

console.log(JSON.stringify(notex(`\\def A set $G$ is a *group* under a binary operation $\\cdot: G \\times G \\to G$
	\\iff closure: $\\forall a,b \\in G: a \\cdot b \\in G$
\\def An *abelian group* \\pred is a group whose operation is commutative.
\\thm If $|G|$ is prime, then $G$ is cyclic.
\\thm *Lagrange's theorem:* $|H|$ divides $|G|$.
`), null, 4))