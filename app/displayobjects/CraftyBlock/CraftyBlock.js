import PIXI from 'pixi.js';
import CraftyBlockSpec from './CraftyBlockSpec.js';
import { BLOCK_TEXT_STYLE, BLOCK_TEXT_MARGIN, BLOCK_STYLE, PARAMETER_BLOCK_STYLE, LINE_STYLE, BLOCK_MARGIN } from '../../constants/BlockConstants.js';

let IS_DRAGGING = false;
let MOUSEOVER_BLOCK = null;

let blockType = {"function": 0, constant: 1, parameter: 2};

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

        //  If no children given, make children list of null blocks
        if (this.childBlocks.length == 0) {
            this.childBlocks = new Array(this.blockInfo.parameters.length);
        }

        //  Create and store parameter blocks with parameterName
        for (let i=0;i<this.blockInfo.parameters.length;i++) {
            let parameterBlockInfo = new CraftyBlockSpec(this.blockInfo.parameters[i],blockType.parameter);
            let newBlock = new CraftyBlock(parameterBlockInfo);
            this.parameterBlocks.push(newBlock);

            //  Add parameter block to this(block) and make it invisible
            this.addChild(this.parameterBlocks[i]).visible = false;

            //  Add child block to this(block) if it isn't null and make it invisible
            if (this.childBlocks[i] != null) {
                this.addChild(this.childBlocks[i]).visible = false;
            }
        }

        //  set interactivity of blocks
        this.setInteractivity();
    }

    //** render: positions child/parameter blocks and draws lines
    renderFrom(childIndex) {
        //console.log(`DEBUG::: Render {${this.blockInfo.name}} from index ${childIndex}`);

        let blockWidth = this.getChildAt(0).width;
        let blockHeight = this.getChildAt(0).height;
        let lineStartPosition = new PIXI.Point(blockWidth, blockHeight/2 - (LINE_STYLE.width + LINE_STYLE.spacing)*this.childBlocks.length/2 + childIndex*(LINE_STYLE.width + LINE_STYLE.spacing));
        let childBlockPosition = new PIXI.Point(blockWidth + BLOCK_MARGIN.width, 0);

        if (childIndex != 0) {
            let previousHeight = this.childBlocks[childIndex-1].y + this.childBlocks[childIndex-1].height + BLOCK_MARGIN.height;
            childBlockPosition.y = previousHeight;
        }

        if (childIndex < this.lines.length) {
            for (let i=childIndex;i<this.lines.length;i++) {
                this.removeChild(this.lines[i]);
            }
        }

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
            if (this.childBlocks[i] != null) {
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

    //  set interactivity for blocks
    setInteractivity() {
        this.interactive = true;
        this.hitArea = this.getChildAt(0).getBounds().clone();
        //console.log(`DEBUG:::interactivity enabled for {${this.blockInfo.name}}`);

        //  enable drag and drop for non-parameter blocks, enable mouse over check for parameter blocks
        if (this.blockInfo.type != blockType.parameter) {
            this
            .on('mousedown', onDragStart)
            .on('touchstart', onDragStart)
            .on('mouseup', onDragEnd)
            .on('mouseupoutside', onDragEnd)
            .on('touchend', onDragEnd)
            .on('touchendoutside', onDragEnd)
            .on('mousemove', onDragMove)
            .on('touchmove', onDragMove);
        } else {
            this
            .on('mousedown', onParameterStart)
            .on('touchstart', onParameterStart)
            .on('mouseup', onParameterEnd)
            .on('mouseupoutside', onParameterEnd)
            .on('touchend', onParameterEnd)
            .on('touchendoutside', onParameterEnd)
            .on('mousemove', onParameterMove)
            .on('touchmove', onParameterMove);
        }

        function onDragStart(event) {
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

        function onDragEnd(event) {
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
                }
                // case: clicked
                else {
                    //  export block
                    console.log(this.stringify());
                }

                this.alpha = 1;
                this.dragging = false;
                IS_DRAGGING = false;
            }
        }

        function onDragMove(event) {
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
        function onParameterMove(event) {
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

        function onParameterStart(event) {
            this.clicked = true;
        }
        function onParameterEnd(event) {
            if (this.clicked) {
                let letiableName = prompt("Type in your constant!");
                let constantBlockInfo = new CraftyBlockSpec(letiableName, blockType.constant);
                let constantBlock = new CraftyBlock(constantBlockInfo);
                constantBlock.attachTo(this);
                this.clicked = false;
            }
        }
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
