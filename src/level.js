function Level(map) {
  this.nbTotalTilesX = 512;
  this.nbTotalTilesY = 18;

  this.tileSize = 16;

  this.tilesDisplayX = 20;
  this.tilesDisplayY = 15;

  this.data = map.data;
  this.collisions = map.collisions;
  this.artifacts = map.rings;
  this.foreground = map.foreground;

  this.halfScreen = this.tilesDisplayX / 2 * this.tileSize;
  this.endLevel = this.nbTotalTilesX * this.tileSize;

  this.watterRun = 1;
  this.collectedRings = 0; // adjusting variable
  this.maxRings = 278 + this.collectedRings;
  this.continueRings = 190 + this.collectedRings;
  this.mermaid1Rings = 130 + this.collectedRings;
  this.mermaid2Rings = 100 + this.collectedRings;
}

Level.prototype.isAtEndOfLevel = function(x) {
  return x > this.endLevel - this.halfScreen;
};

Level.prototype.isAtMiddleOfLevel = function(x) {
  return x > this.halfScreen;
};

Level.prototype.draw = function(context, image, posXCharacter, posYCharacter, isDialog) {

  var startX = 0;

  if (this.isAtEndOfLevel(posXCharacter)) {
    startX = this.endLevel - this.halfScreen * 2;
  } else if (this.isAtMiddleOfLevel(posXCharacter)) {
    startX = posXCharacter - this.halfScreen;
  }

  var fromTileX = Math.floor(startX / this.tileSize);
  var fromTileY = 0;

  var remainingX = Math.floor(startX % this.tileSize);
  var remainingY = 0;

  this.watterRun += 1;
  this.watterRun &= 0x0F;

  for (var y = fromTileY, newY = 0; y < fromTileY + this.tilesDisplayY + (remainingY > 0 ? 1 : 0); y++, newY++) {
    for (var x = fromTileX, newX = 0; x < fromTileX + this.tilesDisplayX + (remainingX > 0 ? 1 : 0); x++, newX++) {

      const tilePositionInData = (y * this.nbTotalTilesX) + x;
      const tileNum = this.data[tilePositionInData] & 0x0FFF;
      if (this.data[tilePositionInData] === -1 && this.artifacts[tilePositionInData] === -1) continue;

      if (!this.watterRun && tileNum > 214 && tileNum < 222) {
        if (tileNum > 215 && tileNum < 219) { this.data[tilePositionInData] += 1; }
        else if (tileNum === 219) { this.data[tilePositionInData] = 216; }
        else this.data[tilePositionInData] ^= (1 << 31);
      }

      var tilePosX = this.getTilePositionX(this.data[tilePositionInData]);
      var tilePosY = this.getTilePositionY(this.data[tilePositionInData]);

      if (tilePosY < 0) {
        tilePosY = tilePosX;
      }

      const flip = {
        x: 1 - ((this.data[tilePositionInData] >> 30) & 0x2),
        y: 1 - ((this.data[tilePositionInData] >> 29) & 0x2),
      };

      // bind arguments to a new function
      const scale = context.scale.bind(context, flip.x, flip.y);
      const draw = context.drawImage.bind(context, image,
        (tilePosX * this.tileSize * 2),
        (tilePosY * this.tileSize),
        this.tileSize, this.tileSize,
        flip.x * ((newX - (flip.x - 1) / 2) * this.tileSize - remainingX),
        flip.y * ((newY - (flip.y - 1) / 2) * this.tileSize - remainingY),
        this.tileSize, this.tileSize);

      // test for tile > 100
      if (!isDialog && this.foreground[tilePositionInData] === 179) { // great success
        foreground.push({ scale: scale, draw: draw });
      } else {
        context.save();
        scale();
        draw();
        context.restore();
      }

      if (this.artifacts[tilePositionInData] == 285) { // normal rings
        rings.drawRing(context, newX * this.tileSize - remainingX, newY * this.tileSize - remainingY);
      }
      if (this.artifacts[tilePositionInData] == 266) { // the ring
        ring.drawRing(context, newX * this.tileSize - remainingX, newY * this.tileSize - remainingY);
      }
    }
  }

  if (this.artifacts[0] === 283) rings.drawRing(context, 0, 0);

  let counter = "" + this.collectedRings;
  while (counter.length < 3) counter = "0" + counter;

  foreground.push({
    scale: () => {
      context.textAlign = "left";
      context.fillStyle = "#FFF0F0"
      context.font = "15px sega";

    },
    draw: context.fillText.bind(context, counter, 20, 14),
  })
};

