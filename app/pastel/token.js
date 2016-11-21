/**
 * Token class for syllable classification
 */

class Token {
    
    constructor(type , data = undefined, location = undefined) {
        this.type = type;
        this.data = data;
        this.location = location;
    }

}

// Token definer
let tokenId = 0;

// Define token types
Token.OPEN      = tokenId++;
Token.CLOSE     = tokenId++;
Token.ID        = tokenId++;
Token.STRING    = tokenId++;
Token.NUMBER    = tokenId++;

export default Token;