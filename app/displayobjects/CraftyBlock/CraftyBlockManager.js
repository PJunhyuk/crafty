//import CraftyBlockAnimator from './CraftyBlockAnimator.js';
import CraftyBlock from '../CraftyBlock/CraftyBlock.js';
import CraftyBlockSpec from '../CraftyBlock/CraftyBlockSpec.js';
import Node from '../../pastel/node.js';
import Token from '../../pastel/token.js';
import CraftyStore from '../../stores/CraftyStore.js';

/**
 * CraftyBlock Manager Class
 * 
 * Manages existing and new blocks, and their positions
 *
 * @exports CraftyBlockManager
 */
export default class CraftyBlockManager {
    constructor(stage, sidebar) {
        this.stage = stage;
        this.sidebar = sidebar;
        console.log("DEBUG::: Created CraftyBlockManager!");
        this.blocks = [];

        this.loadTree();

        CraftyStore.addChangeListener(this.loadTree.bind(this));
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
     * Add block to stage
     */
    addToStage(block) {
        this.stage.addChild(block);
    }
    
    //  TODO
    createBlock() {
    }

    //  TODO
    attachBlock(parameterBlock, block) {
    }

    //  TODO
    deleteBlock(block) {
    }

    //  TODO
    replaceBlock(block, newBlock) {
    }

    //  TODO
    uncurryBlock(block) {
    }

    //  TODO
    curryBlock(block) {
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
                //functionBlock.setChildBlocks(childBlocks);

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
}
