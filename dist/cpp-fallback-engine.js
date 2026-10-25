/**
 * @file cpp-fallback-engine.js
 * @brief Pure JavaScript mirror of the C++ OOP simulation architecture.
 * 
 * Provides an identical, zero-dependency game simulation engine when WebAssembly 
 * is not yet compiled or running in standard web environments.
 * 
 * Demonstrates 1:1 mapping of C++ OOP concepts:
 * - Base class Entity (Inheritance, Polymorphism)
 * - Health & Weapon (Encapsulation, Composition)
 * - Zombie, Player, Bullet, Supply (Derived classes)
 * - GameSimulation (Master controller matching bindings.cpp)
 */

// Enums matching C++ definitions
const GameStateEnum = Object.freeze({
  MENU: 0,
  PLAYING: 1,
  PAUSED: 2,
  GAME_OVER: 3
});

const ZombieTypeEnum = Object.freeze({
  NORMAL: 0,
  RUNNER: 1,
  TANK: 2
});

const SupplyTypeEnum = Object.freeze({
  HEALTH: 0,
  AMMO: 1
});

/**
 * 1. Base Class: Entity
 * Mirrors cpp/Entity.h
 */
class SimEntity {
  constructor(x = 0, y = 0, radius = 10) {
    this._x = x;
    this._y = y;
    this._radius = radius;
    this._active = true;
  }

  // Pure virtual in C++
  update(dt) {
    throw new Error("SimEntity.update() must be implemented by derived class.");
  }

  getX() { return this._x; }
  getY() { return this._y; }
  setPosition(x, y) { this._x = x; this._y = y; }

  getRadius() { return this._radius; }
  setRadius(r) { this._radius = r; }

  isActive() { return this._active; }
  setActive(val) { this._active = Boolean(val); }

  checkCollision(other) {
    if (!this._active || !other.isActive()) return false;
    const dx = this._x - other.getX();
    const dy = this._y - other.getY();
    const distSq = dx * dx + dy * dy;
    const radiusSum = this._radius + other.getRadius();
    return distSq <= (radiusSum * radiusSum);
  }

  distanceTo(targetX, targetY) {
    const dx = targetX - this._x;
    const dy = targetY - this._y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

/**
 * 2. Component: Health
 * Mirrors cpp/Health.h
 */
class SimHealth {
  constructor(maxHealth = 100) {
    this._max = Math.max(1, maxHealth);
    this._current = this._max;
  }

  takeDamage(amount) {
    if (amount <= 0) return;
    this._current -= amount;
    if (this._current < 0) this._current = 0;
  }

  heal(amount) {
    if (amount <= 0) return;
    this._current += amount;
    if (this._current > this._max) this._current = this._max;
  }

  reset() {
    this._current = this._max;
  }

  isAlive() { return this._current > 0; }
  getCurrent() { return this._current; }
  getMax() { return this._max; }
  getPercentage() { return this._max > 0 ? this._current / this._max : 0; }
}

/**
 * 3. Component: Weapon
 * Mirrors cpp/Weapon.h
 */
class SimWeapon {
  constructor(maxAmmo = 60, fireRate = 0.18, bulletDamage = 35.0, bulletSpeed = 650.0) {
    this._maxAmmo = maxAmmo;
    this._ammo = Math.floor(maxAmmo / 2);
    this._fireRate = fireRate;
    this._cooldownTimer = 0.0;
    this._bulletDamage = bulletDamage;
    this._bulletSpeed = bulletSpeed;
  }

  update(dt) {
    if (this._cooldownTimer > 0) {
      this._cooldownTimer -= dt;
      if (this._cooldownTimer < 0) this._cooldownTimer = 0;
    }
  }

  canShoot() {
    return this._ammo > 0 && this._cooldownTimer <= 0;
  }

  fire() {
    if (!this.canShoot()) return false;
    this._ammo--;
    this._cooldownTimer = this._fireRate;
    return true;
  }

  addAmmo(amount) {
    if (amount <= 0) return;
    this._ammo = Math.min(this._ammo + amount, this._maxAmmo);
  }

  reset() {
    this._ammo = Math.floor(this._maxAmmo / 2);
    this._cooldownTimer = 0;
  }

  getAmmo() { return this._ammo; }
  getMaxAmmo() { return this._maxAmmo; }
  getBulletDamage() { return this._bulletDamage; }
  getBulletSpeed() { return this._bulletSpeed; }
}

/**
 * 4. Derived Class: Bullet
 * Mirrors cpp/Bullet.h
 */
class SimBullet extends SimEntity {
  constructor(x, y, targetX, targetY, speed = 650, damage = 35) {
    super(x, y, 4.0);
    this._damage = damage;
    this._lifetime = 2.5;

    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0.0001) {
      this._vx = (dx / dist) * speed;
      this._vy = (dy / dist) * speed;
    } else {
      this._vx = speed;
      this._vy = 0;
    }
  }

  update(dt) {
    if (!this._active) return;
    this._x += this._vx * dt;
    this._y += this._vy * dt;

    this._lifetime -= dt;
    if (this._lifetime <= 0) {
      this._active = false;
    }
  }

  getDamage() { return this._damage; }
}

/**
 * 5. Derived Class: Supply
 * Mirrors cpp/Supply.h
 */
class SimSupply extends SimEntity {
  constructor(x, y, type = SupplyTypeEnum.HEALTH, value = 30, lifespan = 22) {
    super(x, y, 15.0);
    this._type = type;
    this._value = value;
    this._lifespan = lifespan;
  }

