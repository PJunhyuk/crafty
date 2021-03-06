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
        this.folded = false;

        this._initialize();

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
     * Convenience method for creating CraftyBlock.CONSTANT
     */
    static constantWithValue(value) {
        let blockInfo = new CraftyBlockSpec(value, CraftyBlock.CONSTANT);
        return new CraftyBlock(blockInfo);
    }

    _getChildBlocks() {
        return this.folded ? this.inputBlocks : this.childBlocks;
    }

    /**
     * Initializer for CraftyBlock
     *
     * Creates block text, graphics, placeholder blocks, and calls makeInteractive();
     */
    _initialize() {
        //  Create text and set style
        let text = new PIXI.Text(
            this.name,
            BLOCK_CONST.TEXT_STYLE
        );
        text.position.set(BLOCK_CONST.PADDING_H,BLOCK_CONST.PADDING_V);

        //  Create block graphics and set style
        let blockGraphics = new PIXI.Graphics();
        switch(this.type) {
            case CraftyBlock.PLACEHOLDER:
                blockGraphics.beginFill(BLOCK_CONST.TYPE_PLACEHOLDER_COLOR, BLOCK_CONST.OPACITY);
                break;
            case CraftyBlock.FUNCTION:
                blockGraphics.beginFill(BLOCK_CONST.TYPE_FUNCTION_COLOR, BLOCK_CONST.OPACITY);
                break;
            case CraftyBlock.CONSTANT:
                blockGraphics.beginFill(BLOCK_CONST.TYPE_CONSTANT_COLOR, BLOCK_CONST.OPACITY);
                break;
            case CraftyBlock.PARAMETER:
                blockGraphics.beginFill(BLOCK_CONST.TYPE_PARAMETER_COLOR, BLOCK_CONST.OPACITY);
                break;
            default:
                throw new TypeError("Unknown CraftyBlock type!");
        }
        blockGraphics.drawRoundedRect(0,0,text.width + 2 * BLOCK_CONST.PADDING_H, text.height + 2 * BLOCK_CONST.PADDING_V, BLOCK_CONST.CORNER_RADIUS);
        blockGraphics.endFill();

        //  Add PIXI Objects to parent container
        this.addChild(blockGraphics);
        this.addChild(text);

        //  Add placeholder block to this(block) and make it invisible
        this.parameters.forEach((name) => {
            let blockInfo = new CraftyBlockSpec(name, CraftyBlock.PLACEHOLDER);
            const placeholderBlock = new CraftyBlock(blockInfo);
            this.addChild(placeholderBlock);
            this.childBlocks.push([placeholderBlock]);
            placeholderBlock.visible = false;
        });

        this.hitArea = blockGraphics.getBounds().clone();

        //  set interactivity of blocks
        this._makeInteractive();
    }

    /**
     * Makes the block interactive
     */
    _makeInteractive() {
        const events = CraftyBlockAnimator;

        this.interactive = true;
        //console.log(`DEBUG:::interactivity enabled for {${this.name}}`);

        //  enable drag and drop for non-placeholder blocks, enable mouse over check for placeholder blocks
        if (this.type != CraftyBlock.PLACEHOLDER) {
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
                .on('mousedown', events.onPlaceholderStart.bind(events))
                .on('touchstart', events.onPlaceholderStart.bind(events))
                .on('mouseup', events.onPlaceholderEnd.bind(events))
                .on('mouseupoutside', events.onPlaceholderEnd.bind(events))
                .on('touchend', events.onPlaceholderEnd.bind(events))
                .on('touchendoutside', events.onPlaceholderEnd.bind(events))
                .on('mousemove', events.onPlaceholderMove.bind(events))
                .on('touchmove', events.onPlaceholderMove.bind(events));
        }
    }

    /**
     * Returns a clone of current block
     */
    clone() {
        console.log(`Cloning {${this.name}}...`);
        let blockCopy = new CraftyBlock(this.blockInfo);
        this._getChildBlocks().forEach( (blocks,index) => {
            if (blocks.length != 1) {
                blocks[0].print();
                blockCopy.addChildBlock(blocks[0].clone(),index);
            }
        });
        blockCopy.position = this.position.clone();;
        blockCopy.folded = this.folded;

        return blockCopy;
    }


    /**
     * Returns true if position is inside block's hitArea
     */
    isHit(position) {
        return this.hitArea.contains(position.x, position.y);
    }

    //** render: positions child/placeholder blocks and draws lines
    render(childIndex = 0) {
        // console.log(`DEBUG::: Render {${this.name}} from index ${childIndex}`);
        let drawingBlocks = this._getChildBlocks();

        let lineStartPosition = new PIXI.Point(this.hitArea.width, this.hitArea.height/2 - (LINE_CONST.STROKE_WIDTH + LINE_CONST.SPACING)*drawingBlocks.length/2 + childIndex*(LINE_CONST.STROKE_WIDTH + LINE_CONST.SPACING));
        let childBlockPosition = new PIXI.Point(this.hitArea.height + BLOCK_CONST.SPACING_H, 0);

        //  recalculate starting height if render not starting from 0
        if (childIndex != 0) {
            let activeChildBlock = drawingBlocks[childIndex-1][0];
            childBlockPosition.y = activeChildBlock.y + activeChildBlock.height + BLOCK_CONST.SPACING_V;
        }

        //  remove existing lines from block
        this.lines.splice(childIndex).forEach(line => this.removeChild(line));


        //  draw line and position corresponding blocks
        drawingBlocks.slice(childIndex).forEach( (blocks,index) => {
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

            //  set position of child/placeholder blocks and make visible to false
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
     * Returns the index position of a child CraftyBlock instance (works with both placeholder and child blocks);
     */
    getChildBlockIndex(block) {
        return this._getChildBlocks().findIndex( blocks => blocks.includes(block) );
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
        this._getChildBlocks()[index].unshift(block);

        //  update augmented block
        block.update(true);
    }

    attachTo(targetBlock) {
        if (this.parent instanceof CraftyBlock) {
            this.parent.removeChildBlock(this);
        }
        let targetParent = targetBlock.parent;

        targetParent.addChild(this);
        let index = targetParent.getChildBlockIndex(targetBlock);
        targetParent._getChildBlocks()[index].unshift(this);

        this.update(true);
    }

    /**
     * Removes a child block from this instance
     */
    removeChildBlock(block) {
        console.log(`DEBUG::: Removing {${block.name}} from {${this.name}}`);

        this.removeChild(block);

        let index = this.getChildBlockIndex(block);
        this._getChildBlocks()[index].shift();
        let parameterBlock = this._getChildBlocks()[index][0];

        //  set parameterBlock visible to true and update taken out block
        parameterBlock.visible = true;
        parameterBlock.update();
    }

    // TODO
    deattach() {
    }

    /****** FOLDING IMPLEMENTATIONS ******/

    /**
     *
     */
    _applyName(name) {
        //  Create new PIXI text and set position
        let text = new PIXI.Text(
            name,
            BLOCK_CONST.TEXT_STYLE
        );
        text.position.set(BLOCK_CONST.PADDING_H,BLOCK_CONST.PADDING_V);

        //  Remove existing text
        this.removeChildAt(1);

        //  Add text to block
        this.addChildAt(text,1);
    }

    _applyMainBlock(color) {
        //  Create new PIXI Graphics and set color, position
        let blockGraphics = new PIXI.Graphics();
        if (this.type == CraftyBlock.PLACEHOLDER) { // if block is parameter, apply different style
            blockGraphics.beginFill(color, BLOCK_CONST.OPACITY);

        } else if (this.type == CraftyBlock.CONSTANT) {
            blockGraphics.beginFill(color, BLOCK_CONST.OPACITY);
        } else {
            if (this.folded) {
                blockGraphics.beginFill(color, BLOCK_CONST.OPACITY);
            } else {
                blockGraphics.beginFill(color, BLOCK_CONST.OPACITY);
            }
        }
        blockGraphics.drawRoundedRect(0,0,this.getChildAt(1).width + 2 * BLOCK_CONST.PADDING_H, this.getChildAt(1).height + 2 * BLOCK_CONST.PADDING_V, BLOCK_CONST.CORNER_RADIUS);
        blockGraphics.endFill();

        this.hitArea = blockGraphics.getBounds().clone();

        //  Remove existing graphics
        this.removeChildAt(0);

        //  Add graphics to block
        this.addChildAt(blockGraphics,0);
    }

    /**
     * Remove all children except main block and text
     */
    _purge() {
        this.removeChildren(2);
    }

    /**
     * Redraw and re-add all child blocks
     */
    _redraw() {
        this._getChildBlocks().forEach( blocks => blocks.forEach( block => {
            this.addChild(block);
            block._redraw();
        }));

        console.log(`Redrawing {${this.name}}...`);
        this.render();
    }

    /**
     * Returns a list of blocks that are at the end of the trees (leafs)
     */
    _getLeafBlocks() {
        let leafBlocks = [];

        this.childBlocks.forEach( blocks => {
            if (blocks[0].type == CraftyBlock.FUNCTION) {
                leafBlocks.push(...blocks[0]._getLeafBlocks());
            } else {
                leafBlocks.push(blocks);
            }
        });

        return leafBlocks;
    }

    /**
     * Fold block
     */
    fold() {
        // assert (this.type == CraftyBlock.FUNCTION, "Attempt to fold on non-function block");
        this.folded = true;
        this._purge();
        this._applyName("...");
        this._applyMainBlock(BLOCK_CONST.TYPE_FUNCTION_FOLDED_COLOR);
        this.inputBlocks = this._getLeafBlocks();
        this.inputBlocks.forEach( blocks => blocks.forEach( block => this.addChild(block) ) );
        this.render();
    }

    /**
     * Unfold block
     */
    unfold() {
        this.folded = false;
        this._purge();
        this._applyName(this.name);
        this._applyMainBlock(BLOCK_CONST.TYPE_FUNCTION_COLOR);
        this._redraw();
        this.inputBlocks = null;
    }

    /**
     * Check if block has objects to fold
     */
    isFoldable() {
        //  Returns true when the block is a function block, and it contains at least one function blocks
        return this.type == CraftyBlock.FUNCTION && this.childBlocks.some( blocks => blocks[0].type == CraftyBlock.FUNCTION )
    }

    /**
     **** TESTING PURPOSES ONLY
     * Prints block structure onto console
     */
    print(indent = "") {
        let prefix = "";
        let childIndent = "  ";
        if (this.parent instanceof CraftyBlock) {
            if (this.parent.getChildBlockIndex(this) == this.parent._getChildBlocks().length -1) {
                prefix += "└─";
                childIndent = "  ";
            } else {
                prefix += "├─";
                childIndent = "| ";
            }
        }
        console.log(indent + prefix + this.name);
        this._getChildBlocks().forEach( (blocks,index) => { 
            blocks[0].print(indent + childIndent);
        });
    }
    
    /**
     * Rename a constant block's name and redraw text and block
     */
    renameConstant(name) {
        if (this.type !== CraftyBlock.CONSTANT) {
            throw new TypeError("Renaming only supported with constant blocks!");a
        }
        this.blockInfo.name = name;

        //  Create new PIXI.Text
        let text = new PIXI.Text(
            this.name,
            BLOCK_CONST.TEXT_STYLE
        );
        text.position.set(BLOCK_CONST.PADDING_H,BLOCK_CONST.PADDING_V);

        //  Create block graphics and set style(constant)
        let blockGraphics = new PIXI.Graphics();
        blockGraphics.beginFill(BLOCK_CONST.TYPE_CONSTANT_COLOR, BLOCK_CONST.OPACITY);
        blockGraphics.drawRoundedRect(0,0,text.width + 2 * BLOCK_CONST.PADDING_H, text.height + 2 * BLOCK_CONST.PADDING_V, BLOCK_CONST.CORNER_RADIUS);
        blockGraphics.endFill();

        //  Swap old blocks with new ones
        this.removeChildren(0,2);
        this.addChildAt(blockGraphics,0);
        this.addChildAt(text,1);
    }
}

//  Define CraftyBlock types
let blockId = 0;
CraftyBlock.FUNCTION    = blockId++;
CraftyBlock.CONSTANT    = blockId++;
CraftyBlock.PLACEHOLDER = blockId++;
CraftyBlock.DEFINE      = blockId++;
CraftyBlock.PARAMETER = blockId++;
