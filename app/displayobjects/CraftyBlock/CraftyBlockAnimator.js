import PIXI from 'pixi.js';
import CraftyBlock from './CraftyBlock.js';
import CraftyBlockSpec from './CraftyBlockSpec.js';
import crafty from './../../crafty/crafty.js';

var stage;

class CraftyBlockAnimator {
    constructor() {
        console.log(`DEBUG:::Created CraftyBlockAnimator`);
        this.isHoldingBlock = false;
        this.targetBlock = null;
    }

    makeInteractive(block) {
        block.interactive = true;
        block.hitArea = block.getChildAt(0).getBounds().clone();
        console.log(`DEBUG:::interactivity enabled for {${block.blockInfo.name}}`);

        //  enable drag and drop for non-parameter blocks, enable mouse over check for parameter blocks
        if (block.blockInfo.type != CraftyBlock.PARAMETER) {
            block
                .on('mousedown', this.onDragStart)
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
        block
            .on('clickonce', this.onClick)
    }

    onClick() {
        console.log("Clicked!");
        crafty.showSetting(this);
    }

    onDragStart(event) {

        stage = this._getStage();

        let relativeMousePosition = event.data.getLocalPosition(this);
        if (this.hitArea.contains(relativeMousePosition.x, relativeMousePosition.y)) {
            //console.log("DEBUG::: drag started by \"" + this.blockInfo.name + "\"");

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
            this.selected = true;
            CraftyBlockAnimator.isHoldingBlock = true;
            //  set toggle that becomes true the moment when drag starts
            this.isClick = true;

            $('.delete_btn').remove();
        }
    }

    onDragMove(event) {
        //console.log("DEBUG::: drag moving by \"" + this.blockInfo.name + "\"");

        if (this.selected)
        {
            //  move block to mouse position
            let newPosition = event.data.getLocalPosition(this.parent);
            this.position.x = newPosition.x - this.diff.x;
            this.position.y = newPosition.y - this.diff.y;

            //  set isClick to false since block started to move
            if (this.isClick) {
                this.isClick = false;

                //  if block has parent block, detach from parent block and set originalBlock for later update()
                if (this.parent.hasOwnProperty('blockInfo')) {
                    this.originalBlock = this.detachFromParentBlock();
                } else {
                    this.originalBlock = null;
                }
            }
        }
    }

    /**
     * Called when click/drag of a block is ended
     */
    onDragEnd(event) {
        if (this.selected) {
            //  if parent is sidebar, either add new Block to stage or remove depending on mouse location
            if (this.parent.id == "sidebar") {
                let relativeMousePosition = event.data.getLocalPosition(this.parent);
                if (this.sidebarRect.contains(relativeMousePosition.x, relativeMousePosition.y)) {
                    this.parent.removeChild(this);
                } else {
                    this.addToStage();
                }
            }

            if (this.isClick) {
                this.emit('clickonce');
            } else {
                //console.log("DEBUG::: drag ended by \"" + this.blockInfo.name + "\"");

                //  if there is parameter block below, attach
                if (CraftyBlockAnimator.targetBlock) {
                    this.attachTo(CraftyBlockAnimator.targetBlock);
                    CraftyBlockAnimator.targetBlock = null;
                }

                //  render update the taken out block
                if (this.originalBlock) {
                    this.originalBlock.update();
                }

                checkBlockInfoList();
            }

            this.alpha = 1;
            this.selected = false;
            CraftyBlockAnimator.isHoldingBlock = false;
        }
    }

    onParameterStart(event) {
        this.clicked = true;
    }

    // "mousemove" event handler for parameter blocks
    onParameterMove(event) {
        //  if mouse position is inside hit area, then set stage.target to this
        if (CraftyBlockAnimator.isHoldingBlock) {
            let relativeMousePosition = event.data.getLocalPosition(this);
            if (this.hitArea.contains(relativeMousePosition.x, relativeMousePosition.y)) {
                //console.log(`DEBUG::: parameter moving by {${this.blockInfo.name}}`);

                this.getChildAt(0).tint = 0xDDDDDD;
                CraftyBlockAnimator.targetBlock = this;
            } else {
                if (this == CraftyBlockAnimator.targetBlock) {
                    CraftyBlockAnimator.targetBlock = null;
                    this.getChildAt(0).tint = 0xFFFFFF;
                }
            }
        }
    }

    onParameterEnd(event) {
        if (this.clicked) {
            let constantName = prompt("Type in your constant!");
            if (constantName) {
                let constantBlockInfo = new CraftyBlockSpec(constantName, CraftyBlock.CONSTANT);
                let constantBlock = new CraftyBlock(constantBlockInfo);
                constantBlock.attachTo(this);
            }
            this.clicked = false;
            checkBlockInfoList();
        }
    }
}

function checkBlockInfoList() {
  var numberOfBlocks = stage.children.length - 2;

  var i;
  var BlockInfoList = new Array("");

  for (i = 1; i <= numberOfBlocks; i++) {
    BlockInfoList[i-1] = stage.getChildAt(i+1).stringify();
  }

  //  call canvasChanged function
  crafty.canvasChanged(BlockInfoList);
  // getBlockInfoList(BlockInfoList);
}

export default new CraftyBlockAnimator();
