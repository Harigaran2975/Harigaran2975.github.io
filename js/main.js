/* =========================================================
   K. HARIGARAN — Neon Portfolio · interactions
   ========================================================= */
(() => {
  'use strict';

  clearTimeout(window.__khFallback);

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const root = document.documentElement;
  const body = document.body;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const THEMES = ['cyber', 'synth', 'matrix'];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rand = (a, b) => Math.random() * (b - a) + a;
  const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
  const smooth = () => (reduceMotion ? 'auto' : 'smooth');

  const safe = (name, fn) => {
    try { fn(); } catch (err) { console.warn(`[portfolio] ${name} failed:`, err); }
  };

  const onBoot = (cb) => {
    if (body.classList.contains('loaded')) cb();
    else document.addEventListener('kh:booted', cb, { once: true });
  };

  // Calls cb(true/false) as the element enters/leaves the viewport.
  const watch = (el, cb, threshold = 0.15) => {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { cb(true); return; }
    new IntersectionObserver((entries) => entries.forEach((e) => cb(e.isIntersecting)), { threshold }).observe(el);
  };

  const once = (el, cb, threshold = 0.3) => {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { cb(); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); cb(); }
    }, { threshold });
    io.observe(el);
  };

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(msg, icon = 'i-check') {
    const t = $('#toast');
    if (!t) return;
    t.textContent = '';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'i');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `#${icon}`);
    svg.appendChild(use);
    const span = document.createElement('span');
    span.textContent = msg;
    t.append(svg, span);
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
  }

  /* ---------- Theme ---------- */
  const currentTheme = () => root.dataset.theme || 'cyber';

  function setTheme(name) {
    if (!THEMES.includes(name)) return false;
    root.dataset.theme = name;
    try { localStorage.setItem('kh-theme', name); } catch (e) { /* storage unavailable */ }
    markSwatches();
    document.dispatchEvent(new CustomEvent('kh:themechange', { detail: name }));
    return true;
  }

  function markSwatches() {
    $$('.swatch[data-theme-set]').forEach((s) => {
      const on = s.dataset.themeSet === currentTheme();
      s.classList.toggle('active', on);
      s.setAttribute('aria-pressed', String(on));
    });
  }

  function initTheme() {
    $$('.swatch[data-theme-set]').forEach((s) =>
      s.addEventListener('click', () => {
        setTheme(s.dataset.themeSet);
        toast(`Theme: ${s.title || s.dataset.themeSet}`, 'i-zap');
      })
    );
    markSwatches();
  }

  /* ---------- Boot preloader ---------- */
  let booted = false;
  function bootDone() {
    if (booted) return;
    booted = true;
    const pre = $('#preloader');
    if (pre) {
      pre.classList.add('done');
      setTimeout(() => pre.remove(), 900);
    }
    body.classList.remove('booting');
    body.classList.add('loaded');
    document.dispatchEvent(new Event('kh:booted'));
  }

  function initPreloader() {
    const pre = $('#preloader');
    const finish = bootDone;

    let seen = false;
    try { seen = sessionStorage.getItem('kh-booted') === '1'; } catch (e) { /* ignore */ }
    if (!pre || seen || reduceMotion) { finish(); return; }

    body.classList.add('booting');
    const log = $('#bootLog');
    const bar = $('#bootBar');
    const pct = $('#bootPct');
    const lines = [
      'Initializing neon core',
      'Loading skills [Java · Python · React · SQL]',
      'Compiling projects & experience',
      'Calibrating holographic UI',
      'Establishing secure uplink',
    ];
    let stopped = false;

    const progress = (p) => {
      if (bar) bar.style.width = `${p}%`;
      if (pct) pct.textContent = `${p}%`;
    };

    const end = () => {
      if (stopped) return;
      stopped = true;
      try { sessionStorage.setItem('kh-booted', '1'); } catch (e) { /* ignore */ }
      progress(100);
      setTimeout(finish, 280);
    };

    pre.addEventListener('click', end);
    window.addEventListener('keydown', end, { once: true });
    setTimeout(end, 6000);

    (async () => {
      for (let i = 0; i < lines.length && !stopped; i++) {
        const row = document.createElement('div');
        row.textContent = `> ${lines[i]}... `;
        log.appendChild(row);
        progress(Math.round(((i + 1) / (lines.length + 1)) * 100));
        await sleep(rand(240, 380));
        const ok = document.createElement('span');
        ok.className = 'ok';
        ok.textContent = '[OK]';
        row.appendChild(ok);
      }
      if (stopped) return;
      const grant = document.createElement('div');
      grant.className = 'grant';
      grant.textContent = '> ACCESS GRANTED_';
      log.appendChild(grant);
      await sleep(420);
      end();
    })();
  }

  /* ---------- Particle network ---------- */
  function initParticles() {
    const canvas = $('#bg-canvas');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const LINK = 130;
    const MOUSE_R = 170;
    const mouse = { x: -9999, y: -9999 };
    let w = 0, h = 0, lastW = 0, parts = [], colors = [], raf = null;

    const readColors = () => {
      const cs = getComputedStyle(root);
      colors = ['--n1-rgb', '--n2-rgb', '--n3-rgb'].map((v) => cs.getPropertyValue(v).trim() || '255,255,255');
    };

    const make = () => {
      const count = Math.round(Math.min(110, Math.max(30, (w * h) / 16000)));
      parts = Array.from({ length: count }, () => ({
        x: rand(0, w), y: rand(0, h),
        vx: rand(-0.3, 0.3), vy: rand(-0.3, 0.3),
        r: rand(0.8, 2.2), c: Math.floor(rand(0, 3)),
      }));
    };

    const draw = (move) => {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        if (move) {
          p.x += p.vx; p.y += p.vy;
          if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
          if (p.y < -10) p.y = h + 10; else if (p.y > h + 10) p.y = -10;
          const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
          if (d2 < MOUSE_R * MOUSE_R && d2 > 0.01) {
            const d = Math.sqrt(d2), f = ((MOUSE_R - d) / MOUSE_R) * 0.8;
            p.x += (dx / d) * f; p.y += (dy / d) * f;
          }
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${colors[p.c]}, .85)`;
        ctx.fill();
      }
      ctx.lineWidth = 1;
      for (let i = 0; i < parts.length; i++) {
        const a = parts[i];
        for (let j = i + 1; j < parts.length; j++) {
          const b = parts[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
          if (d2 < LINK * LINK) {
            ctx.strokeStyle = `rgba(${colors[a.c]}, ${(1 - Math.sqrt(d2) / LINK) * 0.3})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        const mx = a.x - mouse.x, my = a.y - mouse.y, md = mx * mx + my * my;
        if (md < MOUSE_R * MOUSE_R) {
          ctx.strokeStyle = `rgba(${colors[1]}, ${(1 - Math.sqrt(md) / MOUSE_R) * 0.6})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
    };

    const loop = () => {
      draw(true);
      raf = requestAnimationFrame(loop);
    };
    const start = () => { if (!raf && !reduceMotion) loop(); };
    const stop = () => { if (raf) cancelAnimationFrame(raf); raf = null; };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!parts.length || Math.abs(w - lastW) > 60) { make(); lastW = w; }
      if (reduceMotion) draw(false);
    };

    readColors();
    resize();
    start();
    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
    window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    document.addEventListener('mouseleave', () => { mouse.x = mouse.y = -9999; });
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    document.addEventListener('kh:themechange', () => { readColors(); if (reduceMotion) draw(false); });
  }

  /* ---------- Custom cursor ---------- */
  function initCursor() {
    if (!finePointer) return;
    const dot = $('.cursor-dot');
    const ring = $('.cursor-ring');
    if (!dot || !ring) return;
    root.classList.add('has-cursor');
    let mx = -100, my = -100, rx = -100, ry = -100;
    const HOVER = 'a, button, input, textarea, label, .tilt, .flip, .chip, .tech, .pill, .stat, .terminal, .swatch';

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
      root.classList.add('cursor-visible');
    }, { passive: true });
    document.addEventListener('mouseleave', () => root.classList.remove('cursor-visible'));
    document.addEventListener('mouseover', (e) => {
      ring.classList.toggle('hover', !!(e.target.closest && e.target.closest(HOVER)));
    });
    window.addEventListener('mousedown', (e) => {
      ring.classList.add('down');
      if (reduceMotion) return;
      const b = document.createElement('span');
      b.className = 'click-burst';
      b.style.left = `${e.clientX}px`;
      b.style.top = `${e.clientY}px`;
      body.appendChild(b);
      setTimeout(() => b.remove(), 650);
    });
    window.addEventListener('mouseup', () => ring.classList.remove('down'));

    const follow = () => {
      rx += (mx - rx) * 0.2; ry += (my - ry) * 0.2;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(follow);
    };
    follow();
  }

  /* ---------- Navigation, progress, timeline ---------- */
  function initNav() {
    const nav = $('#nav');
    const progress = $('.scroll-progress');
    const toTop = $('#toTop');
    const ham = $('#hamburger');
    const menu = $('#navMenu');
    const timeline = $('#timeline');
    const fill = $('#timelineFill');
    const dots = $$('.tl-dot');
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const max = root.scrollHeight - window.innerHeight;
      if (nav) {
        nav.classList.toggle('scrolled', y > 30);
        if (Math.abs(y - lastY) > 6) {
          const hide = y > lastY && y > 420 && !nav.classList.contains('menu-open');
          nav.classList.toggle('nav-hide', hide);
          lastY = y;
        }
      }
      if (progress) progress.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      if (toTop) toTop.classList.toggle('show', y > 700);
      if (timeline && fill) {
        const r = timeline.getBoundingClientRect();
        const mark = window.innerHeight * 0.6;
        const p = Math.min(1, Math.max(0, (mark - r.top) / r.height));
        fill.style.transform = `scaleY(${p})`;
        dots.forEach((d) => {
          const dr = d.getBoundingClientRect();
          d.classList.toggle('active', dr.top + dr.height / 2 < mark);
        });
      }
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();

    const setMenu = (open) => {
      if (!nav) return;
      nav.classList.toggle('menu-open', open);
      body.classList.toggle('no-scroll', open);
      if (ham) ham.setAttribute('aria-expanded', String(open));
      if (open) nav.classList.remove('nav-hide');
    };
    if (ham) ham.addEventListener('click', () => setMenu(!nav.classList.contains('menu-open')));
    if (menu) $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
    window.addEventListener('resize', () => { if (window.innerWidth > 1100) setMenu(false); });
    if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: smooth() }));

    // Highlight the nav link of the section in view
    const links = $$('.nav-link');
    const byId = new Map(links.map((l) => [l.getAttribute('href').slice(1), l]));
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          links.forEach((l) => l.classList.remove('active'));
          const l = byId.get(en.target.id);
          if (l) l.classList.add('active');
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      $$('main section[id]').forEach((s) => io.observe(s));
    }

    // Scramble nav labels on hover
    if (finePointer) {
      links.forEach((l) => {
        const label = $('[data-scramble]', l);
        if (label) l.addEventListener('mouseenter', () => scramble(label, 450));
      });
    }
  }

  /* ---------- Text scramble ---------- */
  const GLYPHS = '!<>-_\\/[]{}=+*^?#01ABCDEFXYZ';
  const originals = new WeakMap();
  function scramble(el, duration = 700) {
    if (reduceMotion || !el) return;
    if (!originals.has(el)) originals.set(el, el.textContent);
    const text = originals.get(el);
    cancelAnimationFrame(el._scrRaf);
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      const shown = Math.floor(p * text.length);
      let out = '';
      for (let i = 0; i < text.length; i++) {
        out += i < shown || text[i] === ' ' ? text[i] : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      el.textContent = out;
      if (p < 1) el._scrRaf = requestAnimationFrame(step);
      else el.textContent = text;
    };
    el._scrRaf = requestAnimationFrame(step);
  }

  /* ---------- Typing roles ---------- */
  function initTyping() {
    const el = $('#typed');
    if (!el) return;
    const roles = ['Software Engineer', 'Java Developer', 'Front-End Developer', 'Python Programmer', 'Data Analyst', 'Problem Solver'];
    if (reduceMotion) { el.textContent = roles[0]; return; }
    let r = 0, i = roles[0].length, deleting = true;
    const tick = () => {
      const word = roles[r];
      i += deleting ? -1 : 1;
      el.textContent = word.slice(0, i);
      let delay = deleting ? 40 : 90;
      if (!deleting && i >= word.length) { deleting = true; delay = 1700; }
      else if (deleting && i <= 0) { deleting = false; r = (r + 1) % roles.length; delay = 350; }
      setTimeout(tick, delay);
    };
    onBoot(() => setTimeout(tick, 2600));
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveal() {
    const CLASSES = ['reveal', 'reveal-left', 'reveal-right', 'reveal-zoom'];
    const els = $$(CLASSES.map((c) => `.${c}`).join(','));
    // Drop reveal classes once finished so hover transforms/transitions work normally.
    const settle = (el) => {
      const delay = parseFloat(getComputedStyle(el).transitionDelay) || 0;
      setTimeout(() => el.classList.remove(...CLASSES, 'in'), (delay + 1) * 1000);
    };
    const show = (el) => {
      el.classList.add('in');
      settle(el);
      const title = el.matches('.section-head') ? $('.section-title[data-scramble]', el) : null;
      if (title) scramble(title, 900);
    };
    if (!('IntersectionObserver' in window) || reduceMotion) { els.forEach(show); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        show(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach((el) => io.observe(el));
  }

  /* ---------- Stat counters ---------- */
  function initCounters() {
    $$('.stat-num[data-count]').forEach((el) => {
      const target = parseFloat(el.dataset.count);
      const dec = parseInt(el.dataset.decimals || '0', 10);
      const suffix = el.dataset.suffix || '';
      const fmt = (v) => `${v.toFixed(dec)}${suffix}`;
      if (reduceMotion) { el.textContent = fmt(target); return; }
      el.textContent = fmt(0);
      once(el, () => {
        const t0 = performance.now(), dur = 1800;
        const step = (now) => {
          const p = Math.min(1, (now - t0) / dur);
          const e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
          el.textContent = fmt(target * e);
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }, 0.6);
    });
  }

  /* ---------- 3D tilt ---------- */
  function initTilt() {
    if (!finePointer || reduceMotion) return;
    $$('.tilt').forEach((el) => {
      const max = parseFloat(el.dataset.tiltMax || '10');
      let raf = null;
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.style.transition = 'transform .12s linear, box-shadow .5s, border-color .5s';
          el.style.transform = `perspective(1000px) rotateX(${(0.5 - py) * max * 2}deg) rotateY(${(px - 0.5) * max * 2}deg) scale3d(1.02, 1.02, 1.02)`;
          el.style.setProperty('--gx', `${px * 100}%`);
          el.style.setProperty('--gy', `${py * 100}%`);
        });
      });
      el.addEventListener('mouseleave', () => {
        cancelAnimationFrame(raf);
        el.style.transition = '';
        el.style.transform = '';
      });
    });
  }

  /* ---------- Spotlight borders ---------- */
  function initSpotlight() {
    if (!finePointer) return;
    document.addEventListener('pointermove', (e) => {
      const el = e.target.closest && e.target.closest('.spot');
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    }, { passive: true });
  }

  /* ---------- Magnetic buttons ---------- */
  function initMagnetic() {
    if (!finePointer || reduceMotion) return;
    $$('.magnetic').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.22}px, ${y * 0.35}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- Infinite marquee ---------- */
  function initMarquee() {
    $$('.marquee-track').forEach((track, idx) => {
      const items = Array.from(track.children);
      const addSet = () => items.forEach((n) => {
        const c = n.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        track.appendChild(c);
      });
      // Each half of the track must be at least as wide as the viewport for a seamless loop.
      let guard = 0;
      while (track.scrollWidth < window.innerWidth + 200 && guard++ < 6) addSet();
      const halfCount = track.children.length;
      for (let i = 0; i < halfCount; i++) {
        const c = track.children[i].cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        track.appendChild(c);
      }
      const speed = idx % 2 ? 34 : 42; // px per second
      track.style.animationDuration = `${Math.max(20, track.scrollWidth / 2 / speed)}s`;
    });
  }

  /* ---------- Project filter ---------- */
  function initFilter() {
    const btns = $$('.filter[data-filter]');
    const items = $$('.project[data-cat]');
    btns.forEach((b) => b.addEventListener('click', () => {
      const f = b.dataset.filter;
      btns.forEach((x) => {
        const on = x === b;
        x.classList.toggle('active', on);
        x.setAttribute('aria-pressed', String(on));
      });
      items.forEach((it) => {
        const show = f === 'all' || it.dataset.cat === f;
        it.classList.toggle('is-hidden', !show);
        it.classList.remove('pop');
        if (show) { void it.offsetWidth; it.classList.add('pop'); }
      });
    }));
  }

  /* ---------- Interactive terminal ---------- */
  function initTerminal() {
    const term = $('#terminal');
    const out = $('#termOut');
    const form = $('#termForm');
    const input = $('#termInput');
    const view = $('#termBody');
    if (!term || !out || !form || !input || !view) return;

    const PROMPT = 'harigaran@portfolio:~$';
    const SECTIONS = ['home', 'about', 'skills', 'projects', 'experience', 'education', 'awards', 'contact'];
    const scrollDown = () => { view.scrollTop = view.scrollHeight; };
    const go = (id) => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: smooth() }); };

    // parts: string | { t, cls, href, download }
    const line = (parts, cls = 't-out') => {
      const div = document.createElement('div');
      div.className = `term-line ${cls}`.trim();
      (Array.isArray(parts) ? parts : [parts]).forEach((p) => {
        if (typeof p === 'string') { div.appendChild(document.createTextNode(p)); return; }
        const el = document.createElement(p.href ? 'a' : 'span');
        if (p.cls) el.className = p.cls;
        el.textContent = p.t;
        if (p.href) {
          el.href = p.href;
          if (/^https?:/.test(p.href)) { el.target = '_blank'; el.rel = 'noopener'; }
          if (p.download) el.setAttribute('download', '');
        }
        div.appendChild(el);
      });
      out.appendChild(div);
      scrollDown();
      return div;
    };
    const list = (rows) => rows.forEach((r) => line(Array.isArray(r) ? r : [r]));
    const hl = (t) => ({ t, cls: 't-hl' });
    const pk = (t) => ({ t, cls: 't-pink' });
    const echoCmd = (cmd) => line([{ t: PROMPT, cls: 't-prompt' }, cmd], '');

    const typeCmd = async (cmd) => {
      const div = document.createElement('div');
      div.className = 'term-line';
      const p = document.createElement('span');
      p.className = 't-prompt';
      p.textContent = PROMPT;
      const txt = document.createTextNode('');
      const cur = document.createElement('span');
      cur.className = 'term-cursor';
      div.append(p, txt, cur);
      out.appendChild(div);
      scrollDown();
      for (const ch of cmd) { txt.data += ch; await sleep(rand(45, 95)); }
      await sleep(260);
      cur.remove();
    };

    const cmds = {
      help: () => {
        line('Available commands:', 't-hl');
        [
          ['about', 'who I am'], ['skills', 'my tech stack'], ['projects', "things I've built"],
          ['experience', 'internships'], ['education', 'academics'], ['awards', 'achievements & certs'],
          ['contact', 'reach me'], ['social', 'find me online'], ['resume', 'download my CV'],
          ['goto <section>', 'scroll to a section'], ['theme <name>', 'cyber | synth | matrix'],
          ['ls / cat', 'browse files'], ['date / echo', 'the classics'], ['clear', 'clear the screen'],
          ['sudo hire-me', 'you know you want to 😉'],
        ].forEach(([c, d]) => line(['  ', pk(c.padEnd(16)), d]));
      },
      whoami: () => line('K. Harigaran — Software Engineer · ECE Graduate · Chennai, IN'),
      about: () => list([
        "Hi! I'm Harigaran — a Software Engineering fresher from Chennai.",
        ['B.E. ', hl('Electronics & Communication Engineering'), ' · CGPA ', hl('8.1')],
        'I turn ideas into clean, efficient code — Java, Python & the modern web.',
        'ECE roots → I understand systems from the silicon up.',
      ]),
      skills: () => list([
        ['Languages   ', hl('Java · Python')],
        ['Web         ', hl('HTML · CSS · JavaScript · React')],
        ['Database    ', hl('MySQL · PostgreSQL')],
        ['Tools       ', hl('Git · GitHub · Docker · Vivado')],
        ['Cloud & AI  ', hl('Azure · Agentic AI · AI Foundations')],
        ['Analytics   ', hl('Excel · Power BI')],
        ['Concepts    ', hl('DSA · OOP · SQL & APIs')],
      ]),
      projects: () => {
        list([
          ['01 ', hl('High-Speed Counter (Pipelined LFSR)'), ' — Vivado, VLSI'],
          ['02 ', hl('Real-Time Vehicle Tracking'), ' — GSM, Embedded'],
          ['03 ', hl('Tic Tac Toe'), ' — React, Android'],
          ['04 ', hl('Weather Website'), ' — JavaScript, REST API'],
        ]);
        line(['→ Try them live: ', pk('goto projects')], 't-dim');
      },
      experience: () => list([
        [hl('Process Executive'), ' @ Sutherland (paid internship)'],
        [hl('Front End Development Intern'), ' @ Cognifyz'],
        [hl('Java Development Intern'), ' @ CodSoft'],
        [hl('Embedded Engineer & IoT System Management Intern'), ' @ Edufy Techno Solutions'],
      ]),
      education: () => list([
        [hl('B.E. ECE'), ' — S.A Engineering College (2021–2025) · CGPA 8.1'],
        [hl('HSC'), ' — Sethu Bhaskara Mat. Hr. Sec. School (2021) · 91.1%'],
        [hl('SSLC'), ' — Sethu Bhaskara Mat. Hr. Sec. School (2019) · 91.2%'],
      ]),
      awards: () => list([
        ['🏆 ', hl('Best Paper Award'), ' — ICSEEIS, SVCE Tirupati'],
        ['🏆 ', hl('Best Project Award'), ' — ICSEEIS, SVCE Tirupati'],
        ['🎯 ', hl('Hackathon'), ' — reached Round 2'],
        ['📜 Certified: Python (Skill Upgrade) · Java (Scaler) · Front End & Azure (Simplilearn) · AI (Infosys Springboard) · GitHub Copilot (GH-300)'],
      ]),
      contact: () => list([
        ['Email   ', { t: 'harigarank12a307@gmail.com', href: 'mailto:harigarank12a307@gmail.com' }],
        ['Phone   ', { t: '+91 90944 48452', href: 'tel:+919094448452' }],
        ['Based   ', hl('Ambattur, Chennai, India')],
      ]),
      social: () => list([
        ['GitHub    ', { t: 'github.com/Harigaran2975', href: 'https://github.com/Harigaran2975' }],
        ['LinkedIn  ', { t: 'linkedin.com/in/harigaran-k', href: 'https://www.linkedin.com/in/harigaran-k' }],
      ]),
      resume: () => {
        line(['Downloading ', { t: 'K_Harigaran_Resume.pdf', href: 'assets/K_Harigaran_Resume.pdf', download: true }, ' ...']);
        const a = document.createElement('a');
        a.href = 'assets/K_Harigaran_Resume.pdf';
        a.download = 'K_Harigaran_Resume.pdf';
        body.appendChild(a);
        a.click();
        a.remove();
      },
      goto: (arg) => {
        const id = (arg || '').toLowerCase().replace(/^#/, '');
        if (SECTIONS.includes(id)) { line(`Navigating to #${id} ...`, 't-dim'); setTimeout(() => go(id), 300); }
        else line(`goto: unknown section "${arg || ''}". Try: ${SECTIONS.join(', ')}`, 't-err');
      },
      theme: (arg) => {
        const name = (arg || '').toLowerCase();
        if (!name) { line(`Current theme: ${currentTheme()} · options: ${THEMES.join(', ')}`); return; }
        if (setTheme(name)) line(`✔ Theme switched to "${name}"`, 't-hl');
        else line(`theme: unknown theme "${arg}". Options: ${THEMES.join(', ')}`, 't-err');
      },
      date: () => line(new Date().toString()),
      echo: (arg) => line(arg || ''),
      clear: () => { out.textContent = ''; },
      ls: () => line('about.txt  skills.json  projects/  experience.log  education.md  awards/  contact.vcf  resume.pdf'),
      cat: (arg) => {
        const files = {
          'about.txt': 'about', 'skills.json': 'skills', 'projects': 'projects', 'projects/': 'projects',
          'experience.log': 'experience', 'education.md': 'education', 'awards': 'awards', 'awards/': 'awards',
          'contact.vcf': 'contact', 'resume.pdf': 'resume',
        };
        const f = (arg || '').trim();
        if (has(files, f)) cmds[files[f]]();
        else line(`cat: ${f || '(missing file)'}: No such file. Try "ls".`, 't-err');
      },
      sudo: (arg) => {
        if (/^hire[- ]?me$/i.test((arg || '').trim())) cmds['hire-me']();
        else line('sudo: permission denied — nice try 😄', 't-err');
      },
      'hire-me': () => {
        line('🚀 Excellent decision! Preparing a message to Harigaran ...', 't-hl');
        const subj = $('#cfSubject');
        if (subj && !subj.value) subj.value = 'Job Opportunity for K. Harigaran';
        setTimeout(() => go('contact'), 500);
      },
      exit: () => line('There is no escape from the neon 😎  (type "help")', 't-pink'),
    };

    const history = [];
    let hIdx = 0;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const raw = input.value.trim();
      input.value = '';
      echoCmd(raw);
      if (!raw) return;
      history.push(raw);
      hIdx = history.length;
      const [name, ...rest] = raw.split(/\s+/);
      const key = name.toLowerCase();
      if (has(cmds, key)) cmds[key](rest.join(' '));
      else line(`command not found: ${name}. Type "help" for available commands.`, 't-err');
      scrollDown();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (hIdx > 0) input.value = history[--hIdx];
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (hIdx < history.length - 1) input.value = history[++hIdx];
        else { hIdx = history.length; input.value = ''; }
      } else if (e.key === 'Tab' && input.value.trim()) {
        e.preventDefault();
        const v = input.value.trim().toLowerCase();
        const matches = Object.keys(cmds).filter((c) => c.startsWith(v));
        if (matches.length === 1) input.value = `${matches[0]} `;
        else if (matches.length > 1) { echoCmd(input.value); line(matches.join('   '), 't-dim'); }
      } else if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault();
        cmds.clear();
      }
    });

    view.addEventListener('click', () => {
      if (!form.hidden && !String(window.getSelection())) input.focus({ preventScroll: true });
    });

    const intro = async () => {
      out.textContent = '';
      await sleep(300);
      await typeCmd('whoami');
      line('K. Harigaran — Software Engineer');
      await sleep(350);
      await typeCmd('cat about.txt');
      for (const r of [
        ['> B.E. ', hl('Electronics & Communication Engg.'), ' · CGPA 8.1'],
        ['> ', hl('Java · Python · React · SQL · Azure · AI')],
        ['> Turning ideas into clean, efficient code.'],
      ]) { line(r); await sleep(160); }
      await sleep(300);
      await typeCmd('status --check');
      line(['● ', hl('AVAILABLE FOR HIRE'), ' — open to Software Engineering roles']);
      await sleep(250);
      line(['Type ', pk('help'), ' to explore · try ', pk('theme synth'), ' or ', pk('sudo hire-me')], 't-dim');
      form.hidden = false;
      scrollDown();
    };

    if (reduceMotion) {
      out.textContent = '';
      cmds.whoami();
      line(['Type ', pk('help'), ' to explore.'], 't-dim');
      form.hidden = false;
      return;
    }
    onBoot(() => once(term, intro, 0.35));
  }

  /* ---------- Demo: 8-bit LFSR (x^8 + x^6 + x^5 + x^4 + 1) ---------- */
  function initLFSR() {
    const wrap = $('#lfsr');
    const cellsEl = $('#lfsrCells');
    if (!wrap || !cellsEl) return;
    const led = $('#lfsrLed');
    const hex = $('#lfsrHex');
    const cyc = $('#lfsrCycle');
    const TAPS = [0, 2, 3, 4];
    const SEED = 0xe1;
    const cells = [];
    for (let b = 7; b >= 0; b--) {
      const c = document.createElement('span');
      c.className = `cell${TAPS.includes(b) ? ' tap' : ''}`;
      c.dataset.b = `b${b}`;
      cellsEl.appendChild(c);
      cells.push(c);
    }
    let state = SEED, cycle = 0, timer = null;

    const render = (animate) => {
      cells.forEach((c, idx) => {
        const bit = (state >> (7 - idx)) & 1;
        c.textContent = bit;
        c.classList.toggle('on', bit === 1);
        if (animate) { c.classList.remove('shift'); void c.offsetWidth; c.classList.add('shift'); }
      });
      if (hex) hex.textContent = `0x${state.toString(16).toUpperCase().padStart(2, '0')}`;
      if (cyc) cyc.textContent = String(cycle).padStart(3, '0');
    };
    const step = () => {
      const fb = ((state >> 0) ^ (state >> 2) ^ (state >> 3) ^ (state >> 4)) & 1;
      state = ((state >> 1) | (fb << 7)) & 0xff;
      cycle = (cycle % 255) + 1;
      if (led) { led.classList.add('on'); setTimeout(() => led.classList.remove('on'), 160); }
      render(!reduceMotion);
    };
    render(false);
    watch(wrap, (vis) => {
      if (vis && !timer) timer = setInterval(step, 650);
      else if (!vis && timer) { clearInterval(timer); timer = null; }
    });
  }

  /* ---------- Demo: GPS radar ---------- */
  function initTracker() {
    const blip = $('#blip');
    if (!blip) return;
    const lat = $('#gpsLat');
    const lng = $('#gpsLng');
    const spd = $('#gpsSpd');
    let t = 0, timer = null;
    const tick = () => {
      t += 0.025;
      const x = 50 + 30 * Math.sin(t * 1.3);
      const y = 50 + 28 * Math.sin(t * 2.1 + 0.6);
      blip.style.left = `${x}%`;
      blip.style.top = `${y}%`;
      if (lat) lat.textContent = (13.1143 - (y - 50) * 0.0004).toFixed(4);
      if (lng) lng.textContent = (80.1548 + (x - 50) * 0.0004).toFixed(4);
      if (spd && Math.random() < 0.15) spd.textContent = String(Math.round(rand(36, 58)));
    };
    watch(blip.closest('.tracker'), (vis) => {
      if (vis && !timer) timer = setInterval(tick, 120);
      else if (!vis && timer) { clearInterval(timer); timer = null; }
    });
  }

  /* ---------- Demo: Tic Tac Toe vs minimax AI ---------- */
  function initTicTacToe() {
    const boardEl = $('#tttBoard');
    if (!boardEl) return;
    const status = $('#tttStatus');
    const reset = $('#tttReset');
    const scoreEl = { X: $('#sX'), O: $('#sO'), D: $('#sD') };
    const score = { X: 0, O: 0, D: 0 };
    const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    let board = [], over = false, busy = false, restartTimer = null;

    const setStatus = (...parts) => {
      status.textContent = '';
      parts.forEach((p) => {
        if (typeof p === 'string') status.appendChild(document.createTextNode(p));
        else { const b = document.createElement('b'); b.className = p.cls; b.textContent = p.t; status.appendChild(b); }
      });
    };
    const yourMove = () => setStatus('Your move — you\'re ', { t: 'X', cls: 'x' });

    const cells = Array.from({ length: 9 }, (_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ttt-cell';
      b.setAttribute('aria-label', `Cell ${i + 1}, empty`);
      b.addEventListener('click', () => play(i));
      boardEl.appendChild(b);
      return b;
    });

    const winner = (bd) => {
      for (const l of LINES) {
        const [a, b, c] = l;
        if (bd[a] && bd[a] === bd[b] && bd[a] === bd[c]) return { p: bd[a], line: l };
      }
      return bd.every(Boolean) ? { p: 'D' } : null;
    };

    const minimax = (bd, player, depth) => {
      const w = winner(bd);
      if (w) return w.p === 'O' ? 10 - depth : w.p === 'X' ? depth - 10 : 0;
      let best = player === 'O' ? -Infinity : Infinity;
      for (let i = 0; i < 9; i++) {
        if (bd[i]) continue;
        bd[i] = player;
        const s = minimax(bd, player === 'O' ? 'X' : 'O', depth + 1);
        bd[i] = null;
        best = player === 'O' ? Math.max(best, s) : Math.min(best, s);
      }
      return best;
    };

    const aiMove = () => {
      const empty = board.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
      if (Math.random() < 0.25) return empty[Math.floor(Math.random() * empty.length)];
      let bestS = -Infinity, bestI = empty[0];
      for (const i of empty) {
        board[i] = 'O';
        const s = minimax(board, 'X', 1);
        board[i] = null;
        if (s > bestS) { bestS = s; bestI = i; }
      }
      return bestI;
    };

    const mark = (i, p) => {
      board[i] = p;
      const s = document.createElement('span');
      s.className = p.toLowerCase();
      s.textContent = p;
      cells[i].textContent = '';
      cells[i].appendChild(s);
      cells[i].disabled = true;
      cells[i].setAttribute('aria-label', `Cell ${i + 1}, ${p}`);
    };

    const finish = (w) => {
      over = true;
      cells.forEach((c) => { c.disabled = true; });
      if (w.line) w.line.forEach((i) => cells[i].classList.add('win'));
      score[w.p]++;
      scoreEl[w.p].textContent = score[w.p];
      if (w.p === 'X') { setStatus('You win! 🎉 Impressive.'); toast('You beat the AI! 🏆', 'i-trophy'); }
      else if (w.p === 'O') setStatus('AI wins 🤖 — try again!');
      else setStatus('Draw 🤝 — well played.');
      restartTimer = setTimeout(newGame, 2600);
    };

    function play(i) {
      if (over || busy || board[i]) return;
      mark(i, 'X');
      const w = winner(board);
      if (w) { finish(w); return; }
      busy = true;
      setStatus('AI is thinking', { t: '…', cls: 'o' });
      setTimeout(() => {
        mark(aiMove(), 'O');
        busy = false;
        const w2 = winner(board);
        if (w2) finish(w2); else yourMove();
      }, 420);
    }

    function newGame() {
      clearTimeout(restartTimer);
      board = Array(9).fill(null);
      over = false;
      busy = false;
      cells.forEach((c, i) => {
        c.textContent = '';
        c.disabled = false;
        c.classList.remove('win');
        c.setAttribute('aria-label', `Cell ${i + 1}, empty`);
      });
      yourMove();
    }

    if (reset) reset.addEventListener('click', newGame);
    newGame();
  }

  /* ---------- Demo: live weather (Open-Meteo, no key needed) ---------- */
  function initWeather() {
    const wrap = $('#weather');
    if (!wrap) return;
    const badge = $('#wxBadge');
    const temp = $('#wxTemp');
    const cond = $('#wxCond');
    const hum = $('#wxHum');
    const wind = $('#wxWind');
    const API = 'https://api.open-meteo.com/v1/forecast?latitude=13.0827&longitude=80.2707'
      + '&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,is_day&timezone=auto';

    const classify = (code, day) => {
      if (code === 0) return [day ? 'sun' : 'moon', day ? 'Clear Sky' : 'Clear Night'];
      if (code === 1 || code === 2) return [day ? 'partly' : 'partly-night', code === 1 ? 'Mainly Clear' : 'Partly Cloudy'];
      if (code === 3) return ['cloud', 'Overcast'];
      if (code === 45 || code === 48) return ['cloud', 'Foggy'];
      if (code >= 51 && code <= 57) return ['rain', 'Drizzle'];
      if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return ['rain', code >= 80 ? 'Rain Showers' : 'Rain'];
      if ((code >= 71 && code <= 77) || code === 85 || code === 86) return ['cloud', 'Snow'];
      if (code >= 95) return ['storm', 'Thunderstorm'];
      return ['cloud', 'Cloudy'];
    };

    const show = (state, t, c, h, w) => {
      wrap.dataset.wx = state;
      temp.textContent = t;
      cond.textContent = c;
      hum.textContent = h;
      wind.textContent = w;
    };

    const demo = () => {
      if (badge) {
        badge.classList.add('demo');
        badge.lastChild.textContent = 'DEMO MODE';
      }
      const states = [
        ['sun', 33, 'Sunny', 58, 12], ['partly', 31, 'Partly Cloudy', 64, 14],
        ['rain', 27, 'Rain', 84, 18], ['storm', 26, 'Thunderstorm', 90, 24], ['moon', 28, 'Clear Night', 72, 9],
      ];
      let k = 0;
      const next = () => show(...states[k++ % states.length]);
      next();
      setInterval(next, 3500);
    };

    const load = async () => {
      const ctrl = 'AbortController' in window ? new AbortController() : null;
      const to = setTimeout(() => ctrl && ctrl.abort(), 6000);
      try {
        const res = await fetch(API, ctrl ? { signal: ctrl.signal } : undefined);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const cur = (await res.json()).current;
        if (!cur || typeof cur.temperature_2m !== 'number') throw new Error('No data');
        const [state, label] = classify(cur.weather_code, cur.is_day === 1);
        show(state, Math.round(cur.temperature_2m), label, Math.round(cur.relative_humidity_2m), Math.round(cur.wind_speed_10m));
      } catch (err) {
        demo();
      } finally {
        clearTimeout(to);
      }
    };
    once(wrap, load, 0.1);
  }

  /* ---------- Education progress rings ---------- */
  function initRings() {
    const C = 2 * Math.PI * 52;
    $$('.ring[data-percent]').forEach((r) => {
      const fg = $('.ring-fg', r);
      if (!fg) return;
      const p = Math.min(100, Math.max(0, parseFloat(r.dataset.percent) || 0));
      fg.style.strokeDasharray = C;
      fg.style.strokeDashoffset = C;
      once(r, () => { fg.style.strokeDashoffset = C * (1 - p / 100); }, 0.5);
    });
  }

  /* ---------- Flip cards (touch + keyboard) ---------- */
  function initFlip() {
    const canHover = window.matchMedia('(hover: hover)').matches;
    $$('.flip').forEach((f) => {
      f.setAttribute('role', 'button');
      f.setAttribute('aria-pressed', 'false');
      const title = $('h3', f);
      if (title) f.setAttribute('aria-label', `${title.textContent} — flip for details`);
      const toggle = () => f.setAttribute('aria-pressed', String(f.classList.toggle('flipped')));
      f.addEventListener('click', () => { if (!canHover) toggle(); });
      f.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
    });
  }

  /* ---------- Copy to clipboard ---------- */
  function initCopy() {
    const fallback = (text) => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
      body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove();
      return ok;
    };
    $$('.copy-btn[data-copy]').forEach((btn) => btn.addEventListener('click', async () => {
      const text = btn.dataset.copy;
      let ok = false;
      try { await navigator.clipboard.writeText(text); ok = true; } catch (e) { ok = fallback(text); }
      if (!ok) { toast('Copy failed — please copy manually', 'i-copy'); return; }
      toast(`Copied: ${text}`, 'i-check');
      const use = $('use', btn);
      btn.classList.add('copied');
      if (use) use.setAttribute('href', '#i-check');
      setTimeout(() => {
        btn.classList.remove('copied');
        if (use) use.setAttribute('href', '#i-copy');
      }, 1800);
    }));
  }

  /* ---------- Contact form → mailto ---------- */
  function initContact() {
    const form = $('#contactForm');
    if (!form) return;
    const fields = ['cfName', 'cfEmail', 'cfSubject', 'cfMessage'].map((id) => document.getElementById(id));
    if (fields.some((f) => !f)) return;
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const validate = (el) => {
      const v = el.value.trim();
      const ok = v.length > 0 && (el.type !== 'email' || emailRe.test(v));
      el.closest('.field').classList.toggle('invalid', !ok);
      return ok;
    };
    fields.forEach((f) => f.addEventListener('input', () => {
      if (f.closest('.field').classList.contains('invalid')) validate(f);
    }));
    form.addEventListener('animationend', () => form.classList.remove('shake'));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const valid = fields.map(validate).every(Boolean);
      if (!valid) {
        form.classList.remove('shake');
        void form.offsetWidth;
        form.classList.add('shake');
        toast('Please fill in every field correctly', 'i-zap');
        const first = fields.find((f) => f.closest('.field').classList.contains('invalid'));
        if (first) first.focus();
        return;
      }
      const [name, email, subject, message] = fields.map((f) => f.value.trim());
      const text = `Hi Harigaran,\n\n${message}\n\n— ${name}\n${email}`;
      window.location.href = `mailto:harigarank12a307@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
      toast('Opening your email app… ✉️', 'i-send');
    });
  }

  /* ---------- Misc ---------- */
  function initMisc() {
    const year = $('#year');
    if (year) year.textContent = String(new Date().getFullYear());
    console.log(
      '%c<KH/> %cHey there, curious developer! 👋\n%cLike what you see? Let\'s talk → harigarank12a307@gmail.com',
      'color:#00f5ff;font:900 22px Orbitron, sans-serif;text-shadow:0 0 8px #00f5ff',
      'color:#ff2bd6;font:600 14px sans-serif',
      'color:#9b97c4;font:13px monospace'
    );
  }

  /* ---------- Init ---------- */
  safe('theme', initTheme);
  safe('marquee', initMarquee);
  safe('reveal', initReveal);
  safe('nav', initNav);
  safe('typing', initTyping);
  safe('counters', initCounters);
  safe('particles', initParticles);
  safe('cursor', initCursor);
  safe('tilt', initTilt);
  safe('spotlight', initSpotlight);
  safe('magnetic', initMagnetic);
  safe('filter', initFilter);
  safe('terminal', initTerminal);
  safe('lfsr', initLFSR);
  safe('tracker', initTracker);
  safe('tictactoe', initTicTacToe);
  safe('weather', initWeather);
  safe('rings', initRings);
  safe('flip', initFlip);
  safe('copy', initCopy);
  safe('contact', initContact);
  safe('misc', initMisc);
  safe('preloader', initPreloader);
  setTimeout(bootDone, 7000); // last-resort safety net
})();
