function Block() {

  this.type;
  this.data;

  this.parent;
  this.children = [];

  this.lines = [];

  this.graphics = new PIXI.Graphics();

}

/**
 *
 */
Block.prototype.update = function () {

  this.render();

  for (let i = 0; this.children.length; i++) {

    let child = this.children[i];

    child.render();

    // 위치 설정
    child.x = this.x + MARGIN_X;
    child.y = this.y + this.children[i - 1].y + MARGIN_Y;
  }
}

Block.prototype.render = function () {
  this.graphics.textField.text = this.data;
  this.graphics.drawRect(0, 0, 100, 100 + textField.width)
}

let block = new Block();
block.parent
