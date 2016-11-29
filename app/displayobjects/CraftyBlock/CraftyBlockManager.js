//import CraftyBlockAnimator from './CraftyBlockAnimator.js';
import CraftyBlock from '../CraftyBlock/CraftyBlock.js';
import CraftyBlockSpec from '../CraftyBlock/CraftyBlockSpec.js';
import Node from '../../pastel/node.js';
import Token from '../../pastel/token.js';
import CraftyStore from '../../stores/CraftyStore.js';
import CraftyBlockAnimator from './CraftyBlockAnimator.js';
import crafty from './../../crafty/crafty.js';

/**
 * CraftyBlock Manager Class
 * 
 * Manages existing and new blocks, and their positions
 *
 * @exports CraftyBlockManager
 */
export default class CraftyBlockManager {
    constructor(stage) {
        this.stage = stage;
        console.log("DEBUG::: Created CraftyBlockManager!");
        this.blocks = [];

        this.loadTree();

        /*
        let blockOne = new CraftyBlock.functionWithName("if");
        blockOne.render();
        this.addToStage(blockOne);
        let blockTwo = new CraftyBlock.functionWithName("+");
        blockTwo.render();
        let blockThree = new CraftyBlock.functionWithName("=");
        blockThree.render();
        console.log("adding blockTwo")
        blockOne.addChildBlock(blockTwo, 2);
        console.log("adding blockThree")
        blockTwo.addChildBlock(blockThree,0);

        this.addToStage(blockTwo);
        blockOne.addChildBlock(blockThree, 1);
        blockOne.addChildBlock(blockThree, 2);
        blockOne.addChildBlock(blockThree, 0);

        blockOne.print();
        console.log(this.stage.children);
        */

        CraftyStore.addChangeListener(this.loadTree.bind(this));

        CraftyBlockAnimator.on('movingready', this.prepareBlockDrag.bind(this));
        CraftyBlockAnimator.on('movingstart', this.startBlockDrag.bind(this));
        CraftyBlockAnimator.on('movingend', this.endBlockDrag.bind(this));
    }

    prepareBlockDrag(block) {
        //  if block is in sidebar, create copy
        if (this.stage.sidebar.children.includes(block)) {
            let blockCopy = block.clone();
            this.stage.sidebar.addChildAt(blockCopy,1);
            block.render();
            block.createdFromSidebar = true;
        } else {
            block.createdFromSidebar = false;
        }
    }

    startBlockDrag(event) {
        let block = event.target;

        //console.log(event.data.getLocalPosition(this.stage));
        block.isClick = false;
        this.addToStage(block);

        //  TODO: Disable auto render for this case
    }

    endBlockDrag(event) {
        console.log("DEBUG::: Block drag ended!");

        let block = event.target;

        if (block.createdFromSidebar) {
            let relativeMousePosition = event.data.getLocalPosition(block.parent);
            if (this.stage.sidebar.containsPosition(relativeMousePosition)) {
                this.removeBlock(block);
            }
        }

        this.checkBlockInfoList();
    }

    /**
     * Loads saved tree from CraftyStore, blockifies trees, and positions the blocks
     */
    loadTree() {
        //  empty stage first
        this.emptyStage();

        let savedTree = CraftyStore.get('tree');
        let savedBlocks = this.blockify(savedTree, -1);
        const MARGIN_LEFT = 70;
        const MARGIN_TOP = 150;
        const SPACING = 15;
        let blockPosition = MARGIN_TOP;

        //  Set position of blocks and add to stage
        savedBlocks.forEach( block => { 
            block.position.x = MARGIN_LEFT;
            block.position.y = blockPosition;
            this.addToStage(block) 
            blockPosition += block.height + SPACING;
        });

        console.log("DEBUG::: block-loading saved tree is done!");
    }

    /**
     * Delete all crafty blocks on stage
     */
    emptyStage() {
        //  iterate in reverse order
        for (let i=this.stage.children.length-1; i>=0;i--) {
            if (this.stage.getChildAt(i) instanceof CraftyBlock) {
                this.stage.removeChildAt(i);
            }
        }
    }

    /**
     * Removes a block out of existence
     */
    removeBlock(block) {
        if (block.parent instanceof CraftyBlock) {
            block.parent.removeChildBlock(block);
        }
        else if (this.stage.children.includes(block)) {
            this.stage.removeChild(block);
        }
    }

    /**
     * Add block to stage
     */
    addToStage(block) {
        console.log(`DEBUG::: Adding {${block.name}} to stage`);
        if (block.parent instanceof CraftyBlock) {
            block.parent.removeChildBlock(block);
        }

        this.stage.addChild(block);
    }

    //  TODO
    treefy(block) {
        let tree = new Node();
        for (let block of this.blocks) {
            if (block.blockInfo.type == CraftyBlock.FUNCTION) {
            }
            let subtree = new Node();


            tree.addChild(subtree);
        }

        return tree;
    }

    /**
     * Transforms pastel's parsed tree from into Crafty blocks
     */
    blockify(node, index = 0) {
        //  for first try (whole stage), divide into groups and perform blockify on each subtree
        if (index == -1) {
            let blocks = [];

            node.children.forEach( (childNode) => {
                blocks.push(this.blockify(childNode));
            });

            return blocks;
        }
        else {
            //console.log("DEBUG::: blockifying...");
            if (!node.getData()) {
                let children = node.getChildren();
                let functionBlock;
                let childBlocks = [];
                children.forEach( (childNode, idx) => {
                    if (idx == 0) {
                        functionBlock = this.blockify(childNode, idx);
                    } else {
                        childBlocks.push(this.blockify(childNode, idx));
                    }
                });

                childBlocks.forEach( (block,index) => {
                    functionBlock.addChildBlock(block,index);
                });

                return functionBlock;
            }
            else {
                let blockInfo;
                if (index == 0) {
                    blockInfo = CraftyBlockSpec.functionWithName(node.getData().data);
                }
                else {
                    blockInfo = new CraftyBlockSpec(node.getData().data,CraftyBlock.CONSTANT);
                }
                return new CraftyBlock(blockInfo);
            }
        }
    }

    /**
     * DEPRECATED: use treefy
     *
     * Returns a string version of the selected block
    */
    stringify(block) {
        //  quick return space + letiable name or space + {parameter name}
        if (block.type == CraftyBlock.CONSTANT) {
            return " " + block.name;
        } else if (block.type == CraftyBlock.PARAMETER) {
            return " {" + block.name + "}";
        }

        let word = "";

        //  add starting parenthesis if the block is a function or in stage
        if (this.stage == block.parent) {
            word += "(";
        } else if (block.type == CraftyBlock.FUNCTION) {
            word += " (";
        }

        //  add block name
        word += block.name;

        //  add child blocks
        for (let i=0;i<block.parameters.length;i++) {
            if (block.childBlocks[i]) {
                word += this.stringify(block.childBlocks[i]);
            } else {
                word += this.stringify(block.parameterBlocks[i]);
            }
        }

        //  add closing parenthesis
        word += ")";

        return word;
    }


    checkBlockInfoList() {
        var numberOfBlocks = this.stage.children.length - 2;

        var i;
        var blockInfoList = new Array("");

        for (i = 1; i <= numberOfBlocks; i++) {
            blockInfoList[i-1] = this.stringify(this.stage.getChildAt(i+1));
        }

        //  call canvasChanged function
        crafty.canvasChanged(blockInfoList);
        // getBlockInfoList(BlockInfoList);
    }
}
