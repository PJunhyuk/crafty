import PIXI from 'pixi.js';
import EventEmitter from 'events';
import CraftyBlock from './CraftyBlock.js';
import CraftyBlockSpec from './CraftyBlockSpec.js';
import crafty from './../../crafty/crafty.js';

var stage;

/**
 * CraftyBlock Animator Class
 *
 * Handles user events on crafty blocks
 * Emits required block edit
 *
 * @exports new CraftyBlockAnimator instance
 * @extends EventEmitter
 */
class CraftyBlockAnimator extends EventEmitter {
    constructor(...args) {
        super(...args);

        this.isHoldingBlock = false;
        this.targetBlock = null;
        console.log("DEBUG::: CraftyBlockAnimator initialized!");
    }

    onClick(event) {
        console.log("Clicked!");
        let block = event.target;

        if (block.isClick) {
            crafty.showSetting(this);
        }
    }

    onDragStart(event) {
        let block = event.target;

        let relativeMousePosition = event.data.getLocalPosition(block);
        if (block.isHit(relativeMousePosition)) {
            //console.log("DEBUG::: drag started by \"" + block.blockInfo.name + "\"");

            //  emit start of drag move
            this.emit('movingready', block);

            //  save original position and distance from original to mouse position
            let mouseStartPosition = event.data.getLocalPosition(block.parent);
            block.diff = new PIXI.Point(mouseStartPosition.x - block.position.x, mouseStartPosition.y - block.position.y);
            block.originalPosition = new PIXI.Point(block.position.x,block.position.y);

            block.alpha = 0.6;
            block.selected = true;
            this.isHoldingBlock = true;
            //  set toggle that becomes true the moment when drag starts
            block.isClick = true;

            $('.delete_btn').remove();
        }
    }

    onDragMove(event) {
        let block = event.target;
        //console.log("DEBUG::: drag moving by \"" + block.blockInfo.name + "\"");

         if (block.selected)
         {
            //  set isClick to false since block started to move
            if (block.isClick) {
                block.isClick = false;
                this.emit('movingstart', event);
            }

            //  move block to mouse position
            let newPosition = event.data.getLocalPosition(block.parent);
            block.position.x = newPosition.x - block.diff.x;
            block.position.y = newPosition.y - block.diff.y;
        }
    }

    /**
     * Called when click/drag of a block is ended
     */
    onDragEnd(event) {
        let block = event.target;

        if (block.selected) {
            //  if parent is sidebar, either add new Block to stage or remove depending on mouse location
            this.emit('movingend', event);
            if (block.isClick) {
                block.emit('clickonce', event);
            } else {
                console.log("DEBUG::: drag ended by \"" + block.blockInfo.name + "\"");

                //  if there is parameter block below, attach
                if (this.targetBlock) {
                    block.attachTo(this.targetBlock);
                    this.targetBlock = null;
                }
            }

            block.alpha = 1;
            block.selected = false;
            this.isHoldingBlock = false;
        }
    }

    onParameterStart(event) {
        let block = event.target;

        block.clicked = true;
    }

    // "mousemove" event handler for parameter blocks
    onParameterMove(event) {
        let block = event.target;

        //  if mouse position is inside hit area, then set stage.target to this
        if (this.isHoldingBlock) {
            let relativeMousePosition = event.data.getLocalPosition(block);
            if (block.isHit(relativeMousePosition)) {
                //console.log(`DEBUG::: parameter moving by {${block.blockInfo.name}}`);

                block.getChildAt(0).tint = 0xDDDDDD;
                this.targetBlock = block;
            } else {
                if (block == this.targetBlock) {
                    this.targetBlock = null;
                    block.getChildAt(0).tint = 0xFFFFFF;
                }
            }
        }
    }

    onParameterEnd(event) {
        let block = event.target;

        if (block.clicked) {
            let relativeMousePosition = event.data.getLocalPosition(block);
            if (block.isHit(relativeMousePosition)) {
                let value = prompt("Type in your constant!");

                if (value) {
                    let constantBlock = CraftyBlock.constantWithValue(value);
                    constantBlock.attachTo(block);
                }
            }
            block.clicked = false;
        }
    }
}

export default new CraftyBlockAnimator();
