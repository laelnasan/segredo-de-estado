window.requestAnimationFrame = (function() {
  return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    function(callback) {
      window.setTimeout(callback, 1000 / 60);
    }
})();

var titleScreen;
var backgrounds;
var level;
var sonic;
var rose;
var physics;
var gamepad;
var rings;
var ring;
var dialog;

var sounds = [
  { title: 'stage', url: 'resources/audio/emerald-hill.mp3' },
  { title: 'stage2', url: 'resources/audio/emerald-hill3.mp3' },
  { title: 'chords', url: 'resources/audio/slowed-chords.mp3' },
  { title: 'jump', url: 'resources/audio/jump.wav' },
  { title: 'loop', url: 'resources/audio/loop.mp3' },
  { title: 'stop', url: 'resources/audio/stop.wav' },
  { title: 'ring', url: 'resources/audio/ring.wav' },
  { title: 'title', url: 'resources/audio/title-screen.mp3' },
  { title: 'ending', url: 'resources/audio/ending.mp3' },
  { title: 'trueending', url: 'resources/audio/trueending.mp3' },
];
var audio = new Audio(sounds);

var images = [
  { title: 'title_bg', url: 'resources/image/title_bg.png' },
  { title: 'title_sonic', url: 'resources/image/title_sonic.png' },
  { title: 'bg_mer', url: 'resources/image/mer.jpg' },
  { title: 'bg_clouds1', url: 'resources/image/bn.png' },
  { title: 'bg_clouds2', url: 'resources/image/mn.png' },
  { title: 'tileset', url: 'resources/image/emeraldhillsc.png' },
  { title: 'sonicSprites', url: 'resources/image/sprites-sonic.png' },
  { title: 'roseSprites', url: 'resources/image/sprites-rose.png' },
  { title: 'ring', url: 'resources/image/ring-no-bleed.png' }
];
var resources = new Resources(images);

var scale = 1;
var canvas = document.getElementById('game');
var context2d = canvas.getContext('2d');

function resizeScreen() {
  // console.log(window.innerWidth, window.innerHeight, window.outerWidth, window.outerHeight)
  let width = window.innerWidth / 320;
  let height = window.innerHeight / 240;
  scale = width < height ? width : height;
  const granularity = 1;
  scale = Math.floor(scale * granularity) / granularity;
  canvas.width = (320 * scale) | 0;
  canvas.height = (240 * scale) | 0;
  canvas.style = `padding-top: ${(window.innerHeight - canvas.height) >> 2}px`
  context2d = canvas.getContext('2d');
  context2d.scale(scale, scale);
  context2d.mozImageSmoothingEnabled = false;  // firefox
  context2d.webkitImageSmoothingEnabled = false;  // webkit
  context2d.imageSmoothingEnabled = false;
}

var rafHandler;

var A = false;
var down = false;
var left = false;
var right = false;
var last_side_was_left = false;
var joy_jump = false;
var control_block = false;
var foreground = [];

const handleKeydown = (e) => {
  if (e.code === "Space") A = true;
  if (e.code === "ArrowDown") down = true;
  if (e.code === "ArrowLeft") left = true;
  if (e.code === "ArrowRight") right = true;
};

const handleKeyup = (e) => {
  if (e.code === "Space") A = false;
  if (e.code === "ArrowDown") down = false;
  if (e.code === "ArrowLeft") { left = false; last_side_was_left = true; }
  if (e.code === "ArrowRight") { right = false; last_side_was_left = false; }
};

function interactToStart() {
  console.log("interaction.")
  // launchTitle();
  let start = true;
  const resize = () => {
    window.setTimeout(resizeScreen, 500);
    if (start) launchTitle();
    start = false;
  }
  document.addEventListener("fullscreenchange", resize);
  document.addEventListener("webkitfullscreenchange", resize);
  document.addEventListener("mozfullscreenchange", resize);
  const el = document.documentElement;
  const rfs = el.requestFullScreen
    || el.webkitRequestFullScreen
    || el.mozRequestFullScreen;
  rfs.call(el);

  window.removeEventListener("touchend", interactToStart);
  window.removeEventListener("keydown", interactToStart);

  window.addEventListener("keydown", handleKeydown);
  window.addEventListener("keyup", handleKeyup);
}

