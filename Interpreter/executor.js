const error_system = require("./error.js");

class Environment {
	#environment = "EOE";
	depth = 0;
	initScope(local_environment = {}) {
		this.depth ++;
		this.#environment = [
			local_environment,
			this.#environment
		];
	};
	endScope() {
		this.depth --;
		if (this.#environment === "EOE")
			throw new error_system.PlayGroundSystemError(["0001", "Failed to end scope, reached end of environment"]);
		this.#environment = this.#environment[1];
	};
	add(name, value, type, environment = this.#environment[0]) {
		if (!(["string", "symbol", "number", "boolean"].includes(typeof name)))
			console.warn(`A value of type ${typeof name} has been used as name.
				This can be dangerous because coercion have sometimes a surprising behaviour.`);
		environment[name] = {
			type: type,
			value: value
		};
	};
	reassign(name, value, position) {
		this.#reassign(this.#environment, name, value, position);
	};
	#reassign(environment, name, value, position) {
		if (environment[0][name] === undefined) {
			if (environment[1] === "EOE")
				throw new error_system.PlReferenceError(["1110", name, position]);
			return this.#reassign(environment[1], name, value, position);
		};
		environment[0][name].value = value;
	};
	get(name, position = null) {
		const content = this.#get(this.#environment, name);
		if (content === undefined) 
			throw new error_system.PlReferenceError(["1100", name, position]);
		return content;
	};
	#get(environment, name) {
		const content = environment[0][name];
		if (content === undefined && environment[1] !== "EOE")
			return this.#get(environment[1], name);
		return content;
	};
};

function execute(ast) {
	try {
		environment = new Environment;
		if (!isIterable(ast))
			throw new error_system.AstObjectError(["0100", "Ast", "iterable", ast]);
		environment.initScope();
		execGlobalEnvironment(ast, environment);
		execBlock(ast, environment);
	} catch(error) {
		if (error instanceof error_system.PlayGroundError)
			console.error(error);
		else {
			console.group(new error_system.PlayGroundSystemError(["0000", `Unhandled error:`]));
			console.error(error);
			console.groupEnd();
		};
	};
}

function execGlobalEnvironment(ast, environment, global_names = new Set()) {
	const unresolved_declaration = [];
	const missing_names = new Set();

	for (let statement of ast) {
		if (!statement)
			throw new error_system.AstObjectError(["0110", "Statement", "not null", statement]);
		if (!statement.st_type)
			throw new error_system.AstFieldError(["0300", "statement", "type", statement]);
		try {
			if (statement.st_type === "variable declaration") {
				if (!statement.name)
					throw new error_system.AstFieldError(["0321", "variable declaration", "name", statement]);
				global_names.add(statement.name);
				execVariableDeclaration(statement, environment);
			} else if (statement.st_type === "function declaration") {
				if (!statement.name)
					throw new error_system.AstFieldError(["0323", "function declaration", "name", statement]);
				global_names.add(statement.name);
				execFunctionDeclaration(statement, environment);
			};
		} catch(error) {
			if (error instanceof error_system.PlReferenceError) {
				missing_names.add(error);
				unresolved_declaration.push(statement);
			} else {
				throw error;
			};
		};

	};
	if (unresolved_declaration.length < 1)
		return;

	for (let ref_error of missing_names)
		if (!global_names.has(ref_error.undeclared_name))
			throw ref_error;
	execGlobalEnvironment(unresolved_declaration, environment, global_names);
};

function execFunctionBlock(block, environment, local_environment = {}) {
	const call_depth = environment.depth;
	try {
		execBlock(block, environment, local_environment);
	} catch(error) {
		if (error instanceof error_system.PlReturnError) {
			const opened_scope = environment.depth - call_depth;
			for (let i = 0; i < opened_scope; i ++)
				environment.endScope();
			return error.return_value;
		};
		throw error;
	};
};

