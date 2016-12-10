import EventEmitter from 'events';

/**
 * CraftyBlock Events Class
 *
 * Hnadler for all events emitted in canvas
 *
 * @exports new CraftyBlockEvents instance
 */
class CraftyBlockEvents extends EventEmitter {
    constructor(...args) {
        super(...args);
    }

    emit(eventName, ...args) {
        console.log(`EVENT: ${eventName} occured!`);
        super.emit(eventName, ...args);
    }
}

export default new CraftyBlockEvents();