  update(dt) {
    if (!this._active) return;
    this._lifespan -= dt;
    if (this._lifespan <= 0) {
      this._active = false;
    }
  }

  getType() { return this._type; }
  getValue() { return this._value; }
  getLifespan() { return this._lifespan; }
}

/**
 * 6. Derived Class: Zombie
 * Mirrors cpp/Zombie.h
 */
class SimZombie extends SimEntity {
  constructor(x, y, type = ZombieTypeEnum.NORMAL, speedMult = 1.0, healthMult = 1.0) {
    super(x, y, 16.0);
    this._type = type;
    this._targetX = x;
    this._targetY = y;

    switch (type) {
      case ZombieTypeEnum.RUNNER:
        this._radius = 14.0;
        this._health = new SimHealth(45.0 * healthMult);
        this._speed = 145.0 * speedMult;
        this._damage = 10.0;
        this._points = 150;
        break;

      case ZombieTypeEnum.TANK:
        this._radius = 24.0;
        this._health = new SimHealth(180.0 * healthMult);
        this._speed = 65.0 * speedMult;
        this._damage = 25.0;
        this._points = 300;
        break;

      case ZombieTypeEnum.NORMAL:
      default:
        this._radius = 16.0;
        this._health = new SimHealth(75.0 * healthMult);
        this._speed = 95.0 * speedMult;
        this._damage = 15.0;
        this._points = 100;
        break;
    }
  }

  setTarget(x, y) {
    this._targetX = x;
    this._targetY = y;
  }

  update(dt) {
    if (!this._active) return;
    const dx = this._targetX - this._x;
    const dy = this._targetY - this._y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 1.0) {
      this._x += (dx / dist) * this._speed * dt;
      this._y += (dy / dist) * this._speed * dt;
    }
  }

  takeDamage(amount) {
    this._health.takeDamage(amount);
    if (!this._health.isAlive()) {
      this._active = false;
    }
  }

  isAlive() { return this._health.isAlive(); }
  getType() { return this._type; }
  getHealth() { return this._health.getCurrent(); }
  getMaxHealth() { return this._health.getMax(); }
  getDamage() { return this._damage; }
  getPointsValue() { return this._points; }
}

/**
 * 7. Derived Class: Player
 * Mirrors cpp/Player.h
 */
class SimPlayer extends SimEntity {
  constructor(x = 600, y = 400) {
    super(x, y, 18.0);
    this._health = new SimHealth(100.0);
    this._weapon = new SimWeapon(60, 0.18, 35.0, 650.0);
    this._speed = 210.0;
    this._invulnerableTimer = 0.0;
    this.INVULNERABLE_DURATION = 0.8;
  }

  update(dt) {
    if (!this._active) return;
    this._weapon.update(dt);

    if (this._invulnerableTimer > 0) {
      this._invulnerableTimer -= dt;
      if (this._invulnerableTimer < 0) this._invulnerableTimer = 0;
    }
  }

