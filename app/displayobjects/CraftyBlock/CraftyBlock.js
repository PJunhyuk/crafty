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
    get absolutePosition() {
        let position = this.position.clone();
        if (this.parent instanceof CraftyBlock) {
            position.x += this.parent.absolutePosition.x;
            position.y += this.parent.absolutePosition.y;
        }
        return position;
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
            const parameterBlock = CraftyBlock.parameterWithName(name);
            this.addChild(parameterBlock);
            this.childBlocks.push([parameterBlock]);
            parameterBlock.visible = false;
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
                .on('mousedown', events.onMouseDown.bind(events))
                .on('touchstart', events.onMouseDown.bind(events))
                .on('mousemove', events.onMouseMove.bind(events))
                .on('touchmove', events.onMouseMove.bind(events))
                .on('mouseup', events.onMouseUp.bind(events))
                .on('mouseupoutside', events.onMouseUp.bind(events))
                .on('touchend', events.onMouseUp.bind(events))
                .on('touchendoutside', events.onMouseUp.bind(events));
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
        // console.log(`DEBUG::: Render {${this.name}} from index ${childIndex}`);

        let lineStartPosition = new PIXI.Point(this.hitArea.width, this.hitArea.height/2 - (LINE_CONST.STROKE_WIDTH + LINE_CONST.SPACING)*this.childBlocks.length/2 + childIndex*(LINE_CONST.STROKE_WIDTH + LINE_CONST.SPACING));
        let childBlockPosition = new PIXI.Point(this.hitArea.height + BLOCK_CONST.SPACING_H, 0);

        //  recalculate starting height if render not starting from 0
        if (childIndex != 0) {
            let activeChildBlock = this.childBlocks[childIndex-1][0];
            childBlockPosition.y = activeChildBlock.y + activeChildBlock.height + BLOCK_CONST.SPACING_V;
        }

        //  remove existing lines from block
        this.lines.splice(childIndex).forEach(line => this.removeChild(line));

        this.childBlocks.slice(childIndex).forEach( (blocks,index) => {
            //  set line end position to middle of next block to draw
            let lineEndPosition = new PIXI.Point(childBlockPosition.x, childBlockPosition.y + this.hitArea.height/2);

            // for case 0, make line straight
            if (childIndex==0 && index == 0) {
                lineEndPosition.y = lineStartPosition.y;
            }

            //  draw curve, add to child, and push into lines array
            let curve = drawBezierCurve(lineStartPosition,lineEndPosition);
            this.addChild(curve);
            this.lines.push(curve);

            //  set position of child/parameter blocks and make visible to false
            blocks.forEach( block => {
                block.position = childBlockPosition.clone();
                block.visible = false;
            });
            //  only show top block as visible
            blocks[0].visible = true;

            //  increment height of lineStartPositon and childBlockPosition
            lineStartPosition.y += LINE_CONST.STROKE_WIDTH + LINE_CONST.SPACING;
            childBlockPosition.y += BLOCK_CONST.SPACING_V + blocks[0].height;
        });

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
            let index = this.parent.getChildBlockIndex(this);
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
     * Returns the index position of a child CraftyBlock instance (works with both parameter and child blocks);
     */
    getChildBlockIndex(block) {
        return this.childBlocks.findIndex( blocks => blocks.includes(block) );
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
        this.childBlocks[index].unshift(block);

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
        this.childBlocks[index].shift();

        //  set parameterBlock visible to true and update taken out block
        let parameterBlock = this.childBlocks[index][0];
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
        let index = parent.getChildBlockIndex(parameterBlock);
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
    print(indent = "") {
        let prefix = "";
        let childIndent = "  ";
        if (this.parent instanceof CraftyBlock) {
            if (this.parent.getChildBlockIndex(this) == this.parent.childBlocks.length -1) {
                prefix += "└─";
                childIndent = "  ";
            } else {
                prefix += "├─";
                childIndent = "| ";
            }
        }
        console.log(indent + prefix + this.name);
        this.childBlocks.forEach( (blocks,index) => { 
            blocks[0].print(childIndent);
        });
    }
}

//  Define CraftyBlock types
let blockId = 0;
CraftyBlock.FUNCTION    = blockId++;
CraftyBlock.CONSTANT    = blockId++;
CraftyBlock.PARAMETER   = blockId++;
