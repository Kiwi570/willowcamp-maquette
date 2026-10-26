/* Willow Camp — dessins générés en code (plume, herbier, cadran, visuels provisoires) */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var D = {};

  // Générateur pseudo-aléatoire stable (même dessin à chaque visite)
  function rng(seed) {
    var s = seed >>> 0 || 1;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  D.rng = rng;
  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  D.el = el;
  function f(n) { return Math.round(n * 10) / 10; }

  // Feuille de saule (lancéolée) orientée selon un angle
  function feuilleSaule(x, y, ang, len, w) {
    var c = Math.cos(ang), s = Math.sin(ang), nx = -s, ny = c;
    var tx = x + c * len, ty = y + s * len;
    var m1x = x + c * len * .45 + nx * w, m1y = y + s * len * .45 + ny * w;
    var m2x = x + c * len * .45 - nx * w, m2y = y + s * len * .45 - ny * w;
    return 'M' + f(x) + ' ' + f(y) + ' Q' + f(m1x) + ' ' + f(m1y) + ' ' + f(tx) + ' ' + f(ty) + ' Q' + f(m2x) + ' ' + f(m2y) + ' ' + f(x) + ' ' + f(y) + ' Z';
  }
  D.feuilleSaule = feuilleSaule;

  // Branches de saule pleureur qui tombent du haut d'un SVG
  D.saule = function (svg, opts) {
    opts = opts || {};
    var vb = svg.viewBox.baseVal, W = vb.width, H = vb.height;
    var r = rng(opts.seed || 7);
    var n = opts.n || 14;
    var g = el('g', { 'class': 'saule' }, svg);
    var brins = [];
    for (var i = 0; i < n; i++) {
      var t = opts.xs ? opts.xs[i % opts.xs.length] : (i + .5) / n;
      var x0 = vb.x + W * t + (r() - .5) * W / n;
      var mn = opts.min || .35, mx = opts.max || .95;
      if (opts.longueur) { var lm = opts.longueur(t); mn = lm[0]; mx = lm[1]; }
      var len = H * mn + r() * H * (mx - mn);
      var sway = (r() - .5) * W * .05;
      var brin = el('g', { 'class': 'brin' }, g);
      var d = 'M' + f(x0) + ' ' + f(vb.y - 4) + ' C' + f(x0 + sway * .4) + ' ' + f(vb.y + len * .35) + ' ' + f(x0 + sway) + ' ' + f(vb.y + len * .7) + ' ' + f(x0 + sway * 1.2) + ' ' + f(vb.y + len);
      var tige = el('path', { d: d, 'class': 'tige' }, brin);
      brin.setAttribute('data-x', f(x0));
      var L = tige.getTotalLength ? tige.getTotalLength() : len;
      var nb = Math.max(4, Math.round(len / (opts.pas || 22)));
      var leaves = [];
      for (var k = 1; k <= nb; k++) {
        var p = tige.getPointAtLength(L * (k / (nb + .5)));
        var side = k % 2 ? 1 : -1;
        var ang = Math.PI / 2 + side * (.35 + r() * .35);
        var ll = (opts.feuille || 24) * (.7 + r() * .5) * (1 - k / (nb * 2.2));
        leaves.push('<path class="f" d="' + feuilleSaule(p.x, p.y, ang, ll, ll * .16) + '"/>');
      }
      var fg = el('g', { 'class': 'feuilles' }, brin);
      fg.innerHTML = leaves.join('');
      brins.push(brin);
    }
    return brins;
  };

  // Bord de papier déchiré
  D.bordDechire = function (path, seed) {
    var r = rng(seed || 3), d = 'M0 0 L0 14', x = 0;
    while (x < 1200) { x += 14 + r() * 26; d += ' L' + f(Math.min(x, 1200)) + ' ' + f(6 + r() * 26); }
    d += ' L1200 0 Z';
    path.setAttribute('d', d);
  };

  // Feuilles d'arbres (roulottes)
  function contour(fn, steps) {
    var pts = [];
    for (var i = 0; i <= steps; i++) pts.push(fn(i / steps));
    return 'M' + pts.map(function (p) { return f(p[0]) + ' ' + f(p[1]); }).join(' L') + ' Z';
  }
  D.feuilleArbre = function (svg, type) {
    svg.innerHTML = '';
    var g = el('g', {}, svg);
    var cx = 100, base = 222, top = 24;
    function nerv(d) { el('path', { d: d, 'class': 'nervure' }, g); }
    if (type === 'robinia') {
      el('path', { d: 'M100 228 C100 180 100 120 100 26', 'class': 'nervure' }, g);
      var ys = [40, 72, 104, 136, 168, 200];
      ys.forEach(function (y, i) {
        if (i === 0) { el('ellipse', { cx: 100, cy: 30, rx: 11, ry: 17, 'class': 'limbe' }, g); }
        [-1, 1].forEach(function (s) {
          var ex = 100 + s * 30, ey = y + 4;
          el('ellipse', { cx: ex, cy: ey, rx: 22, ry: 11, transform: 'rotate(' + (s * -14) + ' ' + ex + ' ' + ey + ')', 'class': 'limbe' }, g);
          nerv('M100 ' + y + ' L' + (100 + s * 46) + ' ' + (y + 8));
        });
      });
      return;
    }
    var fn;
    if (type === 'willow') {
      fn = function (t) {
        var a = t * Math.PI * 2, y = top + (base - top) * (1 - (Math.cos(a) + 1) / 2);
        var hw = Math.sin(Math.PI * (y - top) / (base - top)) * 15 * (1 - .2 * (y - top) / (base - top));
        var serr = (Math.sin(t * 120) * .9);
        var side = Math.sin(a) >= 0 ? 1 : -1;
        return [cx + side * (hw + serr), y];
      };
    } else if (type === 'oak') {
      fn = function (t) {
        var a = t * Math.PI * 2, u = (1 - Math.cos(a)) / 2, y = top + 6 + (base - 30 - top) * u;
        var env = Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.04)), .75) * 50 * (0.6 + .4 * u);
        var lobes = .74 + .26 * Math.cos(u * Math.PI * 9);
        var side = Math.sin(a) >= 0 ? 1 : -1;
        return [cx + side * env * lobes, y];
      };
    } else {
      // hazel : arrondi, base en cœur, bord doublement denté, pointe courte
      fn = function (t) {
        var a = t * Math.PI * 2, u = (1 - Math.cos(a)) / 2, y = top + 10 + (base - 38 - top) * u;
        var env = Math.sin(Math.PI * Math.pow(u, .78)) * 66;
        if (u < .08) env *= u / .08 * .6 + .4;
        var dents = 1 + .045 * Math.sin(u * 110) + .025 * Math.sin(u * 230);
        var side = Math.sin(a) >= 0 ? 1 : -1;
        var heart = u > .9 ? -(u - .9) * 90 : 0;
        return [cx + side * env * dents, y + heart * .3];
      };
    }
    el('path', { d: contour(fn, 360), 'class': 'limbe' }, g);
    nerv('M100 ' + (base + 6) + ' C100 ' + (base - 40) + ' 101 ' + (top + 60) + ' 100 ' + (top + 8));
    var nb = type === 'willow' ? 9 : 6;
    for (var i = 1; i <= nb; i++) {
      var y = top + 20 + (base - top - 60) * (i / (nb + .5));
      var l = type === 'willow' ? 10 : 34 + Math.sin(i / nb * Math.PI) * 14;
      nerv('M100 ' + f(y + 8) + ' Q' + f(100 - l * .5) + ' ' + f(y + 2) + ' ' + f(100 - l) + ' ' + f(y - 10));
      nerv('M100 ' + f(y + 8) + ' Q' + f(100 + l * .5) + ' ' + f(y + 2) + ' ' + f(100 + l) + ' ' + f(y - 10));
    }
    nerv('M100 ' + (base + 6) + ' L100 ' + (base + 16));
  };

  // Fougère (marges)
  D.fougere = function (svg, seed) {
    var r = rng(seed);
    var d = [], H = 600, x = 60;
    d.push('M' + x + ' ' + H + ' C' + (x - 10) + ' ' + (H * .6) + ' ' + (x + 30) + ' ' + (H * .3) + ' ' + (x + 8) + ' 20');
    svg.innerHTML = '';
    var rach = el('path', { d: d[0], 'class': 'rachis' }, svg);
    var L = rach.getTotalLength(), n = 26;
    for (var i = 1; i < n; i++) {
      var p = rach.getPointAtLength(L * i / n), q = rach.getPointAtLength(Math.max(0, L * i / n - 4));
      var ang = Math.atan2(p.y - q.y, p.x - q.x);
      var len = 44 * Math.sin(Math.PI * (1 - i / n)) + 6;
      [-1, 1].forEach(function (s) {
        var a = ang + s * (1.25 + r() * .2);
        var ex = p.x + Math.cos(a) * len, ey = p.y + Math.sin(a) * len;
        el('path', { d: 'M' + f(p.x) + ' ' + f(p.y) + ' Q' + f((p.x + ex) / 2 + Math.cos(ang) * 6) + ' ' + f((p.y + ey) / 2 + Math.sin(ang) * 6 - 4) + ' ' + f(ex) + ' ' + f(ey), 'class': 'penne' }, svg);
      });
    }
  };

  // Fleurs des prés (Le camp, la part sauvage)
  D.fleurs = function (svg) {
    var vb = svg.viewBox.baseVal, W = vb.width, H = vb.height, r = rng(11);
    svg.innerHTML = '';
    var cols = ['#7A8B5A', '#4C5C35', '#6E6B3F'];
    for (var i = 0; i < 110; i++) {
      var x = r() * W, h = H * (.25 + r() * .7), bend = (r() - .5) * 40;
      el('path', { d: 'M' + f(x) + ' ' + H + ' Q' + f(x + bend * .3) + ' ' + f(H - h * .5) + ' ' + f(x + bend) + ' ' + f(H - h), stroke: cols[i % 3], 'stroke-width': f(.8 + r() * 1.2), 'class': 'brin-herbe' }, svg);
    }
    var types = ['marguerite', 'centauree', 'trefle', 'marguerite', 'graminee'];
    for (var j = 0; j < 34; j++) {
      var fx = 20 + r() * (W - 40), fh = H * (.35 + r() * .55), fb = (r() - .5) * 30, ty = types[j % types.length];
      var g = el('g', { 'class': 'fleur' }, svg);
      el('path', { d: 'M' + f(fx) + ' ' + H + ' Q' + f(fx + fb * .3) + ' ' + f(H - fh * .5) + ' ' + f(fx + fb) + ' ' + f(H - fh), stroke: '#4C5C35', 'stroke-width': 1.4, 'class': 'tige' }, g);
      var hx = fx + fb, hy = H - fh;
      if (ty === 'marguerite') {
        for (var k = 0; k < 12; k++) { var a = k / 12 * Math.PI * 2; el('ellipse', { cx: f(hx + Math.cos(a) * 9), cy: f(hy + Math.sin(a) * 9), rx: 6, ry: 2.4, transform: 'rotate(' + f(a * 57.3) + ' ' + f(hx + Math.cos(a) * 9) + ' ' + f(hy + Math.sin(a) * 9) + ')', fill: '#FBF8F1', stroke: '#6A584A', 'stroke-width': .7 }, g); }
        el('circle', { cx: f(hx), cy: f(hy), r: 4.2, fill: '#D6A23A', stroke: '#6A584A', 'stroke-width': .7 }, g);
      } else if (ty === 'centauree') {
        for (var m = 0; m < 9; m++) { var b = -Math.PI / 2 + (m - 4) * .28; el('path', { d: 'M' + f(hx) + ' ' + f(hy) + ' l' + f(Math.cos(b) * 12) + ' ' + f(Math.sin(b) * 12), stroke: '#8E5A8C', 'stroke-width': 2.2 }, g); }
        el('ellipse', { cx: f(hx), cy: f(hy + 3), rx: 5, ry: 6, fill: '#6E6B3F', stroke: 'none' }, g);
      } else if (ty === 'trefle') {
        el('circle', { cx: f(hx), cy: f(hy), r: 7, fill: '#C7849A', stroke: '#6A584A', 'stroke-width': .7 }, g);
      } else {
        for (var q = 0; q < 7; q++) el('ellipse', { cx: f(hx + (q % 2 ? 3 : -3)), cy: f(hy + q * 5), rx: 2.2, ry: 4, fill: '#B9A46A', stroke: 'none' }, g);
      }
    }
  };

  // Arbres en boule (pourtour du plan, forêt de la carte)
  D.arbres = function (g, pathEl, n, seed, inset) {
    var r = rng(seed), L = pathEl.getTotalLength(), out = [];
    for (var i = 0; i < n; i++) {
      var p = pathEl.getPointAtLength(L * i / n);
      var q = pathEl.getPointAtLength((L * i / n + 2) % L);
      var nx = -(q.y - p.y), ny = q.x - p.x, nl = Math.hypot(nx, ny) || 1;
      var off = (inset || 8) + r() * 6;
      var x = p.x + nx / nl * off, y = p.y + ny / nl * off, rr = 6 + r() * 5;
      out.push(nuage(x, y, rr, r));
    }
    g.innerHTML = out.map(function (d) { return '<path d="' + d + '"/>'; }).join('');
  };
  function nuage(x, y, rr, r) {
    var d = '', k = 7;
    for (var i = 0; i <= k; i++) {
      var a = i / k * Math.PI * 2, rad = rr * (.85 + r() * .3);
      var px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad;
      if (i === 0) d += 'M' + f(px) + ' ' + f(py);
      else { var am = (i - .5) / k * Math.PI * 2, cr = rad * 1.3; d += ' Q' + f(x + Math.cos(am) * cr) + ' ' + f(y + Math.sin(am) * cr) + ' ' + f(px) + ' ' + f(py); }
    }
    return d + ' Z';
  }
  D.foret = function (g, cx, cy, w, h, seed) {
    var r = rng(seed), out = [];
    for (var i = 0; i < 38; i++) out.push(nuage(cx - w / 2 + r() * w, cy - h / 2 + r() * h, 7 + r() * 6, r));
    g.innerHTML = out.map(function (d) { return '<path d="' + d + '"/>'; }).join('');
  };

  // Icônes des équipements
  var ICONES = {
    sani: '<path d="M14 8 L26 8 L28 13"/><path d="M18 17 L16 23 M22 17 L22 24 M26 17 L28 23" class="accent"/><path d="M10 40 L38 40"/><path d="M34 14 L34 40"/>',
    baby: '<circle cx="24" cy="15" r="6"/><path d="M14 40 C14 28 34 28 34 40"/><path d="M21 15 L21 15.5 M27 15 L27 15.5"/><path d="M22 18.5 C23 19.5 25 19.5 26 18.5" class="accent"/>',
    vaisselle: '<path d="M8 24 L40 24 C40 32 34 38 24 38 C14 38 8 32 8 24 Z"/><path d="M30 24 L30 10 L36 8"/><path d="M14 20 C14 16 20 16 20 20" class="accent"/>',
    laverie: '<rect x="11" y="7" width="26" height="34" rx="3"/><circle cx="24" cy="26" r="9"/><path d="M19 27 C21 24 27 29 29 26" class="accent"/><path d="M15 12 L19 12"/>',
    repas: '<path d="M10 20 L38 20 C38 28 30 32 24 32 C18 32 10 28 10 20 Z"/><path d="M18 32 L14 42 M30 32 L34 42"/><path d="M18 14 C16 11 20 9 18 6 M26 14 C24 11 28 9 26 6" class="accent"/>',
    service: '<path d="M10 36 L38 36"/><path d="M16 36 L16 18 L28 18 L28 24"/><path d="M28 24 C28 30 34 30 34 24 C34 20 31 17 31 17 C31 17 28 20 28 24 Z" class="accent"/><path d="M12 18 L22 18"/>',
    elec: '<path d="M26 6 L14 26 L23 26 L20 42 L34 20 L25 20 Z" class="accent"/>',
    wifi: '<path d="M8 20 C17 11 31 11 40 20"/><path d="M13 26 C19 20 29 20 35 26"/><path d="M19 32 C22 29 26 29 29 32"/><circle cx="24" cy="37" r="2" class="accent"/>',
    jeux: '<path d="M8 42 L16 10 L24 42"/><path d="M16 10 L38 10 L38 42"/><path d="M30 10 L30 26 M34 10 L34 26 M28 26 L36 26" class="accent"/>',
    petanque: '<circle cx="16" cy="28" r="8"/><circle cx="32" cy="30" r="8"/><path d="M11 25 C14 23 18 23 21 25 M27 27 C30 25 34 25 37 27"/><circle cx="25" cy="16" r="2.5" class="accent"/>',
    peche: '<path d="M8 24 C14 14 30 14 36 24 C30 34 14 34 8 24 Z"/><path d="M36 24 L44 17 L44 31 Z"/><circle cx="14" cy="22" r="1.4" class="accent"/><path d="M20 18 C22 22 22 26 20 30"/>',
    oeufs: '<path d="M18 10 C11 10 8 22 8 28 C8 36 13 40 18 40 C23 40 28 36 28 28 C28 22 25 10 18 10 Z"/><path d="M32 16 C27 16 25 25 25 30 C25 36 28 40 32 40 C36 40 40 36 40 30 C40 25 37 16 32 16 Z" class="accent"/>'
  };
  D.icone = function (svg) { svg.innerHTML = ICONES[svg.getAttribute('data-icone')] || ''; };

  // Cadran de la réception (heure de Bruxelles)
  D.cadran = function (svg) {
    svg.innerHTML = '';
    var c = 60;
    el('circle', { cx: c, cy: c, r: 54, 'class': 'cadran__bord' }, svg);
    for (var i = 0; i < 60; i++) {
      var a = i / 60 * Math.PI * 2 - Math.PI / 2, fort = i % 5 === 0;
      var r1 = fort ? 44 : 48;
      el('line', { x1: f(c + Math.cos(a) * r1), y1: f(c + Math.sin(a) * r1), x2: f(c + Math.cos(a) * 51), y2: f(c + Math.sin(a) * 51), 'class': 'cadran__tic' + (fort ? ' cadran__tic--fort' : '') }, svg);
    }
    [12, 3, 6, 9].forEach(function (h) {
      var a = h / 12 * Math.PI * 2 - Math.PI / 2;
      var t = el('text', { x: f(c + Math.cos(a) * 35), y: f(c + Math.sin(a) * 35), 'class': 'cadran__chiffre' }, svg); t.textContent = h;
    });
    el('path', { d: '', 'class': 'cadran__arc', 'data-arc': '' }, svg);
    el('line', { x1: c, y1: c, x2: c, y2: c - 28, 'class': 'cadran__aiguille cadran__h', 'data-h': '' }, svg);
    el('line', { x1: c, y1: c, x2: c, y2: c - 40, 'class': 'cadran__aiguille cadran__m', 'data-m': '' }, svg);
    el('circle', { cx: c, cy: c, r: 3.2, 'class': 'cadran__centre' }, svg);
  };
  D.arc = function (h1, h2) {
    // arc sur un cadran de 12 h entre deux heures décimales
    var c = 60, r = 54;
    function pt(h) { var a = (h % 12) / 12 * Math.PI * 2 - Math.PI / 2; return [f(c + Math.cos(a) * r), f(c + Math.sin(a) * r)]; }
    var p1 = pt(h1), p2 = pt(h2), large = (h2 - h1) > 6 ? 1 : 0;
    return 'M' + p1[0] + ' ' + p1[1] + ' A' + r + ' ' + r + ' 0 ' + large + ' 1 ' + p2[0] + ' ' + p2[1];
  };

  /* ---------- Visuels provisoires (en attendant les images Grok) ---------- */
  var PEINTRES = {
    papier: function (x, w, h, r) { x.fillStyle = '#F3EEE3'; x.fillRect(0, 0, w, h); grain(x, w, h, r, .08); },
    herbier: function (x, w, h, r) {
      x.fillStyle = '#EFE7D6'; x.fillRect(0, 0, w, h); grain(x, w, h, r, .07);
      for (var i = 0; i < 9; i++) {
        var cx = w * (.45 + r() * .5), cy = h * (.1 + r() * .8), a = -1.2 + r() * 1.6, len = h * (.22 + r() * .16);
        x.save(); x.translate(cx, cy); x.rotate(a);
        x.fillStyle = 'rgba(' + (110 + r() * 30 | 0) + ',' + (128 + r() * 20 | 0) + ',' + (80 + r() * 20 | 0) + ',.55)';
        x.strokeStyle = 'rgba(76,92,53,.7)'; x.lineWidth = 1.2;
        x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(len * .45, len * .09, len, 0); x.quadraticCurveTo(len * .45, -len * .09, 0, 0); x.fill(); x.stroke();
        x.beginPath(); x.moveTo(0, 0); x.lineTo(len, 0); x.stroke();
        if (i % 3 === 0) { x.fillStyle = 'rgba(233,222,196,.85)'; x.fillRect(len * .35, -9, 34, 18); }
        x.restore();
      }
    },
    prairie: function (x, w, h, r) {
      var g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#E9DFC4'); g.addColorStop(.55, '#C9C79A'); g.addColorStop(1, '#6E7A48'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      for (var b = 0; b < 40; b++) { x.fillStyle = 'rgba(251,240,200,' + (.08 + r() * .14) + ')'; x.beginPath(); x.arc(r() * w, r() * h * .6, 10 + r() * 40, 0, 7); x.fill(); }
      for (var i = 0; i < 520; i++) { var px = r() * w, ph = h * (.25 + r() * .6); x.strokeStyle = 'rgba(' + (60 + r() * 50 | 0) + ',' + (80 + r() * 40 | 0) + ',' + (40 + r() * 20 | 0) + ',.55)'; x.lineWidth = .6 + r() * 1.4; x.beginPath(); x.moveTo(px, h); x.quadraticCurveTo(px + (r() - .5) * 20, h - ph / 2, px + (r() - .5) * 30, h - ph); x.stroke(); }
      var cols = ['#FBF8F1', '#8E5A8C', '#C7849A', '#D6A23A'];
      for (var j = 0; j < 70; j++) { x.fillStyle = cols[j % 4]; x.globalAlpha = .85; x.beginPath(); x.arc(r() * w, h * (.35 + r() * .5), 2 + r() * 5, 0, 7); x.fill(); }
      x.globalAlpha = 1;
    },
    nuit: function (x, w, h, r) {
      var g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0C1613'); g.addColorStop(.62, '#1A2B25'); g.addColorStop(1, '#14221D'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      for (var s = 0; s < 320; s++) { x.fillStyle = 'rgba(243,238,227,' + (.15 + r() * .7) + ')'; x.beginPath(); x.arc(r() * w, r() * h * .72, r() * 1.2 + .2, 0, 7); x.fill(); }
      var base = h * .9;
      // reflet de l'eau
      x.fillStyle = 'rgba(40,62,54,.5)'; x.fillRect(0, base - 4, w, 8);
      function saule(cx, H, L) {
        var top = base - H;
        x.strokeStyle = '#070D0B'; x.fillStyle = '#070D0B';
        // tronc et charpentières
        x.lineCap = 'round'; x.lineWidth = Math.max(6, H * .045);
        x.beginPath(); x.moveTo(cx, base); x.bezierCurveTo(cx - H * .04, base - H * .25, cx + H * .03, base - H * .4, cx, base - H * .5); x.stroke();
        var pointes = [];
        for (var b = 0; b < 5; b++) {
          var ang = -Math.PI / 2 + (b - 2) * .42 + (r() - .5) * .2, len = H * (.38 + r() * .14);
          var ex = cx + Math.cos(ang) * len, ey = base - H * .5 + Math.sin(ang) * len;
          x.lineWidth = Math.max(2.5, H * .02);
          x.beginPath(); x.moveTo(cx, base - H * .5); x.quadraticCurveTo(cx + (ex - cx) * .4, ey + len * .1, ex, ey); x.stroke();
          pointes.push([ex, ey]);
        }
        // masse du houppier
        x.globalAlpha = .55; x.beginPath(); x.ellipse(cx, top + H * .28, L * .48, H * .26, 0, 0, 7); x.fill(); x.globalAlpha = 1;
        // rameaux retombants
        for (var k = 0; k < 420; k++) {
          var a = Math.PI + r() * Math.PI, rx = L * .5 * (.7 + r() * .35), ry = H * .3 * (.75 + r() * .35);
          var sx = cx + Math.cos(a) * rx, sy = top + H * .3 + Math.sin(a) * ry;
          var chute = (base - sy) * (.55 + r() * .45), dx = (sx - cx) * (.06 + r() * .12);
          x.globalAlpha = .55 + r() * .45; x.lineWidth = .7 + r() * 1.1;
          x.beginPath(); x.moveTo(sx, sy); x.quadraticCurveTo(sx + dx * 1.4, sy + chute * .25, sx + dx, Math.min(base, sy + chute)); x.stroke();
        }
        x.globalAlpha = 1;
      }
      [[.1, .55, .3], [.34, .42, .24], [.6, .62, .34], [.86, .48, .27]].forEach(function (t) { saule(w * t[0], h * t[1], w * t[2]); });
      // herbes du premier plan
      x.strokeStyle = '#050A08';
      for (var i = 0; i < 260; i++) { var px = r() * w, ph = 10 + r() * 34; x.lineWidth = 1 + r() * 1.2; x.beginPath(); x.moveTo(px, h); x.quadraticCurveTo(px + (r() - .5) * 8, h - ph * .5, px + (r() - .5) * 14, h - ph); x.stroke(); }
      x.fillStyle = '#050A08'; x.fillRect(0, base + 4, w, h - base);
    },
    rosee: function (x, w, h, r) {
      var g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#E8E2C9'); g.addColorStop(1, '#9BA77A'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      for (var b = 0; b < 30; b++) { x.fillStyle = 'rgba(255,250,230,' + (.1 + r() * .2) + ')'; x.beginPath(); x.arc(r() * w, r() * h, 8 + r() * 30, 0, 7); x.fill(); }
      for (var i = 0; i < 40; i++) {
        var px = r() * w; x.strokeStyle = 'rgba(76,92,53,' + (.5 + r() * .4) + ')'; x.lineWidth = 2 + r() * 4; x.beginPath(); x.moveTo(px, h); x.quadraticCurveTo(px + (r() - .5) * 60, h * .5, px + (r() - .5) * 120, h * (r() * .3)); x.stroke();
        for (var d = 0; d < 3; d++) { var dy = h * (.2 + r() * .7); x.fillStyle = 'rgba(255,255,255,.75)'; x.beginPath(); x.arc(px + (r() - .5) * 30, dy, 2 + r() * 3, 0, 7); x.fill(); }
      }
    },
    table: function (x, w, h, r) {
      for (var p = 0; p < 6; p++) { x.fillStyle = 'hsl(' + (30 + r() * 6) + ',' + (28 + r() * 8) + '%,' + (52 + r() * 10) + '%)'; x.fillRect(0, p * h / 6, w, h / 6 - 3); }
      for (var l = 0; l < 160; l++) { x.strokeStyle = 'rgba(90,60,30,.12)'; x.beginPath(); var y = r() * h; x.moveTo(0, y); x.bezierCurveTo(w * .3, y + 4, w * .6, y - 4, w, y + 2); x.stroke(); }
      for (var s = 0; s < 26; s++) { x.fillStyle = 'rgba(255,245,210,' + (.08 + r() * .18) + ')'; x.beginPath(); x.ellipse(r() * w, r() * h, 20 + r() * 50, 10 + r() * 20, r() * 3, 0, 7); x.fill(); }
      [[.34, .44], [.62, .56]].forEach(function (m) { x.fillStyle = '#F4F1E8'; x.strokeStyle = '#3B2F25'; x.lineWidth = 2; x.beginPath(); x.ellipse(w * m[0], h * m[1], w * .1, w * .1, 0, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#6A584A'; x.beginPath(); x.ellipse(w * m[0], h * m[1], w * .075, w * .075, 0, 0, 7); x.fill(); });
    },
    linge: function (x, w, h, r) {
      x.fillStyle = '#E7DFCF'; x.fillRect(0, 0, w, h);
      for (var i = 0; i < 6; i++) { var y = h * (.18 + i * .12); var g = x.createLinearGradient(0, y, 0, y + h * .11); g.addColorStop(0, i % 2 ? '#DCD3BE' : '#F3EEE3'); g.addColorStop(1, i % 2 ? '#C9BFA6' : '#E2D9C4'); x.fillStyle = g; x.beginPath(); x.moveTo(w * .12, y); x.bezierCurveTo(w * .4, y - 6, w * .7, y + 6, w * .88, y); x.lineTo(w * .9, y + h * .1); x.bezierCurveTo(w * .6, y + h * .11, w * .3, y + h * .1, w * .1, y + h * .1); x.fill(); }
      grain(x, w, h, r, .05);
    },
    grenouille: function (x, w, h, r) {
      x.fillStyle = '#4F6648'; x.fillRect(0, 0, w, h);
      for (var i = 0; i < 900; i++) { x.fillStyle = 'rgba(' + (120 + r() * 60 | 0) + ',' + (150 + r() * 50 | 0) + ',' + (60 + r() * 30 | 0) + ',.85)'; x.beginPath(); x.ellipse(r() * w, r() * h, 2 + r() * 4, 1.5 + r() * 3, r() * 3, 0, 7); x.fill(); }
      var cx = w * .5, cy = h * .55;
      x.fillStyle = '#6B6A3C'; x.beginPath(); x.ellipse(cx, cy + 10, w * .2, h * .07, 0, 0, 7); x.fill();
      [-1, 1].forEach(function (s) { x.fillStyle = '#7C7A45'; x.beginPath(); x.arc(cx + s * w * .09, cy - 4, w * .05, 0, 7); x.fill(); x.fillStyle = '#1C1A12'; x.beginPath(); x.arc(cx + s * w * .09, cy - 6, w * .022, 0, 7); x.fill(); x.fillStyle = 'rgba(255,255,255,.8)'; x.beginPath(); x.arc(cx + s * w * .09 - 2, cy - 9, 2, 0, 7); x.fill(); });
    },
    aquarelle: function (x, w, h, r) {
      x.fillStyle = '#F3EEE3'; x.fillRect(0, 0, w, h);
      ['#B5552F', '#6E6B3F', '#D6A23A', '#3F5B45'].forEach(function (c, i) { tache(x, w * (.14 + i * .24), h * .5, w * .1, c, r); });
    },
    hetres: function (x, w, h, r) {
      var g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#E9DDBF'); g.addColorStop(1, '#BFA272'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      for (var i = 0; i < 26; i++) { var tx = r() * w, tw = 6 + r() * 22; x.fillStyle = 'rgba(110,100,85,' + (.25 + r() * .4) + ')'; x.fillRect(tx, 0, tw, h); }
      for (var j = 0; j < 400; j++) { x.fillStyle = 'rgba(181,120,47,' + (.2 + r() * .4) + ')'; x.beginPath(); x.ellipse(r() * w, h * (.75 + r() * .25), 3, 1.6, r() * 3, 0, 7); x.fill(); }
    },
    eau: function (x, w, h, r) {
      var g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#9FB0A0'); g.addColorStop(1, '#4F6B62'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      for (var i = 0; i < 14; i++) { x.strokeStyle = 'rgba(251,248,241,' + (.12 + r() * .2) + ')'; x.lineWidth = 1.5; x.beginPath(); x.ellipse(w * .5, h * .5, i * w * .05, i * h * .035, 0, 0, 7); x.stroke(); }
    }
  };
  function grain(x, w, h, r, a) { for (var i = 0; i < w * h / 90; i++) { x.fillStyle = 'rgba(59,47,37,' + (r() * a) + ')'; x.fillRect(r() * w, r() * h, 1, 1); } }
  function tache(x, cx, cy, rad, col, r) {
    for (var l = 0; l < 14; l++) {
      x.globalAlpha = .08; x.fillStyle = col; x.beginPath();
      for (var k = 0; k <= 24; k++) { var a = k / 24 * Math.PI * 2, rr = rad * (.75 + r() * .4); var px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr * 1.2; k ? x.lineTo(px, py) : x.moveTo(px, py); }
      x.fill();
    }
    x.globalAlpha = 1;
  }
  D.peindre = function (box) {
    var cv = box.querySelector('canvas'); if (!cv) return;
    var rect = box.getBoundingClientRect(); var dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = Math.max(200, Math.round(rect.width)), h = Math.max(160, Math.round(rect.height || rect.width * 1.25));
    cv.width = w * dpr; cv.height = h * dpr;
    var x = cv.getContext('2d'); x.scale(dpr, dpr);
    var p = PEINTRES[box.getAttribute('data-peindre')] || PEINTRES.papier;
    p(x, w, h, rng(w + h));
  };

  window.WCDessins = D;
})();
