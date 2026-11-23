(() => {
  'use strict';

  // ---------- Cau hinh ----------
  const W = 800, H = 240, GROUND = 190;
  const GRAVITY = 2600;          // px/s^2
  const JUMP_V = -820;           // van toc nhay ban dau
  const START_SPEED = 320;
  const MAX_SPEED = 820;
  const ACCEL = 6;               // px/s moi giay

  const THEMES = {
    day:   { fg: '#535353', ground: '#8a8a8a', cloud: '#e3e3e3', dino: '#2e9e55', spike: '#1f7a40', cactus: '#3f8f4a', eye: '#ffffff' },
    night: { fg: '#e8e8e8', ground: '#7d7d85', cloud: '#2b2d35', dino: '#55d68a', spike: '#3aa868', cactus: '#62c070', eye: '#17181c' },
  };

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  function setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  setupCanvas();
  window.addEventListener('resize', setupCanvas);

  // ---------- Luu diem cao ----------
  function loadHi() {
    try { return parseInt(localStorage.getItem('dino-hi') || '0', 10) || 0; } catch (e) { return 0; }
  }
  function saveHi(v) {
    try { localStorage.setItem('dino-hi', String(v)); } catch (e) { /* bo qua */ }
  }

  // ---------- Am thanh ----------
  let audioCtx = null;
  let muted = false;
  function beep(freq, dur, type, vol) {
    if (muted) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      const t = audioCtx.currentTime;
      o.type = type || 'square';
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(vol || 0.05, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start(t);
      o.stop(t + dur);
    } catch (e) { /* bo qua */ }
  }

  // ---------- Trang thai ----------
  const dino = { x: 50, y: GROUND, vy: 0, onGround: true, duck: false, frame: 0 };
  let state = 'ready';           // ready | running | paused | over
  let speed = START_SPEED;
  let score = 0;
  let hi = loadHi();
  let obstacles = [];
  let clouds = [];
  let pebbles = [];
  let theme = 'day';
  let blinkTimer = 0;
  let lastMilestone = 0;
  let overAt = 0;

  for (let i = 0; i < 4; i++) clouds.push({ x: Math.random() * W, y: 30 + Math.random() * 70, s: 0.7 + Math.random() * 0.6 });
  for (let i = 0; i < 24; i++) pebbles.push({ x: Math.random() * W, y: GROUND + 8 + Math.random() * 28, w: 2 + Math.random() * 6 });

  function setTheme(name) {
    theme = name;
    document.body.dataset.theme = name;
  }

  function reset() {
    speed = START_SPEED;
    score = 0;
    obstacles = [];
    dino.y = GROUND; dino.vy = 0; dino.onGround = true; dino.duck = false; dino.frame = 0;
    lastMilestone = 0;
    blinkTimer = 0;
    setTheme('day');
  }

  function start() {
    reset();
    state = 'running';
  }

  function gameOver() {
    state = 'over';
    overAt = performance.now();
    dino.duck = false;
    beep(160, 0.35, 'sawtooth', 0.08);
    const s = Math.floor(score);
    if (s > hi) { hi = s; saveHi(hi); }
  }

  // ---------- Vat can ----------
  function spawn() {
    const r = Math.random();
    let o;
    if (score > 300 && r < 0.25) {
      const ys = [172, 142, 100];   // thap (phai nhay), vua (phai cui), cao (di duoi)
      o = { type: 'bird', w: 40, h: 26, cy: ys[Math.floor(Math.random() * ys.length)], flap: 0 };
    } else if (r < 0.65) {
      const n = 1 + Math.floor(Math.random() * 3);
      o = { type: 'cactus', n, stemW: 16, h: 36, w: n * 16 + (n - 1) * 5, arms: false };
    } else {
      const n = 1 + Math.floor(Math.random() * 2);
      o = { type: 'cactus', n, stemW: 24, h: 52, w: n * 24 + (n - 1) * 6, arms: true };
    }
    o.x = W + 20;
    obstacles.push(o);
  }

  function boxOf(o) {
    if (o.type === 'bird') return { x: o.x, y: o.cy - o.h / 2, w: o.w, h: o.h };
    return { x: o.x, y: GROUND - o.h, w: o.w, h: o.h };
  }

  function dinoBox() {
    if (dino.duck && dino.onGround) return { x: dino.x + 3, y: GROUND - 26 + 2, w: 50, h: 22 };
    return { x: dino.x + 6, y: dino.y - 44 + 4, w: 30, h: 40 };
  }

  function hit(a, b, pad) {
    return a.x + pad < b.x + b.w && a.x + a.w - pad > b.x &&
           a.y + pad < b.y + b.h && a.y + a.h - pad > b.y;
  }

  // ---------- Cap nhat ----------
  function update(dt) {
    speed = Math.min(MAX_SPEED, speed + ACCEL * dt);
    score += speed * dt * 0.04;

    if (!dino.onGround) {
      const g = dino.duck ? GRAVITY * 2.6 : GRAVITY;
      dino.vy += g * dt;
      dino.y += dino.vy * dt;
      if (dino.y >= GROUND) { dino.y = GROUND; dino.vy = 0; dino.onGround = true; }
    }
    dino.frame += dt * (speed / 32);

    for (const o of obstacles) {
      o.x -= (o.type === 'bird' ? speed + 50 : speed) * dt;
      if (o.type === 'bird') o.flap += dt * 8;
    }
    obstacles = obstacles.filter(o => o.x + o.w > -30);

    // sinh vat can moi khi vat can cuoi da du xa
    const last = obstacles[obstacles.length - 1];
    const gap = speed * (0.75 + Math.random() * 0.9) + 60;
    if (!last || (W - (last.x + last.w)) > (last._gap || (last._gap = gap))) spawn();

    const db = dinoBox();
    for (const o of obstacles) {
      if (hit(db, boxOf(o), 3)) { gameOver(); break; }
    }

    // moc diem
    const m = Math.floor(score / 100);
    if (m > lastMilestone) {
      lastMilestone = m;
      blinkTimer = 0.9;
      beep(880, 0.12, 'square', 0.04);
      setTheme(Math.floor(score / 700) % 2 === 1 ? 'night' : 'day');
    }
    if (blinkTimer > 0) blinkTimer -= dt;
  }

  function scrollBackground(dt, factor) {
    for (const c of clouds) {
      c.x -= speed * 0.15 * c.s * factor * dt;
      if (c.x < -80) { c.x = W + 40 + Math.random() * 100; c.y = 30 + Math.random() * 70; }
    }
    for (const p of pebbles) {
      p.x -= speed * factor * dt;
      if (p.x < -10) { p.x += W + 20; p.y = GROUND + 8 + Math.random() * 28; p.w = 2 + Math.random() * 6; }
    }
  }

  // ---------- Ve ----------
  function rr(x, y, w, h, r) {
    ctx.beginPath();
    const rad = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
    ctx.fill();
  }
  function tri(x1, y1, x2, y2, x3, y3) {
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3);
    ctx.closePath();
    ctx.fill();
  }

  function drawEye(x, y, dead) {
    const T = THEMES[theme];
    if (dead) {
      ctx.strokeStyle = T.eye; ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x - 3, y - 3); ctx.lineTo(x + 3, y + 3);
      ctx.moveTo(x + 3, y - 3); ctx.lineTo(x - 3, y + 3);
      ctx.stroke();
    } else {
      ctx.fillStyle = T.eye;
      ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#222';
      ctx.beginPath(); ctx.arc(x + 1, y, 1.5, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawDino(dead) {
    const T = THEMES[theme];
    const x = dino.x, feet = dino.y;
    const running = dino.onGround && state === 'running';
    const lift = running ? (Math.floor(dino.frame * 2) % 2 ? 4 : 0) : 0;
    const liftB = running ? (Math.floor(dino.frame * 2) % 2 ? 0 : 4) : 0;

    if (dino.duck && dino.onGround) {
      const top = feet - 26;
      ctx.fillStyle = T.spike;
      tri(x - 10, top + 8, x + 8, top + 4, x + 8, top + 20);
      ctx.fillStyle = T.dino;
      rr(x + 2, top + 6, 36, 18, 8);
      rr(x + 30, top, 24, 16, 7);
      ctx.fillStyle = T.spike;
      tri(x + 8, top + 7, x + 14, top + 1, x + 20, top + 7);
      tri(x + 20, top + 7, x + 26, top + 2, x + 32, top + 8);
      ctx.fillStyle = T.dino;
      rr(x + 10, feet - 6, 7, 6 - lift * 0.5, 2);
      rr(x + 24, feet - 6, 7, 6 - liftB * 0.5, 2);
      drawEye(x + 46, top + 6, dead);
    } else {
      const top = feet - 44;
      ctx.fillStyle = T.spike;
      tri(x - 14, top + 30, x + 8, top + 18, x + 8, top + 36);
      ctx.fillStyle = T.dino;
      rr(x + 4, top + 14, 28, 24, 9);
      rr(x + 18, top, 22, 20, 8);
      ctx.fillStyle = T.spike;
      tri(x + 6, top + 16, x + 12, top + 7, x + 18, top + 15);
      tri(x + 14, top + 14, x + 20, top + 5, x + 26, top + 13);
      ctx.fillStyle = T.dino;
      rr(x + 30, top + 27, 9, 3.5, 1.5);
      rr(x + 9, feet - 9, 7, 9 - lift, 2);
      rr(x + 22, feet - 9, 7, 9 - liftB, 2);
      ctx.fillStyle = T.spike;
      ctx.fillRect(x + 35, top + 13, 3, 2);   // lo mui
      drawEye(x + 33, top + 7, dead);
    }
  }

  function drawCactus(o) {
    const T = THEMES[theme];
    ctx.fillStyle = T.cactus;
    for (let i = 0; i < o.n; i++) {
      const sx = o.x + i * (o.stemW + (o.arms ? 6 : 5));
      const top = GROUND - o.h;
      rr(sx, top, o.stemW, o.h, o.stemW / 2.2);
      if (o.arms) {
        // canh tay trai/phai
        rr(sx - 6, top + o.h * 0.38, 8, 5, 2);
        rr(sx - 6, top + o.h * 0.2, 5, o.h * 0.23, 2);
        rr(sx + o.stemW - 2, top + o.h * 0.5, 8, 5, 2);
        rr(sx + o.stemW + 1, top + o.h * 0.32, 5, o.h * 0.23, 2);
      }
    }
  }

  function drawBird(o) {
    const T = THEMES[theme];
    const cx = o.x + o.w / 2, cy = o.cy;
    ctx.fillStyle = T.fg;
    ctx.beginPath(); ctx.ellipse(cx, cy, 14, 7, 0, 0, Math.PI * 2); ctx.fill();
    tri(o.x, cy, o.x + 11, cy - 3.5, o.x + 11, cy + 3.5);                  // mo
    tri(o.x + o.w, cy, o.x + o.w - 11, cy - 4, o.x + o.w - 11, cy + 4);    // duoi
    const up = Math.floor(o.flap) % 2 === 0;
    if (up) tri(cx - 6, cy - 4, cx + 9, cy - 4, cx + 3, cy - 20);
    else tri(cx - 6, cy + 4, cx + 9, cy + 4, cx + 3, cy + 18);
    ctx.fillStyle = THEMES[theme].eye === '#ffffff' ? '#f7f7f7' : '#17181c';
    ctx.beginPath(); ctx.arc(o.x + 14, cy - 1.5, 1.6, 0, Math.PI * 2); ctx.fill();
  }

  function drawCloud(c) {
    ctx.fillStyle = THEMES[theme].cloud;
    const s = c.s * 14;
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, s * 2.4, s * 0.8, 0, 0, Math.PI * 2);
    ctx.ellipse(c.x - s * 0.8, c.y - s * 0.5, s * 1.1, s * 0.8, 0, 0, Math.PI * 2);
    ctx.ellipse(c.x + s * 0.7, c.y - s * 0.7, s * 1.3, s * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function pad5(n) { return String(Math.floor(n)).padStart(5, '0'); }

  function drawText(text, x, y, size, align, alpha) {
    ctx.globalAlpha = alpha === undefined ? 1 : alpha;
    ctx.fillStyle = THEMES[theme].fg;
    ctx.textAlign = align || 'center';
    ctx.font = (size || 16) + 'px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(text, x, y);
    ctx.globalAlpha = 1;
  }

  function draw() {
    const T = THEMES[theme];
    ctx.clearRect(0, 0, W, H);

    for (const c of clouds) drawCloud(c);

    // mat dat
    ctx.fillStyle = T.ground;
    ctx.fillRect(0, GROUND + 1, W, 2);
    for (const p of pebbles) ctx.fillRect(p.x, p.y, p.w, 2);

    for (const o of obstacles) {
      if (o.type === 'bird') drawBird(o); else drawCactus(o);
    }
    drawDino(state === 'over');

    // diem so
    const showScore = !(blinkTimer > 0 && Math.floor(blinkTimer * 8) % 2 === 0);
    ctx.font = 'bold 16px "Courier New", monospace';
    if (hi > 0) drawText('HI ' + pad5(hi), W - 110, 28, 16, 'right', 0.6);
    if (showScore) drawText(pad5(score), W - 16, 28, 16, 'right');
    ctx.font = 'bold 16px "Courier New", monospace';

    if (state === 'ready') {
      drawText('Nhấn SPACE hoặc chạm màn hình để bắt đầu', W / 2, 90, 18);
    } else if (state === 'paused') {
      drawText('TẠM DỪNG', W / 2, 80, 26);
      drawText('Nhấn SPACE hoặc P để chơi tiếp', W / 2, 108, 15, 'center', 0.75);
    } else if (state === 'over') {
      drawText('GAME OVER', W / 2, 80, 26);
      drawText('Nhấn SPACE hoặc chạm để chơi lại', W / 2, 108, 15, 'center', 0.75);
    }
  }

  // ---------- Vong lap ----------
  let lastTs = 0;
  function frame(ts) {
    if (!lastTs) lastTs = ts;
    let dt = (ts - lastTs) / 1000;
    lastTs = ts;
    if (dt > 0.05) dt = 0.05;       // tranh nhay vot khi chuyen tab

    if (state === 'running') {
      update(dt);
      scrollBackground(dt, 1);
    } else if (state === 'ready') {
      scrollBackground(dt, 0.15);
    }
    draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ---------- Dieu khien ----------
  function pause() {
    if (state === 'running') { state = 'paused'; dino.duck = false; }
  }
  function resume() {
    if (state === 'paused') state = 'running';
  }

  function pressJump() {
    if (state === 'paused') { resume(); return; }
    if (state === 'ready') start();
    else if (state === 'over') {
      if (performance.now() - overAt < 400) return;   // tranh bam nham ngay sau khi thua
      start();
    }
    if (state === 'running' && dino.onGround) {
      dino.vy = JUMP_V;
      dino.onGround = false;
      beep(520, 0.09, 'square', 0.035);
    }
  }
  function releaseJump() {
    if (!dino.onGround && dino.vy < -300) dino.vy = -300;   // nhay thap khi tha phim som
  }
  function setDuck(v) {
    if (state === 'running') dino.duck = v;
    else if (!v) dino.duck = false;
  }

  const JUMP_KEYS = ['Space', 'ArrowUp', 'KeyW'];
  const DUCK_KEYS = ['ArrowDown', 'KeyS'];

  window.addEventListener('keydown', (e) => {
    if (JUMP_KEYS.includes(e.code) || DUCK_KEYS.includes(e.code)) e.preventDefault();
    if (DUCK_KEYS.includes(e.code)) { setDuck(true); return; }
    if (e.repeat) return;
    if (JUMP_KEYS.includes(e.code)) pressJump();
    else if (e.code === 'KeyM') muted = !muted;
    else if (e.code === 'KeyP' || e.code === 'Escape') { if (state === 'paused') resume(); else pause(); }
  });
  window.addEventListener('keyup', (e) => {
    if (JUMP_KEYS.includes(e.code)) releaseJump();
    else if (DUCK_KEYS.includes(e.code)) setDuck(false);
  });
  canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); pressJump(); });
  canvas.addEventListener('pointerup', releaseJump);
  window.addEventListener('blur', pause);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

  // Bao cho launcher biet cua so van dang mo (de tu tat server khi dong)
  function heartbeat() {
    if (typeof fetch === 'function') fetch('/__alive', { cache: 'no-store' }).catch(() => {});
  }
  heartbeat();
  setInterval(heartbeat, 5000);

  // De test tu dong / debug trong console
  window.__dino = {
    get state() { return state; },
    get score() { return Math.floor(score); },
    get speed() { return Math.round(speed); },
    get obstacles() { return obstacles.length; },
  };
})();
