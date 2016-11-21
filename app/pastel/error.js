class Error {
	
	constructor(type, message, location) {
		this.self = this;
		this.type = type;
		this.message = message;
		this.stack = [location];
	}

	after(location) {
		this.stack.push(location);
		return this.self;
	}
}

let errorId = 0;

// Predefine type of errors;
Error.SYNTAX = errorId++;

export default Error;