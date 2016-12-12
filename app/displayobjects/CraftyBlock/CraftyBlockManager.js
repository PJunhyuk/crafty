import Pastel from 'pastel-lang';
import CraftyBlock from '../CraftyBlock/CraftyBlock.js';
import CraftyBlockSpec from '../CraftyBlock/CraftyBlockSpec.js';
import CraftyStore from '../../stores/CraftyStore.js';
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
        this.rootBlocks = [];
        this.menu = new CraftyBlockMenu();

        //  Add Block Event Listeners
        this.addBlockEventListeners();

        //  Load Saved Tree from CraftyStore
        this.loadTree();

        //  Add CraftyStore Listener for changes from editor
        CraftyStore.addChangeListener(caller => {
            if (caller == "editor") {
                this.loadTree();
            } else {
                console.log(`DEBUG::: Ignoring change from ${caller}`);
            }
        });

        //  React to block events that results in canvas change
        CraftyBlockEvents.on('canvaschange', _ => {
            let rootTree = new Pastel.Node();
            this.rootBlocks.forEach( block => {
                let tree = this.treefy(block);
                rootTree.addChild(tree);
            });
            CraftyStore.set('tree', rootTree);
            CraftyStore.emitChange("canvasmanager");
        });


        console.log("DEBUG::: Initialized CraftyBlockManager!");
    }

    addBlockEventListeners() {
        CraftyBlockEvents.on('dragready', onDragReady.bind(this));
        CraftyBlockEvents.on('dragstart', onDragStart.bind(this));
        CraftyBlockEvents.on('dragend', onDragEnd.bind(this));
        CraftyBlockEvents.on('clickblock', block => {
            if(block.isFoldable()) {
              this.menu.foldable = true;
              this.menu.reRender();
            } else {
              this.menu.foldable = false;
              this.menu.reRender();
            }
            this.menu.toggle(block);
            this.stage.addChild(this.menu);
        });
        CraftyBlockEvents.on('clickfold', block => {
          if (block.folded) {
              block.unfold();
          } else {
              block.fold();
          }
        });
        CraftyBlockEvents.on('clickdelete', block => {
            this.removeBlock(block);
            CraftyBlockEvents.emit('canvaschange');
        });

        function onDragReady(block) {
            //  if block is in sidebar, create copy
            block.originalAddress = this.getAddress(block);

            if (block.originalAddress == -1) {
                this.stage.sidebar.addChildAt(block.clone(),1);
                block.render();
            }
        }

        function onDragStart(block) {

            if (block.parent instanceof CraftyBlock) {
                block.parent.removeChildBlock(block);
            }

            this.stage.addChild(block);
            //  TODO: Disable auto render for this case
        }

        function onDragEnd(event) {
            //  called after block is placed according to corresponding mouse location
            let block = event.target;
            let targetBlock = event.targetBlock;
            let validDrag = true;

            //  if block has targetBlock(parameter block that is being hovered over), attach
            if(targetBlock) {
                console.log("Attaching block to target...");
                block.attachTo(targetBlock);
            }

            //  Get new block address
            let newAddress = this.getAddress(block);

            //  only interested in when block address changed
            if (!this.isAddressEqual(block.originalAddress,newAddress)) {

                //  when block is no longer a root block
                if (block.originalAddress.length == 1 && newAddress.length != 1) {
                    //  remove block from rootBlocks
                    this.rootBlocks.splice(this.rootBlocks.indexOf(block),1);
                }

                //  if the block is sidebar created
                if (block.originalAddress[0] == -1) {
                    //  check mouse location is inside sidebar
                    let relativeMousePosition = event.data.getLocalPosition(this.stage);
                    if (this.stage.sidebar.containsPosition(relativeMousePosition)) {
                        //  remove block out of existence
                        console.log("Mouse inside sidebar");
                        this.removeBlock(block);
                        validDrag = false;
                    }
                }
                //  if the block is valid, i.e. not removed from sidebar
                if (validDrag) {
                    //  if the block is on stage
                    if (newAddress[0] == -2) {
                        //  add to rootBlocks right after original root block position
                        this.rootBlocks.splice(block.originalAddress[0]+1,0,block);
                        //  no need to addToStage since it is already done during moving
                    }

                    //  emit canvas changed
                    CraftyBlockEvents.emit('canvaschange');
                }
            }

            block.originalAddress = undefined;
        }
    }

    /**
     * Loads saved tree from CraftyStore, blockifies trees, and positions the blocks
     */
    loadTree() {
        //  empty stage first
        this.emptyStage();

        let savedTree = CraftyStore.get('tree');

        this.rootBlocks = this.blockify(savedTree);

        const MARGIN_LEFT = 70;
        const MARGIN_TOP = 150;
        const SPACING = 15;
        let blockPosition = MARGIN_TOP;

        //  Set position of blocks and add to stage
        this.rootBlocks.forEach( block => {
            block.position.x = MARGIN_LEFT;
            block.position.y = blockPosition;
            this.stage.addChild(block);
            blockPosition += block.height + SPACING;
        });

        console.log("DEBUG::: block-loading saved tree is done!");
    }

    /**
     * Delete all crafty blocks on stage
     */
    emptyStage() {
        //  iterate in reverse order
        for (let i=this.rootBlocks.length-1; i>=0;i--) {
            this.removeBlock(this.rootBlocks[i]);
        }
    }

    /**
     * Removes a block out of existence
     */
    removeBlock(block) {
        if (block.parent instanceof CraftyBlock) {
            block.parent.removeChildBlock(block);
        } else {
            let index = this.rootBlocks.indexOf(block);
            if (index > -1) {
                this.rootBlocks.splice(index,1);
            }
            this.stage.removeChild(block);
        }
    }

    /**
     * Transform Crafty block into pastel's parsed tree
     */
    treefy(block) {
        let tree;

        let blockName = (block.type == CraftyBlock.PARAMETER) ? "{" + block.name + "}" : block.name;
        let token = new Pastel.Token(Pastel.Token.ID, blockName);

        if (block.type == CraftyBlock.FUNCTION) {
            tree = new Pastel.Node();
            let subtree = new Pastel.Node(token);

            tree.addChild(subtree);

            block.childBlocks.forEach( blocks => {
                tree.addChild(this.treefy(blocks[0]));
            });
        } else {
            tree = new Pastel.Node(token);
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

    getAddress(block) {
        let address = [];
        if (block.parent instanceof CraftyBlock) {
            address = this.getAddress(block.parent);
            address.push(block.parent.getChildBlockIndex(block));
        } else {
            let sidebarIndex = this.stage.sidebar.children.indexOf(block);
            if (sidebarIndex > -1) {
                address.push(-1);
            }
            else {
                let stageIndex = this.rootBlocks.indexOf(block);
                if (stageIndex > -1) {
                    address.push(stageIndex);
                } else {
                    // -2 means is on stage temporarily
                    address.push(-2);
                }
            }
        }

        return address;
    }

    isAddressEqual(address1, address2) {
        return (address1.length == address2.length) && address1.every( (element, index) => element === address2[index] );
    }

    getBlockAt(address) {
        if (address[0] < 0) {
            throw new Error("Invalid address!!");
        }

        let targetBlock = this.rootBlocks[address.shift()];
        while (address.length > 0) {
            targetBlock = targetBlock.childBlocks[address.shift()][0];
        }

        return targetBlock;
    }
}
