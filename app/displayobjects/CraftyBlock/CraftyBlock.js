import PIXI from 'pixi.js';
import CraftyBlockSpec from './CraftyBlockSpec.js';
import { BLOCK_TEXT_STYLE, BLOCK_TEXT_MARGIN, BLOCK_STYLE, PARAMETER_BLOCK_STYLE, LINE_STYLE, BLOCK_MARGIN } from '../../constants/BlockConstants.js';
import CraftyBlockAnimator from './CraftyBlockAnimator.js';

const blockType = {"function": 0, constant: 1, parameter: 2};

export default class CraftyBlock extends PIXI.Container {
    constructor(blockInfo) {
        super();
        this.id = "block";
        this.blockInfo = blockInfo;
        this.childBlocks = [];
        this.parameterBlocks = [];
        this.lines = [];

        this.initialize();

        //console.log(`DEBUG:::Created {${this.blockInfo.name}} block`);
    }

    initialize() {
        //  Crate text and set style
        let text = new PIXI.Text(
            this.blockInfo.name,
            BLOCK_TEXT_STYLE
        );
        text.position.set(BLOCK_TEXT_MARGIN.top,BLOCK_TEXT_MARGIN.left);

        //  Create block graphics and set style
        let blockGraphics = new PIXI.Graphics();
        if (this.blockInfo.type == blockType.parameter) { // if block is parameter, apply different style
            blockGraphics.beginFill(PARAMETER_BLOCK_STYLE.color, PARAMETER_BLOCK_STYLE.opacity);
        } else {
            blockGraphics.beginFill(BLOCK_STYLE.color, BLOCK_STYLE.opacity);
        }
        blockGraphics.drawRoundedRect(0,0,text.width + BLOCK_TEXT_MARGIN.left + BLOCK_TEXT_MARGIN.right, text.height + BLOCK_TEXT_MARGIN.top + BLOCK_TEXT_MARGIN.bottom, BLOCK_STYLE.cornerRadius);
        blockGraphics.endFill();

        //  Add PIXI Objects to parent container
        this.addChild(blockGraphics);
        this.addChild(text);

        //  Add parameter block to this(block) and make it invisible
        this.blockInfo.parameters.forEach((name) => {
            const parameterBlockInfo = new CraftyBlockSpec(name,blockType.parameter);
            const newBlock = new CraftyBlock(parameterBlockInfo);
            this.parameterBlocks.push(newBlock);
            this.addChild(newBlock).visible = false;
        });

        //  set interactivity of blocks
        //this.setInteractivity();
        CraftyBlockAnimator.makeInteractive(this)
    }

    //** render: positions child/parameter blocks and draws lines
    renderFrom(childIndex) {
        //console.log(`DEBUG::: Render {${this.blockInfo.name}} from index ${childIndex}`);

        const blockWidth = this.getChildAt(0).width;
        const blockHeight = this.getChildAt(0).height;
        let lineStartPosition = new PIXI.Point(blockWidth, blockHeight/2 - (LINE_STYLE.width + LINE_STYLE.spacing)*this.parameterBlocks.length/2 + childIndex*(LINE_STYLE.width + LINE_STYLE.spacing));
        let childBlockPosition = new PIXI.Point(blockWidth + BLOCK_MARGIN.width, 0);

        if (childIndex != 0) {
            let previousHeight = this.childBlocks[childIndex-1].y + this.childBlocks[childIndex-1].height + BLOCK_MARGIN.height;
            childBlockPosition.y = previousHeight;
        }

        //  remove existing lines from block
        this.lines.slice(childIndex).forEach(line => this.removeChild(line));

        //  for each parameter/branch, draw line and place block
        for (let i=childIndex;i < this.parameterBlocks.length; i++) {
            //  set line end position and draw line
            let lineEndPosition = new PIXI.Point(childBlockPosition.x, childBlockPosition.y + blockHeight/2);
            if (i==0) { // for case 0, make line straight
                lineEndPosition.y = lineStartPosition.y;
            }
            let curve = drawBezierCurve(lineStartPosition,lineEndPosition);
            this.addChild(curve);
            this.lines[i] = curve;

            //  parameter block: set position
            this.parameterBlocks[i].visible = true;
            this.parameterBlocks[i].position = childBlockPosition.clone();
            let lastChildHeight = this.parameterBlocks[i].height;

            //  child block: set position, make corresponding parameterBlock invisible
            if (this.childBlocks[i]) {
                this.childBlocks[i].visible = true;
                this.childBlocks[i].position = childBlockPosition.clone();
                lastChildHeight = this.childBlocks[i].height;
                this.parameterBlocks[i].visible = false;
            }

            //  increment height of lineStartPositon and childBlockPosition
            lineStartPosition.y += LINE_STYLE.width + LINE_STYLE.spacing;
            childBlockPosition.y += BLOCK_MARGIN.height + lastChildHeight;
        }

        function drawBezierCurve(startPosition,endPosition) {
            let curve = new PIXI.Graphics().lineStyle(LINE_STYLE.width,LINE_STYLE.color);

            let lineWidth = endPosition.x - startPosition.x;
            let lineHeight = endPosition.y - startPosition.y;
            let midPosition = new PIXI.Point(startPosition.x + lineWidth/2, startPosition.y + lineHeight/2);

            curve.moveTo(startPosition.x, startPosition.y);
            curve.bezierCurveTo(
                startPosition.x + LINE_STYLE.bezierHScale*lineWidth,
                startPosition.y,
                midPosition.x,
                midPosition.y - LINE_STYLE.bezierVScale*lineHeight,
                midPosition.x,
                midPosition.y);
            curve.bezierCurveTo(
                midPosition.x,
                midPosition.y + LINE_STYLE.bezierVScale*lineHeight,
                endPosition.x - LINE_STYLE.bezierHScale*lineWidth,
                endPosition.y,
                endPosition.x,
                endPosition.y);
            return curve;
        }
    }