function execBlock(block, environment, local_environment = {}) {
	if (!isIterable(block))
		throw new error_system.AstObjectError(["0101", "Block", "iterable", block]);

	environment.initScope(local_environment);

	for (let statement of block)
	{
		if (!statement)
			throw new error_system.AstObjectError(["0110", "Statement", "not null", statement]);
		if (!statement.st_type)
			throw new error_system.AstFieldError(["0300", "statement", "st_type", statement]);
		switch (statement.st_type) {
			case "print":
				execPrint(statement, environment);
				break;
			case "variable declaration":
				execVariableDeclaration(statement, environment);
				break;
			case "reassignment":
				execReassignment(statement, environment);
				break;
			case "function declaration":
				execFunctionDeclaration(statement, environment);
				break;
			case "return":
				execReturn(statement, environment);
				break;
			case "call":
				execProcedureCall(statement, environment);
				break;
			case "if-else":
				execIfElse(statement,environment);
				break;
			case "while":
				execWhileLoop(statement, environment);
				break;
			case "do-while":
				execDoWhileLoop(statement, environment);
				break;
			case "foreach":
				execForeachLoop(statement, environment);
				break;
			case "block":
				if (!statement.block)
					throw new error_system.AstFieldError(["031A", "block", "block", statement]);
				execBlock(statement.block, environment);
				break;
			default:
				throw new error_system.AstTypeError("0200",
				"statement", statement.st_type);
		};
	};
	environment.endScope();
};

function execPrint(print, environment) {
	if (!print.value)
		throw new error_system.AstFieldError(["0310", "print", "value", print]);
	const value = execExpression(print.value, environment);
	console.log(value);
};

function execVariableDeclaration(declaration, environment) {
	if (!declaration.value)
		throw new error_system.AstFieldError(["0320", "variable declaration", "value", declaration]);
	if (!declaration.name)
		throw new error_system.AstFieldError(["0321", "variable declaration", "name", declaration]);
	const value = execExpression(declaration.value, environment);
	environment.add(declaration.name, value, "variable");
};

function execReassignment(reassignment, environment) {
	if (!reassignment.name)
		throw new error_system.AstFieldError(["0325", "reassignment", "name", reassignment]);
	if (!reassignment.value)
		throw new error_system.AstFieldError(["0325", "reassignment", "value", reassignment]);
	const value = execExpression(reassignment.value, environment);
	environment.reassign(reassignment.name, value);
};

function execFunctionDeclaration(declaration, environment) {
	if (!declaration.block)
		throw new error_system.AstFieldError(["0322", "function declaration", "block", declaration]);
	if (!isIterable(declaration.block))
		throw new error_system.AstObjectError(["0130", "Function block", "iterable", declaration]);
	if (!declaration.name)
		throw new error_system.AstFieldError(["0323", "function declaration", "name", declaration]);
	if (!declaration.parameter_list)
		throw new error_system.AstFieldError(["0324", "function declaration", "parameter list", declaration]);
	if (!isIterable(declaration.parameter_list))
		throw new error_system.AstObjectError(["0131", "Parameter list", "iterable", declaration]);
	if (!canConvertToArray(declaration.parameter_list))
		throw new error_system.AstObjectError(["0141", "Parameter list", "an iterable object with a valid length or size, or less than 1000 items", declaration]);

	const function_object = {
		block: declaration.block,
		parameter_list: Array.from(declaration.parameter_list)
	};
	environment.add(declaration.name, function_object, "function");
};

function isIterable(object) {
	return object !== null && typeof object[Symbol.iterator] === "function";
};

function execReturn(return_statement, environment) {
	let value = null;
	if(return_statement.value !== undefined && return_statement.value !== null)
		value = execExpression(return_statement.value, environment);
	throw new error_system.PlReturnError(["1600", return_statement.position], value);
};

function execProcedureCall(call, environment) {
	if (!call.call)
		throw new error_system.AstFieldError(["0325", "procedure call", "call", call]);
	execExpression(call.call, environment);
};

function execIfElse(ifElse, environment) {
	if (!ifElse.condition)
		throw new error_system.AstFieldError(["0311", "if-else", "condition", ifElse]);
	if (!ifElse.if_block)
		throw new error_system.AstFieldError(["0312", "if-else", "if_block", ifElse]);
	const condition = execExpression(ifElse.condition, environment);
	if (condition)
		execBlock(ifElse.if_block, environment);
	else if (ifElse.else_block)
		execBlock(ifElse.else_block, environment);
};

function execWhileLoop(whileLoop, environment) {
	if (!whileLoop.condition)
		throw new error_system.AstFieldError(["0313", "while loop", "condition", whileLoop]);
	if (!whileLoop.loop_block)
		throw new error_system.AstFieldError(["0314", "while loop", "loop_block", whileLoop]);
	while (execExpression(whileLoop.condition, environment))
		execBlock(whileLoop.loop_block, environment);
};

function execDoWhileLoop(doWhileLoop, environment) {
	if (!doWhileLoop.condition)
		throw new error_system.AstFieldError(["0315", "do while loop", "condition", doWhileLoop]);
	if (!doWhileLoop.loop_block)
		throw new error_system.AstFieldError(["0316", "do while loop", "loop_block", doWhileLoop]);
	do
		execBlock(doWhileLoop.loop_block, environment);
	while (execExpression(doWhileLoop.condition, environment));
};

