const EOL = /\r\n|\r|\n/;

function StringBuilder() {
	
}

const notex = {};
notex.commands = [[/()/, (head, children) => [head, children]]];
notex.inline = [];
notex.inlineVerbatim = [];

notex.parse = function (string) {
	let position = 0;

	function matchRegex(re) {
		// Simulate a sticky regex
		return (new RegExp('^(' + re.source + ')')).exec(string.substr(position));
	}

	function consumeRegex(re) {
		const match = matchRegex(re);
		if (match) {
			position += match[0].length;
			return match.slice(1);
		}
		return false;
	}

	function consume(substring) {
		if (typeof substring === 'string') {
			const matched = string.substr(position, substring.length) === substring;
			if (matched)
				position += substring.length;
			return matched;
		} else
			throw new Error('invalid object to consume');
	}
	
	function consumeN(n) {
		const substring = string.substr(position, n);
		position += substring.length;
		return substring;
	}
	
	function consumePatterns(patterns) {
		for (let [regex, ...rest] of patterns) {
			const match = consumeRegex(regex);
			if (match)
				return [match, regex, ...rest];
		}
		return false;
	}
	
	function consumeBlocks(tabs=0) {
		const objects = [];
		while (position < string.length) {
			if (consume('\t'.repeat(tabs))) {
				const pattern = consumePatterns(notex.commands);
				if (!pattern)
					throw new Error('Couldn\'t parse tag');
				
				const [match, regex, fn] = pattern;
				const header = consumeInlineUntil(EOL);
				const children = consumeBlocks(tabs + 1);
				objects.push(fn(header, children, match));
			}
			
			// A new line.
			//else if (consume('fewer than tabs \t + \n'))
			//	objects.push(null);
			
			else 
				break;
		}
		
		return objects;
	}
	
	function consumeInlineUntil(until) {
		let currentTextNode = '';
		
		const objects = [];
		while (!consumeRegex(until)) {
			// Reached end of string.
			if (position >= string.length) {
				if (until === EOL)
					break;
				else
					throw new SyntaxError('Unexpected end of file: expected character ' + until);
			}
		
			const verbatimPattern = consumePatterns(notex.inlineVerbatim);
			if (verbatimPattern) {
				if (currentTextNode) {
					objects.push(currentTextNode);
					currentTextNode = '';
				}
			
				const [leftMatch, leftRegex, rightRegex, fn] = verbatimPattern;
				objects.push(fn(consumeVerbatimUntilRegex(rightRegex), leftMatch));
				continue;
			}
			
			const inlinePattern = consumePatterns(notex.inline);
			if (inlinePattern) {
				if (currentTextNode) {
					objects.push(currentTextNode);
					currentTextNode = '';
				}
					
				const [leftMatch, leftRegex, rightRegex, fn] = inlinePattern;
				objects.push(fn(consumeInlineUntil(rightRegex), leftMatch));
				continue;
			}
			
			// Just text.
			currentTextNode += consumeN(1);
		}

		if (currentTextNode) {
			objects.push(currentTextNode);
			currentTextNode = '';
		}
		
		return objects;
	}
	function consumeVerbatimUntilRegex(until) {
		let string = '';
		while (!consumeRegex(until))
			string += consumeN(1);
		return string;
	}
	function consumeVerbatimUntil(until) {
		const verbatim = consumeN(string.indexOf(until, position) - position);
		consume(until);
		return verbatim;
	}
	
	return consumeBlocks();
}

module.exports = notex;
