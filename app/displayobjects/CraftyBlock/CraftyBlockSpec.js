export default class CraftyBlockSpec {
    constructor(name, type, parameters = [], library="", docstring="") {
        this.name = name;
        this.type = type;
        this.parameters = parameters;
        this.docstring = docstring;
        this.library = library;
    }
}
