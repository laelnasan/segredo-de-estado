(function(window) {
  'use strict';

  function Audio(sounds) {
    this.sounds = sounds || {};
    this.soundsList = {};
    this.loadCount = 0;
    this.playingSound = false;
    this.buffers = {};
    this.state = "land";
    this.fadeoutJack = null;

    try {
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new window.AudioContext();

      // Set default values
      this.jack = this.audioContext.createGain();
      this.jack.gain.value = 1;

      // Create audio filter
      this.filter = this.audioContext.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.q = 1000;
      this.filter.gain.value = 0;
      this.filter.connect(this.audioContext.destination);

      this.jack.connect(this.audioContext.destination);
    } catch (e) {
      window.alert('Audio não suportado.');
    }


  }

  Audio.prototype.updateFilter = function(timestamp, y) {
    if (y > 192) {
      if (this.state == "land") {
        this.state == "water";
        this.jack.disconnect();
        this.jack.connect(this.filter);
      }
      this.filter.frequency.value = 800 + (256 - y) * (256 - y) * 4 + 300 * Math.sin(timestamp * Math.PI / 2000);
      return
    }
    if (this.state == "water") {
      this.state == "land";
      this.jack.disconnect();
      this.jack.connect(this.audioContext.destination);
    }

  }

  Audio.prototype.loadSounds = function(soundList) {

    var promises = [];
    soundList.forEach(function(element) {
      promises.push(this.loadSound(element));
    }.bind(this));
    return Promise.all(promises);
  };

  Audio.prototype.loadSound = function(sound) {

    var p = new Promise(function(resolve, reject) {

      if (this.soundsList[sound.title]) {
        resolve(sound);
      } else {
        var request = new XMLHttpRequest();
        request.open('GET', sound.url, true);
        request.responseType = 'arraybuffer';

        request.onload = function() {
          this.audioContext.decodeAudioData(
            request.response,
            function(buffer) {
              this.soundsList[sound.title] = buffer;
              resolve(sound);
            }.bind(this),
            function(error) {
              console.error('decodeAudioData error', error);
              reject(sound);
            }
          );
        }.bind(this);

        request.send();
      }

    }.bind(this));

    return p;
  };

  Audio.prototype.load = function() {
    return this.loadSounds(this.sounds);
  };

  Audio.prototype.stageTitle = function(callback) {
    this.play("title", false, 0, 0, callback);
  };

  Audio.prototype.stageBgm = function() {
    this.play("stage", true, 3.680, 45.195);
  };

  Audio.prototype.stage2Bgm = function() {
    this.play("stage2", true, 0, 36.913, null, 1.531);
  };

  Audio.prototype.chords = function() {
    this.play("chords", false);
  };

  Audio.prototype.ending = function() {
    this.play("ending", false, null, null, () => { localStorage.setItem("as6df41s461a641*1a641a641*64a5cs5", false); });
  };

  Audio.prototype.trueending = function() {
    this.play("trueending", false, null, null, () => { localStorage.setItem("as6df41s461a641*1a641a641*64a5cs5", true); });
  };

  Audio.prototype.loop = function() {
    this.play("loop", false);
  };

  Audio.prototype.jump = function() {
    this.play("jump", false);
  };

  Audio.prototype.ring = function() {
    this.play("ring", false);
  };

  Audio.prototype.stop = function() {

    if (!this.playingSound) {
      this.playingSound = true;

      this.play("stop", false, 0, 0, function() {
        this.playingSound = false;
      }.bind(this));
    }
  };

  Audio.prototype.fadeout = function() {
    if (this.fadeoutJack === null) {
      this.fadeoutJack = this.jack;
      this.jack = this.audioContext.createGain();
      this.jack.connect(this.state === "land" ? this.audioContext.destination : this.filter);
    }
    if (this.fadeoutJack.gain.value > 0.04) {
      this.fadeoutJack.gain.value -= 0.04;
      window.setTimeout(this.fadeout.bind(this), 200);
    } else {
      this.fadeoutJack.disconnect();
      this.fadeoutJack = null;
      window.dispatchEvent(new Event("audiofadeout"));
    }
  }

  Audio.prototype.play = function(sound, loop, loopStart, loopEnd, callback, start = 0) {
    console.log(sound);
    if (this.buffers[sound]) {
      this.buffers[sound].stop();
      delete this.buffers[sound];
    }
    this.buffers[sound] = this.audioContext.createBufferSource();
    this.buffers[sound].buffer = this.soundsList[sound];
    this.buffers[sound].loop = loop;
    if (loop) {
      this.buffers[sound].loopStart = loopStart;

      this.buffers[sound].loopEnd = loopEnd;
    }

    if (typeof callback === 'function') {
      this.buffers[sound].onended = callback;
    }

    this.buffers[sound].connect(this.jack);
    this.buffers[sound].start(0, start);
  };

  window.Audio = Audio;

})(window);
