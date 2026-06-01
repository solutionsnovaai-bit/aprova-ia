/* ============================================================
   APROVA — main.js
   Lenis · GSAP/ScrollTrigger · loader · nav · reveals
   counters · carousel · magnetic button
   ============================================================ */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGSAP = typeof window.gsap !== "undefined";
  if (hasGSAP && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ---------------------------------------------------------
     ATMOSPHERE — floating gold dust (canvas)
  --------------------------------------------------------- */
  function initDust() {
    const canvas = document.getElementById("dustCanvas");
    if (!canvas) return;
    if (prefersReduced) return;

    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    let particles = [];
    let raf = null;

    const isMobile = () => window.innerWidth < 760;

    function resize() {
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + "px"; canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    function build() {
      const area = w * h;
      const density = isMobile() ? 26000 : 16000;
      const count = Math.min(isMobile() ? 34 : 90, Math.round(area / density));
      particles = [];
      for (let i = 0; i < count; i++) particles.push(makeP());
    }

    function makeP() {
      const r = Math.random() * 1.7 + 0.4;
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r,
        vy: -(Math.random() * 0.22 + 0.05),      // drift up
        vx: (Math.random() - 0.5) * 0.16,
        a: Math.random() * 0.5 + 0.15,
        tw: Math.random() * Math.PI * 2,          // twinkle phase
        tws: Math.random() * 0.02 + 0.006,
        red: Math.random() < 0.12,                // a few embers tint red
      };
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.y += p.vy; p.x += p.vx; p.tw += p.tws;
        if (p.y < -6) { p.y = h + 6; p.x = Math.random() * w; }
        if (p.x < -6) p.x = w + 6; else if (p.x > w + 6) p.x = -6;
        const flick = (Math.sin(p.tw) * 0.4 + 0.6);
        const alpha = p.a * flick;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.red
          ? "rgba(230,57,70," + (alpha * 0.7).toFixed(3) + ")"
          : "rgba(240,215,123," + alpha.toFixed(3) + ")";
        ctx.shadowColor = p.red ? "rgba(230,57,70,0.6)" : "rgba(212,175,55,0.7)";
        ctx.shadowBlur = p.r * 3;
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }

    // pause when tab hidden (save battery on mobile)
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = null; } }
      else if (!raf) frame();
    });

    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 200); });
    resize();
    frame();
  }

  /* ---------------------------------------------------------
     LENIS smooth scroll (+ ScrollTrigger sync)
  --------------------------------------------------------- */
  let lenis = null;
  function initLenis() {
    if (prefersReduced || typeof window.Lenis === "undefined") return;
    lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.4,
    });
    lenis.on("scroll", () => { if (hasGSAP) ScrollTrigger.update(); });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);

    // anchor links → lenis
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (id.length < 2) return;
        const el = document.querySelector(id);
        if (!el) return;
        e.preventDefault();
        lenis.scrollTo(el, { offset: -10 });
      });
    });
  }

  /* ---------------------------------------------------------
     LOADER — APROVA letters + % counter
  --------------------------------------------------------- */
  function runLoader(done) {
    const loader = document.getElementById("loader");
    const letters = document.querySelectorAll("#loaderWord span");
    const countEl = document.getElementById("loaderCount");
    const barEl = document.getElementById("loaderBar");

    if (prefersReduced || !hasGSAP) {
      if (countEl) countEl.textContent = "100";
      if (barEl) barEl.style.width = "100%";
      if (loader) loader.style.display = "none";
      done();
      return;
    }

    const tl = gsap.timeline({ onComplete: done });
    tl.to(letters, {
      opacity: 1, y: "0%", duration: 0.7, stagger: 0.07, ease: "power3.out",
    });

    const counter = { v: 0 };
    tl.to(counter, {
      v: 100, duration: 1.4, ease: "power1.inOut",
      onUpdate: () => {
        const val = Math.round(counter.v);
        if (countEl) countEl.textContent = val;
        if (barEl) barEl.style.width = val + "%";
      },
    }, 0.3);

    tl.to("#loaderWord, .loader__meta, .loader__bar", {
      opacity: 0, y: -14, duration: 0.5, ease: "power2.in",
    }, "+=0.25");
    tl.to(loader, {
      yPercent: -100, duration: 0.85, ease: "power4.inOut",
      onComplete: () => { loader.style.display = "none"; },
    }, "-=0.1");
  }

  /* ---------------------------------------------------------
     NAV — dark background on scroll
  --------------------------------------------------------- */
  function initNav() {
    const nav = document.getElementById("nav");
    if (!nav) return;
    const onScroll = () => {
      nav.classList.toggle("is-scrolled", window.scrollY > 40);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------------------------------------------------------
     HERO entrance + parallax
  --------------------------------------------------------- */
  function initHero() {
    if (!hasGSAP) {
      document.querySelectorAll(".hero .reveal, .hero .reveal-line > span")
        .forEach((el) => { el.style.opacity = 1; el.style.transform = "none"; });
      return;
    }
    if (prefersReduced) return;

    const tl = gsap.timeline({ delay: 0.1 });
    tl.to(".hero__title .reveal-line > span", {
      y: "0%", duration: 1, stagger: 0.12, ease: "power4.out",
    });
    tl.to(".hero .reveal", {
      opacity: 1, y: 0, duration: 0.9, stagger: 0.12, ease: "power3.out",
    }, "-=0.7");

    // parallax on hero image
    const img = document.querySelector(".hero__media img");
    if (img && window.ScrollTrigger) {
      gsap.to(img, {
        yPercent: 12, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
      });
    }
    return tl;
  }

  /* ---------------------------------------------------------
     SCROLL REVEALS (generic) + manifesto words + method blocks
  --------------------------------------------------------- */
  function initReveals() {
    if (!hasGSAP || !window.ScrollTrigger) {
      document.querySelectorAll(".reveal, .reveal-up, .reveal-word, .reveal-line > span")
        .forEach((el) => { el.style.opacity = 1; el.style.transform = "none"; });
      return;
    }
    if (prefersReduced) return;

    // generic reveal / reveal-up (skip hero — handled separately)
    gsap.utils.toArray(".reveal, .reveal-up").forEach((el) => {
      if (el.closest(".hero")) return;
      gsap.to(el, {
        opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 86%" },
      });
    });

    // manifesto — word by word
    const words = gsap.utils.toArray(".manifesto .reveal-word");
    if (words.length) {
      gsap.set(words, { opacity: 0.12, y: 18 });
      gsap.to(words, {
        opacity: 1, y: 0, ease: "power2.out", stagger: 0.05,
        scrollTrigger: { trigger: ".manifesto", start: "top 72%", end: "center 60%", scrub: 0.6 },
      });
    }

    // method blocks stagger
    gsap.to(".metodo .reveal-up", {
      opacity: 1, y: 0, duration: 0.8, stagger: 0.14, ease: "power3.out",
      scrollTrigger: { trigger: ".metodo__grid", start: "top 80%" },
    });
  }

  /* ---------------------------------------------------------
     COUNTERS — animate on enter
  --------------------------------------------------------- */
  function initCounters() {
    const counters = document.querySelectorAll(".counter");
    if (!counters.length) return;

    counters.forEach((el) => {
      const to = parseInt(el.getAttribute("data-to"), 10) || 0;

      const animate = () => {
        if (prefersReduced || !hasGSAP) { el.textContent = to; return; }
        const obj = { v: 0 };
        gsap.to(obj, {
          v: to, duration: 2, ease: "power2.out",
          onUpdate: () => { el.textContent = Math.round(obj.v); },
        });
      };

      if (hasGSAP && window.ScrollTrigger && !prefersReduced) {
        ScrollTrigger.create({ trigger: el, start: "top 88%", once: true, onEnter: animate });
      } else {
        animate();
      }
    });
  }

  /* ---------------------------------------------------------
     CAROUSEL — drag (desktop) + swipe (mobile) + arrows
  --------------------------------------------------------- */
  function initCarousel() {
    const viewport = document.getElementById("carousel");
    const track = document.getElementById("carTrack");
    const prev = document.getElementById("carPrev");
    const next = document.getElementById("carNext");
    const progress = document.getElementById("carProgress");
    if (!viewport || !track) return;

    let pos = 0;          // current translate (negative)
    let min = 0;          // most-negative allowed

    function measure() {
      min = Math.min(0, viewport.clientWidth - track.scrollWidth);
      clamp();
      apply();
    }
    function clamp() { pos = Math.max(min, Math.min(0, pos)); }
    function apply() {
      track.style.transform = "translate3d(" + pos + "px,0,0)";
      const ratio = min === 0 ? 0 : pos / min;          // 0..1
      if (progress) {
        const visible = Math.min(1, viewport.clientWidth / track.scrollWidth);
        progress.style.width = (visible * 100) + "%";
        progress.style.left = (ratio * (100 - visible * 100)) + "%";
      }
      if (prev) prev.disabled = pos >= -1;
      if (next) next.disabled = pos <= min + 1;
    }

    function step() {
      const card = track.querySelector(".mcard");
      const gap = 22;
      return card ? card.offsetWidth + gap : 320;
    }
    function go(dir) {
      pos += dir * step() * (window.innerWidth < 760 ? 1 : 1.4);
      clamp();
      track.style.transition = "transform 0.6s cubic-bezier(0.22,1,0.36,1)";
      apply();
      setTimeout(() => { track.style.transition = ""; }, 620);
    }

    if (next) next.addEventListener("click", () => go(1));
    if (prev) prev.addEventListener("click", () => go(-1));

    // pointer drag
    let dragging = false, startX = 0, startPos = 0, moved = 0;
    function down(x) { dragging = true; startX = x; startPos = pos; moved = 0; viewport.classList.add("is-drag"); track.style.transition = ""; }
    function move(x) {
      if (!dragging) return;
      const dx = x - startX; moved = Math.abs(dx);
      pos = startPos + dx; 
      // rubber-band a touch past edges
      if (pos > 0) pos = pos * 0.35;
      if (pos < min) pos = min + (pos - min) * 0.35;
      apply();
    }
    function up() {
      if (!dragging) return;
      dragging = false; viewport.classList.remove("is-drag");
      clamp();
      track.style.transition = "transform 0.5s cubic-bezier(0.22,1,0.36,1)";
      apply();
      setTimeout(() => { track.style.transition = ""; }, 520);
    }

    viewport.addEventListener("mousedown", (e) => { e.preventDefault(); down(e.clientX); });
    window.addEventListener("mousemove", (e) => move(e.clientX));
    window.addEventListener("mouseup", up);

    viewport.addEventListener("touchstart", (e) => down(e.touches[0].clientX), { passive: true });
    viewport.addEventListener("touchmove", (e) => move(e.touches[0].clientX), { passive: true });
    viewport.addEventListener("touchend", up);

    // prevent click-through after a drag
    track.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", (e) => { if (moved > 6) e.preventDefault(); }));

    window.addEventListener("resize", measure);
    measure();
  }

  /* ---------------------------------------------------------
     MAGNETIC buttons
  --------------------------------------------------------- */
  function initMagnetic() {
    if (prefersReduced || !hasGSAP) return;
    if (window.matchMedia("(hover: none)").matches) return;

    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      const strength = 0.4;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * strength;
        const y = (e.clientY - r.top - r.height / 2) * strength;
        gsap.to(el, { x, y, duration: 0.4, ease: "power3.out" });
      });
      el.addEventListener("mouseleave", () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1,0.4)" });
      });
    });
  }

  /* ---------------------------------------------------------
     FAKE QR CODE (PIX)
  --------------------------------------------------------- */
  function buildQR() {
    const SIZE = 25;
    const CELL = 8;
    const data = [];
    for (let r = 0; r < SIZE; r++) {
      data[r] = new Array(SIZE).fill(0);
    }

    // finder pattern helper
    function finder(r0, c0) {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const outer = r === 0 || r === 6 || c === 0 || c === 6;
          const inner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          data[r0 + r][c0 + c] = (outer || inner) ? 1 : 0;
        }
      }
    }
    finder(0, 0);
    finder(0, SIZE - 7);
    finder(SIZE - 7, 0);

    // timing patterns
    for (let i = 8; i < SIZE - 8; i++) {
      data[6][i] = i % 2 === 0 ? 1 : 0;
      data[i][6] = i % 2 === 0 ? 1 : 0;
    }

    // stable-random data modules
    let seed = 0xCAFE47;
    const rand = () => {
      seed ^= seed << 13; seed ^= seed >> 17; seed ^= seed << 5;
      return ((seed >>> 0) / 0xFFFFFFFF);
    };
    const reserved = (r, c) =>
      (r < 8 && c < 8) || (r < 8 && c >= SIZE - 7) || (r >= SIZE - 7 && c < 8) || r === 6 || c === 6;

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (!reserved(r, c)) data[r][c] = rand() > 0.45 ? 1 : 0;
      }
    }

    const W = SIZE * CELL;
    let rects = '';
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (data[r][c]) {
          rects += `<rect x="${c * CELL}" y="${r * CELL}" width="${CELL}" height="${CELL}" fill="#1a1407"/>`;
        }
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${W}">
      <rect width="${W}" height="${W}" fill="#fff"/>
      ${rects}
    </svg>`;
  }

  /* ---------------------------------------------------------
     FAKE BARCODE (Boleto)
  --------------------------------------------------------- */
  function buildBarcode() {
    const widths = [2,1,2,1,1,3,1,1,2,1,2,1,3,1,1,2,1,2,1,1,3,2,1,1,2,1,3,1,1,2,1,2,2,1,1,3,1,2,1,1,2,2,3,1,1,2,1];
    const H = 64;
    let total = widths.reduce((a, b) => a + b, 0);
    const unit = 300 / total;
    let rects = '';
    let x = 0;
    widths.forEach((w, i) => {
      if (i % 2 === 0) {
        rects += `<rect x="${x.toFixed(2)}" y="0" width="${(w * unit).toFixed(2)}" height="${H}" fill="#1a1407"/>`;
      }
      x += w * unit;
    });
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 ${H}" preserveAspectRatio="none">
      <rect width="300" height="${H}" fill="#fff"/>
      ${rects}
    </svg>`;
  }

  /* ---------------------------------------------------------
     CONFETTI
  --------------------------------------------------------- */
  function launchConfetti() {
    const canvas = document.getElementById("coConfetti");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const modal = document.getElementById("coModal");
    if (!modal) return;
    const rect = modal.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const COLORS = ["#D4AF37","#F0D77B","#E63946","#F26A1B","#ECE3D2","#FAF8F4","#102A4C"];
    const COUNT = 160;
    const cx = canvas.width / 2;
    const cy = canvas.height * 0.35;

    const particles = Array.from({ length: COUNT }, () => {
      const angle = (Math.random() * Math.PI * 2);
      const speed = Math.random() * 14 + 5;
      return {
        x: cx + (Math.random() - 0.5) * 60,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        w: Math.random() * 9 + 5,
        h: Math.random() * 5 + 3,
        rot: Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 0.28,
        life: 1,
        decay: Math.random() * 0.010 + 0.006,
        shape: Math.random() < 0.4 ? "circle" : "rect",
      };
    });

    let raf;
    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particles) {
        if (p.life <= 0) continue;
        alive = true;
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.38; p.vx *= 0.995;
        p.rot += p.rotV; p.life -= p.decay;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
        ctx.restore();
      }
      if (alive) raf = requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    cancelAnimationFrame(raf);
    frame();
  }

  /* ---------------------------------------------------------
     PIX COUNTDOWN TIMER
  --------------------------------------------------------- */
  let pixInterval = null;
  function startPixTimer() {
    const el = document.getElementById("pixTimer");
    if (!el) return;
    let secs = 4 * 60 + 59;
    clearInterval(pixInterval);
    const update = () => {
      if (secs <= 0) { clearInterval(pixInterval); el.textContent = "Expirado"; return; }
      const m = Math.floor(secs / 60), s = secs % 60;
      el.textContent = String(m).padStart(2,"0") + ":" + String(s).padStart(2,"0");
      secs--;
    };
    update();
    pixInterval = setInterval(update, 1000);
  }
  function stopPixTimer() {
    clearInterval(pixInterval); pixInterval = null;
  }

  /* ---------------------------------------------------------
     COPY TO CLIPBOARD
  --------------------------------------------------------- */
  function setupCopy(inputId, btnId) {
    const btn = document.getElementById(btnId);
    const inp = document.getElementById(inputId);
    if (!btn || !inp) return;
    btn.addEventListener("click", () => {
      navigator.clipboard.writeText(inp.value).catch(() => {
        inp.select(); document.execCommand("copy");
      });
      btn.textContent = "Copiado!";
      btn.classList.add("is-copied");
      setTimeout(() => { btn.textContent = "Copiar"; btn.classList.remove("is-copied"); }, 2200);
    });
  }

  /* ---------------------------------------------------------
     CARD NUMBER MASK
  --------------------------------------------------------- */
  function initCardMask() {
    const inp = document.getElementById("cardNum");
    if (!inp) return;
    inp.addEventListener("input", () => {
      let v = inp.value.replace(/\D/g, "").slice(0, 16);
      inp.value = v.replace(/(.{4})/g, "$1  ").trim();
    });
    const exp = document.getElementById("cardExp");
    if (exp) {
      exp.addEventListener("input", () => {
        let v = exp.value.replace(/\D/g, "").slice(0, 4);
        if (v.length > 2) v = v.slice(0,2) + "/" + v.slice(2);
        exp.value = v;
      });
    }
  }

  /* ---------------------------------------------------------
     CHECKOUT MODAL
  --------------------------------------------------------- */
  function initCheckout() {
    const overlay = document.getElementById("coOverlay");
    const modal   = document.getElementById("coModal");
    const closeBtn = document.getElementById("coClose");
    const success  = document.getElementById("coSuccess");
    if (!overlay || !modal) return;

    // inject QR and barcode
    const qrEl = document.getElementById("pixQR");
    if (qrEl) qrEl.innerHTML = buildQR();
    const barEl = document.getElementById("boletoSVG");
    if (barEl) barEl.innerHTML = buildBarcode();

    // copy buttons
    setupCopy("pixCode", "pixCopyBtn");
    setupCopy("boletoCode", "boletoCopyBtn");
    initCardMask();

    // tab switching
    const tabs   = overlay.querySelectorAll(".co-tab");
    const panels = overlay.querySelectorAll(".co-panel");
    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        tabs.forEach(t => { t.classList.remove("is-active"); t.setAttribute("aria-selected","false"); });
        panels.forEach(p => p.classList.add("co-panel--hidden"));
        tab.classList.add("is-active"); tab.setAttribute("aria-selected","true");
        const target = document.getElementById("panel-" + tab.dataset.tab);
        if (target) target.classList.remove("co-panel--hidden");
      });
    });

    // open / close
    function open() {
      overlay.classList.add("is-open");
      overlay.setAttribute("aria-hidden","false");
      document.body.style.overflow = "hidden";
      startPixTimer();
      if (hasGSAP) gsap.to(overlay, { opacity: 1, duration: 0 });
    }
    function close() {
      overlay.classList.remove("is-open");
      overlay.setAttribute("aria-hidden","true");
      document.body.style.overflow = "";
      stopPixTimer();
      // reset to initial state after transition
      setTimeout(resetModal, 380);
    }
    function resetModal() {
      if (success) success.classList.add("co-success--hidden");
      tabs.forEach(t => t.classList.remove("is-active"));
      panels.forEach(p => p.classList.add("co-panel--hidden"));
      const firstTab = overlay.querySelector('.co-tab[data-tab="pix"]');
      if (firstTab) { firstTab.classList.add("is-active"); firstTab.setAttribute("aria-selected","true"); }
      const firstPanel = document.getElementById("panel-pix");
      if (firstPanel) firstPanel.classList.remove("co-panel--hidden");
    }

    // confirm → success
    function confirm() {
      panels.forEach(p => p.classList.add("co-panel--hidden"));
      if (success) {
        success.classList.remove("co-success--hidden");
        launchConfetti();
      }
    }

    document.querySelectorAll("[data-checkout]").forEach(btn => {
      btn.addEventListener("click", e => {
        e.preventDefault();
        open();
      });
    });

    if (closeBtn) closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && overlay.classList.contains("is-open")) close();
    });

    ["confirmPix","confirmCard","confirmBoleto"].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener("click", confirm);
    });

    const successClose = document.getElementById("coSuccessClose");
    if (successClose) successClose.addEventListener("click", close);
  }

  /* ---------------------------------------------------------
     BOOT
  --------------------------------------------------------- */
  function boot() {
    initDust();
    initLenis();
    initNav();
    initReveals();
    initCounters();
    initCarousel();
    initMagnetic();
    initCheckout();

    runLoader(() => {
      initHero();
      if (hasGSAP && window.ScrollTrigger) ScrollTrigger.refresh();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
