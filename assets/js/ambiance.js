/* Willow Camp — « Écouter le camp » : paysage sonore de démonstration, synthétisé en code.
   À remplacer par de vrais enregistrements faits sur place (oiseaux, étang, grenouilles de mai).
   Ne démarre qu'après un clic du visiteur. */
(function () {
  'use strict';
  var MIX = {
    prairie: { vent: .55, oiseaux: 1, eau: .12, grenouilles: 0, grillons: 0 },
    etang: { vent: .3, oiseaux: .45, eau: .85, grenouilles: .75, grillons: 0 },
    village: { vent: .45, oiseaux: .6, eau: 0, grenouilles: 0, grillons: 0 },
    nuit: { vent: .2, oiseaux: 0, eau: .25, grenouilles: .55, grillons: .9 }
  };
  function Ambiance() { this.ctx = null; this.on = false; this.mix = 'prairie'; this.timers = []; }

  Ambiance.prototype._bruit = function () {
    var ctx = this.ctx, len = ctx.sampleRate * 3, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    var b0 = 0, b1 = 0, b2 = 0;
    for (var i = 0; i < len; i++) { var w = Math.random() * 2 - 1; b0 = .99765 * b0 + w * .099; b1 = .963 * b1 + w * .2965; b2 = .57 * b2 + w * 1.0526; d[i] = (b0 + b1 + b2 + w * .1848) * .16; }
    var src = ctx.createBufferSource(); src.buffer = buf; src.loop = true; return src;
  };
  Ambiance.prototype._init = function () {
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    var ctx = this.ctx = new AC(), self = this;
    this.maitre = ctx.createGain(); this.maitre.gain.value = 0;
    var comp = ctx.createDynamicsCompressor(); this.maitre.connect(comp); comp.connect(ctx.destination);
    this.bus = {};
    ['vent', 'oiseaux', 'eau', 'grenouilles', 'grillons'].forEach(function (k) { var g = ctx.createGain(); g.gain.value = 0; g.connect(self.maitre); self.bus[k] = g; });
    // vent dans les feuilles
    var v = this._bruit(), bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = .6;
    var lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = .08; lg.gain.value = 350; lfo.connect(lg); lg.connect(bp.frequency);
    var vg = ctx.createGain(); vg.gain.value = .5; v.connect(bp); bp.connect(vg); vg.connect(this.bus.vent); v.start(); lfo.start();
    // eau qui clapote
    var e = this._bruit(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
    this.clapot = ctx.createGain(); this.clapot.gain.value = .05; e.connect(lp); lp.connect(this.clapot); this.clapot.connect(this.bus.eau); e.start();
    this._boucle(function () { self._vague(); }, 260, 900);
    this._boucle(function () { self._oiseau(); }, 700, 2600);
    this._boucle(function () { self._grenouilles(); }, 1400, 4200);
    this._boucle(function () { self._grillon(); }, 500, 900);
    return true;
  };
  Ambiance.prototype._boucle = function (fn, a, b) {
    var self = this;
    (function tic() { var id = setTimeout(function () { if (self.on && !document.hidden) fn(); tic(); }, a + Math.random() * (b - a)); self.timers.push(id); })();
  };
  Ambiance.prototype._pan = function (dest) {
    var p = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    if (!p) return dest; p.pan.value = Math.random() * 1.6 - .8; p.connect(dest); return p;
  };
  Ambiance.prototype._vague = function () {
    var t = this.ctx.currentTime, g = this.clapot.gain;
    g.cancelScheduledValues(t); g.setTargetAtTime(.12 + Math.random() * .2, t, .08); g.setTargetAtTime(.04, t + .25, .25);
  };
  Ambiance.prototype._oiseau = function () {
    var ctx = this.ctx, t = ctx.currentTime, out = this._pan(this.bus.oiseaux), n = 2 + (Math.random() * 4 | 0), base = 2400 + Math.random() * 1800;
    for (var i = 0; i < n; i++) {
      var o = ctx.createOscillator(), g = ctx.createGain(), t0 = t + i * (.11 + Math.random() * .08), d = .06 + Math.random() * .09;
      o.type = 'sine'; o.frequency.setValueAtTime(base * (.9 + Math.random() * .25), t0); o.frequency.exponentialRampToValueAtTime(base * (1.25 + Math.random() * .4), t0 + d * .5); o.frequency.exponentialRampToValueAtTime(base * (.85 + Math.random() * .2), t0 + d);
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.06, t0 + .012); g.gain.exponentialRampToValueAtTime(.0005, t0 + d);
      o.connect(g); g.connect(out); o.start(t0); o.stop(t0 + d + .02);
    }
  };
  Ambiance.prototype._grenouilles = function () {
    var ctx = this.ctx, t = ctx.currentTime, out = this._pan(this.bus.grenouilles), n = 2 + (Math.random() * 5 | 0), f0 = 120 + Math.random() * 70;
    for (var i = 0; i < n; i++) {
      var t0 = t + i * (.32 + Math.random() * .12), d = .2 + Math.random() * .16;
      var o = ctx.createOscillator(), bp = ctx.createBiquadFilter(), g = ctx.createGain(), am = ctx.createOscillator(), amg = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(f0, t0); o.frequency.linearRampToValueAtTime(f0 * .8, t0 + d);
      bp.type = 'bandpass'; bp.frequency.value = 650 + Math.random() * 300; bp.Q.value = 4;
      am.type = 'square'; am.frequency.value = 26 + Math.random() * 10; amg.gain.value = .5;
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.18, t0 + .03); g.gain.linearRampToValueAtTime(0, t0 + d);
      am.connect(amg); amg.connect(g.gain);
      o.connect(bp); bp.connect(g); g.connect(out); o.start(t0); am.start(t0); o.stop(t0 + d + .05); am.stop(t0 + d + .05);
    }
  };
  Ambiance.prototype._grillon = function () {
    var ctx = this.ctx, t = ctx.currentTime, out = this._pan(this.bus.grillons);
    for (var i = 0; i < 3; i++) {
      var t0 = t + i * .07, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = 4300 + Math.random() * 300;
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.025, t0 + .01); g.gain.linearRampToValueAtTime(0, t0 + .045);
      o.connect(g); g.connect(out); o.start(t0); o.stop(t0 + .06);
    }
  };
  Ambiance.prototype.melange = function (nom) {
    if (!MIX[nom]) return; this.mix = nom;
    if (!this.ctx) return;
    var t = this.ctx.currentTime, m = MIX[nom];
    for (var k in m) { this.bus[k].gain.cancelScheduledValues(t); this.bus[k].gain.setTargetAtTime(m[k], t, .8); }
  };
  Ambiance.prototype.basculer = function () {
    if (!this.ctx && !this._init()) return false;
    this.on = !this.on;
    var t = this.ctx.currentTime;
    if (this.on) { this.ctx.resume(); this.melange(this.mix); this.maitre.gain.setTargetAtTime(.6, t, .6); }
    else { this.maitre.gain.setTargetAtTime(0, t, .3); }
    return this.on;
  };
  window.WCAmbiance = new Ambiance();
})();
