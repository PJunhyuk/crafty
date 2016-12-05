import EventEmitter from 'events';

/**
 * CraftyBlock Events Class
 *
 * Hnadler for all events emitted in canvas
 *
 * @exports new CraftyBlockEvents instance
 */
class CraftyBlockAnimator {
    constructor() {
        this.isHoldingBlock = false;
        this.targetBlock = null;
        console.log("DEBUG::: CraftyBlockAnimator initialized!");
    }

class CraftyBlockEvents extends EventEmitter {
    constructor(...args) {
        super(...args);
    }

    emit(eventName, ...args) {
        console.log(`DEBUG: ${eventName} occured!`);
        super.emit(eventName, ...args);
    }
}

export default new CraftyBlockEvents();
