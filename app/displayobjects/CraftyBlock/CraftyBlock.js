import PIXI from 'pixi.js';
import CraftyBlockSpec from './CraftyBlockSpec.js';
import * as BLOCK_CONST from '../../constants/BlockConstants.js';
import * as LINE_CONST from '../../constants/LineConstants.js';
import CraftyBlockAnimator from './CraftyBlockAnimator.js';

export default class CraftyBlock extends PIXI.Container {
    constructor(blockInfo) {
        super();
        this.id = "block";
        this.blockInfo = blockInfo;
        this.childBlocks = [];
        this.parameterBlocks = [];
        this.lines = [];

        this.initialize();

        //console.log(`DEBUG:::Created {${this.name}} block`);
    }

    /** 
     * Convenient getters for block properties
     */
    get name() {
        return this.blockInfo.name;
    }
    get type() {
        return this.blockInfo.type;
    }
    get parameters() {
        return this.blockInfo.parameters;
    }

    static constantWithValue(value) {
        let blockInfo = new CraftyBlockSpec(value, CraftyBlock.CONSTANT);
        return new CraftyBlock(blockInfo);
    }

    static functionWithName(name) {
        let blockInfo = new CraftyBlockSpec.functionWithName(name);
        return new CraftyBlock(blockInfo);
    }

    static parameterWithName(name) {
        let blockInfo = new CraftyBlockSpec(name, CraftyBlock.PARAMETER);
        return new CraftyBlock(blockInfo);
    }

    initialize() {
        //  Create text and set style
        let text = new PIXI.Text(
            this.name,
            BLOCK_CONST.TEXT_STYLE
        );
        text.position.set(BLOCK_CONST.PADDING_H,BLOCK_CONST.PADDING_V);

        //  Create block graphics and set style
        let blockGraphics = new PIXI.Graphics();
        if (this.type == CraftyBlock.PARAMETER) { // if block is parameter, apply different style
            blockGraphics.beginFill(BLOCK_CONST.TYPE_PARAMETER_COLOR, BLOCK_CONST.OPACITY);
        } else if (this.type == CraftyBlock.CONSTANT) {
            blockGraphics.beginFill(BLOCK_CONST.TYPE_CONSTANT_COLOR, BLOCK_CONST.OPACITY);
        } else {
            blockGraphics.beginFill(BLOCK_CONST.TYPE_FUNCTION_COLOR, BLOCK_CONST.OPACITY);
        }
        blockGraphics.drawRoundedRect(0,0,text.width + 2 * BLOCK_CONST.PADDING_H, text.height + 2 * BLOCK_CONST.PADDING_V, BLOCK_CONST.CORNER_RADIUS);
        blockGraphics.endFill();

        //  Add PIXI Objects to parent container
        this.addChild(blockGraphics);
        this.addChild(text);

        //  Add parameter block to this(block) and make it invisible
        this.parameters.forEach((name) => {
            const newBlock = CraftyBlock.parameterWithName(name);
            this.addChild(newBlock);
            this.parameterBlocks.push(newBlock);
            newBlock.visible = false;
        });

        //  set interactivity of blocks
        CraftyBlockAnimator.makeInteractive(this)
    }

    // TODO
    clone() {
    }

    /**
     * Returns the index position of a child CraftyBlock instance
     */
    getChildBlockIndex(block) {
        let index = this.childBlocks.indexOf(block);
        if (index === -1) {
            throw new Error('The supplied Block must be a child of the caller');
        }

        return index;
    }

    /**
     * Removes block from original parent and adds to this instance
     */
    addChildBlock(block, index) {
        console.log(`DEBUG::: Adding {${block.name}} to {${this.name}} at index ${index}`);
        if (block.parent instanceof CraftyBlock) {
            block.parent.removeChildBlock(block);
        }

        this.addChild(block);
        this.childBlocks[index] = block;

        block.update(true);
    }

