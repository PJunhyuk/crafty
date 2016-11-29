/**
 * App.js
 *
 * The main entry point, appends PIXI to the DOM
 * and starts a render and animation loop
 *
 */

import './index.html';
import {config} from '../package.json';
import Renderer from './Renderer/Renderer';
import App from './displayobjects/App/App';

import Crafty from './crafty/crafty.js';
import PastelEvaluator from "./pastel/evaluator.js";
import PastelError from "./pastel/error.js";
import Parser from './pastel/parser.js';
import CraftyStore from './stores/CraftyStore.js';

//import AnimationStore from './stores/AnimationStore';
//import TWEEN from 'tween.js';

const renderer = new Renderer(config.stageWidth, config.stageHeight,{backgroundColor: 0xCCCCCC, antialias:true});
const app = new App(config.stageWidth, config.stageHeight);

Crafty.render();

Crafty.compileToolkit.evaluator = new PastelEvaluator();
Crafty.compileToolkit.parser = new Parser();
Crafty.compileToolkit.CraftyStore = CraftyStore;
Crafty.compileToolkit.isError = function(result) {
	return result instanceof PastelError;
}

document.body.appendChild(renderer.view);

//AnimationStore.addChangeListener(() => TWEEN.update());

renderer.addRenderable(app);
renderer.start();
