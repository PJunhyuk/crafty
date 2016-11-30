import Token from "./token.js";
import Lexer from "./lexer.js";
import Node from "./node.js";
import Error from "./error.js";

class Parser {

    constructor() {
        this.lexer = new Lexer();
    }

    /**
     * Create syntax tree
     */
    analyze(text) {
        let tokenArray = this.lexer.analyze(text);
        let tokenTree = this.treefy(tokenArray);
        return tokenTree;
    }

    viewTree(node, space = "") {
        if (!node.getData()) {
            console.log(space + "(container)");
            let children = node.getChildren();
            for (let i = 0; i < children.length; i++) {
                this.viewTree(children[i], space + "---");
            }
        } else {
            console.log(space + "(token " + node.getData().type + ") " +node.getData().data);
        }
    }

    /**
     * Convert 2-d tree to code
     */
    stringify(node) {
        let string = "";
        if (!node.getData()) {
            let children = node.getChildren();
            string += "(";

            for (let i = 0; i < children.length; i++) {
                string += (i != 0) ? " " : "";
                string += this.stringify(children[i]);
            }
            string += ")";
        } else {
            string += node.getData().data;
        }

        return string;
    }

    /**
     * Convert 1-d token array to 2-d tree
     */
    treefy(tokenArray) {
        // Parent tree
        let tree = new Node();

        let index = 0;
        let depth = 0;
        let subarray = [];

        while (index < tokenArray.length) {

            let token = tokenArray[index++];
            //console.log(token);
            // Open
            if (token.type == Token.OPEN) {

                depth++;

                if (depth == 1) {
                    subarray = [];
                    continue;
                }
            }

            // Close
            else if (token.type == Token.CLOSE) {

                depth--;

                // Depth cannot be smaller than 0
                if (depth < 0)
                    return new Error(Error.SYNTAX, "Surplus ')' exists", token.location);

                if (depth == 0) {
                    
                    // Create sub-tree
                    let subtree = this.treefy(subarray);

                    // If error, just pass beyond (no stack push)
                    if (subtree instanceof Error)
                        return subtree;

                    tree.addChild(subtree);
                    continue;
                }
            }

            // Direct (siblings) token
            if (depth == 0) {
                tree.addChild(new Node(token));
            } 

            // Subarray (children) token
            else if (depth > 0) {
                subarray.push(token);
            }
        }

        // Depth must be 0 at the termination point
        if (depth > 0)
            return new Error(Error.SYNTAX, "'(' not closed", tokenArray[tokenArray.length - 1].location);

        return tree;
    }

    
}

export default Parser;