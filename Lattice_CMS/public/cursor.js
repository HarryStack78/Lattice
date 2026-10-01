// Same pointer as the Lattice website (components/CustomCursor.tsx): a dot plus a trailing ring with a
// difference blend that turns into a filled lens over anything clickable. Standalone: no GSAP.
(function () {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  var INTERACTIVE = 'a, button, [role="button"], [data-cursor="link"], summary, label, input, textarea, select';

  function el(cls, parent) {
    var node = document.createElement("div");
    node.className = cls;
    if (parent) parent.appendChild(node);
    return node;
  }

  var root = el("lc");
  root.setAttribute("aria-hidden", "true");
  var ring = el("lc-ring", root);
  el("lc-ring-in", ring);
  var dot = el("lc-dot", root);
  el("lc-dot-in", dot);
  document.body.appendChild(root);

  var target = { x: 0, y: 0 };
  var d = { x: 0, y: 0 };
  var r = { x: 0, y: 0 };
  var tracking = false;
  var running = false;
  var last = 0;

  // Exponential smoothing tuned to the site's quickTo timings (dot 0.1s, ring 0.4s, power3.out).
  function k(dt, duration) {
    return 1 - Math.exp(-dt / (duration / 3));
  }

  function frame(now) {
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    var kd = k(dt, 0.1);
    var kr = k(dt, 0.4);
    d.x += (target.x - d.x) * kd;
    d.y += (target.y - d.y) * kd;
    r.x += (target.x - r.x) * kr;
    r.y += (target.y - r.y) * kr;
    dot.style.transform = "translate3d(" + d.x + "px," + d.y + "px,0)";
    ring.style.transform = "translate3d(" + r.x + "px," + r.y + "px,0)";
    if (Math.abs(target.x - r.x) > 0.1 || Math.abs(target.y - r.y) > 0.1) requestAnimationFrame(frame);
    else running = false;
  }
  function kick() {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }

  window.addEventListener(
    "mousemove",
    function (e) {
      target.x = e.clientX;
      target.y = e.clientY;
      if (!tracking) {
        tracking = true;
        d.x = r.x = e.clientX;
        d.y = r.y = e.clientY;
        document.body.setAttribute("data-cursor-ready", "true");
      }
      root.classList.add("on");
      kick();
    },
    { passive: true }
  );
  document.addEventListener("mouseover", function (e) {
    var t = e.target;
    root.classList.toggle("hover", !!(t && t.closest && t.closest(INTERACTIVE)));
  });
  document.documentElement.addEventListener("mouseleave", function () {
    root.classList.remove("on");
  });
  window.addEventListener("mousedown", function () { root.classList.add("down"); });
  window.addEventListener("mouseup", function () { root.classList.remove("down"); });
})();
