class PlayGroundError extends Error {
	constructor(content) {
		super();
		const name = this.constructor.name;
		this.message = this.createMessage(...content);
	};
	createMessage(message) {
		return "\n" + message;
	};
};

class PlayGroundSystemError extends PlayGroundError {
	createMessage(code, message) {
		return code + " : " + message;
	};
};

class AstObjectError extends PlayGroundError {
	createMessage(code, object, type, value) {
		return `${code} : ${object} object was expected to be ${type}. Got ${value}`;
	};
}

class AstTypeError extends PlayGroundError {
	createMessage(code, object, type) {
		return `${code} : Unknown ${object} type: ${type}`;
	};
}

class AstFieldError extends PlayGroundError {
	createMessage(code, object, field, value) {
		return `${code} : ${object} object was expected to have a "${field}" field. Got object ${value}`;
	};
};


class PlError extends PlayGroundError {
	getPosition(position) {
		if (Array.isArray(position) 
			&& position.length === 2 
			&& typeof position[0] === "number" 
			&& typeof position[1] === "number")
			return `at line ${position[0]}, col ${position[1]}.`;
		return "at unknown position."
	}
}

class PlReferenceError extends PlError {
	undeclared_name;
	constructor(content) {
		super(content);
		this.undeclared_name = content[1];
	};
	createMessage(code, name, position = null) {
		return `${code} : Use of undeclared name "${name}" ${this.getPosition(position)}`;
	};
};

class PlTypeError extends PlError {
	createMessage(code, name, expected_type, actual_type, position = null) {
		return `${code} : Can't use ${name} as ${expected_type}, because it's a ${actual_type}, ${this.getPosition(position)}`;
	};
};

class PlCollectionError extends PlError {
	createMessage(code, value, position = null) {
		return `${code} : Can't use the value ${value} as a collection, ${this.getPosition(position)}`;
	};
};

class PlArithmeticError extends PlError {
	createMessage(code, operation_type, position) {
		return `${code} : ${operation_type} by zero ${this.getPosition(position)}`;
	};
};

class PlArityError extends PlError {
	createMessage(code, parameter_count, argument_count, position) {
		return `${code} : Wrong argument number, expected ${parameter_count}, got ${argument_count}, ${this.getPosition(position)}`;
	};
};

class PlReturnError extends PlError {
	return_value;
	constructor(content, value) {
		super(content);
		this.return_value = value;
	};
	createMessage(code, position) {
		return `${code} : Unhandled return statement ${this.getPosition(position)}`;
	};
};

class PlCustomError extends PlError {
	createMessage(code, name, error, position) {
		return `${code} : Error from ${name} function ${this.getPosition(position)} : ${error}`;
	};
};

module.exports = {PlayGroundError, PlayGroundSystemError, AstObjectError, AstTypeError, AstFieldError, PlReferenceError, PlTypeError, PlCollectionError, PlArithmeticError, PlArityError, PlReturnError, PlCustomError};
