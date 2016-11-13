import PIXI from 'pixi.js';
import CraftyBlock from '../CraftyBlock/CraftyBlock.js';
import CraftyBlockSpec from '../CraftyBlock/CraftyBlockSpec.js';
import SidebarBackground from './SidebarBackground.js';

const blockType = {"function": 0, constant: 1, parameter: 2};
//  built-in blockInfos
const IF_BLOCKINFO = new CraftyBlockSpec("if", blockType.function, ["condition", "true-body", "false-body"], "standard")
const ADD_BLOCKINFO = new CraftyBlockSpec("+", blockType.function, ["a", "b"], "math")
const EQUALS_BLOCKINFO = new CraftyBlockSpec("=", blockType.function, ["a", "b"], "math")

//  sidebar-style
const BLOCK_LIBRARY_MARGIN = {left: 30, top: 20, height: 10};

//  block libraries
let BLOCK_LIB_STANDARD = [IF_BLOCKINFO, ADD_BLOCKINFO, EQUALS_BLOCKINFO];

export default class Sidebar extends PIXI.Container {
    constructor() {
        super();
        this.id = "sidebar";
        console.log("DEBUG::: loading library...");
        let bg = new SidebarBackground();
        this.addChild(bg);

        let height = BLOCK_LIBRARY_MARGIN.top;
        for (let blockInfo of BLOCK_LIB_STANDARD) {
            let block = new CraftyBlock(blockInfo);
            block.position.set(BLOCK_LIBRARY_MARGIN.left, height);
            this.addChild(block);
            height += block.height + BLOCK_LIBRARY_MARGIN.height;
        }
        console.log("DEBUG::: library loaded!!");
    }
}