    /**
     * Removes a child block from this instance
     */
    removeChildBlock(block) {
        const index = this.getChildBlockIndex(block);

        this.removeChild(block);
        this.childBlocks[index] = null;

        let parameterBlock = this.parameterBlocks[index];
        parameterBlock.visible = true;
        this.parameterBlock.update();
        parameterBlock.update();
    }

    }

    //** render: positions child/parameter blocks and draws lines
    render(childIndex = 0) {
        console.log(`DEBUG::: Render {${this.name}} from index ${childIndex}`);

        const blockWidth = this.getChildAt(0).width;
        const blockHeight = this.getChildAt(0).height;
        let lineStartPosition = new PIXI.Point(blockWidth, blockHeight/2 - (LINE_CONST.STROKE_WIDTH + LINE_CONST.SPACING)*this.parameterBlocks.length/2 + childIndex*(LINE_CONST.STROKE_WIDTH + LINE_CONST.SPACING));
        let childBlockPosition = new PIXI.Point(blockWidth + BLOCK_CONST.SPACING_H, 0);

        if (childIndex != 0) {
            let previousHeight = this.childBlocks[childIndex-1].y + this.childBlocks[childIndex-1].height + BLOCK_CONST.SPACING_V;
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
                //console.log(`DEBUG::: childBlock {${this.childBlocks[i].name}} is being added`);
                this.childBlocks[i].visible = true;
                this.childBlocks[i].position = childBlockPosition.clone();
                lastChildHeight = this.childBlocks[i].height;
                this.parameterBlocks[i].visible = false;
            }

            //  increment height of lineStartPositon and childBlockPosition
            lineStartPosition.y += LINE_CONST.STROKE_WIDTH + LINE_CONST.SPACING;
            childBlockPosition.y += BLOCK_CONST.SPACING_V + lastChildHeight;
        }

        function drawBezierCurve(startPosition,endPosition) {
            let curve = new PIXI.Graphics().lineStyle(LINE_CONST.STROKE_WIDTH,LINE_CONST.COLOR);

            let lineWidth = endPosition.x - startPosition.x;
            let lineHeight = endPosition.y - startPosition.y;
            let midPosition = new PIXI.Point(startPosition.x + lineWidth/2, startPosition.y + lineHeight/2);

            curve.moveTo(startPosition.x, startPosition.y);
            curve.bezierCurveTo(
                startPosition.x + LINE_CONST.BEZIER_SCALE_H*lineWidth,
                startPosition.y,
                midPosition.x,
                midPosition.y - LINE_CONST.BEZIER_SCALE_V*lineHeight,
                midPosition.x,
                midPosition.y);
            curve.bezierCurveTo(
                midPosition.x,
                midPosition.y + LINE_CONST.BEZIER_SCALE_V*lineHeight,
                endPosition.x - LINE_CONST.BEZIER_SCALE_H*lineWidth,
                endPosition.y,
                endPosition.x,
                endPosition.y);
            return curve;
        }
    }

    /**
     * Re-renders blocks starting from the index of current block, and repeating for its parent
     */
    update(includeSelf = false) {
        console.log(`DEBUG::: Update called by {${this.name}}`);

        if (this.parent instanceof CraftyBlock) {
            let index = (this.type == CraftyBlock.PARAMETER ? this.parent.getParameterBlockIndex(this) : this.parent.getChildBlockIndex(this));
            this.parent.render(index + (includeSelf ? 0 : 1));
            this.parent.update();
        }
    }

    /*
    //  replace parameterBlock location with block(this)
    attachTo(parameterBlock) {
        //console.log(`DEBUG::: Attached to {${parameterBlock.name}}`);
        parameterBlock.visible = false;
        parameterBlock.parent.addChild(this);
        let index = parameterBlock.parent.parameterBlocks.indexOf(parameterBlock);
        parameterBlock.parent.childBlocks[index] = this;
        this.position = parameterBlock.position;

        this.update();
    }

    //  detach block(this) from parent block and restore parameter block
    detachFromParentBlock() {
        //console.log(`DEBUG::: Detached from {${this.parent.name}}`);

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
    */

    //  returns a string version of the selected block
    stringify() {
        //  quick return space + letiable name or space + {parameter name}
        if (this.type == CraftyBlock.CONSTANT) {
            return " " + this.name;
        } else if (this.type == CraftyBlock.PARAMETER) {
            return " {" + this.name + "}";
        }

        let word = "";

        //  add starting parenthesis if the block is a function or in stage
        if (this._getStage() == this.parent) {
            word += "(";
        } else if (this.type == CraftyBlock.FUNCTION) {
            word += " (";
        }

        //  add block name
        word += this.name;

        //  add child blocks
        for (let i=0;i<this.parameters.length;i++) {
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

    print(indent = "*") {
        console.log(indent, this.name);
        this.parameterBlocks.forEach( (block,index) => {
            if (this.childBlocks[index]) {
                this.childBlocks[index].print(indent + "**");
            } else {
                block.print(indent + "**");
            }
        });
    }
}

//  Define CraftyBlock types
let blockId = 0;
CraftyBlock.FUNCTION    = blockId++;
CraftyBlock.CONSTANT    = blockId++;
CraftyBlock.PARAMETER   = blockId++;
