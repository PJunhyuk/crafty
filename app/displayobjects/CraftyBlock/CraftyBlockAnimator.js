import PIXI from 'pixi.js';
import CraftyBlock from './CraftyBlock.js';
import CraftyBlockSpec from './CraftyBlockSpec.js';

let IS_DRAGGING = false;
let MOUSEOVER_BLOCK = null;

const blockType = {"function": 0, constant: 1, parameter: 2};

class CraftyBlockAnimator {
    constructor() {
    }

    makeInteractive(block) {
        block.interactive = true;
        block.hitArea = block.getChildAt(0).getBounds().clone();
        //console.log(`DEBUG:::interactivity enabled for {${this.blockInfo.name}}`);

        //  enable drag and drop for non-parameter blocks, enable mouse over check for parameter blocks
        if (block.blockInfo.type != blockType.parameter) {
            console.log(`helloo from ${block.blockInfo.name}`);
            block
                .on('mousedown', this.onDragStart)
                .on('click', this.onClick)
                .on('touchstart', this.onDragStart)
                .on('mouseup', this.onDragEnd)
                .on('mouseupoutside', this.onDragEnd)
                .on('touchend', this.onDragEnd)
                .on('touchendoutside', this.onDragEnd)
                .on('mousemove', this.onDragMove)
                .on('touchmove', this.onDragMove);
        } else {
            block
                .on('mousedown', this.onParameterStart)
                .on('touchstart', this.onParameterStart)
                .on('mouseup', this.onParameterEnd)
                .on('mouseupoutside', this.onParameterEnd)
                .on('touchend', this.onParameterEnd)
                .on('touchendoutside', this.onParameterEnd)
                .on('mousemove', this.onParameterMove)
                .on('touchmove', this.onParameterMove);
        }
    }
    onClick() {
        console.log("Clicked!");
    }

    onDragStart(event) {
        let relativeMousePosition = event.data.getLocalPosition(this);
        if (this.hitArea.contains(relativeMousePosition.x, relativeMousePosition.y)) {
            //console.log("DEBUG::: drag started by \"" + this.blockInfo.name + "\"");

            //  set toggle that becomes true the moment when drag starts
            this.startedDragging = false;

            //  if parent is sidebar, create copy
            if (this.parent.id == "sidebar") {
                let blockCopy = new CraftyBlock(this.blockInfo);
                this.sidebarRect = this.parent.getChildAt(0).getBounds().clone();
                blockCopy.position = this.position.clone();
                this.parent.addChildAt(blockCopy,1);
                this.renderFrom(0);
            }

            //  save original position and distance from original to mouse position
            let mouseStartPosition = event.data.getLocalPosition(this.parent);
            this.diff = new PIXI.Point(mouseStartPosition.x - this.position.x, mouseStartPosition.y - this.position.y);
            this.originalPosition = new PIXI.Point(this.position.x,this.position.y);

            this.alpha = 0.6;
            this.dragging = true;
            IS_DRAGGING = true;
        }
    }

    onDragEnd(event) {
        //  if block had been clicked, check drag or click, and execute by case
        if (this.dragging) {
            // case: dragged

            //  if parent is sidebar, either add new Block to stage or remove depending on mouse location
            if (this.parent.id == "sidebar") {
                let relativeMousePosition = event.data.getLocalPosition(this.parent);
                if (this.sidebarRect.contains(relativeMousePosition.x, relativeMousePosition.y)) {
                    this.parent.removeChild(this);
                } else {
                    this.addToStage();
                }
            }

            if (this.startedDragging) {
                //console.log("DEBUG::: drag ended by \"" + this.blockInfo.name + "\"");

                //  if there is parameter block below, attach
                if (MOUSEOVER_BLOCK) {
                    this.attachTo(MOUSEOVER_BLOCK);
                    MOUSEOVER_BLOCK = null;
                }

                //  render update the taken out block
                if (this.originalBlock) {
                    this.originalBlock.update();
                }

                //  call canvasChanged function
                canvasChanged();
            }
            // case: clicked
            else {
                this.emit('click');
                //  export block
                // console.log(this.stringify());
                //  call canvasClicked function
                canvasClicked(this.stringify());
            }

            this.alpha = 1;
            this.dragging = false;
            IS_DRAGGING = false;
        }
    }

    onDragMove(event) {
        //console.log("DEBUG::: drag moving by \"" + this.blockInfo.name + "\"");

        if (this.dragging)
        {
            //  re-position block to relative mouse position
            let newPosition = event.data.getLocalPosition(this.parent);
            this.position.x = newPosition.x - this.diff.x;
            this.position.y = newPosition.y - this.diff.y;

            //  trigger when first drag after select
            if (!this.startedDragging) {
                this.startedDragging = true;

                //  if block has parent block, detach from parent block and set originalBlock for later update()
                if (this.parent.hasOwnProperty('blockInfo')) {
                    this.originalBlock = this.detachFromParentBlock();
                } else {
                    this.originalBlock = null;
                }
            }
        }
    }

    // "mousemove" event handler for parameter blocks
    onParameterMove(event) {
        //  if mouse position is inside hit area, then set stage.target to this
        if (IS_DRAGGING) {
            let relativeMousePosition = event.data.getLocalPosition(this);
            if (this.hitArea.contains(relativeMousePosition.x, relativeMousePosition.y)) {
                //console.log(`DEBUG::: parameter moving by {${this.blockInfo.name}}`);

                this.getChildAt(0).tint = 0xDDDDDD;
                MOUSEOVER_BLOCK = this;
            } else {
                if (this == MOUSEOVER_BLOCK) {
                    MOUSEOVER_BLOCK = null;
                    this.getChildAt(0).tint = 0xFFFFFF;
                }
            }
        }
    }

    onParameterStart(event) {
        this.clicked = true;
    }

    onParameterEnd(event) {
        if (this.clicked) {
            let letiableName = prompt("Type in your constant!");
            let constantBlockInfo = new CraftyBlockSpec(letiableName, blockType.constant);
            let constantBlock = new CraftyBlock(constantBlockInfo);
            constantBlock.attachTo(this);
            this.clicked = false;
        }
    }
}

export default new CraftyBlockAnimator();
