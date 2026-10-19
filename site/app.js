(() => {
  'use strict';

  document.documentElement.classList.add('js');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const body = document.body;
  const $ = (sel) => document.querySelector(sel);

  /* ================================================================
     Digitaler Regen
     ================================================================ */
  const canvas = $('#rain');
  const ctx = canvas.getContext('2d');
  const GLYPHS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789Z:.=*+-<>¦|';
  const FONT = '"Hiragino Kaku Gothic ProN", "MS Gothic", "Noto Sans JP", monospace';
  const rain = { speed: 1, size: 16, cols: 0, drops: [], chars: [], w: 0, h: 0, last: 0 };

  const randomGlyph = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];

  function resize(force) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // Mobile Adressleiste ein/aus: kleine Höhenänderungen ignorieren
    if (!force && w === rain.w && Math.abs(h - rain.h) < 160) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    rain.w = w;
    rain.h = h;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    rain.size = w < 520 ? 14 : 18;
    rain.cols = Math.ceil(w / rain.size);
    const rows = h / rain.size;
    const old = rain.drops;
    rain.drops = Array.from({ length: rain.cols }, (_, i) => old[i] ?? -Math.random() * rows);
    rain.chars = Array.from({ length: rain.cols }, randomGlyph);

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    if (reduceMotion) drawStatic();
  }

  function step() {
    const s = rain.size;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.fillRect(0, 0, rain.w, rain.h);
    ctx.font = `${s}px ${FONT}`;
    ctx.textBaseline = 'top';

    for (let i = 0; i < rain.cols; i++) {
      const x = i * s;
      const y = rain.drops[i] * s;

      // bisheriges (helles) Kopfzeichen grün übermalen
      ctx.fillStyle = '#000';
      ctx.fillRect(x, y - s, s, s);
      ctx.fillStyle = '#00ff41';
      ctx.fillText(rain.chars[i], x, y - s);

      // neues helles Kopfzeichen
      const ch = randomGlyph();
      rain.chars[i] = ch;
      ctx.fillStyle = '#e0ffe6';
      ctx.fillText(ch, x, y);

      if (y > rain.h && Math.random() > 0.975) rain.drops[i] = 0;
      rain.drops[i] += 1;
    }
  }

  function drawStatic() {
    for (let i = 0; i < 90; i++) step();
  }

  function loop(t) {
    requestAnimationFrame(loop);
    if (rain.speed <= 0 || t - rain.last < 50 / rain.speed) return;
    rain.last = t;
    step();
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => resize(false), 150);
  });
  resize(true);
  if (!reduceMotion) requestAnimationFrame(loop);

  /* ================================================================
     Ablauf
     ================================================================ */
  let run = 0; // jede neue Aktion bricht laufende Animationen ab

  const wait = (ms) => new Promise((r) => setTimeout(r, reduceMotion ? Math.min(ms, 40) : ms));

  async function typeInto(el, text, id, speed = 40) {
    if (reduceMotion) {
      el.textContent += text;
      return id === run;
    }
    for (const c of text) {
      if (id !== run) return false;
      el.textContent += c;
      await wait(speed + Math.random() * 30);
    }
    return id === run;
  }

  const screens = { choice: $('#choice'), red: $('#red'), blue: $('#blue') };
  const pills = document.querySelectorAll('.pill-choice');

  function show(name) {
    for (const [key, el] of Object.entries(screens)) el.hidden = key !== name;
  }

  function focusHeading(section) {
    const h = section.querySelector('h1, h2');
    if (h) h.focus({ preventScroll: true });
  }

  async function intro(fromReset = false) {
    const id = ++run;
    body.dataset.state = 'choice';
    body.classList.remove('flash-on');
    rain.speed = 1;
    show('choice');
    screens.choice.classList.remove('is-ready');
    pills.forEach((p) => {
      p.disabled = false;
      p.classList.remove('is-chosen');
    });

    const kicker = $('#kicker');
    kicker.textContent = '';
    await wait(fromReset ? 600 : 500);
    if (!(await typeInto(kicker, 'Wach auf …', id, 90))) return;
    await wait(350);
    if (id !== run) return;
    screens.choice.classList.add('is-ready');
    if (fromReset) focusHeading(screens.choice);
  }

  function choose(color) {
    const id = ++run;
    screens.choice.classList.add('is-ready');
    pills.forEach((p) => { p.disabled = true; });
    $(`.pill-choice--${color}`).classList.add('is-chosen');
    if (navigator.vibrate) navigator.vibrate(color === 'red' ? [20, 60, 40] : 15);
    return color === 'red' ? takeRed(id) : takeBlue(id);
  }

  async function takeRed(id) {
    body.dataset.state = 'taking-red';
    rain.speed = 3.5;
    await wait(1600);
    if (id !== run) return;

    body.classList.add('flash-on');
    await wait(140);
    if (id !== run) return;

    const term = $('#terminal');
    term.textContent = '';
    screens.red.classList.remove('is-done');
    show('red');
    body.dataset.state = 'red';
    rain.speed = 0.6;
    body.classList.remove('flash-on');
    await wait(700);

    const lines = [
      '> Rote Pille geschluckt.\n',
      '> Trägersignal wird zurückverfolgt …\n',
      '> Verbindung zur Matrix: getrennt\n',
      '> Neuronale Schnittstelle: offline\n',
      '> Du bist frei.',
    ];
    for (const line of lines) {
      if (!(await typeInto(term, line, id, 26))) return;
      await wait(380);
    }
    if (id !== run) return;
    screens.red.classList.add('is-done');
    focusHeading(screens.red);
  }

  async function takeBlue(id) {
    body.dataset.state = 'taking-blue';
    rain.speed = 0.35;
    await wait(1400);
    if (id !== run) return;

    show('blue');
    body.dataset.state = 'blue-erase';
    await wait(3700);
    if (id !== run) return;

    $('#clock').textContent = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    body.dataset.state = 'blue';
    rain.speed = 0;
    focusHeading(screens.blue);
  }

  /* ================================================================
     Events
     ================================================================ */
  document.addEventListener('click', (e) => {
    const pill = e.target.closest('[data-pill]');
    if (pill && !pill.disabled) {
      choose(pill.dataset.pill);
      return;
    }
    if (e.target.closest('[data-action="reset"]')) intro(true);
  });

  document.addEventListener('keydown', (e) => {
    if (body.dataset.state !== 'choice' || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === 'r') choose('red');
    else if (k === 'b') choose('blue');
  });

  intro();
})();
