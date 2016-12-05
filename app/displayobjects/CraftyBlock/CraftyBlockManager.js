import Node from '../../pastel/node.js';
import Token from '../../pastel/token.js';
import CraftyBlock from '../CraftyBlock/CraftyBlock.js';
import CraftyBlockSpec from '../CraftyBlock/CraftyBlockSpec.js';
import CraftyStore from '../../stores/CraftyStore.js';
import crafty from './../../crafty/crafty.js';
import CraftyBlockMenu from './CraftyBlockMenu.js';
import CraftyBlockEvents from './CraftyBlockEvents.js';

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
        this.blocks = [];
        this.menu = new CraftyBlockMenu();

        //  Add Block Event Listeners
        CraftyBlockEvents.on('movingready', this.prepareBlockDrag.bind(this));
        CraftyBlockEvents.on('movingstart', this.startBlockDrag.bind(this));
        CraftyBlockEvents.on('movingend', this.endBlockDrag.bind(this));
        CraftyBlockEvents.on('createdonstage', (block) => {
            if (!this.rootBlocks.includes(block)) {
                this.rootBlocks.push(block);
                console.log(block);

                console.log("Block added to Stage! rootBlock.length = " + this.rootBlocks.length);
                this.checkBlockInfoList();
            }
        });
        CraftyBlockEvents.on('clickonce', (block) => {
            console.log("Clicked!");
            console.log(block);
            this.menu.toggle(block);
            this.stage.addChild(this.menu);
        });
        CraftyBlockEvents.on('deleteClicked', (block) => {
            this.removeBlock(block);
        });

        //  Load Saved Tree from CraftyStore
        this.loadTree();

        console.log("DEBUG::: Created CraftyBlockManager!");
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

        let savedBlocks = this.blockify(savedTree);

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

    /**
     * Transform Crafty block into pastel's parsed tree
     */
    treefy(blocks) {
        let tree;

        if (blocks instanceof Array) {
            tree = new Node();
            let childTrees = [];

            blocks.forEach( childBlock => { 
                let childTree = this.treefy(childBlock)
                childTrees[childBlock.order] = childTree;
                //tree.addChild(childTree);
            });

            childTrees.forEach( childTree => {
                tree.addChild(childTree);
            });
        }
        else {
            let block = blocks;
            let token = new Token(Token.ID, block.name);
            if (block.type == CraftyBlock.FUNCTION) {
                tree = new Node();
                let subtree = new Node(token);

                tree.addChild(subtree);

                block.childBlocks.forEach( childBlock => {
                    tree.addChild(this.treefy(childBlock));
                });
            } else {
                tree = new Node(token);
            }
        }

        return tree;
    }

    /**
     * Transforms pastel's parsed tree from into Crafty blocks
     */
    blockify(node, index = 0) {
        //  for first try (whole stage), divide into groups and perform blockify on each subtree
        if (!node.parent) {
            //  for each children(subtree), map its blockified version
            //let blocks = node.children.map ( childNode => this.blockify(childNode) );
            let blocks = [];
            node.children.forEach( (childNode,index) => { 
                let block = this.blockify(childNode);
                block.order = index;
                blocks.push(block);
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
