import PIXI from 'pixi.js';
import TILE from './background-tile.png';
import RendererStore from '../../stores/RendererStore.js';

/**
 * Loads the adds the diagnostic image
 *
 * @exports Background
 * @extends Container
 */

const TILE_WIDTH = 16;
const TILE_HEIGHT = 16;
export default class Background extends PIXI.Container {
    constructor() {
        super();

        //  Set backgroundTile as size of window + extra margins for panning illusion
        this.backgroundTile = PIXI.extras.TilingSprite.fromImage(TILE,TILE_WIDTH,TILE_HEIGHT);
        this.backgroundTile.width = RendererStore.get('width') + 2*TILE_WIDTH;
        this.backgroundTile.height = RendererStore.get('height') + 2*TILE_HEIGHT;
        this.backgroundTile.position.x = - TILE_WIDTH;
        this.backgroundTile.position.y = - TILE_HEIGHT;

        //  Add backgroundTile to change
        this.addChild(this.backgroundTile);

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
            this.position.x = (newPosition.x - event.offset.x) % TILE_WIDTH;
            this.position.y = (newPosition.y - event.offset.y) % TILE_HEIGHT;
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
        this.backgroundTile.width = RendererStore.get('width') + 2*TILE_WIDTH;
        this.backgroundTile.height = RendererStore.get('height') + 2*TILE_HEIGHT;
    }
}
