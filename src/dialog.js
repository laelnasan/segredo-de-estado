function Dialog(map, tiles) {
  this.nbTotalTilesX = 20;
  this.tileSize = 16;

  this.data = tiles.data;
  this.artifacts = map.rings;

  this.x = 1;
  this.y = 1;
  this.w = 18;
  this.h = 10;

  this.text = { x: 36, y: 36 + 7, h: 6 * 11, w: 31 * 8 };
  this.continue = { x: 16 * this.tileSize + 8, y: 7 * this.tileSize - 2 };
  this.ring = { x: 17 * this.tileSize, y: 6 * this.tileSize };

  this.visible = false;
  this.printNext = false;
  this.isMenu = false;
}

Dialog.prototype.hasRing = function() {
  return this.artifacts[3581] === 284;
}

Dialog.prototype.draw = function(context, image, text) {

  if (this.printNext && !this.text.remaining) {
    this.visible = false;
    return;
  }

  // draw borders
  for (var y = this.y; y < this.y + this.h; y++) {
    for (var x = this.x; x < this.x + this.w; x++) {

      var tilePositionInData = (y * this.nbTotalTilesX) + x;

      const flip = {
        x: 1 - ((this.data[tilePositionInData] >> 30) & 0x2),
        y: 1 - ((this.data[tilePositionInData] >> 29) & 0x2),
      };

      const tileNumber = this.data[tilePositionInData] & 0x00000FFF;
      var tilePosX = Math.floor(tileNumber % this.nbTotalTilesX);
      var tilePosY = Math.floor(tileNumber / this.nbTotalTilesX);

      context.save();
      context.scale(flip.x, flip.y);
      context.drawImage(image,
        (tilePosX * this.tileSize * 2),
        (tilePosY * this.tileSize),
        this.tileSize, this.tileSize,
        flip.x * ((x - (flip.x - 1) / 2) * this.tileSize),
        flip.y * ((y - (flip.y - 1) / 2) * this.tileSize),
        this.tileSize, this.tileSize);
      context.restore();
    }
  }

  // draw text
  context.save();
  context.textAlign = "left";
  context.fillStyle = "#FFF0F0"
  context.font = "10px sega";

  // test for re-rendering and store calculated lines
  const isRerender = !this.printNext && this.text.text === text;
  this.text.text = text;

  // get lines to print
  const textWrapper = isRerender ? this.text.lines : (this.text.remaining ?? text.split(" "));
  this.text.lines = [];

  // reset text.remaining
  if (this.printNext) this.text.remaining = null;

  // wrap words
  for (var y = 0; y < (this.text.h / 11) && textWrapper.length; y++) {
    let line = textWrapper.shift();

    // increase line size by adding words to it
    while (!isRerender && textWrapper.length && line !== "\n"
      && context.measureText(`${line} ${textWrapper[0]}`)?.width < this.text.w) {
      if (textWrapper[0] === "\n") {
        textWrapper.shift();
        break;
      }
      line = `${line} ${textWrapper.shift()}`;
    }

    this.text.lines.push(line);
    context.fillText(line, this.text.x, this.text.y + y * 11);
  }

  if (textWrapper.length) this.text.remaining = textWrapper;

  context.textAlign = "right";
  context.fillText(this.text.remaining ? "... Pular" : "Pular", this.continue.x, this.continue.y);
  context.restore();

  // draw ring
  if (this.hasRing())
    rings.drawRing(context, this.ring.x, this.ring.y);
};

Dialog.prototype.print = function(context, image) {
  if (this.visible && this.newText) this.draw(context, image, this.newText);
  this.printNext = false;
}

Dialog.prototype.next = function() {
  this.printNext = true;
}

Dialog.prototype.setText = function(text) {
  this.newText = text;
  this.visible = true;
}
