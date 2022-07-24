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
var physics;
var gamepad;
var rings;
var ring;
var dialog;

var sounds = [
  { title: 'stage', url: 'resources/audio/emerald-hill.mp3' },
  { title: 'jump', url: 'resources/audio/jump.wav' },
  { title: 'stop', url: 'resources/audio/stop.wav' },
  { title: 'ring', url: 'resources/audio/ring.wav' },
  { title: 'title', url: 'resources/audio/title-screen.mp3' }
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
  if (!A && cardinalDirection.match(/N/) && !physics.isInAir(dialog.visible)) {
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

function checkInput() {

  if ((joy_jump || A) && !physics.isInAir(dialog.visible)) {
    joy_jump = false;
    audio.jump();
    physics.jump();
    dialog.printNext = true;

  } else if (physics.isInAir(dialog.visible)) {
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


function launchTitle() {
  titleScreen.start();
  audio.stageTitle(startGame);
}

function paintTitle() {
  titleScreen.paint(context2d);
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
    dialog.setText("Puxa vida, bubu! o dr eggman roubou todos os meus aneis de poder! " +
      "ainda bem que ele deixou cair alguns pelo caminho... \n \n " +
      "preciso coletar todos os aneis antes que ele tenha tempo de voltar!");
    dialog.visible = true;
  }, 2000);
}

let lastTimestamp = 90000000;
const UNITS = 60 / 1000;
function physicsLoop(timestamp) {

  const stepSize = (timestamp - lastTimestamp) * UNITS - 0.4;
  lastTimestamp = timestamp;
  for (let i = 0; stepSize > 0 && i < stepSize; i++) {
    checkInput();
    physics.applyPhysics(dialog.visible);
    sonic.animate(dialog.visible);

    if (level.checkAABBRing(physics.x, physics.y, dialog.visible)) {
      audio.ring();
    }
  }
}

function paintGame(timestamp) {
  // find out the step for the physics sim
  backgrounds.paint(context2d, physics.x);
  level.draw(context2d, resources.images['tileset'], physics.x, physics.y, dialog.visible);
  dialog.print(context2d, resources.images['tileset']);
  sonic.draw(context2d, physics.x, physics.y);
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

