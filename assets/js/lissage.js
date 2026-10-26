/* Willow Camp — défilement fluide à la molette (dans l'esprit de Lenis).
   Le défilement natif reste la référence : clavier, barre, tactile et
   lecteurs d'écran ne sont pas interceptés. Seule la molette est lissée. */
(function () {
  'use strict';
  function Lissage(opts) {
    opts = opts || {};
    this.lerp = opts.lerp || .1;
    this.mult = opts.multiplier || 1;
    this.cible = window.scrollY;
    this.actuel = window.scrollY;
    this.actif = false;
    this.anime = null;
    this.arrete = false;
    this._raf = this._raf.bind(this);
    this._molette = this._molette.bind(this);
    this._natif = this._natif.bind(this);
    window.addEventListener('wheel', this._molette, { passive: false });
    window.addEventListener('scroll', this._natif, { passive: true });
  }
  Lissage.prototype.max = function () { return Math.max(0, document.documentElement.scrollHeight - window.innerHeight); };
  Lissage.prototype._defilable = function (n) {
    while (n && n !== document.body && n.nodeType === 1) {
      if (n.hasAttribute('data-lissage-non')) return true;
      var s = getComputedStyle(n);
      if (/(auto|scroll)/.test(s.overflowY + s.overflowX) && (n.scrollHeight > n.clientHeight + 1 || n.scrollWidth > n.clientWidth + 1)) return true;
      n = n.parentNode;
    }
    return false;
  };
  Lissage.prototype._molette = function (e) {
    if (this.arrete || e.ctrlKey || e.defaultPrevented) return;
    if (this._defilable(e.target)) return;
    var d = e.deltaY;
    if (e.deltaMode === 1) d *= 32; else if (e.deltaMode === 2) d *= window.innerHeight;
    if (Math.abs(e.deltaX) > Math.abs(d)) return;
    e.preventDefault();
    this.anime = null;
    if (!this.actif) { this.actuel = window.scrollY; this.cible = window.scrollY; }
    this.cible = Math.max(0, Math.min(this.max(), this.cible + d * this.mult));
    this._demarrer();
  };
  Lissage.prototype._natif = function () {
    if (!this.actif) { this.actuel = this.cible = window.scrollY; }
  };
  Lissage.prototype._demarrer = function () {
    if (this.actif) return;
    this.actif = true; this._t = performance.now();
    requestAnimationFrame(this._raf);
  };
  Lissage.prototype._raf = function (now) {
    var dt = Math.min(64, now - this._t) / 16.667; this._t = now;
    if (this.anime) {
      var a = this.anime, p = Math.min(1, (now - a.debut) / a.duree);
      var e = 1 - Math.pow(1 - p, 4);
      this.actuel = a.de + (a.vers - a.de) * e;
      this.cible = this.actuel;
      window.scrollTo(0, this.actuel);
      if (p >= 1) { this.anime = null; this.actif = false; return; }
    } else {
      var k = 1 - Math.pow(1 - this.lerp, dt);
      this.actuel += (this.cible - this.actuel) * k;
      if (Math.abs(this.cible - this.actuel) < .5) { this.actuel = this.cible; window.scrollTo(0, this.actuel); this.actif = false; return; }
      window.scrollTo(0, this.actuel);
    }
    requestAnimationFrame(this._raf);
  };
  Lissage.prototype.scrollTo = function (cible, opts) {
    opts = opts || {};
    var y = typeof cible === 'number' ? cible : cible.getBoundingClientRect().top + window.scrollY - (opts.offset || 0);
    y = Math.max(0, Math.min(this.max(), y));
    var de = window.scrollY, dist = Math.abs(y - de);
    this.anime = { de: de, vers: y, debut: performance.now(), duree: opts.duree || Math.min(1600, 500 + dist * .35) };
    this.actif = false; this._demarrer();
  };
  Lissage.prototype.stop = function () { this.arrete = true; this.anime = null; this.actif = false; };
  Lissage.prototype.start = function () { this.arrete = false; this.actuel = this.cible = window.scrollY; };
  window.WCLissage = Lissage;
})();
