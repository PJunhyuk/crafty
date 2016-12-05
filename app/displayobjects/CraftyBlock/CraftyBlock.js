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

    /**
     * Convenient initializers for each block types
     */
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

    /**
     * Initializer for CraftyBlock
     *
     * Creates block text, graphics, parameter blocks, and calls makeInteractive();
     */
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
        this.makeInteractive();
    }

    /**
     * Returns a clone of current block
     */
    clone() {
        let blockCopy = new CraftyBlock(this.blockInfo);
        blockCopy.position = this.position.clone();;

        return blockCopy;
    }

    /**
     * Makes the block interactive
     */
    makeInteractive() {
        const events = CraftyBlockAnimator;

        this.interactive = true;
        this.hitArea = this.getChildAt(0).getBounds().clone();
        //console.log(`DEBUG:::interactivity enabled for {${this.name}}`);

        //  enable drag and drop for non-parameter blocks, enable mouse over check for parameter blocks
        if (this.type != CraftyBlock.PARAMETER) {
            this
                .on('mousedown', events.onDragStart.bind(events))
                .on('touchstart', events.onDragStart.bind(events))
                .on('mousemove', events.onDragMove.bind(events))
                .on('touchmove', events.onDragMove.bind(events))
                .on('mouseup', events.onDragEnd.bind(events))
                .on('mouseupoutside', events.onDragEnd.bind(events))
                .on('touchend', events.onDragEnd.bind(events))
                .on('touchendoutside', events.onDragEnd.bind(events));
        } else {
            this
                .on('mousedown', events.onParameterStart.bind(events))
                .on('touchstart', events.onParameterStart.bind(events))
                .on('mouseup', events.onParameterEnd.bind(events))
                .on('mouseupoutside', events.onParameterEnd.bind(events))
                .on('touchend', events.onParameterEnd.bind(events))
                .on('touchendoutside', events.onParameterEnd.bind(events))
                .on('mousemove', events.onParameterMove.bind(events))
                .on('touchmove', events.onParameterMove.bind(events));
        }
    }

    /**
     * Returns true if position is inside block's hitArea
     */
    isHit(position) {
        return this.hitArea.contains(position.x, position.y);
    }

    //** render: positions child/parameter blocks and draws lines
    render(childIndex = 0) {
        //console.log(`DEBUG::: Render {${this.name}} from index ${childIndex}`);

        const blockWidth = this.getChildAt(0).width;
        const blockHeight = this.getChildAt(0).height;
        let lineStartPosition = new PIXI.Point(blockWidth, blockHeight/2 - (LINE_CONST.STROKE_WIDTH + LINE_CONST.SPACING)*this.parameterBlocks.length/2 + childIndex*(LINE_CONST.STROKE_WIDTH + LINE_CONST.SPACING));
        let childBlockPosition = new PIXI.Point(blockWidth + BLOCK_CONST.SPACING_H, 0);

        //  recalculate starting height if render not starting from 0
        if (childIndex != 0) {
            let previousHeight = 0;
            if (this.childBlocks[childIndex-1]) {
                previousHeight = this.childBlocks[childIndex-1].y + this.childBlocks[childIndex-1].height + BLOCK_CONST.SPACING_V;
            } else {
                previousHeight = this.parameterBlocks[childIndex-1].y + this.parameterBlocks[childIndex-1].height + BLOCK_CONST.SPACING_V;
            }
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
        //console.log(`DEBUG::: Update called by {${this.name}}`);

        if (this.parent instanceof CraftyBlock) {
            let index = (this.type == CraftyBlock.PARAMETER ? this.parent.getParameterBlockIndex(this) : this.parent.getChildBlockIndex(this));
            this.parent.render(index + (includeSelf ? 0 : 1));
            this.parent.update();
        }
    }

    /**
     * DEPRECATED: use update() instead
     * Alternative implementation of update function
     */
    /*
    updateFrom(index) {
        //console.log(`DEBUG::: Update called by {${this.name}} from index ${index}`);

        this.render(index);
        if (this.parent instanceof CraftyBlock) {
            this.parent.updateFrom(this.parent.getChildBlockIndex(this) + 1);
        }
    }
    */

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
     * Returns the index position of a child parameterBlock instance
     */
    getParameterBlockIndex(block) {
        let index = this.parameterBlocks.indexOf(block);
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

        //  remove block from its parent
        if (block.parent instanceof CraftyBlock) {
            block.parent.removeChildBlock(block);
        }

        this.addChild(block);
        this.childBlocks[index] = block;

        //  update augmented block
        block.update(true);
    }

    /**
     * Removes a child block from this instance
     */
    removeChildBlock(block) {
        console.log(`DEBUG::: Removing {${block.name}} from {${this.name}}`);
        const index = this.getChildBlockIndex(block);

        this.removeChild(block);
        this.childBlocks[index] = null;

        //  set parameterBlock visible to true and update taken out block
        let parameterBlock = this.parameterBlocks[index];
        parameterBlock.visible = true;
        parameterBlock.update();
    }

    /** 
     * Attach block to parameterBlock location
     *
     * @convenience of addChildBlock
     */
    attachTo(parameterBlock) {
        let parent = parameterBlock.parent;
        let index = parent.getParameterBlockIndex(parameterBlock);
        parent.addChildBlock(this,index);
    }

    //  TODO
    fold() {
    }

    //  TODO
    unfold() {
    }

    /**
     * Prints block structure onto console
     */
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
