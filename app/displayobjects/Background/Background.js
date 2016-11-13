import PIXI from 'pixi.js';
import TILE from './background-tile.png';
import RendererStore from '../../stores/RendererStore.js';

/**
 * Loads the adds the diagnostic image
 *
 * @exports Background
 * @extends Container
 */
export default class Background extends PIXI.Container {
  constructor() {
    super();

    //var bg = PIXI.Sprite.fromImage(TEXTURE);
    this.bg = PIXI.extras.TilingSprite.fromImage(TILE,17,17);
    this.bg.width = RendererStore.get('width');
    this.bg.height = RendererStore.get('height');

    this.addChild(this.bg);

    RendererStore.addChangeListener(this.resizeHandler.bind(this));
  }

  resizeHandler() {
      this.bg.width = RendererStore.get('width');
      this.bg.height = RendererStore.get('height');
  }
}