function execForeachLoop(foreachLoop, environment) {
	if (!foreachLoop.parameter)
		throw new error_system.AstFieldError(["0317", "foreach loop", "parameter", foreachLoop]);
	if (!foreachLoop.collection)
		throw new error_system.AstFieldError(["0318", "foreach loop", "collection", foreachLoop]);
	if (!foreachLoop.loop_block)
		throw new error_system.AstFieldError(["0319", "foreach loop", "loop_block", foreachLoop]);
	const collection = execExpression(foreachLoop.collection, environment);
	if (!isIterable(collection))
		throw new error_system.PlCollectionError(["1300", collection, foreachLoop.position]);
	for (let item of collection) {
		const local_environment = {};
		environment.add(foreachLoop.parameter, item, "variable", local_environment);
		execBlock(foreachLoop.loop_block, environment, local_environment);
	};
};

function execExpression(expression, environment) {
	if (!expression.ex_type)
		throw new error_system.AstFieldError(["0301", "expression", "ex_type", expression]);
	switch (expression.ex_type) {
		case "custom":
			return execCustom(expression, environment);
		case "and":
		case "or":
		case "equality":
		case "inequality":
		case "strict equality":
		case "strict inequality":
		case "greater-than comparison":
		case "less-than comparison":
		case "greater-or-equal comparison":
		case "less-or-equal comparison":
		case "modulo":
		case "euclidian division":
		case "division":
		case "multiplication":
		case "subtraction":
		case "addition":
			return execBinary(expression, environment);
		case "function call":
			return execFunctionCall(expression, environment);
		case "list call":
			return execListCall(expression, environment);
		case "variable":
			return execVariable(expression, environment);
		case "list":
			return execList(expression, environment);
		case "string":
		case "number":
		case "boolean":
			if (expression.value === undefined)
				throw new error_system.AstFieldError(["0320", expression.ex_type, "value", expression]);
			return expression.value;
		default:
			throw new error_system.AstTypeError(["0201", "expression", expression.ex_type]);
	};
};

function execCustom(custom, environment) {
	const custom_name = `${custom.name ? 
			custom.name : 
			`unnamed custom 
		(consider adding a "name" field to it)`}`;
	if (!custom.func)
		throw new error_system.AstFieldError(["032A", "custom", "func", custom]);
	if (typeof custom.func !== "function")
		throw new error_system.AstObjectError(["0120", `Func of ${custom_name}`, "function", custom]);
	const expression_list = [];
	if (custom.expression_list) {
		if (!isIterable(custom.expression_list))
			throw new error_system.AstObjectError(["0121", `Expression list of ${custom_name}`, "iterable", custom]);
		for (expression of custom.expression_list)
			expression_list.push(execExpression(expression, environment));
	};
	const name_list = [];
	if (custom.name_list) {
		if (!isIterable(custom.name_list))
			throw new error_system.AstObjectError(["0122", `Name list of ${custom_name}`, "iterable", custom]);
		for (name of custom.name_list)
			name_list.push(environment.get(name, custom.position).value);
	};

	try {
		return custom.func(...expression_list, ...name_list);
	} catch (error) {
		throw new error_system.PlCustomError(["1700", custom_name, error, custom.position]);
	};
};

function execList(list, environment) {
	if (list.value === undefined)
		throw new error_system.AstFieldError(["0329", "list", "value", list]);
	if (!isIterable(list.value))
		throw new error_system.AstObjectError(["0123", "List value", "iterable", list]);
	const value = [];
	for (item of list.value) 
		value.push(execExpression(item, environment));
	return value;
};

function execFunctionCall(call, environment) {
	if (!call.name)
		throw new error_system.AstFieldError(["0324", "function call", "name", call]);
	if (!call.argument_list)
		throw new error_system.AstFieldError(["0325", "function call", "argument_list", call]);
	if (!isIterable(call.argument_list))
		throw new error_system.AstObjectError(["0124", "Argument list", "iterable", call]);
	const function_item = environment.get(call.name, call.position);
	if (function_item.type !== "function")
		throw new error_system.PlTypeError(["1201", call.name, "a function", function_item.type, call.position]);

	if (!canConvertToArray(call.argument_list))
		throw new error_system.AstObjectError(["0140", "Argument list", "an iterable object with a valid length or size, or less than 1000 items", call]);

	const argument_list = Array.from(call.argument_list);
	const parameter_list = function_item.value.parameter_list;

	if (parameter_list.length !== argument_list.length)
		throw new error_system.PlArityError(["1500", parameter_list.length, call.argument_list.length, call.position]);

	const local_environment = {};
	for (let i = 0; i < parameter_list.length; i++) {
		const argument = execExpression(call.argument_list[i], environment);
		environment.add(parameter_list[i], argument, "variable", local_environment);
	};
	return execFunctionBlock(function_item.value.block, environment, local_environment);
};

