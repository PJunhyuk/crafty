import * as PASTEL_FUNC from '../../functions/functions.js';
import CraftyBlock from './CraftyBlock.js';

export default class CraftyBlockSpec {
    constructor(name, type, parameters = [], library="", docstring="") {
        this.name = name;
        this.type = type;
        this.parameters = parameters;
        this.docstring = docstring;
        this.library = library;
    }

    static functionWithName(name) {
        let info = [ ...PASTEL_FUNC.STANDARD, ...PASTEL_FUNC.MATH].find( functionInfo => { 
            return functionInfo.name === name; 
        });

        return new CraftyBlockSpec(info.name, CraftyBlock.FUNCTION, info.parameters, "", info.docstring);
    }
}
