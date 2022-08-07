function Rose() {
  const rect = (x, y, x2, y2, offset) => ({ x: x, y: y, w: x2 - x, h: y2 - y, offset: offset });

  this.frames = {
    runing: {
      offset: 10,
      numberOfFrames: 4,
      positions: [
        rect(35, 40, 60, 75),
        rect(64, 40, 93, 75, 13),
        rect(97, 40, 121, 75),
        rect(127, 40, 152, 75),
      ],
    },
    huging: {
      offset: 12,
      numberOfFrames: 21,
      positions: [
        rect(157, 40, 182, 75),
        rect(183, 40, 208, 75),
        rect(157, 40, 182, 75),
        rect(183, 40, 208, 75),
        rect(157, 40, 182, 75),
        rect(183, 40, 208, 75),
        rect(210, 40, 235, 75),
        rect(210, 40, 235, 75),
        rect(210, 40, 235, 75),
        rect(210, 40, 235, 75),
        rect(210, 40, 235, 75),
        rect(210, 40, 235, 75),
        rect(210, 40, 235, 75),
        rect(210, 40, 235, 75),
        rect(210, 40, 235, 75),
        rect(210, 40, 235, 75),
        rect(210, 40, 235, 75),
        rect(210, 40, 235, 75),
        rect(210, 40, 235, 75),
        rect(210, 40, 235, 75),
        rect(183, 40, 208, 75),
      ],
    },
    heart: {
      offset: 6,
      numberOfFrames: 7,
      positions: [
        rect(31, 5, 41, 20),
        rect(19, 8, 31, 20),
        rect(6, 11, 19, 20),
        rect(6, 9, 6, 9),
        rect(6, 9, 6, 9),
        rect(6, 9, 6, 9),
        rect(6, 9, 6, 9),
      ],
    }
  }

  this.animate("runing");
  this.countdown = 0;
}

Rose.prototype.animate = function(animation) {
  if (this.frames[animation]) {
    window.clearInterval(this.animationLoop);
    this.currentAnimationFrame = 0;
    this.currentAnimation = animation;
    this.animationLoop = window.setInterval(() => {
      this.currentAnimationFrame = (this.currentAnimationFrame + 1) % this.frames[animation].numberOfFrames;
      if (this.countdown) {
        this.countdown--;
        if (!this.countdown) window.dispatchEvent(new Event("hug"));
      }
    }, 250)
  }
}

Rose.prototype.draw = function(context, xOffset = 0) {
  const pos = this.frames[this.currentAnimation].positions[this.currentAnimationFrame];
  const offset = this.frames[this.currentAnimation].offset;
  context.drawImage(
    resources.images['roseSprites'],
    pos.x, pos.y,
    pos.w, pos.h,
    150 - (pos.offset ?? offset) - xOffset, 166, pos.w, pos.h
  );
};