  move(dirX, dirY, dt, arenaWidth, arenaHeight) {
    if (!this._active) return;
    const len = Math.sqrt(dirX * dirX + dirY * dirY);
    if (len > 0.0001) {
      dirX /= len;
      dirY /= len;
    }

    this._x += dirX * this._speed * dt;
    this._y += dirY * this._speed * dt;

    // Boundaries
    this._x = Math.max(this._radius, Math.min(this._x, arenaWidth - this._radius));
    this._y = Math.max(this._radius, Math.min(this._y, arenaHeight - this._radius));
  }

  takeDamage(amount) {
    if (this.isInvulnerable() || !this._active) return false;
    this._health.takeDamage(amount);
    this._invulnerableTimer = this.INVULNERABLE_DURATION;
    if (!this._health.isAlive()) {
      this._active = false;
    }
    return true;
  }

  heal(amount) { this._health.heal(amount); }
  addAmmo(amount) { this._weapon.addAmmo(amount); }
  canShoot() { return this._active && this._weapon.canShoot(); }
  fire() { return this._active && this._weapon.fire(); }

  reset(x, y) {
    this._x = x;
    this._y = y;
    this._active = true;
    this._health.reset();
    this._weapon.reset();
    this._invulnerableTimer = 0;
  }

  isAlive() { return this._health.isAlive(); }
  isInvulnerable() { return this._invulnerableTimer > 0; }
  getInvulnerableTimer() { return this._invulnerableTimer; }
  getHealth() { return this._health.getCurrent(); }
  getMaxHealth() { return this._health.getMax(); }
  getAmmo() { return this._weapon.getAmmo(); }
  getMaxAmmo() { return this._weapon.getMaxAmmo(); }
  getBulletDamage() { return this._weapon.getBulletDamage(); }
  getBulletSpeed() { return this._weapon.getBulletSpeed(); }
}

/**
 * 8. Master Controller: CppSimulationEngine
 * Mirrors cpp/Game.h and cpp/bindings.cpp
 */
class CppSimulationEngine {
  constructor(arenaWidth = 1200, arenaHeight = 800) {
    this.init(arenaWidth, arenaHeight);
  }

  init(arenaWidth, arenaHeight) {
    this._arenaWidth = arenaWidth;
    this._arenaHeight = arenaHeight;
    this._player = new SimPlayer(arenaWidth / 2, arenaHeight / 2);
    this._zombies = [];
    this._bullets = [];
    this._supplies = [];

    this._state = GameStateEnum.MENU;
    this._score = 0;
    this._survivalTime = 0.0;

    this._wave = 0;
    this._zombiesRemainingToSpawn = 0;
    this._spawnInterval = 1.5;
    this._spawnTimer = 0.0;
    this._waveTransitionTimer = 0.0;
    this._inWaveTransition = false;
    this._supplyTimer = 6.0;

    this.events = {
      playerShot: false,
      zombieHit: false,
      zombieKilled: false,
      playerDamaged: false,
      supplyPickedUp: false,
      waveStarted: false,
      gameOver: false,
      lastSupplyType: 0
    };
  }

  start() {
    this.restart();
    this._state = GameStateEnum.PLAYING;
  }

  pause() {
    if (this._state === GameStateEnum.PLAYING) {
      this._state = GameStateEnum.PAUSED;
    }
  }

  resume() {
    if (this._state === GameStateEnum.PAUSED) {
      this._state = GameStateEnum.PLAYING;
    }
  }

  restart() {
    this._score = 0;
    this._survivalTime = 0;
    this._wave = 0;
    this._zombiesRemainingToSpawn = 0;
    this._spawnTimer = 0;
    this._supplyTimer = 6.0;
    this._inWaveTransition = false;
    this._waveTransitionTimer = 0;

    this._zombies = [];
    this._bullets = [];
    this._supplies = [];

    this._player.reset(this._arenaWidth / 2, this._arenaHeight / 2);
    this.clearEvents();

    this._state = GameStateEnum.PLAYING;
    this.startNextWave();
  }

  clearEvents() {
    this.events.playerShot = false;
    this.events.zombieHit = false;
    this.events.zombieKilled = false;
    this.events.playerDamaged = false;
    this.events.supplyPickedUp = false;
    this.events.waveStarted = false;
    this.events.gameOver = false;
  }

