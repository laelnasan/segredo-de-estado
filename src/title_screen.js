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
    this.pressToStart = true;
  }

  start() {
    this.pressToStart = false;
  }

  paint(context, timestamp) {
    context.save();
    if (animation) context.filter = `blur(${Math.min((animation >> 5), 8)}px)`
    for (var i = 0; i < this.backgrounds.length; i++) {

      var offset = this.scrolledValue * this.backgrounds[i].scrollValue % this.imageWidth;
      context.drawImage(this.backgrounds[i].background,
        offset, this.backgrounds[i].y);

      if (this.backgrounds[i].scrollValue > 0) {

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
    context.fillStyle = "#FFF0F0"

    // define renderingSequence
    const renderingSequence = [];

    if (this.pressToStart) {
      renderingSequence.push(() => {
        // console.log("press key");
        context.font = "15px sega";
        context.fillText("Press any key to Start...", 160, 110);
        rose.draw(context)
      });
    } else {
      animation++;
      renderingSequence.push(() => {
        // console.log("logo");
        context.drawImage(resources.images['title_sonic'], 25, animation < 350 ? animation - 350 : 0);
        context.filter = "";
      });

      if (animation > 380) {
        renderingSequence.push(() => {
          // console.log("bubu");
          context.font = "40px sega";
          context.fillStyle = "#ff7070"
          context.fillText("Bubu", 160, 165);
        });

        if (animation < 400) {
          renderingSequence.unshift(() => { context.filter = "brightness(1.5)"; });
        } else {
          renderingSequence.push(() => {
            // console.log("edition");
            context.font = "20px sega";
            context.fillStyle = "#FFf0f0"
            context.fillText("Edition", 160, 182);
          })
          if (animation > 415) {
            renderingSequence.push(() => {
              // console.log("edition");
              context.font = "8px sega";
              context.fillStyle = "#FFf0f0"
              context.fillText("(c) 2013", 160, 210);
            })

          }
        }
      }
    }

    // render
    renderingSequence.forEach(render => render());

    context.restore();

    this.scrolledValue--;
  }
}