// joystick
const joy = new JoyStick("joyDiv", {}, ({ cardinalDirection }) => {
  if (!A && cardinalDirection === "N" && !physics.isInAir(!dialog.yOffset && dialog.visible)) {
    joy_jump = true;
  }
  if (cardinalDirection.match(/W/)) {
    left = true;
    right = false;
    last_side_was_left = true;
  }
  if (cardinalDirection.match(/E/)) {
    right = true;
    left = false;
    last_side_was_left = false;
  }
  if ((left || right) && cardinalDirection.match(/C/)) {
    right = false;
    left = false;
  }
  console.log("loggin joypad");
});

let minimumDelay = null;
function checkInput() {
  joy_jump = joy_jump && !minimumDelay;
  if ((joy_jump || A) && !physics.isInAir(!dialog.yOffset && dialog.visible) && !minimumDelay) {
    if (!control_block) {
      audio.jump();
      physics.jump();
    }
    joy_jump = false;
    dialog.next();
    window.clearTimeout(minimumDelay);
    minimumDelay = window.setTimeout(() => { minimumDelay = null; }, 200);

  } if (!control_block) {
    if (physics.isInAir(!dialog.yOffset && dialog.visible)) {
      if (left) {
        physics.accelerateLeft(true);
      } else if (right) {
        physics.accelerateRight(true);
      }

    } else if (!(left || right)) {
      physics.applyFriction();

    } else if (left) {
      if (physics.shouldBrakeLeft()) {
        audio.stop();
        sonic.startStopRight();
        physics.decelerateWhenRunningRight();
      } else if (physics.shouldDecelerateLeft()) {
        physics.decelerateWhenRunningRight();
      } else {
        physics.accelerateLeft(false);
      }
    } else if (right) {
      if (physics.shouldBrakeRight()) {
        audio.stop();
        sonic.startStopLeft();
        physics.decelerateWhenRunningLeft();
      } else if (physics.shouldDecelerateRight()) {
        physics.decelerateWhenRunningLeft();
      } else {
        physics.accelerateRight(false);
      }
    }
  }
}


function launchTitle() {
  titleScreen.start();
  audio.stageTitle(startGame);
}

function paintTitle(timestamp) {
  titleScreen.paint(context2d, timestamp ?? 0);
  rafHandler = window.requestAnimationFrame(paintTitle);
}

