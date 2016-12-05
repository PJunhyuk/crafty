import PIXI from 'pixi.js';
import * as BLOCK_CONST from '../../constants/BlockConstants.js';
import CraftyBlockEvents from './CraftyBlockEvents.js';

export default class CraftyBlockMenu extends PIXI.Container {
    constructor() {
        super();
        this.block = undefined;

        let blockGraphics = new PIXI.Graphics();
        blockGraphics.beginFill(BLOCK_CONST.MENU_COLOR, 1);
        blockGraphics.drawRoundedRect(0,0,BLOCK_CONST.MENU_WIDTH,BLOCK_CONST.MENU_HEIGHT, BLOCK_CONST.MENU_CORNER_RADIUS);
        blockGraphics.endFill();
        let text = new PIXI.Text( "DELETE", BLOCK_CONST.MENU_TEXT_STYLE);
        text.position.x = blockGraphics.width/2 - text.width/2;
        text.position.y = blockGraphics.height/2 - text.height/2;
        this.addChild(blockGraphics);
        this.addChild(text);

        this.interactive = true;
        this.on('click', _ => { 
            let block = this.block;
            this.toggle();
            CraftyBlockEvents.emit('deleteClicked', block);
        });
    }

    toggle(block=undefined) {
        if (!block || block == this.block) {
            this.block = undefined;
            this.visible = false;
        } 
        else {
            this.visible = true;
            this.block = block;
            this.setPosition();
        }
    }

    setPosition() {
        console.log(this.block);
        this.position.x = this.block.absolutePosition.x + this.block.hitArea.width/2 - this.width/2;
        this.position.y = this.block.absolutePosition.y - this.height - BLOCK_CONST.MENU_MARGIN;
    }
}