    //  replace parameterBlock location with block(this)
    attachTo(parameterBlock) {
        //console.log(`DEBUG::: Attached to {${parameterBlock.blockInfo.name}}`);
        parameterBlock.visible = false;
        parameterBlock.parent.addChild(this);
        let index = parameterBlock.parent.parameterBlocks.indexOf(parameterBlock);
        parameterBlock.parent.childBlocks[index] = this;
        this.position = parameterBlock.position;

        this.update();
    }

    update() {
        //console.log(`DEBUG::: Update called by {${this.blockInfo.name}}`);

        if (this.parent.id != "stage") {
            this.parent.renderFrom(this.parent.childBlocks.indexOf(this)+1);
            this.parent.update();
        }
    }

    //  detach block(this) from parent block and restore parameter block
    detachFromParentBlock() {
        //console.log(`DEBUG::: Detached from {${this.parent.blockInfo.name}}`);

        let index = this.parent.childBlocks.indexOf(this);
        let parameterBlock = this.parent.parameterBlocks[index];
        parameterBlock.visible = true;
        this.parent.childBlocks[index] = null;

        this.addToStage();
        return parameterBlock;
    }

    addToStage() {
        //  take out selected block to front (last child of stage)
        //  shift postion to absolute position (in relation to stage)
        let absolutePosition = this._getAbsolutePosition();
        this._getStage().addChild(this);
        this.position = absolutePosition;
    }

    //  get position of block(this) relative to stage
    _getAbsolutePosition() {
        let position = new PIXI.Point(this.position.x,this.position.y);
        let parent = this.parent;
        while (parent.id != "stage") {
            position.x += parent.position.x;
            position.y += parent.position.y;
            parent = parent.parent;
        }
        return position;
    }

    //  get stage(first non-block parent)
    _getStage() {
        let parent = this.parent;
        while (parent.id != "stage") {
            parent = parent.parent;
        }
        return parent;
    }

    //  returns a string version of the selected block
    stringify() {
        //  quick return space + letiable name or space + {parameter name}
        if (this.blockInfo.type == blockType.constant) {
            return " " + this.blockInfo.name;
        } else if (this.blockInfo.type == blockType.parameter) {
            return " {" + this.blockInfo.name + "}";
        }

        let word = "";

        //  add starting parenthesis if the block is a function or in stage
        if (this._getStage() == this.parent) {
            word += "(";
        } else if (this.blockInfo.type == blockType.function) {
            word += " (";
        }

        //  add block name
        word += this.blockInfo.name;

        //  add child blocks
        for (let i=0;i<this.blockInfo.parameters.length;i++) {
            if (this.childBlocks[i]) {
                word += this.childBlocks[i].stringify();
            } else {
                word += this.parameterBlocks[i].stringify();
            }
        }

        //  add closing parenthesis
        word += ")";

        return word;
    }
}