function startGame() {
  console.log('start game');
  window.cancelAnimationFrame(rafHandler);

  backgrounds = new Background();
  physics = new Physics();
  level = new Level(map);
  sonic = new Sonic();
  rings = new Rings();
  ring = new Ring();
  dialog = new Dialog(map, dialog_tiles);

  paintGame();
  audio.stageBgm();


  // first dialog
  window.setTimeout(() => {
    physics.speed = 0;
    control_block = true;
    dialog.setText("\n \n Puxa vida, bubu! o dr eggman me deu uma paulada nas ideias e roubou todos os meus aneis de poder! \n \n \n \n \n" +
      "ainda bem que ele deixou cair alguns pelo caminho... \n \n \n \n " +
      "preciso coletar todos os aneis antes que ele tenha tempo de voltar! \n \n \n \n \n \n \n \n \n \n " +
      "<<< --------- Objetivo: --------- >>> \n - coletar todos os aneis.");
  }, 2000);

  // continuation dialog
  let continueDialogText = "\n mais nada... \n acho que \n cheguei no \n meu limite... \n \n \n \n \n ou talvez...";

  window.addEventListener("continuationdialog", () => {
    if (!dialog.visible && physics.speed === 0 && Math.abs(physics.ySpeed) < 0.6) {
      window.removeEventListener("ring", mountainclimber);
      dialog.setText(continueDialogText);
      if (continueDialogText.length > 31) continueDialogText = "\n \n \n ou talvez... \n \n \n";
      else continueDialogText = "\n \n \n ou talvez... \n \n               ";
    }
  });

  const theend = () => {
    audio.ending();
    backgrounds.ending = true;
    control_block = true;
    physics.speed = 1.5;
    physics.applyFriction = () => { };
    // just in case
    window.removeEventListener("mermaid1", mermaid1);

    window.setTimeout(() => { physics.jump(); audio.jump(); physics.speed = 0.7; }, 76500)
    window.setTimeout(() => {
      dialog.setText("\n \n \n bubu... \n \n \n \n \n \n tenho uma pergunta para te fazer...");
      window.addEventListener("dialogend", () => { level.fadeout(); control_block = true; }, { once: true });
    }, 112000);
    /* ending animation */
  };

  let trueending = theend;

  // speedrun
  const speedrunTextBase = "pode ter sido sorte... mas acho que tem gente tentando encontrar algo a mais nesse jogo... digo,  nessa aventura haha \n pena que foi tarde demais...";
  let speedrunText = speedrunTextBase;
  window.addEventListener("speedrun", () => {
    if (!dialog.visible && physics.speed < 0.05 && Math.abs(physics.ySpeed) < 0.6) {
      dialog.setText(speedrunText);
      if (speedrunText.length < 120) speedrunText += "                                                   ";
      else speedrunText = speedrunTextBase;
    } else if (dialog.visible && dialog.text.text !== speedrunText) {
      trueending = () => {
        audio.trueending();
        audio.jump();
        control_block = true;
        physics.speed = 1.5;
        physics.jump();
        physics.applyFriction = () => { };
        // just in case
        window.removeEventListener("mermaid1", mermaid1);
        window.setTimeout(() => { physics.jump(); audio.jump(); physics.speed = 0.7; }, 76500)
        window.setTimeout(() => { rose = new Rose(); rose.countdown = 32 }, 100000)
        window.addEventListener("hug", () => {
          rose.animate("huging");
          dialog.setText("\n \n \n infinito...");
          level.trueending = true;
          window.addEventListener("dialogend", () => { level.fadeout(); control_block = true; }, { once: true });
        }, { once: true });
      };
    }
  });

  // hint
  let hintBase = "Olhando mais de perto consigo ver aneis sendo levados pela correnteza! melhor eu correr antes que a agua leve tudo pra longe. " +
    "\n \n \n e pensar que eu corri contra a correnteza o tempo todo... quem sabe pra que buracos a agua levou esses aneis???";
  let hintText = hintBase;
  window.addEventListener("cataratahint", () => {
    if (!dialog.visible && physics.speed < 0.05 && Math.abs(physics.ySpeed) < 0.6) {
      dialog.setText(hintText);
      physics.speed = 0;
      if (hintText[0] === " ") hintText = hintBase;
      else hintText = " " + hintText;
    }
  });

  // warp
  const warp = () => {
    physics.x %= level.endLevel;
    physics.x += level.endLevel;
    physics.x %= level.endLevel;
    dialog.setText("\n \n \n Dei a volta ao mundo!!! de novo...");
  }

  const theringText = "\n \n ... ... ... ... Esse anel... parece diferente dos outros... \n \n \n \n \n " +
    " um tanto quanto etereo... \n \n \n \n \n \n " +
    " por que passo por ele sem conseguir segurar??? \n \n \n \n" +
    " ... \n \n \n \n \n \n \n \n e por que sinto esse aperto no peito?...";
  const thefirsttimering = () => {
    if (physics.speed < 0.05 && Math.abs(physics.ySpeed) < 0.6) {
      window.addEventListener("audiofadeout", () => {
        audio.buffers.stage2?.stop();
        audio.buffers.stage?.stop();
      }, { once: true });

      audio.fadeout();
      audio.chords();
      physics.speed = 0;
      dialog.setText(theringText, 2);
      dialog.delay = 200;
      control_block = true;
      window.removeEventListener("thering", thefirsttimering);
      hintBase = "\n \n Tem algo desenhado por tras das cataratas... \n \n \n \n " +
        "\n \n parecem dizer como passar a barreira do mundo... o que?!! \n \n \n \n \n " +
        "\n deve ser uma brincadeira de maluco... \n \n pular por cima de tudo... haha loucura!"
      hintText = hintBase;
    }
  }

  const mermaid1 = () => {
    if (!dialog.visible && physics.speed < 0.05 && Math.abs(physics.ySpeed) < 0.6) {
      dialog.setText("\n agora que eu vi! tem mais uma caverna a esquerda aqui, mas essa parece ser mais complicada pra conseguir entrar...");
    }
  }

  const mermaid2 = () => {
    if (!dialog.visible && physics.speed < 0.05 && Math.abs(physics.ySpeed) < 0.6) {
      dialog.setText("\n \n \n ... \n \n \n \n \n \n tem uma caverna a esquerda...");
    }
  }


  // ============= only once ===============

  // around the world event
  const aroundtheworld = () => {
    for (let i = 0; i < 17; i++) {
      level.collisions[i * level.nbTotalTilesX] = level.collisions[i * level.nbTotalTilesX + 1];
      level.data[i * level.nbTotalTilesX] = level.data[i * level.nbTotalTilesX + 1];
      level.data[i * level.nbTotalTilesX + 1] = level.data[i * level.nbTotalTilesX + 2];
      level.foreground[i * level.nbTotalTilesX] = level.foreground[i * level.nbTotalTilesX + 1];
    }
    physics.x %= level.endLevel;
    physics.x += level.endLevel;
    physics.x %= level.endLevel;
    physics.speed *= 0.0001;
    dialog.setText("\n fui ao fim do mundo e voltei... a barreira espacial foi superada e mesmo " +
      " que eu precise dar a volta ao mundo agora eu sei que vou conseguir!!!");
    hintBase = "\n \n Mas quem diria... as vezes as loucuras podem dar certo! hahaha \n \n \n \n \n " +
      "hmmm... \n \n \n \n \n \n " +
      "parece que uma caverna se abriu mais a frente... \n \n \n \n " +
      "talvez seja melhor investigar pelo outro lado para eu poder ver onde vai dar!";
    hintText = hintBase;
    window.addEventListener("outborder", warp);
  };

  const tricky = () => {
    window.removeEventListener("mermaid1", mermaid1);
    dialog.setText("\n \n Caramba!!! Esses estavam escondidos mesmo!!!!");
    // advancement!!
  };

  const morsecode = () => {
    dialog.setText("\n \n Sabia que eu devia ter aprendido codigo morse...");
    hintBase = "\n \n olha! mais um daqueles desenhos... \n \n \n \n \n \n " +
      "digo... dessa vez esta escrito mesmo: \n \n \n \ntodo anel que aparece pode ser pego...";
    hintText = hintBase;
    // advancement!!
  };

  const cataratacave = () => {
    window.removeEventListener("mermaid2", mermaid2);
    control_block = true;
    dialog.setText("\n \n Olha onde vieram parar os aneis levados pela correnteza... \n \n \n \n \n " +
      "imagino se existem outros lugares onde as moedas tenham caido na agua...");
    // advancement!!
  };

  const dothebridge = () => {
    if (Math.abs(physics.speed) < 6 || Math.abs(physics.ySpeed) > 0.8) return;

    dialog.setText("\n \n isso me deixa enjoado :(");
    // advancement!!
  };

  const dotheloop = () => {
    dialog.setText("\n \n Olha o que eu sei fazer!");
    // advancement!!
  };

  const outborder = () => {
    physics.speed = 0;
    control_block = true;
    dialog.setText("\n Espera ai... era pra o mundo ter acabado! ou existem mais coisas para esse lado? \n \n \n \n \n " +
      "complicado andar sem enxergar nada... mas vamos seguir em frente!");
    window.addEventListener("audiofadeout", () => {
      audio.buffers.stage?.stop();
    }, { once: true });
    audio.fadeout();
    audio.stage2Bgm();
    // advancement!!
  };

  const thebreaking = () => {
    physics.speed = 0;
    control_block = true;
    window.addEventListener("audiofadeout", () => {
      audio.buffers.stage?.stop();
      audio.buffers.stage2?.stop();
    }, { once: true });
    audio.fadeout();
    dialog.setText("... \n \n \n \n \n \n \n ... \n \n \n \n \n \n Alguma coisa... \n \n \n \n \n \n \n" +
      " estou esquecendo de alguma coisa importante... \n \n \n \n \n \n ... \n \n \n \n \n aquele anel...");
    hintBase = "\n \n Tem algo desenhado por tras das cataratas... \n \n \n \n " +
      "\n \n parecem dizer como passar a barreira do mundo... o que?!! \n \n \n \n \n " +
      "\n deve ser uma brincadeira de maluco... \n \n pular por cima de tudo... haha loucura!"
    hintText = hintBase;
    window.removeEventListener("thering", thefirsttimering);
    // TODO: flash back
  };

  const getthering = ({ detail: { isTrue } }) => {
    window.addEventListener("audiofadeout", () => {
      audio.buffers.stage?.stop();
      audio.buffers.stage2?.stop();
    }, { once: true });
    audio.fadeout();
    physics.speed = 0;
    control_block = true;
    dialog.setText("\n \n agora eu me lembro... \n \n \n \n \n \n foi por causa disso que eu corri todo esse tempo... \n \n \n \n \n " +
      "tantas batalhas, \n tantas feridas... \n \n \n \n \n mas finalmente...", true);
    window.addEventListener("dialogend", isTrue ? trueending : theend, { once: true });
  };

  const mountainclimber = () => {
    physics.speed = 0;
    control_block = true;
    dialog.setText("\n \n \n Acho que recolhi tudo que eu podia... \n \n \n \n " +
      "Preciso ir para um ponto mais alto para ver se enxergo algo que deixei passar... \n \n \n \n \n \n " +
      "Alguma coisa... \n \n \n \n \n \n \n \n \n \n " +
      "<<< ------ Novo Objetivo: ------ >>> \n - Subir em um lugar alto.");
  }

  window.addEventListener("aroundtheworld", aroundtheworld, { once: true });
  window.addEventListener("tricky", tricky, { once: true });
  window.addEventListener("morsecode", morsecode, { once: true });
  window.addEventListener("cataratacave", cataratacave, { once: true });
  window.addEventListener("dothebridge", dothebridge, { once: true });
  window.addEventListener("dotheloop", dotheloop, { once: true });
  window.addEventListener("outborder", outborder, { once: true });
  window.addEventListener("mountainclimber", mountainclimber, { once: true });
  window.addEventListener("getthering", getthering, { once: true });
  window.addEventListener("mermaid1", mermaid1);
  window.addEventListener("mermaid2", mermaid2);
  window.addEventListener("dialogend", () => { control_block = false; });
  window.addEventListener("thebreaking", thebreaking, { once: true });
  window.addEventListener("thering", thefirsttimering);
}

