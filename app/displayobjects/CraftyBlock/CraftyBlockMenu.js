import PIXI from 'pixi.js';
import * as BLOCK_CONST from '../../constants/BlockConstants.js';
import CraftyBlockEvents from './CraftyBlockEvents.js';

export default class CraftyBlockMenu extends PIXI.Container {
    constructor() {
        super();
        this.block = undefined;
        this.foldable = undefined;

        let blockGraphicsDelete = new PIXI.Graphics();
        blockGraphicsDelete.beginFill(BLOCK_CONST.MENU_COLOR_DELETE, 1);
        blockGraphicsDelete.drawRoundedRect(0, 0, BLOCK_CONST.MENU_WIDTH, BLOCK_CONST.MENU_HEIGHT, BLOCK_CONST.MENU_CORNER_RADIUS);
        blockGraphicsDelete.endFill();
        let textDelete = new PIXI.Text("-", BLOCK_CONST.MENU_TEXT_STYLE);
        textDelete.position.x = blockGraphicsDelete.width / 2 - textDelete.width / 2;
        textDelete.position.y = blockGraphicsDelete.height / 2 - textDelete.height / 2;

        let blockGraphicsFold = new PIXI.Graphics();
        blockGraphicsFold.beginFill(BLOCK_CONST.TYPE_FUNCTION_FOLDED_COLOR, 1);
        blockGraphicsFold.drawRoundedRect(BLOCK_CONST.MENU_WIDTH + BLOCK_CONST.MENU_MARGIN, 0, BLOCK_CONST.MENU_WIDTH, BLOCK_CONST.MENU_HEIGHT, BLOCK_CONST.MENU_CORNER_RADIUS);
        blockGraphicsFold.endFill();
        let textFold = new PIXI.Text("...", BLOCK_CONST.MENU_TEXT_STYLE);
        textFold.position.x = blockGraphicsFold.width / 2 - textFold.width / 2 + BLOCK_CONST.MENU_WIDTH + BLOCK_CONST.MENU_MARGIN;
        textFold.position.y = blockGraphicsFold.height / 2 - textFold.height / 2;

        this.addChild(blockGraphicsDelete);
        this.addChild(textDelete);
        this.addChild(blockGraphicsFold);
        this.addChild(textFold);

        blockGraphicsDelete.interactive = true;
        blockGraphicsDelete.on('click', _ => {
            let block = this.block;
            this.toggle();
            CraftyBlockEvents.emit('clickdelete', block);
        });

        blockGraphicsFold.interactive = true;
        blockGraphicsFold.on('click', _ => {
            let block = this.block;
            this.toggle();
            CraftyBlockEvents.emit('clickfold', block);
        });
    }

    render() {
        console.log("render");
        console.log(this.foldable);
        if (!this.foldable) {
            if (this.children.length == 4) {
                this.removeChildAt(3);
                this.removeChildAt(2);
            }
        } else {
            if (this.children.length == 2) {
                let blockGraphicsFold = new PIXI.Graphics();
                blockGraphicsFold.beginFill(BLOCK_CONST.TYPE_FUNCTION_FOLDED_COLOR, 1);
                blockGraphicsFold.drawRoundedRect(BLOCK_CONST.MENU_WIDTH + BLOCK_CONST.MENU_MARGIN, 0, BLOCK_CONST.MENU_WIDTH, BLOCK_CONST.MENU_HEIGHT, BLOCK_CONST.MENU_CORNER_RADIUS);
                blockGraphicsFold.endFill();
                let textFold = new PIXI.Text("...", BLOCK_CONST.MENU_TEXT_STYLE);
                textFold.position.x = blockGraphicsFold.width / 2 - textFold.width / 2 + BLOCK_CONST.MENU_WIDTH + BLOCK_CONST.MENU_MARGIN;
                textFold.position.y = blockGraphicsFold.height / 2 - textFold.height / 2;

                this.addChild(blockGraphicsFold);
                this.addChild(textFold);

                blockGraphicsFold.interactive = true;
                blockGraphicsFold.on('click', _ => {
                    let block = this.block;
                    this.toggle();
                    CraftyBlockEvents.emit('clickfold', block);
                });
            }
        }
    }

    toggle(block = undefined) {
        if (!block || block == this.block) {
            this.block = undefined;
            this.visible = false;
        } else {
            this.visible = true;
            this.block = block;
            this.setPosition();
        }
    }

    setPosition() {
        this.position.x = this.block.absolutePosition.x + this.block.hitArea.width / 2 - this.width / 2;
        this.position.y = this.block.absolutePosition.y - this.height - BLOCK_CONST.MENU_MARGIN;
    }
}