Level.prototype.getTilePositionX = function(tileNumber) {
  const id = tileNumber & 0x00000FFF;
  return Math.floor(id % this.tilesDisplayX);
};

Level.prototype.getTilePositionY = function(tileNumber) {
  const id = tileNumber & 0x00000FFF;
  return Math.floor(id / this.tilesDisplayX);
};

Level.prototype.getCollisionData = function(x, y) {
  var tileX = Math.floor(((x % this.endLevel + this.endLevel) % this.endLevel) / this.tileSize);
  var tileY = Math.floor(y / this.tileSize);

  var tilePositionInData = (tileY * this.nbTotalTilesX) + tileX;
  switch (this.collisions[tilePositionInData]) {
    case 0:
      window.dispatchEvent(new Event('absolutecollision'));
      break;
    case 23:
      window.dispatchEvent(new Event('collision'));
      break;
    case 101:
      window.dispatchEvent(new Event('dialogcollision'));
      break;
    case 62:
      if (this.collectedRings > this.continueRings)
        window.dispatchEvent(new Event('continuationdialog'));
      break;
    case 63:
      if (this.collectedRings < this.continueRings)
        window.dispatchEvent(new Event('speedrun'));
      break;
    case 89:
      if (x < (-0.5 * this.endLevel) || x > (1.5 * this.endLevel))
        window.dispatchEvent(new Event('aroundtheworld'));
      break;
    case 90:
      window.dispatchEvent(new Event('cataratahint'));
      break;
    case 203:
      window.dispatchEvent(new Event('morsecode'));
      break;
    case 215:
      window.dispatchEvent(new Event('tricky'));
      break;
    case 164:
      window.dispatchEvent(new Event('cataratacave'));
      break;
    case 131:
      window.dispatchEvent(new Event('dothebridge'));
      break;
    case 103:
      if (this.collectedRings > this.mermaid1Rings)
        window.dispatchEvent(new Event('mermaid1'));
      break;
    case 213:
      if (this.collectedRings > this.mermaid2Rings)
        window.dispatchEvent(new Event('mermaid2'));
      break;
    case 119:
      window.dispatchEvent(new Event('dotheloop'));
      break;
  }

  return this.collisions[tilePositionInData];
};

Level.prototype.checkAABBRing = function(x, y, isDialog) {

  // AABB (Axis Aligned Bounding Box)
  return this.manageRingCollision(x - 15, y - 25, isDialog) ||
    this.manageRingCollision(x, y - 25, isDialog) ||
    this.manageRingCollision(x + 15, y - 25, isDialog) ||
    this.manageRingCollision(x - 15, y - 5, isDialog) ||
    this.manageRingCollision(x, y - 5, isDialog) ||
    this.manageRingCollision(x + 15, y - 5, isDialog) ||
    this.manageRingCollision(x - 15, y + 15, isDialog) ||
    this.manageRingCollision(x, y + 15, isDialog) ||
    this.manageRingCollision(x + 15, y + 15, isDialog);
};

Level.prototype.manageRingCollision = function(x, y, isDialog) {
  var tileX = Math.floor(x / this.tileSize);
  var tileY = Math.floor(y / this.tileSize);

  var tilePositionInData = (tileY * this.nbTotalTilesX) + tileX;

  if (this.artifacts[tilePositionInData] === 285) { // Collision
    this.artifacts[tilePositionInData] = -1;
    this.collectedRings++;
    window.dispatchEvent(new CustomEvent('ring', { detail: { rings: this.collectedRings } }));
    return true;
  } else if (isDialog && this.artifacts[tilePositionInData] === 284) {
    this.artifacts[tilePositionInData] = -1;
    this.collectedRings++;
    window.dispatchEvent(new Event('dialogring'));
    return true;
  } else if (x < 64 && this.artifacts[tilePositionInData] === 283) {
    this.artifacts[0] = -1;
    this.collectedRings++;
    window.dispatchEvent(new Event('uiring'));
    return true;
  } else if (this.collectedRings > 207 && this.artifacts[tilePositionInData] === 266) { // Collision
    if (this.collectedRings === this.maxRings) {
      this.artifacts[tilePositionInData] = -1;
      window.dispatchEvent(new Event('getthering'));
      return true;
    } else {
      window.dispatchEvent(new Event('thering'));
    }
  }

  return false;
};
