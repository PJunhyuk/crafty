import PIXI from 'pixi.js';
import Background from '../Background/Background.js';
import Sidebar from '../Sidebar/Sidebar.js';
/**
 * Main App Display Object
 *
 * Adds a background and some bunnies to it's self
 *
 * @exports App
 * @extends ScaledContainer
 */
export default class App extends PIXI.Container {
  constructor(...args) {
    super();
    this.id = "stage";
    this.interactive = false;

    let bg = new Background();
    let sidebar = new Sidebar();

    this.addChild(bg);
    this.addChild(sidebar);
  }
}
