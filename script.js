// The radar sweep and its contacts are pure CSS animations. This parks them
// (animation-play-state: paused, via the .radar-idle class) whenever the hero
// is off-screen, so no compositor work happens while the user reads further
// down the page. Without an observer the animation keeps ticking forever.
function initRadarVisibility() {
  const hero = document.querySelector(".hero, .error-hero");
  if (!hero) return;

  if (!("IntersectionObserver" in window)) return; // animation just runs as normal

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        hero.classList.toggle("radar-idle", !entry.isIntersecting);
      });
    },
    { threshold: 0 }
  );

  observer.observe(hero);
}

// Types out the tagline's existing text once on load, then leaves it alone.
// Deliberately does NOT loop: the tagline is the page's primary identifying
// line, and a type/delete cycle left it unreadable most of the time.
function typeTaglineOnce(el) {
  const text = el.textContent;
  const TYPE_SPEED = 45;

  let i = 0;
  el.textContent = "";

  (function tick() {
    i++;
    el.textContent = text.slice(0, i);
    if (i < text.length) setTimeout(tick, TYPE_SPEED);
  })();
}

// Custom crosshair cursor. Skipped entirely on touch/no-hover devices and when
// the user prefers reduced motion.
function initCustomCursor() {
  const noHover = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (noHover || prefersReducedMotion) return;

  const INTERACTIVE_SELECTOR = "a, button, .filter-btn";

  const dot = document.createElement("div");
  dot.className = "cursor-dot";
  dot.setAttribute("aria-hidden", "true");
  document.body.appendChild(dot);
  document.body.classList.add("custom-cursor-active");

  let mouseX = 0;
  let mouseY = 0;
  let rafScheduled = false;

  function updateDotPosition() {
    dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
    rafScheduled = false;
  }

  window.addEventListener(
    "mousemove",
    (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!rafScheduled) {
        rafScheduled = true;
        requestAnimationFrame(updateDotPosition);
      }
    },
    { passive: true }
  );

  document.addEventListener("mouseover", (e) => {
    dot.classList.toggle("cursor-dot--hover", !!e.target.closest(INTERACTIVE_SELECTOR));
  });
}

// Fades + slides each section's content up into place as it enters the
// viewport. Grouped items (project cards, skill bars) get a small
// incremental delay so they cascade in rather than popping simultaneously.
function initScrollReveal() {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (prefersReducedMotion || !("IntersectionObserver" in window)) return;

  const STAGGER_MS = 80;
  const targets = [];

  function addGroup(elements) {
    elements.filter(Boolean).forEach((el, i) => {
      el.classList.add("reveal");
      el.style.setProperty("--reveal-delay", `${i * STAGGER_MS}ms`);
      targets.push(el);
    });
  }

  addGroup([document.querySelector(".hero-content")]);
  addGroup([
    document.querySelector(".about .section-title"),
    document.querySelector(".about-content"),
  ]);
  addGroup([
    document.querySelector(".projects .section-title"),
    document.querySelector(".projects .section-subtitle"),
    document.querySelector(".project-filters"),
  ]);
  addGroup(Array.from(document.querySelectorAll(".project-card")));
  addGroup([document.querySelector(".skills .section-title")]);
  addGroup(Array.from(document.querySelectorAll(".skill-group-title")));
  addGroup(Array.from(document.querySelectorAll(".skill-fill")));
  addGroup([
    document.querySelector(".contact .section-title"),
    document.querySelector(".contact .section-subtitle"),
    document.querySelector(".contact-links"),
  ]);

  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  targets.forEach((el) => observer.observe(el));
}

// Highlights the left-gutter marker for whichever section is crossing the
// middle of the viewport. The rootMargin collapses the observer's root to a
// thin band at the vertical centre, so exactly one contiguous section is
// "active" at a time (and none while the hero is centred, which is correct).
function initGutterMarkers() {
  const markers = document.querySelectorAll(".gutter-marker");
  if (!markers.length || !("IntersectionObserver" in window)) return;

  const markerForSection = new Map();
  markers.forEach((marker) => {
    const section = document.getElementById(marker.dataset.section);
    if (section) markerForSection.set(section, marker);
  });
  if (!markerForSection.size) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const marker = markerForSection.get(entry.target);
        if (marker) marker.classList.toggle("is-active", entry.isIntersecting);
      });
    },
    { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
  );

  markerForSection.forEach((_, section) => observer.observe(section));
}

