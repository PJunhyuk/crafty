import EventEmitter from 'events';
import Pastel from 'pastel-lang';

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
            tree: undefined
        };
    }

    get(key) {
        console.log(`STORE::: Loading ${key}...`);
        return this.data[key];
    }

    set(key, value) {
        console.log(`STORE::: Saving ${key}...`);
        return this.data[key] = value;
    }


    emitChange(caller) {
        console.log(`STORE::: Change emitted by ${caller}!`);
        this.emit('modifytree', caller, this.data);
    }

    addChangeListener(callback) {
        this.on('modifytree', callback, this.data);
    }
}

export default new CraftyStore();
