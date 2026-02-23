const nearley = require("nearley");
const fs = require("mz/fs");

const grammar = require("./grammar.js");
const executor = require("./Interpreter/executor.js");

async function main() {
	let print_parser_result = false;

	let filename = process.argv[2];
	if (!filename) {
		filename = "test.txt";

	} else if (filename === "-p") {
		filename = process.argv[3];
		print_parser_result = true;
	};

	const program = ((await fs.readFile(filename)).toString()).trim();

	const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
	parser.feed(program);

	if (parser.results.length > 1) {
		console.warn("This grammar contains ambiguity!!!");
	};

	const ast = parser.results[0];
	if (print_parser_result) {
		console.log("Parser result:\n\n")
		console.dir(ast, {depth: null});
		console.log("-------------------------------\n\n");
	};
	try {
		executor.execute(ast);

	} catch (error) {
		console.log(error);
		process.exit(1);
	};
	
	//await fs.writeFile("parser_result.txt", JSON.stringify(ast, null, " "));
	//await fs.writeFile("resolver_result.txt", JSON.stringify(resolved_ast, null, " "));
};

main().catch(error => console.log(error.stack));
