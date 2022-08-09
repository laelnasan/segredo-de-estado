function Background() {

  this.canvasWidth = 512;
  this.backgrounds = [];

  this.backgrounds[0] = {
    background: resources.images['bg_mer'],
    scrollValue: 0,
    y: 0
  };

  this.backgrounds[1] = {
    background: resources.images['bg_clouds1'],
    scrollValue: 0.5,
    y: 95
  };

  this.backgrounds[2] = {
    background: resources.images['bg_clouds2'],
    scrollValue: 0.8,
    y: 20
  };
  this.text = [
    "",
    "Essa é a história do andarilho errante",
    "que, em peregrinação, avistou a princesa.",
    "Os céus arranjaram o encontro na terra,",
    "o tempo, ardiloso, os separou no espaço...",
    "O coração, temeroso, por vezes se cobriu de trevas,",
    "mas tempo não vence o infinito...",
    "",
    "",
  ];

}

Background.prototype.paint = function(context, posXCharacter) {

  var scrolledValue = 0;
  if (level.isAtEndOfLevel(posXCharacter)) {
    scrolledValue = -level.endLevel + level.halfScreen * 2;
  } else if (posXCharacter > level.halfScreen) {
    scrolledValue = -posXCharacter + level.halfScreen;
  }

  for (var i = 0; i < this.backgrounds.length; i++) {

    var offset = scrolledValue * this.backgrounds[i].scrollValue % this.canvasWidth;
    var index = Math.floor(scrolledValue * this.backgrounds[i].scrollValue) >> 8;

    context.drawImage(this.backgrounds[i].background, offset, this.backgrounds[i].y);
    if (i == 2 && this.ending) {

      context.textAlign = "left";
      context.fillStyle = "#FFF0F0";
      context.font = "bold italic 16px verdana";

      context.fillText("                                                                               " +
        this.text[Math.abs(Math.floor((index + 2) / 4))], offset + ((index >> 1) % 2) * this.canvasWidth, 80);
    }

    if (this.backgrounds[i].scrollValue > 0) {
      context.drawImage(this.backgrounds[i].background, offset + this.canvasWidth, this.backgrounds[i].y);
    }
  }
};
