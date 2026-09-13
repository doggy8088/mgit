/* ============================================================================
   mgit website — the instrument's recorder

   The strips are drawn from recorded sessions of the real binary. Two runs
   were captured on 2026-09-14 in a demo workspace holding six repositories:

     mgit --summary      →  exit 0,   6 repositories, 6 succeeded
     mgit pull           →  exit 128, 6 repositories, 0 succeeded, 6 failed

   Nothing here is invented: channel names, branches, change counts, failure
   lines and exit codes are the recorded values.
   ========================================================================== */

(function () {
  "use strict";

  /* The run data is the page's own record of a real session
     (<script type="application/json" id="mgit-runs">), so the legend rows and
     the drawn traces can never disagree. */
  function readRuns() {
    var node = document.getElementById("mgit-runs");
    if (!node) return null;
    try {
      return JSON.parse(node.textContent);
    } catch (error) {
      return null;
    }
  }

  var SVG_NS = "http://www.w3.org/2000/svg";
  var SWEEP_MS = 2400;

  function el(name, attrs) {
    var node = document.createElementNS(SVG_NS, name);
    for (var key in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, key)) {
        node.setAttribute(key, attrs[key]);
      }
    }
    return node;
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* A pen has inertia: it turns in a short S curve, and a violent event makes
     it overshoot before it settles. */
  function stepCurve(x, yFrom, yTo, r) {
    return "C " + (x + r) + " " + yFrom + ", " + (x + r) + " " + yTo + ", " + (x + 2 * r) + " " + yTo;
  }

  function traceFor(channel, lane, lanes, geom) {
    var top = geom.top;
    var bottom = geom.bottom;
    var laneH = (bottom - top) / lanes;
    var y = top + laneH * (lane + 0.5);
    var x0 = geom.left;
    var x1 = geom.right;
    var amp = Math.min(laneH * 0.36, 34);
    var d = "M " + x0 + " " + y;

    if (channel.state === "clean") {
      d += " L " + x1 + " " + y;
      return { d: d, y: y, peak: y, end: x1, amp: 0 };
    }

    if (channel.state === "dirty") {
      var count = Math.max(1, channel.changes);
      var span = x1 - x0;
      var slot = span / (count + 0.5);
      var pw = Math.min(58, slot * 0.6);
      var cursor = x0 + slot * 0.25;
      var peakY = y - amp;
      for (var i = 0; i < count; i++) {
        d += " " + stepCurve(cursor, y, peakY, 7);
        cursor += 2 * 7;
        d += " L " + (cursor + pw) + " " + peakY;
        cursor += pw;
        d += " " + stepCurve(cursor, peakY, y, 7);
        cursor += 2 * 7 + slot * 0.22;
      }
      d += " L " + x1 + " " + y;
      return { d: d, y: y, peak: peakY, end: x1, amp: amp, count: count };
    }

    /* failed: a violent excursion, the pen overshoots, then it rings and rests */
    var centre = x0 + (x1 - x0) * 0.52;
    var big = amp * 1.85;
    var top2 = y - big;
    d += " " + stepCurve(centre - 46, y, top2, 11);
    d += " L " + (centre - 12) + " " + top2;
    d += " " + stepCurve(centre + 10, top2, y + amp * 0.34, 12);
    d += " " + stepCurve(centre + 74, y + amp * 0.34, y - amp * 0.12, 9);
    d += " " + stepCurve(centre + 132, y - amp * 0.12, y, 8);
    d += " L " + x1 + " " + y;
    return { d: d, y: y, peak: top2, end: centre + 150, amp: big };
  }

  function crossMark(cx, cy, size) {
    var g = el("g", { class: "mark mark--cross" });
    g.appendChild(
      el("path", {
        d: "M " + (cx - size) + " " + (cy - size) + " L " + (cx + size) + " " + (cy + size) +
           " M " + (cx + size) + " " + (cy - size) + " L " + (cx - size) + " " + (cy + size)
      })
    );
    return g;
  }

  function flagMark(cx, cy, size) {
    var g = el("g", { class: "mark mark--flag" });
    g.appendChild(el("path", { d: "M " + cx + " " + cy + " l " + size + " " + -size + " l 0 " + 2 * size + " z" }));
    return g;
  }

  function drawStrip(strip, runs) {
    var key = strip.getAttribute("data-strip");
    var run = runs && runs[key];
    if (!run) return null;

    var width = Math.max(320, Math.round(strip.clientWidth));
    var height = Math.max(200, Math.round(strip.clientHeight));
    var geom = {
      top: Math.round(height * 0.16),
      bottom: Math.round(height * 0.9),
      left: 18,
      right: width - 18
    };

    var svg = el("svg", {
      class: "strip__svg",
      viewBox: "0 0 " + width + " " + height,
      preserveAspectRatio: "none",
      role: "presentation",
      "aria-hidden": "true",
      focusable: "false"
    });

    var lanes = run.channels.length;
    var laneH = (geom.bottom - geom.top) / lanes;
    var grid = el("g", { class: "strip__grid" });

    for (var i = 0; i <= lanes; i++) {
      var gy = geom.top + laneH * i;
      grid.appendChild(el("line", { x1: geom.left, y1: gy, x2: geom.right, y2: gy, class: "lane__rule" }));
    }
    svg.appendChild(grid);

    var carriage = el("g", { class: "strip__carriage" });
    carriage.appendChild(el("line", { x1: 0, y1: geom.top - 8, x2: 0, y2: geom.bottom + 4, class: "carriage__head" }));
    carriage.appendChild(el("rect", { x: -7, y: geom.top - 16, width: 14, height: 8, class: "carriage__block" }));
    svg.appendChild(carriage);

    var traces = [];
    run.channels.forEach(function (channel, lane) {
      var t = traceFor(channel, lane, lanes, geom);
      var path = el("path", {
        d: t.d,
        class: "trace trace--" + channel.state,
        "data-lane": lane,
        pathLength: "1"
      });
      traces.push(path);
      svg.appendChild(path);

      if (channel.state === "dirty") {
        var mx = Math.min(t.end - 10, geom.right - 14);
        svg.appendChild(flagMark(mx, t.y - t.amp, 5));
      }

      if (channel.state === "failed") {
        svg.appendChild(crossMark(t.end - 26, t.peak + 12, 6));
        var tick = el("text", {
          x: t.end - 14,
          y: t.peak + 16,
          class: "tick tick--alarm"
        });
        tick.textContent = String(channel.code);
        svg.appendChild(tick);
      }
    });

    var old = strip.querySelector("svg.strip__svg");
    if (old && old.parentNode === strip) strip.removeChild(old);
    strip.insertBefore(svg, strip.firstChild);

    return { svg: svg, traces: traces, carriage: carriage, geom: geom, width: width, reduced: prefersReducedMotion() };
  }

  function settle(ctx) {
    if (!ctx || !ctx.traces) return;
    ctx.traces.forEach(function (path) {
      path.style.strokeDasharray = "1";
      path.style.strokeDashoffset = "0";
    });
    ctx.carriage.style.transform = "translateX(" + ctx.geom.right + "px)";
    ctx.carriage.style.opacity = "0";
    ctx.svg.querySelectorAll(".mark, .tick").forEach(function (node) {
      node.style.opacity = "1";
    });
  }

  function sweep(strip, ctx) {
    if (ctx.reduced) {
      settle(ctx);
      return;
    }
    if (strip.dataset.sweeping === "true") return;
    strip.dataset.sweeping = "true";

    ctx.traces.forEach(function (path, index) {
      path.style.strokeDasharray = "1";
      path.style.strokeDashoffset = "1";
      path.style.transition = "stroke-dashoffset " + SWEEP_MS + "ms cubic-bezier(.22,.61,.24,1)";
      path.style.transitionDelay = index * 60 + "ms";
      path.style.opacity = "1";
    });

    ctx.svg.querySelectorAll(".mark, .tick").forEach(function (node) {
      node.style.opacity = "0";
      node.style.transition = "opacity 260ms linear";
      node.style.transitionDelay = SWEEP_MS * 0.82 + "ms";
    });

    var start = null;
    ctx.carriage.style.opacity = "1";

    function frame(now) {
      if (start === null) start = now;
      var t = Math.min(1, (now - start) / SWEEP_MS);
      var eased = 1 - Math.pow(1 - t, 3);
      var x = ctx.geom.left + (ctx.geom.right - ctx.geom.left) * eased;
      ctx.carriage.style.transform = "translateX(" + x + "px)";
      if (t < 1) {
        window.requestAnimationFrame(frame);
      } else {
        strip.dataset.sweeping = "false";
        ctx.carriage.style.opacity = "0";
      }
    }

    window.requestAnimationFrame(function () {
      ctx.traces.forEach(function (path) {
        path.style.strokeDashoffset = "0";
      });
      window.requestAnimationFrame(frame);
    });
  }

  function initStrips() {
    var runs = readRuns();
    if (!runs) return;
    document.querySelectorAll("[data-strip]").forEach(function (strip) {
      var ctx = drawStrip(strip, runs);
      if (!ctx) return;

      var replay = strip.querySelector("[data-replay]");
      if (replay) {
        replay.addEventListener("click", function () {
          if (ctx.reduced) {
            settle(ctx);
            return;
          }
          sweep(strip, ctx);
        });
      }

      if (ctx.reduced || !("IntersectionObserver" in window)) {
        settle(ctx);
        return;
      }

      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              sweep(strip, ctx);
              observer.disconnect();
            }
          });
        },
        { threshold: 0.35 }
      );
      observer.observe(strip);
    });

    var resizeTimer = null;
    window.addEventListener("resize", function () {
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        document.querySelectorAll("[data-strip]").forEach(function (strip) {
          var ctx = drawStrip(strip, readRuns());
          if (ctx) settle(ctx);
        });
      }, 180);
    });
  }

  /* The legend lifts the pen it names: one instrument, legend wired to strip. */
  function initLegendLinks() {
    document.querySelectorAll("[data-legend]").forEach(function (list) {
      var strip = document.querySelector('[data-strip="' + list.getAttribute("data-legend") + '"]');
      if (!strip) return;
      list.querySelectorAll("[data-lane]").forEach(function (row) {
        function focus() {
          strip.classList.add("is-linking");
          var lane = row.getAttribute("data-lane");
          strip.querySelectorAll(".trace").forEach(function (path) {
            path.classList.toggle("trace--lifted", path.getAttribute("data-lane") === lane);
          });
        }
        function blur() {
          strip.classList.remove("is-linking");
          strip.querySelectorAll(".trace").forEach(function (path) {
            path.classList.remove("trace--lifted");
          });
        }
        row.addEventListener("mouseenter", focus);
        row.addEventListener("mouseleave", blur);
      });
    });
  }

  function legacyCopy(text) {
    return new Promise(function (resolve, reject) {
      var helper = document.createElement("textarea");
      helper.value = text;
      helper.setAttribute("readonly", "true");
      helper.style.position = "fixed";
      helper.style.top = "-1000px";
      document.body.appendChild(helper);
      helper.select();
      try {
        document.execCommand("copy");
        resolve();
      } catch (error) {
        reject(error);
      } finally {
        document.body.removeChild(helper);
      }
    });
  }

  /* The clipboard API rejects on hosts that never granted the permission, so a
     rejection falls back to the legacy path before the button gives up. */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () {
        return legacyCopy(text);
      });
    }
    return legacyCopy(text);
  }

  function initSwitches() {
    document.querySelectorAll("[data-copy]").forEach(function (button) {
      var label = button.querySelector("[data-copy-label]");
      var original = label ? label.textContent : "";
      var done = button.getAttribute("data-label-copied") || "COPIED";
      var timer = null;

      button.addEventListener("click", function () {
        copyText(button.getAttribute("data-copy")).then(
          function () {
            button.setAttribute("data-copied", "true");
            if (label) label.textContent = done;
            if (timer) window.clearTimeout(timer);
            timer = window.setTimeout(function () {
              button.setAttribute("data-copied", "false");
              if (label) label.textContent = original;
            }, 1800);
          },
          function () {
            if (label) label.textContent = button.getAttribute("data-label-failed") || original;
          }
        );
      });
    });
  }

  /* A run log is real terminal output: when its longest line is wider than the
     printed frame, the reader gets the hint and the container is focusable, so
     the rest of the evidence is reachable without a mouse. */
  function initRunlogs() {
    var logs = [].slice.call(document.querySelectorAll(".runlog"));
    if (!logs.length) return;
    function check() {
      logs.forEach(function (log) {
        var body = log.querySelector(".runlog__body");
        if (!body) return;
        var overflows = body.scrollWidth - body.clientWidth > 2;
        log.setAttribute("data-scrollable", overflows ? "true" : "false");
      });
    }
    check();
    var timer = null;
    window.addEventListener("resize", function () {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(check, 150);
    });
  }

  function init() {
    initStrips();
    initLegendLinks();
    initSwitches();
    initRunlogs();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