// Drifting radar contacts in the side gutters: small triangle blips that
// drift slowly and diagonally, leaving a brief fading trail, and periodically
// "ping" — a short brighten plus a small coordinate label like "K-8" that
// fades after ~2s. Canvas rather than DOM nodes specifically so the trail can
// be drawn as a cheap per-frame alpha fade instead of spawning/removing many
// trail elements. Deliberately has NO sweep/beam of any kind — pings fire on
// a per-blip random timer instead of "when a sweep passes," since there's
// nothing sweeping. Skipped entirely under prefers-reduced-motion — Stage 1's
// static rings are left as the only visual.
function initGutterRadarBlips() {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (prefersReducedMotion) return;

  const gutterEls = document.querySelectorAll(".gutter-radar");
  if (!gutterEls.length) return;

  // Matches --color-accent in style.css (#ffb000), which is identical in
  // both themes — canvas fillStyle can't read a CSS custom property, so this
  // has to be hardcoded. Update both together if the accent color changes.
  const ACCENT_RGB = "255, 176, 0";
  const BASE_OPACITY = 0.55; // even at full brightness, stays subtle
  const BLIPS_PER_GUTTER = 2;
  const MIN_SPEED = 4; // px/s — slow, understated drift
  const MAX_SPEED = 8;
  const FADE_SECONDS = 1.2; // fade in on spawn, fade out before despawn
  const TRAIL_ERASE_ALPHA = 0.14; // higher = shorter trail
  const EDGE_MARGIN = 15;
  const PING_FLASH_DURATION = 1.0; // how long the contact itself stays brightened
  const PING_LABEL_DURATION = 1.8; // must match the CSS animation duration below
  const PING_INTERVAL_MIN = 4; // seconds between a blip's pings, while active
  const PING_INTERVAL_MAX = 9;

  const wideQuery = window.matchMedia("(min-width: 1200px)");

  function nextPingDelay() {
    return PING_INTERVAL_MIN + Math.random() * (PING_INTERVAL_MAX - PING_INTERVAL_MIN);
  }

  function makeBlip() {
    return {
      x: 0,
      y: 0,
      angle: 0,
      speed: 0,
      state: "in",
      stateT: 0,
      activeDuration: 0,
      opacity: 0,
      pingT: null,
      nextPingIn: 0,
    };
  }

  function resetBlip(blip, width, height) {
    const fromTop = Math.random() < 0.5;
    blip.x = Math.random() * width;
    blip.y = fromTop ? -EDGE_MARGIN : height + EDGE_MARGIN;
    const skew = Math.random() * 0.8 - 0.4; // +/- ~23 degrees off straight vertical
    const dir = fromTop ? 1 : -1; // travel down if spawned at top, up if spawned at bottom
    blip.angle = (dir * Math.PI) / 2 + skew;
    blip.speed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
    blip.state = "in";
    blip.stateT = 0;
    blip.opacity = 0;
    blip.pingT = null;
    blip.nextPingIn = nextPingDelay();
  }

  const scenes = Array.from(gutterEls).map((gutter) => {
    const canvas = document.createElement("canvas");
    canvas.className = "gutter-radar-canvas";
    gutter.appendChild(canvas);
    const blips = Array.from({ length: BLIPS_PER_GUTTER }, makeBlip);
    return { gutter, canvas, ctx: canvas.getContext("2d"), width: 0, height: 0, blips };
  });

  function resizeScene(scene) {
    const rect = scene.gutter.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    scene.width = rect.width;
    scene.height = rect.height;
    scene.canvas.width = Math.max(1, Math.round(rect.width * dpr));
    scene.canvas.height = Math.max(1, Math.round(rect.height * dpr));
    scene.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // a fresh/resized canvas has no trail history to erase, and blip
    // positions were relative to the old size — just start them over
    scene.blips.forEach((blip) => resetBlip(blip, scene.width, scene.height));
  }

  function triggerPing(scene, blip) {
    blip.pingT = 0;

    const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    const number = 1 + Math.floor(Math.random() * 9);
    const label = document.createElement("span");
    label.className = "gutter-ping-label";
    label.textContent = `${letter}-${number}`;

    // bias the label toward whichever side of the gutter has more room, so
    // it's less likely to sit right at the clipped edge of the container
    if (blip.x < scene.width / 2) {
      label.style.left = blip.x + 8 + "px";
    } else {
      label.style.right = scene.width - blip.x + 8 + "px";
    }
    label.style.top = Math.max(0, blip.y - 8) + "px";

    // belt-and-suspenders: animationend should fire, but a stray label left
    // behind forever if it somehow doesn't is worse than a redundant timer
    const removeTimer = setTimeout(
      () => label.remove(),
      PING_LABEL_DURATION * 1000 + 200
    );
    label.addEventListener("animationend", () => {
      clearTimeout(removeTimer);
      label.remove();
    });
    scene.gutter.appendChild(label);
  }

  function drawBlip(ctx, blip) {
    const pingBoost =
      blip.pingT === null ? 0 : Math.max(0, 1 - blip.pingT / PING_FLASH_DURATION);
    const alpha = Math.min(1, blip.opacity * BASE_OPACITY + pingBoost * 0.4);
    const scale = 1 + pingBoost * 0.6;

    ctx.save();
    ctx.translate(blip.x, blip.y);
    ctx.rotate(blip.angle + Math.PI / 2);
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(4, 5);
    ctx.lineTo(-4, 5);
    ctx.closePath();
    ctx.fillStyle = `rgba(${ACCENT_RGB}, ${alpha.toFixed(3)})`;
    ctx.fill();
    ctx.restore();
  }

  function updateBlip(scene, blip, dt, width, height) {
    if (blip.pingT !== null) {
      blip.pingT += dt;
      if (blip.pingT >= PING_FLASH_DURATION) blip.pingT = null;
    }

    blip.x += blip.speed * Math.cos(blip.angle) * dt;
    blip.y += blip.speed * Math.sin(blip.angle) * dt;
    blip.stateT += dt;

    if (blip.state === "in") {
      blip.opacity = Math.min(1, blip.stateT / FADE_SECONDS);
      if (blip.stateT >= FADE_SECONDS) {
        blip.state = "active";
        blip.stateT = 0;
        blip.activeDuration = 20 + Math.random() * 15;
      }
      return;
    }

    const outOfBounds =
      blip.x < -EDGE_MARGIN ||
      blip.x > width + EDGE_MARGIN ||
      blip.y < -EDGE_MARGIN ||
      blip.y > height + EDGE_MARGIN;

    if (blip.state === "active") {
      blip.opacity = 1;

      blip.nextPingIn -= dt;
      if (blip.nextPingIn <= 0 && blip.pingT === null) {
        triggerPing(scene, blip);
        blip.nextPingIn = nextPingDelay();
      }

      if (outOfBounds || blip.stateT >= blip.activeDuration) {
        blip.state = "out";
        blip.stateT = 0;
      }
      return;
    }

    // state === "out"
    blip.opacity = Math.max(0, 1 - blip.stateT / FADE_SECONDS);
    if (blip.stateT >= FADE_SECONDS) {
      resetBlip(blip, width, height);
    }
  }

  let rafId = null;
  let lastTime = null;

  function frame(now) {
    if (lastTime === null) lastTime = now;
    // clamp dt so a backgrounded/throttled tab doesn't cause a giant jump in
    // blip position the instant the loop resumes
    const dt = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;

    scenes.forEach((scene) => {
      const { ctx, width, height } = scene;
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = `rgba(0, 0, 0, ${TRAIL_ERASE_ALPHA})`;
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = "source-over";

      scene.blips.forEach((blip) => {
        updateBlip(scene, blip, dt, width, height);
        drawBlip(ctx, blip);
      });
    });

    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (rafId !== null) return;
    lastTime = null;
    rafId = requestAnimationFrame(frame);
  }

  function stop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  // Three independent reasons to pause: the tab isn't visible, the viewport
  // has narrowed below where the gutters even render, or the user has
  // scrolled down into the footer (past all real content, so there's
  // nothing left for the radar scene to sit beside).
  let tabHidden = document.hidden;
  let tooNarrow = !wideQuery.matches;
  let footerVisible = false;

  function syncRunning() {
    if (tabHidden || tooNarrow || footerVisible) {
      stop();
    } else {
      start();
    }
  }

  document.addEventListener("visibilitychange", () => {
    tabHidden = document.hidden;
    syncRunning();
  });

  wideQuery.addEventListener("change", (e) => {
    tooNarrow = !e.matches;
    if (!tooNarrow) scenes.forEach(resizeScene);
    syncRunning();
  });

  window.addEventListener(
    "resize",
    () => {
      if (!tooNarrow) scenes.forEach(resizeScene);
    },
    { passive: true }
  );

  const footer = document.querySelector(".site-footer");
  if (footer && "IntersectionObserver" in window) {
    const footerObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          footerVisible = entry.isIntersecting;
        });
        syncRunning();
      },
      { threshold: 0 }
    );
    footerObserver.observe(footer);
  }

  scenes.forEach(resizeScene);
  syncRunning();
}

