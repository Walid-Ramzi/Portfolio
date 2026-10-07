(() => {
  // Wait for i18n to be ready before running main logic
  function init() {
    setupMenu();
    setupScrollSpy();
    setupFadeObserver();
    setupContactForm();
    setupHmiDemo();
    setupPidSimulation();
    setupPidExplainer();
    setupThemeToggle();
    setupHeroCanvases();
  }

  // Two layered background effects for the hero, adapted from a dark-theme
  // reference to this site's white/light theme (crisp blue strokes at low
  // opacity instead of bright cyan-on-black, so they read as texture behind
  // the text rather than compete with it):
  //   #bgGrid — a PCB/constellation-style node network: points drift slowly
  //             and draw a connecting line whenever two are near each other.
  //   #wave   — a smooth multi-frequency sine line, like an oscilloscope
  //             trace, drawn across the same area.
  // Both respect prefers-reduced-motion (one static frame, no rAF loop).
  function setupHeroCanvases() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    setupNodeGrid(reduced, dpr);
    setupWave(reduced, dpr);
  }

  function setupNodeGrid(reduced, dpr) {
    const canvas = document.getElementById('bgGrid');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');

    let width = 0, height = 0, nodes = [];

    function sizeGrid() {
      const rect = canvas.parentElement.getBoundingClientRect();
      width = canvas.width = Math.max(1, rect.width * dpr);
      height = canvas.height = Math.max(1, rect.height * dpr);
      const area = width * height;
      // Density tuned for a light, uncluttered feel — noticeably sparser
      // than a dark "hacker" background since it sits behind readable text.
      const count = Math.min(46, Math.max(14, Math.floor(area / 42000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18 * dpr,
        vy: (Math.random() - 0.5) * 0.18 * dpr,
      }));
    }

    function drawGrid() {
      ctx.clearRect(0, 0, width, height);
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
      }
      const maxDist = 140 * dpr;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < maxDist) {
            // #0055d4 line, fading out with distance
            ctx.strokeStyle = `rgba(0, 85, 212, ${0.12 * (1 - d / maxDist)})`;
            ctx.lineWidth = dpr;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      for (const n of nodes) {
        // #2b7fff dot
        ctx.fillStyle = 'rgba(43, 127, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.4 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reduced) requestAnimationFrame(drawGrid);
    }

    sizeGrid();
    drawGrid();

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        sizeGrid();
        if (reduced) drawGrid();
      }, 150);
    }, { passive: true });
  }

  function setupWave(reduced, dpr) {
    const wave = document.getElementById('wave');
    if (!wave || !wave.getContext) return;
    const wctx = wave.getContext('2d');
    let ww = 0, wh = 0, t = 0;

    function sizeWave() {
      const rect = wave.parentElement.getBoundingClientRect();
      ww = wave.width = Math.max(1, rect.width * dpr);
      wh = wave.height = Math.max(1, rect.height * dpr);
    }

    function drawWave() {
      wctx.clearRect(0, 0, ww, wh);
      const mid = wh * 0.62;
      // Blue gradient trace, transparent at both ends so it fades into the
      // edges of the hero rather than terminating abruptly.
      const grad = wctx.createLinearGradient(0, 0, ww, 0);
      grad.addColorStop(0, 'rgba(0, 102, 255, 0)');
      grad.addColorStop(0.5, 'rgba(0, 102, 255, 0.22)');
      grad.addColorStop(1, 'rgba(0, 102, 255, 0)');
      wctx.strokeStyle = grad;
      wctx.lineWidth = 2 * dpr;
      wctx.beginPath();
      for (let x = 0; x <= ww; x += 4) {
        const k = x / ww;
        const y = mid
          + Math.sin(k * 14 + t) * 18 * dpr
          + Math.sin(k * 5 - t * 0.7) * 26 * dpr
          + Math.sin(k * 30 + t * 1.5) * 5 * dpr;
        x === 0 ? wctx.moveTo(x, y) : wctx.lineTo(x, y);
      }
      wctx.stroke();
      t += 0.03;
      if (!reduced) requestAnimationFrame(drawWave);
    }

    sizeWave();
    drawWave();

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        sizeWave();
        if (reduced) drawWave();
      }, 150);
    }, { passive: true });
  }

  function setupMenu() {
    const mobileNav = document.getElementById('mobileNav');
    const menuButton = document.querySelector('.hamburger');
    const body = document.body;

    function closeMenu() {
      if (!mobileNav) return;
      mobileNav.classList.remove('open');
      body.classList.remove('menu-open');
      if (menuButton) menuButton.setAttribute('aria-expanded', 'false');
    }

    if (menuButton && mobileNav) {
      menuButton.addEventListener('click', () => {
        const open = mobileNav.classList.toggle('open');
        body.classList.toggle('menu-open', open);
        menuButton.setAttribute('aria-expanded', String(open));
      });
      mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    }
  }

  function setupScrollSpy() {
    const sections = [...document.querySelectorAll('main section[id]')];
    const navLinks = [...document.querySelectorAll('.header-nav a[href^="#"], .mobile-nav a[href^="#"]')];
    const desktopLinks = navLinks.filter(link => link.closest('.header-nav'));

    const setActive = () => {
      const y = window.scrollY + 130;
      let current = 'hero';
      sections.forEach(section => {
        if (section.offsetTop <= y) current = section.id;
      });
      desktopLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
      });
    };
    window.addEventListener('scroll', setActive, { passive: true });
    setActive();
  }

  function setupFadeObserver() {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .08 });
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
  }

  function setupContactForm() {
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
      contactForm.addEventListener('submit', event => {
        event.preventDefault();
        const name = contactForm.querySelector('[name="name"]').value.trim();
        const email = contactForm.querySelector('[name="email"]').value.trim();
        const message = contactForm.querySelector('[name="message"]').value.trim();
        if (!name || !email || !message) return;
        const subject = encodeURIComponent(`Portfolio contact from ${name}`);
        const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
        window.location.href = `mailto:kachourwalidramzi@gmail.com?subject=${subject}&body=${body}`;
      });
    }
  }

  function setupHmiDemo() {
    // HMI-style sensor / controller / actuator card values — subtle, slow live demo readout.
    const hmiBoard = document.querySelector('.hmi-board');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (hmiBoard && !reduceMotion) {
      const sensorEl = hmiBoard.querySelector('[data-metric="sensor-pv"]');
      const ctrlPvEl = hmiBoard.querySelector('[data-metric="controller-pv"]');
      const ctrlOutEl = hmiBoard.querySelector('[data-metric="controller-out"]');
      const actSpeedEl = hmiBoard.querySelector('[data-metric="actuator-speed"]');
      const sensorBar = hmiBoard.querySelector('[data-bar="sensor"]');
      const actuatorBar = hmiBoard.querySelector('[data-bar="actuator"]');

      let temp = 38.2;
      let out = 64;

      const step = () => {
        // small, bounded random walk so values stay realistic and readable
        temp += (Math.random() - 0.5) * 0.6;
        temp = Math.max(36.5, Math.min(39.5, temp));
        out += (Math.random() - 0.5) * 6;
        out = Math.max(48, Math.min(80, out));

        if (sensorEl) sensorEl.textContent = `${temp.toFixed(1)} °C`;
        if (ctrlPvEl) ctrlPvEl.textContent = `${(temp - 0.6).toFixed(1)}%`;
        if (ctrlOutEl) ctrlOutEl.textContent = `${Math.round(out)}%`;
        if (actSpeedEl) actSpeedEl.textContent = `${Math.round(out)}%`;
        if (sensorBar) sensorBar.style.width = `${Math.round((temp / 45) * 100)}%`;
        if (actuatorBar) actuatorBar.style.width = `${Math.round(out)}%`;
      };

      step();
      setInterval(step, 2600);
    } else if (hmiBoard) {
      // Reduced motion: set static, sensible values once, no interval.
      hmiBoard.querySelectorAll('.hmi-bar-fill').forEach(bar => { bar.style.width = bar.dataset.bar === 'sensor' ? '85%' : '64%'; });
    }
  }

  function setupPidSimulation() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // DOM references for dynamic value updates
    const pidSpEl = document.getElementById('pid-sp-value');
    const pidErrEl = document.getElementById('pid-error-value');
    const pidOutEl = document.getElementById('pid-out-value');
    const pidMvEl = document.getElementById('pid-mv-value');
    const pidPvEl = document.getElementById('pid-pv-value');
    const readoutSp = document.getElementById('readout-sp');
    const readoutErr = document.getElementById('readout-err');
    const readoutMv = document.getElementById('readout-mv');
    const readoutPv = document.getElementById('readout-pv');

    // "How is this calculated?" panel — same numbers as the diagram, laid
    // out as the worked steps of the PID equation.
    const explainSp = document.getElementById('explain-sp');
    const explainPv = document.getElementById('explain-pv');
    const explainError = document.getElementById('explain-error');
    const explainError2 = document.getElementById('explain-error-2');
    const explainError3 = document.getElementById('explain-error-3');
    const explainPrevError = document.getElementById('explain-preverror');
    const explainSum = document.getElementById('explain-sum');
    const explainP = document.getElementById('explain-p');
    const explainP2 = document.getElementById('explain-p-2');
    const explainI = document.getElementById('explain-i');
    const explainI2 = document.getElementById('explain-i-2');
    const explainD = document.getElementById('explain-d');
    const explainD2 = document.getElementById('explain-d-2');
    const explainOut = document.getElementById('explain-out');

    // Nothing to do if the PID simulation SVG is not on the page
    if (!pidSpEl) return;

    const spInput = document.getElementById('pidSetPointInput');

    // --- PID controller parameters ---
    // SP is user-adjustable via the Set Point input; Kp/Ti/Td/dt/Bias stay
    // fixed (they're the controller's tuning, shown read-only below the
    // diagram).
    let SP = spInput ? parseFloat(spInput.value) : 40.0;
    if (!Number.isFinite(SP)) SP = 40.0;
    const Kp = 2.0;
    const Ti = 30;
    const Td = 5;
    const dt = 5;
    const BIAS = 54.0;

    // --- First-order thermal process model ---
    //   dT/dt = (K_HEAT * OUT - (T - T_AMBIENT)) / TAU
    // With K_HEAT = 1/3, equilibrium at OUT=60 % maps to PV = T_AMBIENT + K_HEAT*60 = 40 °C,
    // which keeps the integral term near its initial value for stable, believable convergence.
    const T_AMBIENT = 20.0;
    const K_HEAT = 1 / 3;
    const TAU = 40;

    // --- Initial state (mathematically consistent at t = 0) ---
    let PV = 37.6;          // Process variable (°C)
    let integralSum = 84.0;  // Σ(Error · dt) in °C·s  →  I = Kp·Σ/(Ti) = 2·84/30 = 5.6 %
    let prevError = 2.2;     // Previous error (°C)    →  D = Kp·Td·(e−eₚ)/dt = 0.4 %

    // Helper formatters
    const fmtSigned = (v) => {
      const s = v.toFixed(1);
      return v >= 0 ? `+${s}` : s;
    };
    const fmtTemp = (v) => `${v.toFixed(1)} °C`;
    const fmtPCT = (v) => `${v.toFixed(1)} %`;

    function syncDOM() {
      const error = SP - PV;
      const P = Kp * error;
      const I = Kp * integralSum / Ti;
      const D = Kp * Td * (error - prevError) / dt;
      const outRaw = BIAS + P + I + D;
      const OUT = Math.max(0, Math.min(100, outRaw));

      if (pidSpEl) pidSpEl.textContent = fmtTemp(SP);
      if (pidErrEl) pidErrEl.textContent = `${fmtSigned(error)} °C`;
      if (pidOutEl) pidOutEl.textContent = `${OUT.toFixed(1)}%`;
      if (pidMvEl) pidMvEl.textContent = fmtPCT(OUT);
      if (pidPvEl) pidPvEl.textContent = fmtTemp(PV);

      if (readoutSp) readoutSp.textContent = fmtTemp(SP);
      if (readoutErr) readoutErr.textContent = `${fmtSigned(error)} °C`;
      if (readoutMv) readoutMv.textContent = fmtPCT(OUT);
      if (readoutPv) readoutPv.textContent = fmtTemp(PV);

      // Explainer panel — mirrors the exact same numbers, broken into the
      // steps of the equation, so it never drifts out of sync with the
      // diagram even though the panel may be collapsed most of the time.
      const errStr = `${fmtSigned(error)} °C`;
      if (explainSp) explainSp.textContent = fmtTemp(SP);
      if (explainPv) explainPv.textContent = fmtTemp(PV);
      if (explainError) explainError.textContent = errStr;
      if (explainError2) explainError2.textContent = errStr;
      if (explainError3) explainError3.textContent = errStr;
      if (explainPrevError) explainPrevError.textContent = `${fmtSigned(prevError)} °C`;
      if (explainSum) explainSum.textContent = `${integralSum.toFixed(1)} °C·s`;
      if (explainP) explainP.textContent = `${fmtSigned(P)}%`;
      if (explainP2) explainP2.textContent = `${fmtSigned(P)}%`;
      if (explainI) explainI.textContent = `${fmtSigned(I)}%`;
      if (explainI2) explainI2.textContent = `${fmtSigned(I)}%`;
      if (explainD) explainD.textContent = `${fmtSigned(D)}%`;
      if (explainD2) explainD2.textContent = `${fmtSigned(D)}%`;
      if (explainOut) explainOut.textContent = `${OUT.toFixed(1)}%`;
    }

    function step() {
      const error = SP - PV;

      // --- PID computation ---
      const P = Kp * error;
      const I = Kp * integralSum / Ti;
      const D = Kp * Td * (error - prevError) / dt;
      let OUT = BIAS + P + I + D;
      OUT = Math.max(0, Math.min(100, OUT));

      // --- Process update (Euler integration of first-order thermal model) ---
      const dT = (K_HEAT * OUT - (PV - T_AMBIENT)) / TAU * dt;
      PV += dT;

      // --- Update integral / derivative state for the next step ---
      integralSum += error * dt;
      prevError = error;

      syncDOM();
    }

    syncDOM();
    setInterval(step, 2000);

    // Let the user try a different target temperature and watch the loop
    // react to it in real time, instead of only ever showing 40.0 °C.
    if (spInput) {
      spInput.addEventListener('input', () => {
        const next = parseFloat(spInput.value);
        if (Number.isFinite(next)) {
          SP = Math.max(0, Math.min(100, next));
          syncDOM();
        }
      });
      spInput.addEventListener('blur', () => {
        const next = parseFloat(spInput.value);
        const clamped = Number.isFinite(next) ? Math.max(0, Math.min(100, next)) : SP;
        spInput.value = clamped.toFixed(1);
        SP = clamped;
        syncDOM();
      });
    }
  }

  // "How is this calculated?" expand/collapse for the PID explainer panel.
  function setupPidExplainer() {
    const toggle = document.querySelector('.pid-explain-toggle');
    const panel = document.getElementById('pid-explain-panel');
    if (!toggle || !panel) return;
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      panel.hidden = open;
    });
  }

  // Light/dark theme toggle. The actual light-vs-dark decision for the
  // very first paint is already made by the inline script in <head>
  // (so there's no flash of the wrong theme); this just wires up the
  // button to flip it afterwards and remember the choice.
  function setupThemeToggle() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    const root = document.documentElement;

    function syncButton(isDark) {
      btn.setAttribute('aria-pressed', String(isDark));
      btn.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
    }

    syncButton(root.getAttribute('data-theme') === 'dark');

    btn.addEventListener('click', () => {
      const isDark = root.getAttribute('data-theme') === 'dark';
      if (isDark) {
        root.removeAttribute('data-theme');
      } else {
        root.setAttribute('data-theme', 'dark');
      }
      try { localStorage.setItem('theme', isDark ? 'light' : 'dark'); } catch (e) { /* ignore */ }
      syncButton(!isDark);
    });
  }

  // Initialize after i18n is ready.
  // Guarded so init() runs exactly once, however many of the paths below fire —
  // without this guard, setupMenu() attached two click listeners to the hamburger
  // button (one per init() call), which toggled the mobile nav open then immediately
  // closed on every tap, and setupHmiDemo()/setupPidSimulation() each started a
  // duplicate setInterval loop.
  let didInit = false;
  function initOnce() {
    if (didInit) return;
    didInit = true;
    init();
  }

  if (typeof I18n !== 'undefined' && I18n.translations && Object.keys(I18n.translations).length > 0) {
    initOnce();
  } else if (typeof I18n !== 'undefined') {
    I18n.onLanguageChange(() => initOnce());
    // also try after a short delay if translations not loaded yet
    setTimeout(initOnce, 500);
  } else {
    // Fallback: i18n not available, still init main
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initOnce);
    } else {
      initOnce();
    }
  }
})();