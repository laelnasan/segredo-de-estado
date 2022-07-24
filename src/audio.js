(function(window) {
  'use strict';

  function Audio(sounds) {
    this.sounds = sounds || {};
    this.soundsList = {};
    this.loadCount = 0;
    this.playingSound = false;
    this.buffers = {};

    try {
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new window.AudioContext();
    } catch (e) {
      window.alert('Audio não suportado.');
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

  Audio.prototype.play = function(sound, loop, loopStart, loopEnd, callback) {
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

    this.buffers[sound].connect(this.audioContext.destination);
    this.buffers[sound].start(0);
  };

  window.Audio = Audio;

})(window);
