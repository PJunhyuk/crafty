import EventEmitter from 'events';
import Node from '../pastel/node.js';

/**
 * Crafty Store
 * Keeps crafty variables
 *
 * @data
 * 	tree : current code in parsed tree
 */
class CraftyStore extends EventEmitter {

    constructor(...args) {
        super(...args);

        this.data = {
            tree: undefined,
        };
    }

    get(key) {
        return this.data[key];
    }

    set(key, value) {
        return this.data[key] = value;
    }

    emitChange() {
        this.emit('modifytree', this.data);
    }

    addChangeListener(callback) {
        this.on('modifytree', callback, this.data);
    }
}

export default new CraftyStore();
