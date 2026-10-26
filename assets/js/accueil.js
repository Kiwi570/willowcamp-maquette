/* Willow Camp — page d'accueil */
(function () {
  'use strict';
  var WC = window.WC, G = window.gsap, D = window.WCDessins;
  var $ = WC.$, $$ = WC.$$, calme = WC.calme;

  /* ---------- Forêt de la carte ---------- */
  $$('[data-foret]').forEach(function (g) { var v = g.getAttribute('data-foret').split(',').map(Number); D.foret(g, v[0], v[1], v[2], v[3], 31); });

  /* ---------- Balades : survol de la liste ---------- */
  $$('[data-balade-lien]').forEach(function (li) {
    var n = li.getAttribute('data-balade-lien'), p = $('[data-balade="' + n + '"]');
    function on() { p && p.classList.add('est-actif'); li.classList.add('est-actif'); }
    function off() { p && p.classList.remove('est-actif'); li.classList.remove('est-actif'); }
    li.addEventListener('mouseenter', on); li.addEventListener('mouseleave', off);
    li.addEventListener('focusin', on); li.addEventListener('focusout', off);
  });

  /* ---------- Nuancier des cabanes ---------- */
  var COUL = { rouille: '#B5552F', kaki: '#6E6B3F', moutarde: '#D6A23A', jura: '#3F5B45' };
  var couleurCabane = COUL.rouille;
  var pastilles = $$('.pastille');
  function choisir(b, focus) {
    pastilles.forEach(function (x) { x.setAttribute('aria-checked', x === b ? 'true' : 'false'); x.tabIndex = x === b ? 0 : -1; });
    couleurCabane = COUL[b.getAttribute('data-couleur')];
    var face = $('.cabane__face'); if (face) face.style.fill = couleurCabane + '99';
    if (planche.actif === 'cabane') teinter(couleurCabane);
    if (focus) b.focus();
    if (G && !calme) G.fromTo(b, { scale: 1.35 }, { scale: 1.12, duration: .5, ease: 'back.out(3)', clearProps: 'scale' });
  }
  pastilles.forEach(function (b, i) {
    b.tabIndex = i === 0 ? 0 : -1;
    b.addEventListener('click', function () { choisir(b); });
    b.addEventListener('keydown', function (e) {
      var k = e.key, j = pastilles.indexOf(b);
      if (k === 'ArrowRight' || k === 'ArrowDown') { e.preventDefault(); choisir(pastilles[(j + 1) % pastilles.length], true); }
      if (k === 'ArrowLeft' || k === 'ArrowUp') { e.preventDefault(); choisir(pastilles[(j + pastilles.length - 1) % pastilles.length], true); }
    });
  });

  /* ---------- Échantillonnier : la planche dessinée ---------- */
  var planche = { actif: null };
  var svgP = $('[data-planche]'), lavis = $('.planche__lavis'), legende = $('[data-planche-legende]');
  var FORMES = {
    tente: 'M48 196 C80 170 120 60 150 46 C182 60 222 170 256 196 C200 204 100 204 48 196 Z',
    vehicule: 'M34 178 C34 120 40 70 70 66 C130 60 200 62 236 96 C262 112 276 130 274 178 C200 186 100 186 34 178 Z',
    cabane: 'M40 168 C56 120 70 80 86 60 C150 70 220 84 276 98 C266 124 258 146 252 168 C180 176 110 176 40 168 Z',
    roulotte: 'M46 156 C46 110 50 70 80 56 C140 40 200 40 230 56 C256 70 256 110 254 156 C190 166 110 166 46 156 Z'
  };
  var TEINTES = { tente: '#7A8B5A', vehicule: '#6E6B3F', roulotte: '#D6A23A' };
  function teinter(c) { if (lavis) { if (G && !calme) G.to(lavis, { fill: c, duration: .6 }); else lavis.style.fill = c; } }
  function activer(cle) {
    if (!svgP || planche.actif === cle) return;
    var avant = planche.actif ? $('[data-croquis="' + planche.actif + '"]', svgP) : null, apres = $('[data-croquis="' + cle + '"]', svgP);
    planche.actif = cle;
    var titre = $('#facon-' + cle + '-t'); if (legende && titre) legende.textContent = titre.textContent;
    teinter(cle === 'cabane' ? couleurCabane : TEINTES[cle]);
    if (!G || calme) {
      $$('.croquis', svgP).forEach(function (c) { c.classList.toggle('est-actif', c === apres); });
      if (lavis) lavis.setAttribute('d', FORMES[cle]);
      return;
    }
    if (avant) { var pa = $$('path, circle', avant); G.killTweensOf(pa); G.to(pa, { drawSVG: '100% 100%', duration: .35, stagger: .015, ease: 'power2.in', onComplete: function () { avant.classList.remove('est-actif'); } }); }
    var pb = $$('path, circle', apres); G.killTweensOf(pb);
    apres.classList.add('est-actif');
    G.fromTo(pb, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: .9, stagger: .06, ease: 'power2.out', delay: avant ? .25 : 0 });
    G.to(lavis, { morphSVG: FORMES[cle], duration: 1, ease: 'power3.inOut' });
    G.fromTo(legende, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .6, delay: .3 });
  }
  if (svgP) {
    activer('tente');
    if (G && window.ScrollTrigger) {
      $$('[data-facon]').forEach(function (art) {
        ScrollTrigger.create({ trigger: art, start: 'top 55%', end: 'bottom 45%', onToggle: function (self) { if (self.isActive) activer(art.getAttribute('data-facon')); } });
      });
    }
  }

  if (!G || calme) {
    return;
  }

  /* ---------- Héros ---------- */
  var mots = $$('.hero__mot'), sec = $$('.hero__lieu, .hero__sous, .hero__txt, .hero__actions, .ticket');
  var photo = $('.hero__photo'), notes = $$('.hero__note'), traits = $$('[data-note-trace]');
  var brins = WC.brinsHero || [];
  G.set(mots, { yPercent: 105, rotation: 5, opacity: 0 });
  G.set(sec, { y: 26, opacity: 0 });
  G.set(photo, { clipPath: 'inset(6% 9% 12% 9%)', scale: .95, opacity: 0 });
  G.set(notes, { opacity: 0, clipPath: 'inset(-30% 100% -30% 0)' });
  G.set(traits, { drawSVG: '0%' });
  brins.forEach(function (b) { G.set($('.tige', b), { drawSVG: '0%' }); G.set($('.feuilles', b), { opacity: 0 }); });
  WC.apresOuverture(function () {
    var tl = G.timeline();
    tl.to(photo, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, opacity: 1, duration: 1.5, ease: 'power3.out' }, 0)
      .to(mots, { yPercent: 0, rotation: 0, opacity: 1, duration: 1.2, stagger: .12, ease: 'power4.out' }, .1)
      .to(sec, { y: 0, opacity: 1, duration: 1, stagger: .09 }, .45);
    brins.forEach(function (b, i) {
      tl.to($('.tige', b), { drawSVG: '100%', duration: 1.4, ease: 'power2.out' }, .2 + i * .04);
      tl.to($('.feuilles', b), { opacity: 1, duration: .8 }, .7 + i * .04);
    });
    tl.to(traits, { drawSVG: '100%', duration: .7, stagger: .18, ease: 'power2.inOut' }, 1.2)
      .to(notes, { opacity: 1, clipPath: 'inset(-30% 0% -30% 0)', duration: 1, stagger: .3, ease: 'power2.inOut' }, 1.35);
  });

  /* ---------- Vélo sur le chemin ---------- */
  var bici = $('.velo__bici'), chemin = $('#chemin-velo');
  if (bici && chemin && window.MotionPathPlugin) {
    G.to(bici, {
      motionPath: { path: chemin, align: chemin, alignOrigin: [.5, .9], autoRotate: true, start: 0, end: 1 },
      ease: 'none',
      scrollTrigger: { trigger: '.velo__route', start: 'top 95%', end: 'bottom 15%', scrub: .8 }
    });
    G.from('.velo__note', { opacity: 0, y: 10, scrollTrigger: { trigger: '.velo__route', start: 'top 70%', toggleActions: 'play none none none' } });
  }

  /* ---------- Carte des alentours ---------- */
  var carte = $('[data-carte]');
  if (carte) {
    var routes = $$('.carte__routes path', carte), balades = $$('.carte__balades path', carte), lieux = $$('.carte__lieux .lieu', carte), foret = $$('.carte__foret path', carte), camp = $('.carte__camp', carte);
    G.set(routes, { drawSVG: '0%' });
    G.set(balades, { opacity: 0, scale: .6, transformOrigin: '50% 50%' });
    G.set(lieux, { opacity: 0, y: 10 });
    G.set(foret, { opacity: 0, scale: .4, transformOrigin: '50% 50%' });
    G.set(camp, { opacity: 0, y: -40 });
    WC.auDefilement(carte, function () {
      var tl = G.timeline();
      tl.to(routes, { drawSVG: '100%', duration: 1.6, stagger: .12, ease: 'power2.inOut' })
        .to(foret, { opacity: 1, scale: 1, duration: .5, stagger: { each: .015, from: 'random' }, ease: 'back.out(2)' }, .4)
        .to(lieux, { opacity: 1, y: 0, duration: .6, stagger: .08 }, .8)
        .to(balades, { opacity: 1, scale: 1, duration: .9, stagger: .14, ease: 'back.out(1.4)' }, 1.1)
        .to(camp, { opacity: 1, y: 0, duration: .8, ease: 'bounce.out' }, 1.4);
    }, 'top 75%');
  }

  /* ---------- Bandeau infos : parallaxe ---------- */
  var band = $('.infos__bandeau img');
  if (band) G.fromTo(band, { yPercent: -12 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.infos__bandeau', start: 'top bottom', end: 'bottom top', scrub: true } });
})();
