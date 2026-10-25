/**
 * @file game.js
 * @brief Canvas renderer, audio synthesis, input handling, and WebAssembly / JS engine orchestrator.
 */

(function () {
  'use strict';

  // --- Constants & Config ---
  const ARENA_WIDTH = 1600;
  const ARENA_HEIGHT = 1000;
  const STORAGE_KEY_SCORE = 'zombie_survival_best_score';
  const STORAGE_KEY_TIME = 'zombie_survival_best_time';
  const STORAGE_KEY_MUTE = 'zombie_survival_muted';

  // --- DOM Elements ---
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  // Screens & Modals
  const screenMenu = document.getElementById('screen-menu');
  const screenPause = document.getElementById('screen-pause');
  const screenGameOver = document.getElementById('screen-gameover');
  const modalControls = document.getElementById('modal-controls');
  const modalOop = document.getElementById('modal-oop');
  const hudOverlay = document.getElementById('hud-overlay');

  // HUD Elements
  const hudWave = document.getElementById('hud-wave');
  const hudZombies = document.getElementById('hud-zombies');
  const hudTimer = document.getElementById('hud-timer');
  const hudScore = document.getElementById('hud-score');
  const hudHealthText = document.getElementById('hud-health-text');
  const hudHealthFill = document.getElementById('hud-health-fill');
  const hudAmmoText = document.getElementById('hud-ammo-text');
  const hudAmmoFill = document.getElementById('hud-ammo-fill');
  const engineStatusPill = document.getElementById('engine-status-pill');
  const menuEngineIndicator = document.getElementById('menu-engine-indicator');
  const waveBanner = document.getElementById('wave-banner');
  const waveBannerTitle = document.getElementById('wave-banner-title');
  const waveBannerSub = document.getElementById('wave-banner-sub');

  // Results & Stats Elements
  const menuBestScore = document.getElementById('menu-best-score');
  const menuBestTime = document.getElementById('menu-best-time');
  const pauseWave = document.getElementById('pause-wave');
  const pauseScore = document.getElementById('pause-score');
  const pauseZombies = document.getElementById('pause-zombies');
  const goFinalScore = document.getElementById('go-final-score');
  const goFinalWave = document.getElementById('go-final-wave');
  const goFinalTime = document.getElementById('go-final-time');
  const goBestScore = document.getElementById('go-best-score');
  const newHighScoreBanner = document.getElementById('new-high-score-banner');

  // Buttons
  const btnPlayGame = document.getElementById('btn-play-game');
  const btnControlsGuide = document.getElementById('btn-controls-guide');
  const btnOopGuide = document.getElementById('btn-oop-guide');
  const btnCloseControls = document.getElementById('btn-close-controls');
  const btnCloseOop = document.getElementById('btn-close-oop');
  const btnPauseGame = document.getElementById('btn-pause-game');
  const btnSoundToggle = document.getElementById('btn-sound-toggle');
  const btnResumeGame = document.getElementById('btn-resume-game');
  const btnRestartFromPause = document.getElementById('btn-restart-from-pause');
  const btnOopFromPause = document.getElementById('btn-oop-from-pause');
  const btnMenuFromPause = document.getElementById('btn-menu-from-pause');
  const btnRestartGame = document.getElementById('btn-restart-game');
  const btnMenuFromGo = document.getElementById('btn-menu-from-go');

  // Mobile Controls
  const mobileControlsZone = document.getElementById('mobile-controls');
  const joystickZone = document.getElementById('touch-joystick-zone');
  const joystickKnob = document.getElementById('touch-joystick-knob');
  const touchShootBtn = document.getElementById('touch-shoot-btn');

  // --- Sound Synthesizer (Web Audio API) ---
  class SoundSynth {
    constructor() {
      this.ctx = null;
      this.isMuted = localStorage.getItem(STORAGE_KEY_MUTE) === 'true';
      this.updateButton();
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      localStorage.setItem(STORAGE_KEY_MUTE, this.isMuted);
      this.updateButton();
    }

    updateButton() {
      if (btnSoundToggle) {
        btnSoundToggle.textContent = this.isMuted ? '🔇' : '🔊';
        btnSoundToggle.title = this.isMuted ? 'Unmute Sound' : 'Mute Sound';
      }
    }

    playShot() {
      if (this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(450, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.12);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    }

    playEmptyClick() {
      if (this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.05);
    }

    playHit() {
      if (this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.08);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.08);
    }

    playKill() {
      if (this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.2);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    }

    playHurt() {
      if (this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.25);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    }

    playPickup() {
      if (this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, t); // C5
      osc.frequency.setValueAtTime(659.25, t + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, t + 0.16); // G5
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.28);
    }

    playWaveStart() {
      if (this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.linearRampToValueAtTime(220, t + 0.4);
      osc.frequency.linearRampToValueAtTime(165, t + 0.8);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.9);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.9);
    }

    playGameOver() {
      if (this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(55, t + 1.2);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 1.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 1.2);
    }
  }

  const sound = new SoundSynth();

  // --- Engine Bridge Interface ---
  let engine = null;
  let isWasmEngine = false;

  function initEngine() {
    // Attempt WebAssembly engine if available in window.Module
    if (window.Module && window.Module.Game) {
      try {
        engine = new window.Module.Game(ARENA_WIDTH, ARENA_HEIGHT);
        isWasmEngine = true;
        updateEngineBadge(true);
        console.log('[ZombieSurvival] Initialized WebAssembly C++ Engine.');
        return;
      } catch (err) {
        console.warn('[ZombieSurvival] Wasm load failed, falling back to C++ JS mirror:', err);
      }
    }

    // Default to the 1:1 JavaScript C++ Architecture Mirror
    engine = new window.CppSimulationEngine(ARENA_WIDTH, ARENA_HEIGHT);
    isWasmEngine = false;
    updateEngineBadge(false);
    console.log('[ZombieSurvival] Initialized C++ OOP JS Fallback Simulation.');
  }

  function updateEngineBadge(wasm) {
    if (engineStatusPill) {
      if (wasm) {
        engineStatusPill.textContent = 'Engine: WebAssembly (C++)';
        engineStatusPill.className = 'engine-pill wasm-mode';
      } else {
        engineStatusPill.textContent = 'Engine: JS Simulation (C++ Fallback)';
        engineStatusPill.className = 'engine-pill js-mode';
      }
    }
    if (menuEngineIndicator) {
      if (wasm) {
        menuEngineIndicator.textContent = '✓ WebAssembly C++ Engine Loaded & Ready';
        menuEngineIndicator.style.color = 'var(--neon-green)';
      } else {
        menuEngineIndicator.textContent = '● Pure C++ Fallback Simulation Active (Deploy-ready)';
        menuEngineIndicator.style.color = 'var(--cyan-accent)';
      }
    }
  }

  // --- Input State ---
  const keys = {
    w: false, a: false, s: false, d: false,
    ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false,
    Space: false
  };

  const mouse = {
    x: ARENA_WIDTH / 2,
    y: ARENA_HEIGHT / 2,
    isDown: false
  };

  const touchJoystick = {
    active: false,
    dirX: 0,
    dirY: 0
  };

  // Camera viewport
  const camera = {
    x: ARENA_WIDTH / 2,
    y: ARENA_HEIGHT / 2,
    scale: 1.0,
    shake: 0.0
  };

  // Particle System
  const particles = [];
  const floatingTexts = [];

  class Particle {
    constructor(x, y, vx, vy, color, radius, life) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.color = color;
      this.radius = radius;
      this.maxLife = life;
      this.life = life;
    }

    update(dt) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vx *= 0.94;
      this.vy *= 0.94;
      this.life -= dt;
      return this.life > 0;
    }

    render(ctx) {
      const alpha = Math.max(0, this.life / this.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  class FloatingText {
    constructor(x, y, text, color) {
      this.x = x;
      this.y = y;
      this.text = text;
      this.color = color;
      this.life = 1.0;
    }

    update(dt) {
      this.y -= 30 * dt;
      this.life -= dt;
      return this.life > 0;
    }

    render(ctx) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.life);
      ctx.fillStyle = this.color;
      ctx.font = 'bold 15px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(this.text, this.x, this.y);
      ctx.restore();
    }
  }

  function addBloodSplat(x, y) {
    const count = 7 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const color = Math.random() > 0.4 ? '#8a0303' : '#c91414';
      particles.push(new Particle(x, y, vx, vy, color, 2 + Math.random() * 3, 0.4 + Math.random() * 0.4));
    }
  }

  function addHitSparks(x, y) {
    for (let i = 0; i < 4; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 70 + Math.random() * 140;
      particles.push(new Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, '#ffea75', 1.5, 0.2));
    }
  }

  function addMuzzleFlash(x, y, angle) {
    const fx = x + Math.cos(angle) * 22;
    const fy = y + Math.sin(angle) * 22;
    for (let i = 0; i < 3; i++) {
      const spread = (Math.random() - 0.5) * 0.4;
      const speed = 120 + Math.random() * 80;
      particles.push(new Particle(fx, fy, Math.cos(angle + spread) * speed, Math.sin(angle + spread) * speed, '#ffb703', 2.5, 0.12));
    }
  }

  // --- Coordinate conversions ---
  function screenToArena(screenX, screenY) {
    const rect = canvas.getBoundingClientRect();
    const cx = screenX - rect.left;
    const cy = screenY - rect.top;
    const arenaX = (cx - canvas.width / 2) / camera.scale + camera.x;
    const arenaY = (cy - canvas.height / 2) / camera.scale + camera.y;
    return { x: arenaX, y: arenaY };
  }

  // --- Resize Canvas ---
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Scale camera so arena is nicely framed
    const scaleX = canvas.width / 1300;
    const scaleY = canvas.height / 850;
    camera.scale = Math.max(0.7, Math.min(1.2, Math.min(scaleX, scaleY)));
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // --- Event Listeners ---
  window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key) || keys.hasOwnProperty(e.code)) {
      keys[e.key] = true;
      keys[e.code] = true;
    }
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
      togglePause();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key) || keys.hasOwnProperty(e.code)) {
      keys[e.key] = false;
      keys[e.code] = false;
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    const coords = screenToArena(e.clientX, e.clientY);
    mouse.x = coords.x;
    mouse.y = coords.y;
  });

  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
      sound.init();
      mouse.isDown = true;
      tryShoot();
    }
  });

  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) {
      mouse.isDown = false;
    }
  });

  // Mobile Touch Detection
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    mobileControlsZone.classList.remove('hidden');
    setupTouchControls();
  }

  function setupTouchControls() {
    let touchId = null;
    let startX = 0, startY = 0;
    const maxRadius = 40;

    joystickZone.addEventListener('touchstart', (e) => {
      sound.init();
      const touch = e.changedTouches[0];
      touchId = touch.identifier;
      const rect = joystickZone.getBoundingClientRect();
      startX = rect.left + rect.width / 2;
      startY = rect.top + rect.height / 2;
      touchJoystick.active = true;
      handleTouchMove(touch);
    }, { passive: false });

    joystickZone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          handleTouchMove(e.changedTouches[i]);
          break;
        }
      }
    }, { passive: false });

    function handleTouchMove(touch) {
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      const clampedDist = Math.min(dist, maxRadius);

      const knobX = Math.cos(angle) * clampedDist;
      const knobY = Math.sin(angle) * clampedDist;
      joystickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;

      touchJoystick.dirX = clampedDist > 5 ? knobX / maxRadius : 0;
      touchJoystick.dirY = clampedDist > 5 ? knobY / maxRadius : 0;
    }

    const resetJoystick = () => {
      touchId = null;
      touchJoystick.active = false;
      touchJoystick.dirX = 0;
      touchJoystick.dirY = 0;
      joystickKnob.style.transform = 'translate(0px, 0px)';
    };

    joystickZone.addEventListener('touchend', resetJoystick);
    joystickZone.addEventListener('touchcancel', resetJoystick);

    touchShootBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      sound.init();
      mouse.isDown = true;
      tryShoot();
    });

    touchShootBtn.addEventListener('touchend', () => {
      mouse.isDown = false;
    });
  }

  // --- UI Screen Navigation ---
  function showScreen(screen) {
    [screenMenu, screenPause, screenGameOver, modalControls, modalOop].forEach(s => s.classList.add('hidden'));
    if (screen) {
      screen.classList.remove('hidden');
    }
  }

  btnPlayGame.addEventListener('click', () => {
    sound.init();
    startGame();
  });

  btnControlsGuide.addEventListener('click', () => {
    sound.init();
    modalControls.classList.remove('hidden');
  });

  btnCloseControls.addEventListener('click', () => {
    modalControls.classList.add('hidden');
  });

  btnOopGuide.addEventListener('click', () => {
    sound.init();
    modalOop.classList.remove('hidden');
  });

  btnCloseOop.addEventListener('click', () => {
    modalOop.classList.add('hidden');
  });

  btnPauseGame.addEventListener('click', () => {
    togglePause();
  });

  btnSoundToggle.addEventListener('click', () => {
    sound.init();
    sound.toggleMute();
  });

  btnResumeGame.addEventListener('click', () => {
    resumeGame();
  });

  btnRestartFromPause.addEventListener('click', () => {
    startGame();
  });

  btnOopFromPause.addEventListener('click', () => {
    modalOop.classList.remove('hidden');
  });

  btnMenuFromPause.addEventListener('click', () => {
    returnToMenu();
  });

  btnRestartGame.addEventListener('click', () => {
    startGame();
  });

  btnMenuFromGo.addEventListener('click', () => {
    returnToMenu();
  });

  function togglePause() {
    if (!engine) return;
    const st = engine.getStateValue();
    if (st === 1) { // PLAYING -> PAUSE
      engine.pause();
      pauseWave.textContent = engine.getWave();
      pauseScore.textContent = engine.getScore();
      pauseZombies.textContent = engine.getRemainingZombies();
      showScreen(screenPause);
    } else if (st === 2) { // PAUSED -> RESUME
      resumeGame();
    }
  }

  function resumeGame() {
    if (!engine) return;
    engine.resume();
    showScreen(null);
  }

  function startGame() {
    showScreen(null);
    hudOverlay.classList.remove('hidden');
    engine.restart();
    sound.playWaveStart();
    camera.x = engine.getPlayerX();
    camera.y = engine.getPlayerY();
  }

  function returnToMenu() {
    showScreen(screenMenu);
    hudOverlay.classList.add('hidden');
    loadRecords();
  }

  function loadRecords() {
    const bestScore = localStorage.getItem(STORAGE_KEY_SCORE) || 0;
    const bestTime = localStorage.getItem(STORAGE_KEY_TIME) || 0;
    if (menuBestScore) menuBestScore.textContent = `${bestScore} PTS`;
    if (menuBestTime) menuBestTime.textContent = formatTime(parseFloat(bestTime));
  }
  loadRecords();

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function tryShoot() {
    if (!engine || engine.getStateValue() !== 1) return;
    const shotFired = engine.shoot(mouse.x, mouse.y);
    if (shotFired) {
      sound.playShot();
      const px = engine.getPlayerX();
      const py = engine.getPlayerY();
      const angle = Math.atan2(mouse.y - py, mouse.x - px);
      addMuzzleFlash(px, py, angle);
    } else if (engine.getPlayerAmmo() <= 0) {
      sound.playEmptyClick();
      const px = engine.getPlayerX();
      const py = engine.getPlayerY();
      floatingTexts.push(new FloatingText(px, py - 25, 'EMPTY!', '#ff3366'));
    }
  }

  // --- Main Simulation & Render Loop ---
  let lastTime = performance.now();

  function gameLoop(currentTime) {
    const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
  }

  function update(dt) {
    if (!engine) return;

    const state = engine.getStateValue();

    if (state === 1) { // PLAYING
      // Calculate movement input
      let dirX = 0;
      let dirY = 0;

      if (keys.w || keys.ArrowUp) dirY -= 1;
      if (keys.s || keys.ArrowDown) dirY += 1;
      if (keys.a || keys.ArrowLeft) dirX -= 1;
      if (keys.d || keys.ArrowRight) dirX += 1;

      if (touchJoystick.active) {
        dirX = touchJoystick.dirX;
        dirY = touchJoystick.dirY;
      }

      engine.handlePlayerInput(dirX, dirY, dt);

      // Continuous firing if mouse is held down
      if (mouse.isDown || keys.Space) {
        tryShoot();
      }

      // Step physics & simulation
      engine.update(dt);

      // Handle Events triggered by C++ logic
      handleEngineEvents();

      // Camera smoothly tracks player
      const px = engine.getPlayerX();
      const py = engine.getPlayerY();
      camera.x += (px - camera.x) * 0.1;
      camera.y += (py - camera.y) * 0.1;

      // Update HUD
      updateHud();
    } else if (state === 3 && screenGameOver.classList.contains('hidden')) {
      // Transition to Game Over screen
      handleGameOver();
    }

    // Decay camera shake
    if (camera.shake > 0) {
      camera.shake = Math.max(0, camera.shake - dt * 25);
    }

    // Update Particles & Floating Text
    for (let i = particles.length - 1; i >= 0; i--) {
      if (!particles[i].update(dt)) {
        particles.splice(i, 1);
      }
    }

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      if (!floatingTexts[i].update(dt)) {
        floatingTexts.splice(i, 1);
      }
    }
  }

  function handleEngineEvents() {
    const ev = engine.events;
    if (!ev) return;

    if (ev.zombieHit) {
      sound.playHit();
      addHitSparks(mouse.x, mouse.y);
    }
    if (ev.zombieKilled) {
      sound.playKill();
      addBloodSplat(mouse.x, mouse.y);
      floatingTexts.push(new FloatingText(mouse.x, mouse.y - 15, '+100', '#ffb703'));
    }
    if (ev.playerDamaged) {
      sound.playHurt();
      camera.shake = 12.0;
      const px = engine.getPlayerX();
      const py = engine.getPlayerY();
      addBloodSplat(px, py);
      floatingTexts.push(new FloatingText(px, py - 25, 'HIT!', '#ff3366'));
    }
    if (ev.supplyPickedUp) {
      sound.playPickup();
      const px = engine.getPlayerX();
      const py = engine.getPlayerY();
      const isHealth = (ev.lastSupplyType === 0);
      const text = isHealth ? '+30 HP' : '+30 AMMO';
      const color = isHealth ? '#00ff88' : '#ffb703';
      floatingTexts.push(new FloatingText(px, py - 30, text, color));
    }
    if (ev.waveStarted) {
      sound.playWaveStart();
    }
  }

  function updateHud() {
    const wave = engine.getWave();
    const remaining = engine.getRemainingZombies();
    const score = engine.getScore();
    const time = engine.getSurvivalTime();

    hudWave.textContent = wave;
    hudZombies.textContent = remaining;
    hudTimer.textContent = formatTime(time);
    hudScore.textContent = score;

    const hp = Math.max(0, engine.getPlayerHealth());
    const maxHp = engine.getPlayerMaxHealth();
    const ammo = Math.max(0, engine.getPlayerAmmo());
    const maxAmmo = engine.getPlayerMaxAmmo();

    hudHealthText.textContent = `${Math.ceil(hp)} / ${maxHp}`;
    hudHealthFill.style.width = `${Math.min(100, (hp / maxHp) * 100)}%`;

    hudAmmoText.textContent = `${ammo} / ${maxAmmo}`;
    hudAmmoFill.style.width = `${Math.min(100, (ammo / maxAmmo) * 100)}%`;

    // Wave Banner
    if (engine.isInWaveTransition()) {
      const countdown = Math.ceil(engine.getWaveTransitionTimer());
      waveBannerTitle.textContent = `WAVE ${wave}`;
      waveBannerSub.textContent = `INCOMING SWARM IN ${countdown}...`;
      waveBanner.classList.remove('hidden');
    } else {
      waveBanner.classList.add('hidden');
    }
  }

  function handleGameOver() {
    sound.playGameOver();
    const finalScore = engine.getScore();
    const finalTime = engine.getSurvivalTime();
    const finalWave = engine.getWave();

    goFinalScore.textContent = finalScore;
    goFinalWave.textContent = finalWave;
    goFinalTime.textContent = formatTime(finalTime);

    const prevBest = parseInt(localStorage.getItem(STORAGE_KEY_SCORE) || '0', 10);
    if (finalScore > prevBest) {
      localStorage.setItem(STORAGE_KEY_SCORE, finalScore);
      localStorage.setItem(STORAGE_KEY_TIME, finalTime);
      newHighScoreBanner.classList.remove('hidden');
      goBestScore.textContent = `${finalScore} ★`;
    } else {
      newHighScoreBanner.classList.add('hidden');
      goBestScore.textContent = prevBest;
    }

    showScreen(screenGameOver);
  }

  // --- Procedural Canvas Rendering ---
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    // Camera Transformation & Screen Shake
    let shakeX = 0, shakeY = 0;
    if (camera.shake > 0) {
      shakeX = (Math.random() - 0.5) * camera.shake;
      shakeY = (Math.random() - 0.5) * camera.shake;
    }

    ctx.translate(canvas.width / 2 + shakeX, canvas.height / 2 + shakeY);
    ctx.scale(camera.scale, camera.scale);
    ctx.translate(-camera.x, -camera.y);

    // 1. Draw Arena Ground
    drawArena();

    if (engine) {
      // 2. Draw Supplies
      drawSupplies();

      // 3. Draw Bullets
      drawBullets();

      // 4. Draw Zombies
      drawZombies();

      // 5. Draw Player & Flashlight
      drawPlayer();
    }

    // 6. Draw Particles
    for (const p of particles) {
      p.render(ctx);
    }

    // 7. Draw Floating Combat Text
    for (const ft of floatingTexts) {
      ft.render(ctx);
    }

    ctx.restore();

    // 8. Screen Vignette Overlay
    drawVignette();
  }

  function drawArena() {
    // Arena Floor
    ctx.fillStyle = '#0f141c';
    ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    // Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const GRID_SIZE = 80;

    ctx.beginPath();
    for (let x = 0; x <= ARENA_WIDTH; x += GRID_SIZE) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ARENA_HEIGHT);
    }
    for (let y = 0; y <= ARENA_HEIGHT; y += GRID_SIZE) {
      ctx.moveTo(0, y);
      ctx.lineTo(ARENA_WIDTH, y);
    }
    ctx.stroke();

    // Center Outpost Marker
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.12)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ARENA_WIDTH / 2, ARENA_HEIGHT / 2, 90, 0, Math.PI * 2);
    ctx.stroke();

    // Outpost Perimeter Hazard Border
    ctx.strokeStyle = '#ff3366';
    ctx.lineWidth = 6;
    ctx.strokeRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    // Subtle Outer Void
    ctx.fillStyle = '#06080b';
    ctx.fillRect(-1000, -1000, ARENA_WIDTH + 2000, 1000);
    ctx.fillRect(-1000, ARENA_HEIGHT, ARENA_WIDTH + 2000, 1000);
    ctx.fillRect(-1000, 0, 1000, ARENA_HEIGHT);
    ctx.fillRect(ARENA_WIDTH, 0, 1000, ARENA_HEIGHT);
  }

  function drawPlayer() {
    const px = engine.getPlayerX();
    const py = engine.getPlayerY();
    const pr = engine.getPlayerRadius();
    const isInvuln = engine.isPlayerInvulnerable();

    const angle = Math.atan2(mouse.y - py, mouse.x - px);

    // Blinking effect during invulnerability frames
    if (isInvuln && Math.floor(Date.now() / 80) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // Flashlight & Laser Sight
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);

    // Flashlight cone
    const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, 320);
    grad.addColorStop(0, 'rgba(255, 255, 220, 0.22)');
    grad.addColorStop(0.5, 'rgba(255, 255, 220, 0.08)');
    grad.addColorStop(1, 'rgba(255, 255, 220, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 320, -Math.PI / 6, Math.PI / 6);
    ctx.closePath();
    ctx.fill();

    // Laser Sight
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pr + 6, 4);
    ctx.lineTo(600, 4);
    ctx.stroke();

    // Weapon Barrel
    ctx.fillStyle = '#22272e';
    ctx.fillRect(8, 2, 18, 5);
    ctx.fillStyle = '#444d56';
    ctx.fillRect(20, 3, 6, 3);

    // Player Body (Tactical Survivor)
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.arc(0, 0, pr, 0, Math.PI * 2);
    ctx.fill();

    // Tactical Vest
    ctx.fillStyle = '#2e7d32';
    ctx.beginPath();
    ctx.arc(0, 0, pr - 3, 0, Math.PI * 2);
    ctx.fill();

    // Hands
    ctx.fillStyle = '#d1a075';
    ctx.beginPath();
    ctx.arc(14, 6, 4, 0, Math.PI * 2);
    ctx.arc(8, -8, 4, 0, Math.PI * 2);
    ctx.fill();

    // Helmet / Head
    ctx.fillStyle = '#374151';
    ctx.beginPath();
    ctx.arc(-2, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    ctx.globalAlpha = 1.0;
  }

  function drawZombies() {
    const count = engine.getZombieCount();
    const time = performance.now() * 0.008;

    for (let i = 0; i < count; i++) {
      const zx = engine.getZombieX(i);
      const zy = engine.getZombieY(i);
      const zr = engine.getZombieRadius(i);
      const type = engine.getZombieType(i);
      const health = engine.getZombieHealth(i);
      const maxHealth = engine.getZombieMaxHealth(i);

      const px = engine.getPlayerX();
      const py = engine.getPlayerY();
      const angle = Math.atan2(py - zy, px - zx);

      ctx.save();
      ctx.translate(zx, zy);
      ctx.rotate(angle);

      // Arm walking bob
      const armBob = Math.sin(time + i) * 4;

      if (type === 1) { // RUNNER
        // Agile red infected
        ctx.fillStyle = '#ff3366';
        ctx.beginPath();
        ctx.arc(0, 0, zr, 0, Math.PI * 2);
        ctx.fill();

        // Reaching claws
        ctx.fillStyle = '#8a0a28';
        ctx.beginPath();
        ctx.arc(zr + 2, 6 + armBob, 3, 0, Math.PI * 2);
        ctx.arc(zr + 2, -6 - armBob, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (type === 2) { // TANK
        // Hulking armored behemoth
        ctx.fillStyle = '#4a154b';
        ctx.beginPath();
        ctx.arc(0, 0, zr, 0, Math.PI * 2);
        ctx.fill();

        // Hardened spikes
        ctx.fillStyle = '#9c27b0';
        ctx.beginPath();
        ctx.arc(0, 0, zr - 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#2d0c2e';
        ctx.fillRect(zr - 2, 8 + armBob, 8, 8);
        ctx.fillRect(zr - 2, -16 - armBob, 8, 8);
      } else { // NORMAL
        // Decayed rotting green
        ctx.fillStyle = '#2d5a27';
        ctx.beginPath();
        ctx.arc(0, 0, zr, 0, Math.PI * 2);
        ctx.fill();

        // Rotten arms
        ctx.fillStyle = '#437c3b';
        ctx.beginPath();
        ctx.arc(zr + 1, 5 + armBob, 3.5, 0, Math.PI * 2);
        ctx.arc(zr + 1, -5 - armBob, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // Health bar above zombie if damaged
      if (health < maxHealth) {
        const barW = zr * 2.2;
        const barH = 4;
        const barX = zx - barW / 2;
        const barY = zy - zr - 9;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(barX, barY, barW, barH);

        const healthRatio = Math.max(0, health / maxHealth);
        ctx.fillStyle = '#ff3366';
        ctx.fillRect(barX, barY, barW * healthRatio, barH);
      }
    }
  }

  function drawBullets() {
    const count = engine.getBulletCount();
    ctx.fillStyle = '#ffea75';
    ctx.shadowColor = '#ffb703';
    ctx.shadowBlur = 8;

    for (let i = 0; i < count; i++) {
      const bx = engine.getBulletX(i);
      const by = engine.getBulletY(i);
      const br = engine.getBulletRadius(i);

      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
  }

  function drawSupplies() {
    const count = engine.getSupplyCount();
    const hoverOffset = Math.sin(performance.now() * 0.005) * 3;

    for (let i = 0; i < count; i++) {
      const sx = engine.getSupplyX(i);
      const sy = engine.getSupplyY(i) + hoverOffset;
      const sr = engine.getSupplyRadius(i);
      const type = engine.getSupplyType(i);

      ctx.save();
      ctx.translate(sx, sy);

      // Shadow below crate
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(0, sr + 4 - hoverOffset, sr * 0.9, sr * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();

      if (type === 0) { // HEALTH CRATE
        ctx.fillStyle = '#042f1a';
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 10;
        ctx.fillRect(-sr, -sr, sr * 2, sr * 2);
        ctx.strokeRect(-sr, -sr, sr * 2, sr * 2);

        // White cross
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 0;
        ctx.fillRect(-3, -8, 6, 16);
        ctx.fillRect(-8, -3, 16, 6);
      } else { // AMMO CRATE
        ctx.fillStyle = '#3a2500';
        ctx.strokeStyle = '#ffb703';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ffb703';
        ctx.shadowBlur = 10;
        ctx.fillRect(-sr, -sr, sr * 2, sr * 2);
        ctx.strokeRect(-sr, -sr, sr * 2, sr * 2);

        // Ammo bullet icon
        ctx.fillStyle = '#ffb703';
        ctx.shadowBlur = 0;
        ctx.fillRect(-6, -4, 12, 8);
        ctx.beginPath();
        ctx.arc(6, 0, 4, -Math.PI / 2, Math.PI / 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  function drawVignette() {
    const grad = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, canvas.width * 0.35,
      canvas.width / 2, canvas.height / 2, canvas.width * 0.75
    );
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, 'rgba(4, 7, 10, 0.65)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // --- Bootstrap Initialization ---
  initEngine();
  requestAnimationFrame(gameLoop);

})();
