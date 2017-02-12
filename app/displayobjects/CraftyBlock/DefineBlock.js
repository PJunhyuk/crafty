import CraftyBlock from './CraftyBlock.js';
import CraftyBlockSpec from './CraftyBlockSpec.js';
import * as BLOCK_CONST from '../../constants/BlockConstants.js';
import * as LINE_CONST from '../../constants/LineConstants.js';

export default class DefineBlock extends CraftyBlock {
    constructor(blockInfo) {
        if (blockInfo.type !== CraftyBlock.DEFINE) {
            throw new TypeError("Trying to create a define block from  non-DEFINE block info!!");
        }
        super(blockInfo);
    }

    _initialize() {
        const paddingH = BLOCK_CONST.PADDING_H + BLOCK_CONST.DEFINE_EXTRA_PADDING;
        const paddingV = BLOCK_CONST.PADDING_V + BLOCK_CONST.DEFINE_EXTRA_PADDING;

        //  create text
        let text = new PIXI.Text(
            this.name,
            BLOCK_CONST.TEXT_STYLE
        );
        text.position.set(paddingH,paddingV);

        let blockWidth = text.width + paddingH + BLOCK_CONST.DEFINE_EXTRA_PADDING;

        //  Add placeholder block to this(block) and make it invisible
        let parameterBlocks = [];
        this.parameters.forEach((name) => {
            blockWidth += BLOCK_CONST.PARAMETER_PADDING;
            let blockInfo = new CraftyBlockSpec(name, CraftyBlock.PARAMETER);
            const parameterBlock = new CraftyBlock(blockInfo);
            parameterBlocks.push(parameterBlock);
            parameterBlock.position.set(blockWidth, BLOCK_CONST.DEFINE_EXTRA_PADDING);
            blockWidth += parameterBlock.width;
        });

        blockWidth += BLOCK_CONST.PADDING_H;

        //  draw block graphics
        let blockGraphics = new PIXI.Graphics();
        blockGraphics.beginFill(BLOCK_CONST.TYPE_DEFINE_COLOR, BLOCK_CONST.OPACITY);
        blockGraphics.drawRoundedRect(0,0,blockWidth, text.height + 2 * paddingV, BLOCK_CONST.CORNER_RADIUS);
        blockGraphics.endFill();

        //  Add PIXI Objects to parent container
        this.addChild(blockGraphics);
        this.addChild(text);
        parameterBlocks.forEach((block) => {
            this.addChild(block);
        });

        this.hitArea = blockGraphics.getBounds().clone();

        //  add body placeholder
        this._addBody();

        //  set interactivity of blocks
        this._makeInteractive();
    }

    /**
     * Add placeholder block that will hold body of the function
     */
    _addBody() {
        // Create and add placeholder block
        const placeholderBlockSpec = new CraftyBlockSpec("body",CraftyBlock.PLACEHOLDER);
        const placeholderBlock = new CraftyBlock(placeholderBlockSpec);
        placeholderBlock.position.set(BLOCK_CONST.DEFINE_BODY_INDENT, this.height + BLOCK_CONST.SPACING_V);
        this.childBlocks.push([placeholderBlock]);
        this.addChild(placeholderBlock);

        // Draw line and add
        let line = new PIXI.Graphics().lineStyle(LINE_CONST.STROKE_WIDTH, LINE_CONST.COLOR);
        line.moveTo(BLOCK_CONST.PADDING_H, placeholderBlock.y - BLOCK_CONST.SPACING_V);
        line.lineTo(BLOCK_CONST.PADDING_H, placeholderBlock.y - 5);
        line.quadraticCurveTo(BLOCK_CONST.PADDING_H, placeholderBlock.y+placeholderBlock.height/2, placeholderBlock.x, placeholderBlock.y+placeholderBlock.height/2);
        // line.lineTo(placeholderBlock.x + placeholderBlock.width/2, placeholderBlock.y);
        this.addChildAt(line,2);
    }
    /**
     * override CraftyBlock's render to fit define block's render
     */
    render(childIndex = 0) {
        let drawingBlocks = this._getChildBlocks();

        drawingBlocks.slice(childIndex).forEach( (blocks,index) => {
            blocks.forEach( block => {
                block.position.set(BLOCK_CONST.DEFINE_BODY_INDENT, this.getChildAt(0).height + BLOCK_CONST.SPACING_V);
                block.visible = false;
            });

            blocks[0].visible = true;
        });
    }
}
