window.requestAnimationFrame = (function() {
  return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    function(callback) {
      window.setTimeout(callback, 1000 / 60);
    };
})();

var scale = 1;
var titleScreen;
var backgrounds;
var level;
var sonic;
var physics;
var gamepad;
var rings;
var ring;

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

var canvas = document.getElementById('game');
{
  let width = window.innerWidth / canvas.width;
  let height = window.innerHeight / canvas.height;
  scale = width < height ? width : height;
  const granularity = 8;
  scale = Math.floor(scale * granularity) / granularity;
  canvas.width = (canvas.width * scale) | 0;
  canvas.height = (canvas.height * scale) | 0;
}
var context2d = canvas.getContext('2d');
context2d.scale(scale, scale);
context2d.mozImageSmoothingEnabled = false;  // firefox
context2d.imageSmoothingEnabled = false;

var rafHandler;

var A = false;
var down = false;
var left = false;
var right = false;
var first_input = true;
var last_side_was_left = false;
var joy_jump = false;
var joy_start = false;

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
  console.log("called first")
  if (first_input) {
    first_input = false;
    launchTitle();
    const el = document.documentElement;
    const rfs = el.requestFullScreen
      || el.webkitRequestFullScreen
      || el.mozRequestFullScreen;
    rfs.call(el);

    window.removeEventListener("mousemove", interactToStart);
    window.removeEventListener("keydown", interactToStart);

    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("keyup", handleKeyup);

    {
      scale = 1;
      let width = window.outerWidth / 320;
      let height = window.outerHeight / 240;
      scale = width < height ? width : height;
      const granularity = 2;
      scale = Math.floor(scale * granularity) / granularity;
      canvas.width = (320 * scale) | 0;
      canvas.height = (240 * scale) | 0;
      canvas.style = `padding-top: ${(window.outerHeight - canvas.height) >> 1}px`
    }
    context2d = canvas.getContext('2d');
    context2d.scale(scale, scale);
    context2d.mozImageSmoothingEnabled = false;  // firefox
    context2d.imageSmoothingEnabled = false;
  }
}

// window.addEventListener("mousemove", interactToStart);
window.addEventListener("keydown", interactToStart);

// joystick
const joy = new JoyStick("joyDiv", {}, ({ cardinalDirection }) => {
  if (!A && cardinalDirection.match(/N/) && !physics.isInAir()) {
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
  if (joy_start && first_input && cardinalDirection.match(/C/)) setTimeout(interactToStart, 500);
  joy_start = true;
  console.log("loggin joypad");
});

function checkInput() {

  // if (gamepad.controls[gamepad.A] == true && !physics.isInAir()) {
  if ((joy_jump || A) && !physics.isInAir()) {
    joy_jump = false;
    audio.jump();
    physics.jump();

  } else if (physics.isInAir()) {
    // if (gamepad.controls[gamepad.LEFT] == true) {
    if (left) {
      physics.accelerateLeft(true);
      // } else if (gamepad.controls[gamepad.RIGHT] == true) {
    } else if (right) {
      physics.accelerateRight(true);
    }

    // } else if (!gamepad.controls[gamepad.LEFT] && !gamepad.controls[gamepad.RIGHT]) {
  } else if (!(left || right)) {
    physics.applyFriction();

    // } else if (gamepad.controls[gamepad.LEFT] == true) {
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
    // } else if (gamepad.controls[gamepad.RIGHT] == true) {
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
  audio.stageTitle(startGame);
}

function paintTitle() {
  titleScreen.paint(context2d);
  rafHandler = window.requestAnimationFrame(paintTitle);
}

function startGame() {
  console.log('start game');
  window.cancelAnimationFrame(rafHandler);

  // gamepad = new Gamepad(mapping);
  backgrounds = new Background();
  physics = new Physics();
  level = new Level();
  sonic = new Sonic();
  rings = new Rings()
  ring = new Ring()

  paintGame();
  audio.stageBgm();
}

function paintGame() {
  backgrounds.paint(context2d, physics.x);
  level.draw(context2d, resources.images['tileset'], physics.x, physics.y);
  sonic.draw(context2d, physics.x, physics.y);

  checkInput();
  physics.applyPhysics();
  sonic.animate();

  if (level.checkAABBRing(physics.x, physics.y)) {
    audio.ring();
  }

  window.requestAnimationFrame(paintGame);
}

audio.load()
  .then(() => resources.load())
  .then(() => {
    titleScreen = new TitleScreen();
    paintTitle();
  });
