let animation = 0;
class TitleScreen {
  constructor() {

    this.imageWidth = 320;
    this.imageHeight = 240;
    this.backgrounds = [];

    this.backgrounds[0] = {
      background: resources.images['title_bg'],
      scrollValue: 0.1,
      y: 0
    };

    this.scrolledValue = 0;
  }
  paint(context) {

    context.save();
    if (animation) context.filter = `blur(${Math.min((animation >> 5), 8)}px)`
    for (var i = 0; i < this.backgrounds.length; i++) {

      // Décallage de chaque image, le modulo permet de boucler quand on a scrollé la taille du canvas
      var offset = this.scrolledValue * this.backgrounds[i].scrollValue % this.imageWidth;
      context.drawImage(this.backgrounds[i].background,
        offset, this.backgrounds[i].y);

      // Pour les calques qui bougent
      if (this.backgrounds[i].scrollValue > 0) {

        // Si on n'a pas fini un cycle total, affiche une image à côté
        if (offset > 0) {
          context.drawImage(this.backgrounds[i].background,
            offset - this.imageWidth, this.backgrounds[i].y);
        } else if (offset < 0) {
          context.drawImage(this.backgrounds[i].background,
            offset + this.imageWidth, this.backgrounds[i].y);
        }
      }
    }
    context.restore();
    context.save();

    context.shadowColor = "black";
    context.shadowOffsetX = 4 * scale;
    context.shadowOffsetY = 4 * scale;
    context.textAlign = "center";
    context.lineWidth = 1.5;
    context.fillStyle = "#F7FFFF"
    if (first_input) {
      context.font = "15px sega";
      context.fillText("Press any key to Start...", 160, 110);
    } else {
      animation++;
      if (animation > 380) {
        context.font = "40px sega";
        context.fillText("Bubu", 160, 197);
        if (animation < 400) {
          context.filter = "brightness(1.5)";
        } else {
          context.font = "20px sega";
          context.fillText("Edition", 160, 214);
        }
      }
      context.drawImage(resources.images['title_sonic'], 25, animation < 350 ? animation - 330 : 20);
    }
    context.restore();

    this.scrolledValue--;
  }
}


