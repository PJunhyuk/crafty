(function(){

"use strict";

/*********************************
 * Workspace Class
 * 
 * Crafty 메인 UI 표현 공간
 *
 *********************************/
function Workspace(width, height) {

    // 블록 관리자
    this.blocks = [];

    // 스테이지 생성
    this.stage = new PIXI.Container();
    this.uiLayer = new PIXI.Container();
    this.blocksLayer = new PIXI.Container();

    // 랜더러 생성
    this.renderer = new PIXI.autoDetectRenderer(width, height);
    this.renderer.backgroundColor = 0x333333;

    this.initialize();
    this.animate();
}

Workspace.prototype.initialize = function() {
    stage.addChild(blocksLayer);
    stage.addChild(uiLayer);

    addBlocks(500, 200);
}

Workspace.prototype.animate = function() {
    requestAnimationFrame(this.animate);
    this.renderer.render(this.stage);
}

Workspace.prototype.addBlocks = function(x, y) {
    var block = new Block();
    var blockGraphics = block.getGraphics();

    this.blocksLayer.addChild(blockGraphics);
    this.blocks.push(block);
}

Workspace.prototype.getDOM = function() {
    return this.renderer.view;
}


/*********************************
 * Block Class
 * 
 * Crafty 메인 UI 표현 공간
 *
 *********************************/
function Block() {
    this.graphics = new PIXI.Container();
    this.box = new PIXI.Graphics();
    this.input = new PIXI.Graphics();
    this.output = new PIXI.Graphics();
    this.grip = new PIXI.Graphics();

    this.initialize();
}

Block.prototype.initialize = function() {

    // Initialize box
    this.box.beginFill(0xc29de0);
    this.box.drawRect(0, 0, 140, 260);
    this.box.endFill();
    this.box.x = 0;
    this.box.y = 0;

    // Initialize input
    this.input.beginFill(0xbbe09d);
    this.input.drawRect(0, 0, 100, 100);
    this.input.endFill();
    this.input.position.x = 20;
    this.input.position.y = 20;

    // Initialize output
    this.output.beginFill(0x9ddde0);
    this.output.drawRect(0, 0, 100, 100);
    this.output.endFill();
    this.output.position.x = 20;
    this.output.position.y = 140;

    // Initialize grip
    this.grip.beginFill(0x863dc2);
    this.grip.drawRect(0, 0, 20, 20);
    this.grip.endFill();
    this.grip.position.x = 0;
    this.grip.position.y = 0;

    // Put them together
    this.graphics.addChild(this.box);
    this.graphics.addChild(this.input);
    this.graphics.addChild(this.output);
    this.graphics.addChild(this.grip);

    // Graphics settings
    this.graphics.interactive = true;
    this.graphics.buttonMode = true;
    this.graphics.hitArea = new PIXI.Rectangle(0, 0, 20, 20);
}


Block.prototype.getGraphics = function() {
    return this.graphics;
}


})();