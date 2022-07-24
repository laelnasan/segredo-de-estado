function Physics() {
  // Vitesse de déplacement, si supérieur à 0 -> vers la droite, inférieur à 0 vers la gauche.
  this.speed = 0;
  this.ySpeed = 0;
  this.timestamp = 0;

  // Positions du personnage.
  this.x = 18 * 16;
  this.y = 0;
}

Physics.prototype.ACCELERATION_STRENGTH = 0.046875;
Physics.prototype.FRICTION = 0.046875;
Physics.prototype.DECELERATION_STRENGTH = 0.5;
Physics.prototype.MAX_SPEED = 6.5;
Physics.prototype.BRAKING_ANIMATION_SPEED = 4.5;
Physics.prototype.GRAVITY = 0.21875;


// Applique le frottement du sol
Physics.prototype.applyFriction = function() {
  this.speed -= Math.min(Math.abs(this.speed), this.FRICTION) * (this.speed > 0 ? 1 : -1);
};

Physics.prototype.jump = function() {
  this.ySpeed = -6.5;
};

Physics.prototype.applyGravity = function() {

  this.ySpeed += this.GRAVITY;
  if (this.ySpeed > 16) {
    this.ySpeed = 16;
  }
};

Physics.prototype.accelerateRight = function(inAir) {
  this.speed += (inAir ? this.ACCELERATION_STRENGTH * 2 : this.ACCELERATION_STRENGTH);
  this.speed = Math.min(this.speed, this.MAX_SPEED);
};

Physics.prototype.accelerateLeft = function(inAir) {
  this.speed -= (inAir ? this.ACCELERATION_STRENGTH * 2 : this.ACCELERATION_STRENGTH);
  this.speed = Math.max(this.speed, this.MAX_SPEED * -1);
};

// Freine quand le perso court à droite
Physics.prototype.decelerateWhenRunningRight = function() {
  this.speed -= this.DECELERATION_STRENGTH;
  this.speed = Math.max(0, this.speed);
};

// Freine quand le perso court à gauche
Physics.prototype.decelerateWhenRunningLeft = function() {
  this.speed += this.DECELERATION_STRENGTH;
  this.speed = Math.min(0, this.speed);
};

Physics.prototype.isDashingLeft = function() {
  return this.speed == this.MAX_SPEED * -1;
};

Physics.prototype.isDashingRight = function() {
  return this.speed == this.MAX_SPEED;
};

Physics.prototype.isStanding = function() {
  return this.speed == 0;
};

Physics.prototype.isRunningLeft = function() {
  return this.speed < 0 && this.speed > this.MAX_SPEED * -1;
};

Physics.prototype.isRunningRight = function() {
  return this.speed > 0 && this.speed < this.MAX_SPEED;
};

Physics.prototype.canMove = function(right, isDialog) {
  var collisionValueX = level.getCollisionData(this.x + this.speed + (right ? level.tileSize : -level.tileSize), this.y + this.ySpeed);
  if (collisionValueX !== 0 && this.ySpeed < 0) return true;
  if (this.y < 0) return true;
  // if (collisionValueX > 175) console.log(this.x, this.y, this.speed, this.ySpeed);
  if (collisionValueX === 178) {
    if (this.speed > 5.5) {
      this.ySpeed = -5.4;
      this.speed = 6;
    }
    return true;
  } else if (collisionValueX === 179) {
    if (this.speed < -5.5) {
      this.ySpeed = -5.4;
      this.speed = -6;
    }
    return true;
  }
  return collisionValueX && collisionValueX !== 23 && (!isDialog || collisionValueX !== 101);
};

Physics.prototype.isInAir = function(isDialog) {
  var collisionValueY = level.getCollisionData(this.x, this.y + this.ySpeed + level.tileSize);

  loop: if (collisionValueY > 175) {
    const v = Math.sqrt(this.speed * this.speed + this.ySpeed * this.ySpeed);
    if (v < 6) break loop;

    const dir = { x: this.speed / v, y: this.ySpeed / v };
    // console.log(collisionValueY, dir.x, dir.y)

    if (collisionValueY === 177) {
      if (dir.x > 0.6 && dir.y < -0.4) {
        this.speed = 0.242535 * v;
        this.ySpeed = -0.9901425 * v;
      } else if (dir.y > 0.9) {
        this.speed = -0.65 * v;
        this.ySpeed = 0.65 * v;
      }

    } else if (collisionValueY === 180) {
      if (dir.x < -0.6 && dir.y < -0.4) {
        this.speed = -0.242535 * v;
        this.ySpeed = -0.9901425 * v;
      } else if (dir.y > 0.9) {
        this.speed = 0.60 * v;
        this.ySpeed = 0.60 * v;
      }

    } else if (collisionValueY === 176) {
      if (dir.y < -0.8) {
        this.speed = -5.6;
        this.ySpeed = -4.5;
      }
    } else if (collisionValueY === 181) {
      if (dir.y < -0.8) {
        this.speed = 5.6;
        this.ySpeed = -4.5;
      }
    }
  }
  else if (this.ySpeed < 0) return true;
  else if (collisionValueY === 23 || (collisionValueY === 101 && isDialog)) { // custom code
    this.y = this.y > 0 ? (this.y + this.ySpeed) & 0xfff0 : 0;
    return false;
  }
  return true;
};

// Invoqué quand on appuie sur gauche alors qu'on court à droite.
Physics.prototype.shouldBrakeLeft = function() {
  return this.speed >= this.BRAKING_ANIMATION_SPEED;
};

// Invoqué quand on appuie sur gauche alors qu'on court à droite.
Physics.prototype.shouldBrakeRight = function() {
  return this.speed <= this.BRAKING_ANIMATION_SPEED * -1;
};

Physics.prototype.shouldDecelerateLeft = function() {
  return this.speed > 0;
};

Physics.prototype.shouldDecelerateRight = function() {
  return this.speed < 0;
};

Physics.prototype.applyPhysics = function(isDialog) {

  if (this.isInAir(isDialog)) {
    this.y += this.ySpeed;
    this.applyGravity();
  } else {
    this.ySpeed = 0.1;
  }

  if (this.canMove(this.speed > 0, isDialog)) {
    this.x += this.speed;
  } else {
    this.speed = 0;
  }
};
