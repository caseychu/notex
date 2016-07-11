const notex = {};

const tokens = notex.tokens = {
	EOL: /\r\n|\r|\n|$/,
	TEXT: Symbol('TEXT'),
	VERBATIM: /(.*?)/,
	RAW_TEXT: /[^\r\n]/ //Symbol('RAW_TEXT')
};

// A default set of commands.
notex.commands = [
	{
		tag: true,
		pattern: /(\\\w+)?/,
		render: ([_, tag], contents, children) => [tag || null, contents, children]
	}
];

notex.parse = function (string) {
	const tagCommands = [];
	const inlineCommands = [];
	for (let command of notex.commands) {
		if (!Array.isArray(command.pattern))
			command.pattern = [command.pattern || ''];
		(command.tag ? tagCommands : inlineCommands).push(command);
	}
	
	function cloneableGenerator(generatorFunction, ...args) {
		const generator = generatorFunction(...args);
		const oldNext = generator.next;
		const calledValues = [];
		generator.next = function (value) {
			calledValues.push(value);
			return oldNext.apply(this, arguments);
		};
		generator.cloner = function () {
			const length = calledValues.length;
			return function () {
				const generator = cloneableGenerator(...arguments);
				for (let i = 0; i < length; i++)
					generator.next(calledValues[i]);
				return generator;
			};
		};
		return generator;
	}
	
	function* matchGen(position, iter, nextValue) {
		const result = iter.next(nextValue);
		if (result.done) {
			yield [position, result.value];
			return;
		}
	
		let clone;
		for (let [nextPosition, nextCaptures] of match(position, result.value)) {
			
			// Reset the iterator if necessary.
			if (!clone)
				clone = iter.cloner();
			else
				iter = clone();
				
			yield* matchGen(nextPosition, iter, nextCaptures);
		}
	}

	function* match(position, pattern) {
		
		// This is a list of possibilities.
		if (Array.isArray(pattern)) {
			if (pattern.length) {
				for (let subpattern of pattern)
					yield* match(position, subpattern)
			} else
				yield [position, []];
		}
		
		// A generator.
		else if (typeof pattern === 'function')
			yield* matchGen(position, cloneableGenerator(pattern));
		/*
		else if ([tokens.RAW_TEXT, tokens.VERBATIM].includes(pattern)) {
			debugger
			if (!tokens.EOL.test(string[position]))
				yield [position + 1, string[position]];
		/*
			let i = 0;
			do {
				yield [position + i, string.substr(position, i)];
			} while (tokens.EOL.test(string[position + (i++)]));*/
		//}
		
		else if (typeof pattern === 'string') {
			if (pattern === string.substr(position, pattern.length))
				yield [position + pattern.length, [pattern]];
		}
		
		else if (pattern instanceof RegExp) {
			// Simulate a sticky regex starting from the given position
			const re = new RegExp('^(' + pattern.source + ')');
			const substr = string.substr(position);
			const result = re.exec(substr);
			
			if (result)
				// Make sure to toss out the extra group captured by our fake regex
				yield [position + result[0].length, result.slice(1)]
		}
		
		else
			throw new Error('Invalid pattern: ' + pattern);
	}
	
	// block_n -> line_n block_n | e
	function createGenBlock(tabs=0) {
		return function* genBlock() {
			return yield [
				function* () {
					return [yield createGenLine(tabs), ...yield createGenBlock(tabs)];
				},
				function* () {
					return [];
				}
			];
		};
	}
	
	// line_n -> TAB^n tagCommand text EOL block_{n+1} | TAB* EOL
	function createGenLine(tabs=0) {
		return function* genLine() {
			return yield [
				function* () {
					yield '\t'.repeat(tabs);
					return yield tagCommands.map(command => function* () {
						const captures = [];
						for (let pattern of command.pattern)
							captures.push(yield pattern);
						
						yield (/\s+/);
						const contents = yield genText;
						yield tokens.EOL;
						const children = yield createGenBlock(tabs + 1);
						return command.render(...captures, contents, children);
					});
				},
				
				function* () {
					yield (/\t*/);
					yield tokens.EOL;
					return [];
				}
			];
		};
	}
	
	// text -> rawText inlineCommand text | rawText | e
	function* genText() {
		return yield [		
			function* () {
				return [
					...yield tokens.RAW_TEXT,
					...yield inlineCommands.map(command => function* () {
						const captures = []
						for (pattern of command.pattern) {
							if (pattern === tokens.TEXT)
								captures.push(yield genText);
							else
								captures.push(yield pattern);
						}
						return command.render(...captures);
					}),
					...yield genText
				];
			},
			
			function* () {
				return [...yield tokens.RAW_TEXT];
			},
			
			function* () {
				return [];
			}
		];
	}
	
	//for (let [position, block] of match(0, createGenBlock(0)))
	for (let [position, block] of match(0, createGenBlock(0)))
		return block;
};

module.exports = notex;