let lastTimestamp = 90000000;
const UNITS = 60 / 1000;
function physicsLoop(timestamp) {

  const stepSize = (timestamp - lastTimestamp) * UNITS - 0.4;
  lastTimestamp = timestamp;
  for (let i = 0; stepSize > 0 && i < stepSize; i++) {
    checkInput();
    physics.applyPhysics(!dialog.yOffset && dialog.visible);
    sonic.animate(!dialog.yOffset && dialog.visible);

    if (level.checkAABBRing(physics.x, physics.y, dialog.visible)) {
      audio.ring();
    }
  }
}

function paintGame(timestamp) {
  // find out the step for the physics sim
  audio.updateFilter(timestamp, physics.y);
  backgrounds.paint(context2d, physics.x);
  level.draw(context2d, timestamp, resources.images['tileset'], physics.x, physics.y, dialog.visible);
  dialog.print(context2d, resources.images['tileset']);
  sonic.draw(context2d, physics.x, physics.y);
  if (rose) rose.draw(context2d, physics.x - 7966 + 8 * rose.countdown);
  foreground.forEach(({ scale, draw }) => {
    context2d.save();
    scale();
    draw();
    context2d.restore();
  });
  foreground = [];

  physicsLoop(timestamp);

  window.requestAnimationFrame(paintGame);
}

audio.load()
  .then(() => resources.load())
  .then(() => {
    titleScreen = new TitleScreen();
    resizeScreen();
    paintTitle();
    window.addEventListener("keydown", interactToStart, { once: true });
    window.addEventListener("touchend", setTimeout.bind(window, () => interactToStart(), 200), { once: true });
  });

