import PIXI from 'pixi.js';
import CraftyBlock from '../CraftyBlock/CraftyBlock.js';
import CraftyBlockSpec from '../CraftyBlock/CraftyBlockSpec.js';
import SidebarBackground from './SidebarBackground.js';
import * as PASTEL_FUNC_LIBRARY from '../../functions/functions.js';


//  sidebar-style
//  TODO:: Create separate constant file
const BLOCK_LIBRARY_MARGIN = {left: 30, top: 140, height: 10};

/**
 * Sidebar container that holds built-in functions
 *
 * @exports Sidebar
 * @extends PIXI.Container
 */
export default class Sidebar extends PIXI.Container {
    constructor() {
        super();
        console.log("DEBUG::: loading library...");
        this.blockInfos = [];
        this.maxY = BLOCK_LIBRARY_MARGIN.top;

        //  Add background
        let bg = new SidebarBackground();
        this.bg = bg;
        this.addChild(bg);

        //  Add library functions
        this._addLibraryFunctions();

        console.log("DEBUG::: library loaded!!");
    }

    containsPosition(position) {
        return this.bg.getBounds().contains(position.x,position.y);
    }

    addFunction(blockInfo) {
        this.blockInfos.push(blockInfo);
        let block = new CraftyBlock(blockInfo);
        block.position.set(BLOCK_LIBRARY_MARGIN.left, this.maxY);
        this.addChild(block);
        this.maxY += block.height + BLOCK_LIBRARY_MARGIN.height;
    }

    removeFunction(blockInfo) {
    }

    _addLibraryFunctions() {
        let blockInfos = [];

        //  Create blockInfo of Standard library functions
        for (let functionInfo of PASTEL_FUNC_LIBRARY.STANDARD) {
            const blockInfo = new CraftyBlockSpec(functionInfo.name, CraftyBlock.FUNCTION, functionInfo.parameters, "standard", functionInfo.docstring);
            blockInfos.push(blockInfo);
        }

        //  Create blockInfo of Math library functions
        for (let functionInfo of PASTEL_FUNC_LIBRARY.MATH) {
            const blockInfo = new CraftyBlockSpec(functionInfo.name, CraftyBlock.FUNCTION, functionInfo.parameters, "math", functionInfo.docstring);
            blockInfos.push(blockInfo);
        }

        //  Create and place Crafty blocks from blockInfos
        for (let blockInfo of blockInfos) {
            this.addFunction(blockInfo);
        }
    }
}
