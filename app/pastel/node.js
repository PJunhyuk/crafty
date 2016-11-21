class Node {
    
    constructor(data = undefined) {
        this.self = this;

        this.data = data;
        this.children = [];
    }

    getParent() {
        return this.parent;
    }

    getData() {
        return this.data;   
    }

    hasChildren() {
        return this.children.length > 0;
    }

    getChildren() {
        return this.children;
    }

    addChild(node) {
        node.parent = this.self;
        this.children.push(node);
    }

}

export default Node;