//  built-in blockInfos
let IF_BLOCKINFO = new BlockInfo("if", blockType.function, parameters = ["condition", "true-body", "false-body"], library = "standard")
let ADD_BLOCKINFO = new BlockInfo("+", blockType.function, parameters = ["a", "b"], library = "math")
let EQUALS_BLOCKINFO = new BlockInfo("=", blockType.function, parameters = ["a", "b"], library = "math")

//  block libraries
let BLOCK_LIB_STANDARD = [IF_BLOCKINFO, ADD_BLOCKINFO, EQUALS_BLOCKINFO];

BLOCK_LIBRARY_MARGIN = {left: 30, top: 20, height: 10};

function initializeBlockLibrary(container) {
    console.log("DEBUG::: loading library...");
    var height = BLOCK_LIBRARY_MARGIN.top;
    for (let blockInfo of BLOCK_LIB_STANDARD) {
        let block = new Block(blockInfo);
        block.position.set(BLOCK_LIBRARY_MARGIN.left, height);
        container.addChild(block);
        height += block.height + BLOCK_LIBRARY_MARGIN.height;
    }
    console.log("DEBUG::: library loaded!!");
}