  startNextWave() {
    this._wave++;
    this._inWaveTransition = true;
    this._waveTransitionTimer = 3.0;

    let count = 5 + (this._wave - 1) * 3;
    if (count > 40) count = 40;
    this._zombiesRemainingToSpawn = count;

    this._spawnInterval = Math.max(0.45, 1.6 - (this._wave * 0.12));
    this._spawnTimer = 0.2;

    this.events.waveStarted = true;
  }

  spawnZombie() {
    if (this._zombiesRemainingToSpawn <= 0) return;

    const side = Math.floor(Math.random() * 4);
    let spawnX = 0, spawnY = 0;
    const PADDING = 30;

    switch (side) {
      case 0: // Top
        spawnX = Math.random() * this._arenaWidth;
        spawnY = -PADDING;
        break;
      case 1: // Right
        spawnX = this._arenaWidth + PADDING;
        spawnY = Math.random() * this._arenaHeight;
        break;
      case 2: // Bottom
        spawnX = Math.random() * this._arenaWidth;
        spawnY = this._arenaHeight + PADDING;
        break;
      case 3: // Left
      default:
        spawnX = -PADDING;
        spawnY = Math.random() * this._arenaHeight;
        break;
    }

    let type = ZombieTypeEnum.NORMAL;
    const roll = Math.random() * 100;
    if (this._wave >= 3 && roll > 75) {
      type = ZombieTypeEnum.TANK;
    } else if (this._wave >= 2 && roll > 50) {
      type = ZombieTypeEnum.RUNNER;
    }

    const speedMult = 1.0 + (this._wave * 0.035);
    const healthMult = 1.0 + (this._wave * 0.05);

    this._zombies.push(new SimZombie(spawnX, spawnY, type, speedMult, healthMult));
    this._zombiesRemainingToSpawn--;
  }

  spawnSupply() {
    const x = 60 + Math.random() * (this._arenaWidth - 120);
    const y = 60 + Math.random() * (this._arenaHeight - 120);
    const type = Math.random() > 0.5 ? SupplyTypeEnum.HEALTH : SupplyTypeEnum.AMMO;
    this._supplies.push(new SimSupply(x, y, type, 30, 22));
  }

  handlePlayerInput(dirX, dirY, dt) {
    if (this._state !== GameStateEnum.PLAYING) return;
    this._player.move(dirX, dirY, dt, this._arenaWidth, this._arenaHeight);
  }

  shoot(targetX, targetY) {
    if (this._state !== GameStateEnum.PLAYING) return false;
    if (this._player.fire()) {
      const px = this._player.getX();
      const py = this._player.getY();
      this._bullets.push(new SimBullet(px, py, targetX, targetY, this._player.getBulletSpeed(), this._player.getBulletDamage()));
      this.events.playerShot = true;
      return true;
    }
    return false;
  }

  update(dt) {
    this.clearEvents();
    if (this._state !== GameStateEnum.PLAYING) return;

    this._survivalTime += dt;
    this._player.update(dt);

    if (!this._player.isAlive()) {
      this._state = GameStateEnum.GAME_OVER;
      this.events.gameOver = true;
      return;
    }

    if (this._inWaveTransition) {
      this._waveTransitionTimer -= dt;
      if (this._waveTransitionTimer <= 0) {
        this._inWaveTransition = false;
      }
    } else {
      if (this._zombiesRemainingToSpawn > 0) {
        this._spawnTimer -= dt;
        if (this._spawnTimer <= 0) {
          this.spawnZombie();
          this._spawnTimer = this._spawnInterval;
        }
      } else if (this._zombies.length === 0) {
        this._score += 500 * this._wave;
        this.startNextWave();
      }
    }

    this._supplyTimer -= dt;
    if (this._supplyTimer <= 0) {
      if (this._supplies.length < 4) {
        this.spawnSupply();
      }
      this._supplyTimer = 14.0;
    }

    const px = this._player.getX();
    const py = this._player.getY();
    for (const z of this._zombies) {
      z.setTarget(px, py);
      z.update(dt);
    }

    for (const b of this._bullets) {
      b.update(dt);
    }

    for (const s of this._supplies) {
      s.update(dt);
    }

    this.checkCollisions();
    this.cleanupInactive();
  }

