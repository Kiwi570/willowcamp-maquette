/* Willow Camp — page Roulottes */
(function () {
  'use strict';
  var WC = window.WC, G = window.gsap, D = window.WCDessins, T = WC.t;
  var $ = WC.$, $$ = WC.$$, calme = WC.calme;

  /* ---------- Simulateur de séjour ---------- */
  var form = $('[data-simulateur]');
  if (form) (function simulateur() {
    var cal = $('[data-calendrier]', form), champArr = $('#sim-arrivee'), lignes = $('[data-lignes]', form), total = $('[data-total]', form);
    var dates = $('[data-dates]', form), err = $('[data-erreur]', form), interp = $('[data-interpretation]', form);
    var auj = new Date(); auj.setHours(0, 0, 0, 0);
    var arrivee = prochaineArrivee(new Date(auj.getTime() + 7 * 864e5));
    var vue = new Date(arrivee.getFullYear(), arrivee.getMonth(), 1);
    var eur = new Intl.NumberFormat(WC.lang === 'en' ? 'en-GB' : (WC.lang === 'nl' ? 'nl-BE' : 'fr-BE'), { style: 'currency', currency: 'EUR', maximumFractionDigits: 2, minimumFractionDigits: 0 });
    function prochaineArrivee(d) { d = new Date(d); while (d.getDay() === 0) d.setDate(d.getDate() + 1); return d; }
    function val(n) { return parseInt(form.elements[n].value, 10) || 0; }
    function fmtDate(d) { return d.getDate() + ' ' + T.mois[d.getMonth()]; }

    function dessinerCal() {
      var nuits = Math.max(1, val('nuits'));
      var fin = new Date(arrivee.getTime() + nuits * 864e5);
      var y = vue.getFullYear(), m = vue.getMonth();
      var premier = new Date(y, m, 1), decal = (premier.getDay() + 6) % 7, nb = new Date(y, m + 1, 0).getDate();
      var h = '<div class="cal__tete"><button type="button" class="cal__nav" data-nav="-1" aria-label="' + T.moisPrec + '"' + (y === auj.getFullYear() && m === auj.getMonth() ? ' disabled' : '') + '>‹</button>' +
        '<p class="cal__mois" aria-live="polite">' + T.mois[m] + ' ' + y + '</p><button type="button" class="cal__nav" data-nav="1" aria-label="' + T.moisSuiv + '">›</button></div><div class="cal__grille" role="grid">';
      var js = T.joursCourts; [1, 2, 3, 4, 5, 6, 0].forEach(function (j) { h += '<span class="cal__jsem" aria-hidden="true">' + js[j] + '</span>'; });
      for (var i = 0; i < decal; i++) h += '<span></span>';
      for (var d = 1; d <= nb; d++) {
        var dt = new Date(y, m, d), dim = dt.getDay() === 0, passe = dt < auj;
        var sel = dt.getTime() === arrivee.getTime(), nuit = dt > arrivee && dt < fin, dep = dt.getTime() === fin.getTime();
        var lab = T.jours[dt.getDay()] + ' ' + d + ' ' + T.mois[m] + (dim ? ' — ' + T.pasDimanche : '') + (passe ? ' — ' + T.passe : '');
        h += '<button type="button" class="cal__jour' + (dim ? ' cal__jour--dim' : '') + (nuit ? ' est-nuit' : '') + (dep ? ' est-depart' : '') + '" data-jour="' + dt.getTime() + '" aria-pressed="' + sel + '" aria-label="' + lab + '"' + (dim || passe ? ' disabled' : '') + '>' + d + '</button>';
      }
      h += '</div>';
      cal.innerHTML = h;
    }
    cal.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b || b.disabled) return;
      if (b.hasAttribute('data-nav')) { vue = new Date(vue.getFullYear(), vue.getMonth() + parseInt(b.getAttribute('data-nav'), 10), 1); dessinerCal(); var n = $('[data-nav="' + b.getAttribute('data-nav') + '"]', cal); n && n.focus(); return; }
      arrivee = new Date(parseInt(b.getAttribute('data-jour'), 10)); calculer(); var s = $('[aria-pressed="true"]', cal); s && s.focus();
    });

    $$('[data-compteur]', form).forEach(function (c) {
      var inp = $('input', c), min = +c.getAttribute('data-min'), max = +c.getAttribute('data-max');
      $('[data-moins]', c).addEventListener('click', function () { inp.value = Math.max(min, (+inp.value || 0) - 1); calculer(); });
      $('[data-plus]', c).addEventListener('click', function () { inp.value = Math.min(+inp.max || max, (+inp.value || 0) + 1); calculer(); });
      inp.addEventListener('change', function () { inp.value = Math.min(+inp.max || max, Math.max(min, +inp.value || min)); calculer(); });
    });
    form.addEventListener('change', function (e) { if (e.target.name === 'type' || e.target.type === 'checkbox') calculer(); });

    function calculer() {
      var type = parseInt(form.elements.type.value, 10), cap = type;
      var ad = form.elements.adultes, en = form.elements.enfants;
      ad.max = cap; en.max = Math.max(0, cap - 1);
      if (+ad.value > cap) ad.value = cap;
      if (+ad.value + +en.value > cap) en.value = Math.max(0, cap - ad.value);
      var nuits = Math.max(1, Math.min(14, val('nuits'))), a = val('adultes'), e = val('enfants');
      err.textContent = a < 1 ? T.adultesMin : '';
      var base = type === 2 ? 110 : 150 + 20 * Math.max(0, a - 2);
      interp.hidden = !(type === 4 && a === 3 && e === 1); interp.textContent = T.interpretation;
      var hebergement = base * nuits, reduc = 0, lab = '';
      var jourSem = arrivee.getDay();
      if (nuits >= 3) { reduc = .4; lab = T.reduc3; }
      else if (nuits === 2) { reduc = .3; lab = T.reduc2; }
      else if (jourSem >= 1 && jourSem <= 4) { reduc = .2; lab = T.reducSemaine; }
      var l = [];
      l.push([T.hebergement + ' · ' + nuits + ' ' + (nuits > 1 ? T.nuits : T.nuit) + ' × ' + eur.format(base), hebergement]);
      if (reduc) l.push([lab, -Math.round(hebergement * reduc * 100) / 100, true]);
      if (form.elements.chien.checked) l.push([T.chien + ' · ' + nuits + ' × ' + eur.format(10), 10 * nuits]);
      if (form.elements.menage.checked) l.push([T.menage, 20]);
      var tot = l.reduce(function (s, x) { return s + x[1]; }, 0);
      lignes.innerHTML = l.map(function (x) { return '<li' + (x[2] ? ' class="est-reduc"' : '') + '><span>' + x[0] + '</span><span>' + eur.format(x[1]) + '</span></li>'; }).join('');
      var fin = new Date(arrivee.getTime() + nuits * 864e5);
      dates.textContent = T.du.replace('{a}', T.jours[arrivee.getDay()] + ' ' + fmtDate(arrivee)).replace('{b}', T.jours[fin.getDay()] + ' ' + fmtDate(fin));
      champArr.value = arrivee.toISOString().slice(0, 10);
      if (G && !calme) G.fromTo(total, { y: -6, opacity: .4 }, { y: 0, opacity: 1, duration: .4 });
      total.textContent = eur.format(tot);
      dessinerCal();
    }
    calculer();

    var conf = $('[data-confirmation]'), declencheur = null;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (val('adultes') < 1) { err.textContent = T.adultesMin; return; }
      declencheur = document.activeElement; conf.hidden = false; conf.focus();
      if (G && !calme) { G.from($('.confirmation__carte', conf), { scale: .85, rotation: -6, opacity: 0, duration: .5, ease: 'back.out(1.6)' }); G.fromTo($('.tampon', conf), { scale: 2.4, opacity: 0 }, { scale: 1, opacity: .9, duration: .4, delay: .3, ease: 'power4.in' }); }
      if (WC.lisse) WC.lisse.stop();
    });
    function fermer() { conf.hidden = true; if (WC.lisse) WC.lisse.start(); declencheur && declencheur.focus(); }
    $('[data-fermer]', conf).addEventListener('click', fermer);
    conf.addEventListener('click', function (e) { if (e.target === conf) fermer(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !conf.hidden) fermer(); });
  })();

  /* ---------- Rideau de saule du héros ---------- */
  var rg = $('[data-saule="rideau-g"]'), rd = $('[data-saule="rideau-d"]');
  var brinsG = [], brinsD = [];
  if (!calme && rg && rd) {
    brinsG = D.saule(rg, { n: 22, seed: 12, min: .75, max: 1.05, feuille: 34, pas: 18 });
    brinsD = D.saule(rd, { n: 22, seed: 27, min: .75, max: 1.05, feuille: 34, pas: 18 });
  }
  if (!G || calme) return;

  WC.apresOuverture(function () {
    var tl = G.timeline({ delay: .1 });
    tl.to(rg, { xPercent: -105, duration: 2, ease: 'power3.inOut' }, 0)
      .to(rd, { xPercent: 105, duration: 2, ease: 'power3.inOut' }, 0)
      .fromTo('.r-hero__img', { scale: 1.12 }, { scale: 1, duration: 2.4, ease: 'power2.out' }, 0)
      .from('.r-hero__carte', { y: 60, opacity: 0, rotation: 2, duration: 1.2, ease: 'power3.out' }, .6)
      .from('.r-hero__carte > *:not(h1)', { y: 18, opacity: 0, stagger: .08, duration: .8 }, .9);
    brinsG.concat(brinsD).forEach(function (b, i) {
      G.to(b, { rotation: (i % 2 ? 1 : -1) * 2.5, svgOrigin: b.getAttribute('data-x') + ' 0', duration: 1.2, yoyo: true, repeat: 1, ease: 'sine.inOut', delay: Math.random() * .4 });
    });
  });
  G.fromTo('.r-hero__img', { yPercent: 0 }, { yPercent: -10, ease: 'none', scrollTrigger: { trigger: '.r-hero__photo', start: 'top top', end: 'bottom top', scrub: true } });

  /* ---------- Vue en coupe ---------- */
  var coupe = $('[data-coupe]');
  if (coupe) {
    var ext = $$('.coupe__ext path, .coupe__ext circle', coupe), int = $$('.coupe__int path, .coupe__int ellipse', coupe), guides = $$('.coupe__guides path', coupe), labels = $$('.coupe__label');
    G.set(ext.concat(int), { drawSVG: '0%' }); G.set(guides, { opacity: 0 });
    if (window.innerWidth > 900) G.set(labels, { opacity: 0, y: 10 });
    var tl = G.timeline({ scrollTrigger: { trigger: coupe, start: 'top 75%', end: 'bottom 55%', scrub: 1 } });
    tl.to(ext, { drawSVG: '100%', stagger: .05, duration: 1 })
      .to(int, { drawSVG: '100%', stagger: .03, duration: 1 }, .6)
      .to(guides, { opacity: 1, stagger: .1, duration: .3 }, 1.4);
    // libellés révélés une fois, quand la coupe est bien dans l'écran (pas au bout du scrub)
    if (window.innerWidth > 900) ScrollTrigger.create({ trigger: coupe, start: 'top 60%', once: true, onEnter: function () { G.to(labels, { opacity: 1, y: 0, stagger: .12, duration: .6 }); } });
  }

  /* ---------- Les quatre roulottes : galerie horizontale épinglée ---------- */
  var piste = $('[data-piste]');
  if (piste && window.innerWidth > 900) {
    var sect = piste.parentNode;
    var dist = function () { return Math.max(0, piste.scrollWidth - window.innerWidth); };
    G.to(piste, { x: function () { return -dist(); }, ease: 'none', scrollTrigger: { trigger: sect, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 1, invalidateOnRefresh: true } });
  }
  $$('.essence').forEach(function (e) {
    var ps = $$('.essence__feuille path, .essence__feuille ellipse', e);
    G.set(ps, { drawSVG: '0%' });
    var limbes = $$('.limbe', e); G.set(limbes, { fillOpacity: 0 });
    var fait = false; function jouer() { if (fait) return; fait = true; G.to(ps, { drawSVG: '100%', duration: 1.6, stagger: .04, ease: 'power2.inOut' }); G.to(limbes, { fillOpacity: 1, duration: 1, delay: 1 }); }
    new IntersectionObserver(function (en, o) { if (en[0].isIntersecting) { jouer(); o.disconnect(); } }, { threshold: .4 }).observe(e);
  });
})();
