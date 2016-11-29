import PIXI from 'pixi.js';
import CraftyBlock from '../CraftyBlock/CraftyBlock.js';
import CraftyBlockSpec from '../CraftyBlock/CraftyBlockSpec.js';
import SidebarBackground from './SidebarBackground.js';
import * as PASTEL_FUNC from '../../functions/functions.js';


//  sidebar-style
//  TODO:: Create separate constant file
const BLOCK_LIBRARY_MARGIN = {left: 30, top: 20, height: 10};

/**
 * Sidebar container that holds built-in functions
 *
 * @exports Sidebar
 * @extends PIXI.Container
 */
export default class Sidebar extends PIXI.Container {
    constructor() {
        super();
        this.id = "sidebar";
        console.log("DEBUG::: loading library...");
        let bg = new SidebarBackground();
        this.bg = bg;
        this.addChild(bg);
        let blockInfos = [];
        let height = BLOCK_LIBRARY_MARGIN.top;

        //  Create blockInfo of Standard library functions
        for (let functionInfo of PASTEL_FUNC.STANDARD) {
            const blockInfo = new CraftyBlockSpec(functionInfo.name, CraftyBlock.FUNCTION, functionInfo.parameters, "standard", functionInfo.docstring);
            blockInfos.push(blockInfo);
        }

        //  Create blockInfo of Math library functions
        for (let functionInfo of PASTEL_FUNC.MATH) {
            const blockInfo = new CraftyBlockSpec(functionInfo.name, CraftyBlock.FUNCTION, functionInfo.parameters, "math", functionInfo.docstring);
            blockInfos.push(blockInfo);
        }

        //  Create and place Crafty blocks from blockInfos
        for (let blockInfo of blockInfos) {
            let block = new CraftyBlock(blockInfo);
            block.position.set(BLOCK_LIBRARY_MARGIN.left, height);
            this.addChild(block);
            height += block.height + BLOCK_LIBRARY_MARGIN.height;
        }

        console.log("DEBUG::: library loaded!!");
    }

    containsPosition(position) {
        return this.bg.getBounds().contains(position.x,position.y);
    }
}