  checkCollisions() {
    // 1. Bullets vs Zombies
    for (const bullet of this._bullets) {
      if (!bullet.isActive()) continue;
      for (const zombie of this._zombies) {
        if (!zombie.isActive()) continue;
        if (bullet.checkCollision(zombie)) {
          bullet.setActive(false);
          zombie.takeDamage(bullet.getDamage());
          this.events.zombieHit = true;
          if (!zombie.isAlive()) {
            this._score += zombie.getPointsValue();
            this.events.zombieKilled = true;
          }
          break;
        }
      }
    }

    // 2. Zombies vs Player
    for (const zombie of this._zombies) {
      if (!zombie.isActive()) continue;
      if (this._player.checkCollision(zombie)) {
        if (this._player.takeDamage(zombie.getDamage())) {
          this.events.playerDamaged = true;
          if (!this._player.isAlive()) {
            this._state = GameStateEnum.GAME_OVER;
            this.events.gameOver = true;
            return;
          }
        }
      }
    }

    // 3. Player vs Supplies
    for (const supply of this._supplies) {
      if (!supply.isActive()) continue;
      if (this._player.checkCollision(supply)) {
        supply.setActive(false);
        this.events.supplyPickedUp = true;
        this.events.lastSupplyType = supply.getType();

        if (supply.getType() === SupplyTypeEnum.HEALTH) {
          this._player.heal(supply.getValue());
        } else {
          this._player.addAmmo(Math.floor(supply.getValue()));
        }
        this._score += 50;
      }
    }
  }

  cleanupInactive() {
    this._bullets = this._bullets.filter(b => b.isActive());
    this._zombies = this._zombies.filter(z => z.isActive());
    this._supplies = this._supplies.filter(s => s.isActive());
  }

  // Bindings-compatible API
  getStateValue() { return this._state; }
  getScore() { return this._score; }
  getWave() { return this._wave; }
  getSurvivalTime() { return this._survivalTime; }
  isInWaveTransition() { return this._inWaveTransition; }
  getWaveTransitionTimer() { return this._waveTransitionTimer; }
  getRemainingZombies() { return this._zombies.length + this._zombiesRemainingToSpawn; }

  getPlayerX() { return this._player.getX(); }
  getPlayerY() { return this._player.getY(); }
  getPlayerRadius() { return this._player.getRadius(); }
  getPlayerHealth() { return this._player.getHealth(); }
  getPlayerMaxHealth() { return this._player.getMaxHealth(); }
  getPlayerAmmo() { return this._player.getAmmo(); }
  getPlayerMaxAmmo() { return this._player.getMaxAmmo(); }
  isPlayerInvulnerable() { return this._player.isInvulnerable(); }

  getZombieCount() { return this._zombies.length; }
  getZombieX(i) { return this._zombies[i] ? this._zombies[i].getX() : 0; }
  getZombieY(i) { return this._zombies[i] ? this._zombies[i].getY() : 0; }
  getZombieRadius(i) { return this._zombies[i] ? this._zombies[i].getRadius() : 0; }
  getZombieType(i) { return this._zombies[i] ? this._zombies[i].getType() : 0; }
  getZombieHealth(i) { return this._zombies[i] ? this._zombies[i].getHealth() : 0; }
  getZombieMaxHealth(i) { return this._zombies[i] ? this._zombies[i].getMaxHealth() : 0; }

  getBulletCount() { return this._bullets.length; }
  getBulletX(i) { return this._bullets[i] ? this._bullets[i].getX() : 0; }
  getBulletY(i) { return this._bullets[i] ? this._bullets[i].getY() : 0; }
  getBulletRadius(i) { return this._bullets[i] ? this._bullets[i].getRadius() : 0; }

  getSupplyCount() { return this._supplies.length; }
  getSupplyX(i) { return this._supplies[i] ? this._supplies[i].getX() : 0; }
  getSupplyY(i) { return this._supplies[i] ? this._supplies[i].getY() : 0; }
  getSupplyRadius(i) { return this._supplies[i] ? this._supplies[i].getRadius() : 0; }
  getSupplyType(i) { return this._supplies[i] ? this._supplies[i].getType() : 0; }
}

// Attach to window for global access
window.CppSimulationEngine = CppSimulationEngine;