function canConvertToArray(object) {
	let length = object.length !== undefined && object.length !== null
		? object.length : object.size;
	if (length === undefined || length === null) {
		let i = 0;
		for (const item of object) {
			if (i++ >= 1000) {
				return false;
			};
			i ++;
		};
		return true;
	};
	length = Number(length);
	return (Number.isFinite(length) &&
		length >= 0 &&
		length <= Number.MAX_SAFE_INTEGER &&
		Math.floor(length) === length);
};

function execListCall(call, environment) {
	if (!call.list)
		throw new error_system.AstFieldError(["0327", "list call", "name", call]);
	if (!call.index)
		throw new error_system.AstFieldError(["0328", "list call", "index", call]);
	const index = Number(execExpression(call.index, environment));
	if (!(Number.isInteger(index) && index >= 0 && index < Number.MAX_SAFE_INTEGER))
		throw new error_system.PlTypeError("1210", index, "as an index", "not coercible to a valid integer", call.position);
	const list = execExpression(call.list, environment);
	if (!isIterable(list) || !canConvertToArray(list))
		throw new error_system.PlTypeError("1211", list, "a collection", typeof list, call.position);
	return Array.from(list)[index];
};

function execVariable(call, environment) {
	if (!call.name)
		throw new error_system.AstFieldError(["0321", "a variable", "name", call]);
	const variable = environment.get(call.name, call.position);
	if (variable.type !== "variable")
		throw new error_system.PlTypeError(["1200", call.name, "variable", variable.type, call.position]);
	return variable.value;
};

function execBinary(binary, environment) {
	if (binary.first_operand === undefined)
		throw new error_system.AstFieldError(["0322", binary.ex_type, "first_operand", binary]);
	if (binary.second_operand === undefined)
		throw new error_system.AstFieldError(["0323", binary.ex_type, "second_operand", binary]);
	const fst = execExpression(binary.first_operand, environment);
	const scd = execExpression(binary.second_operand, environment);
	if (["addition", "multiplication", "subtraction", "division", "euclidian division", "modulo"].includes(binary.ex_type)) {
		if (typeof fst === "symbol")
			throw new error_system.PlTypeError("1212", fst, `in ${binary.ex_type}`, "symbol", binary.position);
		if (typeof scd === "symbol")
			throw new error_system.PlTypeError("1212", scd, `in ${binary.ex_type}`, "symbol", binary.position);
	};
	try {
		switch (binary.ex_type) {
			case "and":
				return fst && scd;
			case "or":
				return fst || scd;
			case "equality":
				return fst == scd;
			case "inequality":
				return fst != scd;
			case "strict equality":
				return fst === scd;
			case "strict inequality":
				return fst !== scd;
			case "greater-than comparison":
				return fst > scd;
			case "less-than comparison":
				return fst < scd;
			case "greater-or-equal comparison":
				return fst >= scd;
			case "less-or-equal comparison":
				return fst <= scd;
			case "modulo":
				if (scd === 0)
					throw new error_system.PlArithmeticError(["1400", "modulo", binary.position]);
				return fst % scd;
			case "euclidian division":
				if (scd === 0)
					throw new error_system.PlArithmeticError(["1401", "euclidian division", binary.position]);
				return Math.floor(fst / scd);
			case "division":
				if (scd === 0)
					throw new error_system.PlArithmeticError(["1402", "division", binary.position]);
				return fst / scd;
			case "multiplication":
				return fst * scd;
			case "subtraction":
				return fst - scd;
			case "addition":
				return fst + scd;
			default:
				throw new error_system.PlayGroundSystemError(["0002", `Unknown operation type ${binary.ex_type} at execBinary`]);
		};
	} catch (error) {
		if (error instanceof TypeError)
			throw new error_system.PlTypeError("1213", `${fst} and ${scd}`, `in ${binary.ex_type}`, `${typeof fst} and ${typeof scd}`, binary.position);
		else
			throw error;
	};

};

module.exports = {execute};
