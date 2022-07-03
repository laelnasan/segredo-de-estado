function Ring() {

  // Position de l'animation courante parmi les frames
  this.currentAnimationFrame = 0;

  // Taille en pixels d'une frame d'animation
  this.animationFrameWidth = 32;

  this.totalFrames = 16;

  // Sert à controler la boucle d'animation
  this.animationLoop;

  this.animate();
}


Ring.prototype.drawRing = function(context, x, y) {
  context.save();
  context.filter = "grayscale(1)";
  context.drawImage(resources.images['ring'], this.currentAnimationFrame * this.animationFrameWidth, 0, 16, 16, x, y, 16, 16);
  context.restore();
};

Ring.prototype.animate = function() {

  this.currentAnimationFrame += 1;
  if (this.currentAnimationFrame == this.totalFrames) {
    this.currentAnimationFrame = 0;
  }

  this.animationLoop = setTimeout(function() {
    this.animate();
  }.bind(this), 100);
};
