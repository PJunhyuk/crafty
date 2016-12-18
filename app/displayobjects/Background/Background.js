import PIXI from 'pixi.js';
import TILE from './background-tile.png';
import RendererStore from '../../stores/RendererStore.js';

import SpaceTILE from './space-tile.png';

import CraftyBlockEvents from './../CraftyBlock/CraftyBlockEvents';

/**
 * Loads the adds the diagnostic image
 *
 * @exports Background
 * @extends Container
 */

// const TILE_WIDTH = 16;
// const TILE_HEIGHT = 16;
// const SpaceTILE_WIDTH = 256;
// const SpaceTILE_HEIGHT = 256;

export default class Background extends PIXI.Container {
    constructor() {
        super();

        this.TILE_WIDTH = 16;
        this.TILE_HEIGHT = 16;

        //  Set backgroundTile as size of window + extra margins for panning illusion
        this.backgroundTile = PIXI.extras.TilingSprite.fromImage(TILE, this.TILE_WIDTH, this.TILE_HEIGHT);
        this.backgroundTile.width = RendererStore.get('width') + 2 * this.TILE_WIDTH;
        this.backgroundTile.height = RendererStore.get('height') + 2 * this.TILE_HEIGHT;
        this.backgroundTile.position.x = - this.TILE_WIDTH;
        this.backgroundTile.position.y = - this.TILE_HEIGHT;

        //  Add backgroundTile to change
        this.addChild(this.backgroundTile);

        CraftyBlockEvents.on('setSpaceTile', () => {
            this.removeChild(this.backgroundTile);
            this.TILE_WIDTH = 256;
            this.TILE_HEIGHT = 256;
            this.SpaceTile = PIXI.extras.TilingSprite.fromImage(SpaceTILE, this.TILE_WIDTH, this.TILE_HEIGHT);
            this.SpaceTile.width = RendererStore.get('width') + 2 * this.TILE_WIDTH;
            this.SpaceTile.height = RendererStore.get('height') + 2 * this.TILE_HEIGHT;
            this.SpaceTile.position.x = - this.TILE_WIDTH;
            this.SpaceTile.position.y = - this.TILE_HEIGHT;
            this.addChild(this.SpaceTile);
        });

        CraftyBlockEvents.on('setDefaultTile', () => {
            this.removeChild(this.SpaceTile);
            this.TILE_WIDTH = 17;
            this.TILE_HEIGHT = 17;
            this.backgroundTile = PIXI.extras.TilingSprite.fromImage(TILE, this.TILE_WIDTH, this.TILE_HEIGHT);
            this.backgroundTile.width = RendererStore.get('width') + 2 * this.TILE_WIDTH;
            this.backgroundTile.height = RendererStore.get('height') + 2 * this.TILE_HEIGHT;
            this.backgroundTile.position.x = - this.TILE_WIDTH;
            this.backgroundTile.position.y = - this.TILE_HEIGHT;
            this.addChild(this.backgroundTile);
        });

        RendererStore.addChangeListener(this.resizeHandler.bind(this));

        this.interactive = true;
        this
            .on('mousedown', this.onMouseDown)
            .on('touchstart', this.onMouseDown)
            .on('mousemove', this.onMouseMove)
            .on('touchmove', this.onMouseMove)
            .on('mouseup', this.onMouseUp)
            .on('mouseupoutside', this.onMouseUp)
            .on('touchend', this.onMouseUp)
            .on('touchendoutside', this.onMouseUp);
    }

    onMouseDown(event) {
        event.offset = event.data.getLocalPosition(this);
        event.originalCanvasPosition = this.canvas.position.clone();
        event.tileOffset = this.position.clone();
        event.selected = true; // boolean used for narrowing event listening socpe
    }

    onMouseMove(event) {
        if (event.selected) {
            let newPosition = event.data.getLocalPosition(this.parent);

            //  Create panning effect by resetting the image offset every time the tile is panned until tile is overlapping
            this.position.x = (newPosition.x - event.offset.x) % this.TILE_WIDTH;
            this.position.y = (newPosition.y - event.offset.y) % this.TILE_HEIGHT;

            this.canvas.position.x = event.originalCanvasPosition.x + newPosition.x - event.offset.x - event.tileOffset.x;
            this.canvas.position.y = event.originalCanvasPosition.y + newPosition.y - event.offset.y - event.tileOffset.y;
            console.log(this.canvas.position);
        }
    }

    onMouseUp(event) {
        if (event.selected) {
            event.selected = false;
        }
    }

    resizeHandler() {
        this.backgroundTile.width = RendererStore.get('width') + 2 * this.TILE_WIDTH;
        this.backgroundTile.height = RendererStore.get('height') + 2 * this.TILE_HEIGHT;
    }
}