// Theme toggle. Dark is the CSS default (bare :root), so light is opt-in via a
// data-theme attribute on <html>. The choice is held in a plain variable for
// the life of the page — deliberately NOT localStorage/sessionStorage — so it
// resets to dark on reload.
function initThemeToggle() {
  const btn = document.getElementById("themeToggle");
  if (!btn) return;

  let theme = "dark";

  function apply() {
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    btn.textContent = theme === "dark" ? "[DARK]" : "[LIGHT]";
    btn.setAttribute(
      "aria-label",
      theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
    );
  }

  btn.addEventListener("click", () => {
    theme = theme === "dark" ? "light" : "dark";
    apply();
  });

  apply();
}

// Mobile nav toggle + smooth-scroll close-on-click + footer year.
document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.getElementById("navToggle");
  const navMenu = document.getElementById("navMenu");

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      const isOpen = navMenu.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    navMenu.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        navMenu.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const taglineEl = document.getElementById("tagline");
  if (taglineEl && !prefersReducedMotion) {
    typeTaglineOnce(taglineEl);
  }

  const filterButtons = document.querySelectorAll(".filter-btn");
  const projectCards = document.querySelectorAll(".project-card");

  if (filterButtons.length && projectCards.length) {
    filterButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const filter = btn.dataset.filter;

        filterButtons.forEach((b) => b.classList.toggle("is-active", b === btn));

        projectCards.forEach((card) => {
          const categories = (card.dataset.category || "").split(" ");
          const show = filter === "all" || categories.includes(filter);
          card.classList.toggle("is-hidden", !show);
        });
      });
    });
  }

  initThemeToggle();
  initGutterMarkers();
  initGutterRadarBlips();
  initRadarVisibility();
  initCustomCursor();
  initScrollReveal();
});
