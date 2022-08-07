function Dialog(map, tiles) {
  this.nbTotalTilesX = 20;
  this.tileSize = 16;

  this.data = tiles.data;
  this.artifacts = map.rings;

  this.x = 1;
  this.y = 1;
  this.w = 18;
  this.h = 10;
  this.yOffset = 0;

  this.text = { x: 36, y: 36 + 7, h: 6 * 11, w: 31 * 8, lines: [], remaining: [] };
  this.continue = { x: 16 * this.tileSize + 8, y: 7 * this.tileSize - 2 };
  this.ring = { x: 17 * this.tileSize, y: 6 * this.tileSize };

  this.visible = false;
  this.printNext = false;
  this.isMenu = false;

  this.delay = 70;
  this.waiting = null;
}

Dialog.prototype.hasRing = function() {
  return this.artifacts[3581] === 284;
}

Dialog.prototype.draw = function(context, image, text) {

  if (this.printNext && !this.text.remaining.length) {
    this.visible = false;
    this.text.text = null;
    window.dispatchEvent(new Event("dialogend"));
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
        flip.y * ((y - (flip.y - 1) / 2) * this.tileSize) + this.yOffset,
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
  const textWrapper = isRerender
    ? [...this.text.lines, ...this.text.remaining]
    : (
      this.printNext
        ? this.text.remaining
        : text.split(" ")
    );

  const processedLines = this.printNext ? 0 : this.text.lines.length;
  this.text.lines = [];

  // reset text.remaining
  // if (this.printNext) this.text.remaining = [];

  // wrap words
  for (var y = 0; y < this.text.h && textWrapper.length; y += 11) {
    let line = processedLines > this.text.lines.length ? textWrapper.shift() : "";

    if (!this.waiting && textWrapper.length && line !== "\n"
      && context.measureText(`${line} ${textWrapper[0]}`)?.width < this.text.w) {
      // increase line size by adding words to it

      this.waiting = window.setTimeout(() => { this.waiting = null }, this.delay);
      const word = textWrapper.shift();
      if (word === "\n") {
        line += "                                                     "; // make it too big
      } else {
        line = `${line} ${word}`;
      }
    }

    if (line.length) this.text.lines.push(line);
    context.fillText(line, this.text.x, this.text.y + this.yOffset + y);
  }

  this.text.remaining = textWrapper;

  context.textAlign = "right";
  context.fillText(this.text.remaining.length ? "... Pular" : "Pular", this.continue.x, this.continue.y + this.yOffset);
  context.restore();

  // draw ring
  if (this.hasRing())
    rings.drawRing(context, this.ring.x, this.ring.y + this.yOffset);
};

Dialog.prototype.print = function(context, image) {
  if (this.visible && this.newText) this.draw(context, image, this.newText);
  this.printNext = false;
}

Dialog.prototype.next = function() {
  if (this.text.lines.length === 6 || this.text.remaining.length === 0)
    this.printNext = true;
}

Dialog.prototype.setText = function(text, bottom = false) {
  this.newText = text;
  this.text.lines = [];
  this.visible = true;
  this.yOffset = bottom ? 6 : 0;
  this.yOffset *= this.tileSize;
  this.delay = 70;
}
