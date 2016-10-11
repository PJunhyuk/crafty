// run the polyfills
require('./polyfill');

var core = module.exports = require('./core');

// add core plugins.
core.extras         = require('./extras');
core.filters        = require('./filters');
core.interaction    = require('./interaction');
core.loaders        = require('./loaders');
core.mesh           = require('./mesh');
core.particles      = require('./particles');
core.accessibility  = require('./accessibility');
core.extract        = require('./extract');
core.prepare        = require('./prepare');

// export a premade loader instance
/**
 * A premade instance of the loader that can be used to load resources.
 *
 * @name loader
 * @memberof PIXI
 * @property {PIXI.loaders.Loader}
 */
core.loader = new core.loaders.Loader();

// mixin deprecated features.
Object.assign(core, require('./deprecation'));

// Always export pixi globally.
global.PIXI = core;
