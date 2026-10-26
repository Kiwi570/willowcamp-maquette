/* Willow Camp — page Le camp */
(function () {
  'use strict';
  var WC = window.WC, G = window.gsap, D = window.WCDessins;
  var $ = WC.$, $$ = WC.$$, calme = WC.calme, fin = WC.fin;

  /* ---------- Plan : arbres du pourtour ---------- */
  var plan = $('[data-plan]'), svg = plan && $('svg', plan);
  var contour = svg && $('[data-contour]', svg), arbres = svg && $('[data-arbres]', svg);
  if (contour && arbres) D.arbres(arbres, contour, 120, 17, 9);

  /* ---------- Plan : zones et fiches ---------- */
  var zones = $$('.zone', svg || document), fiches = $$('[data-fiche]'), vide = $('[data-fiche-vide]');
  function montrer(id, depuisListe) {
    zones.forEach(function (z) { z.classList.toggle('est-actif', z.getAttribute('data-zone') === id); z.setAttribute('aria-pressed', z.getAttribute('data-zone') === id ? 'true' : 'false'); });
    var f = null;
    fiches.forEach(function (x) { var ok = x.getAttribute('data-fiche') === id; x.hidden = !ok; if (ok) f = x; });
    if (vide) vide.hidden = true;
    if (!f) return;
    if (G && !calme) {
      G.fromTo($('.tirage', f), { opacity: 0, y: 30, rotation: 4 }, { opacity: 1, y: 0, rotation: -1, duration: .7, ease: 'power3.out' });
      G.fromTo($$('h3, p', f), { opacity: 0, y: 12 }, { opacity: 1, y: 0, stagger: .08, duration: .6, delay: .1 });
    }
    var r = f.getBoundingClientRect();
    if (window.innerWidth <= 900 || depuisListe) { if (r.top > window.innerHeight * .8 || r.bottom < 0) WC.allerA(f); }
  }
  zones.forEach(function (z) {
    z.addEventListener('click', function () { montrer(z.getAttribute('data-zone')); });
    z.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); montrer(z.getAttribute('data-zone')); } });
  });
  $$('[data-zone-lien]').forEach(function (b) { b.addEventListener('click', function () { montrer(b.getAttribute('data-zone-lien'), true); }); });

  /* ---------- Plan : la loupe ---------- */
  var btnLoupe = $('[data-loupe-plan]');
  btnLoupe && btnLoupe.addEventListener('click', function () { var on = !plan.classList.contains('loupe-active'); plan.classList.toggle('loupe-active', on); btnLoupe.setAttribute('aria-pressed', on ? 'true' : 'false'); });
  if (plan && fin && !calme && WC.loupe) {
    var L = WC.loupe, Z = 2.2, clone = null;
    plan.addEventListener('pointerenter', function () {
      WC.loupePlan = true;
      if (!clone) { clone = svg.cloneNode(true); var d = $('defs', clone); d && d.remove(); clone.removeAttribute('role'); clone.setAttribute('aria-hidden', 'true'); $$('[tabindex]', clone).forEach(function (n) { n.removeAttribute('tabindex'); }); }
      L.verre.style.backgroundImage = 'none'; L.verre.innerHTML = ''; L.verre.appendChild(clone);
      L.el.classList.add('est-visible'); L.curseur.classList.add('est-loupe');
    });
    plan.addEventListener('pointermove', function (e) {
      if (!clone) return;
      var r = svg.getBoundingClientRect();
      clone.style.width = (r.width * Z) + 'px'; clone.style.height = (r.height * Z) + 'px';
      clone.style.left = (95 - (e.clientX - r.left) * Z) + 'px'; clone.style.top = (95 - (e.clientY - r.top) * Z) + 'px';
      $$('.zone', clone).forEach(function (z, i) { z.classList.toggle('est-actif', zones[i].classList.contains('est-actif')); });
    });
    plan.addEventListener('pointerleave', function () { WC.loupePlan = false; L.el.classList.remove('est-visible'); L.curseur.classList.remove('est-loupe'); });
  }

  /* ---------- FAQ : ouverture douce ---------- */
  $$('.question').forEach(function (d) {
    var s = $('summary', d), r = $('.question__r', d);
    s.addEventListener('click', function (e) {
      if (!G || calme) return;
      e.preventDefault();
      if (d.open) { G.to(r, { height: 0, opacity: 0, duration: .45, ease: 'power3.inOut', onComplete: function () { d.open = false; G.set(r, { clearProps: 'height,opacity' }); } }); }
      else { d.open = true; G.fromTo(r, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: .55, ease: 'power3.out', clearProps: 'height' }); }
    });
  });

  /* ---------- Fleurs des prés ---------- */
  var fleurs = $('[data-fleurs]');
  if (fleurs) D.fleurs(fleurs);

  if (!G || calme) return;

  /* ---------- Héros : traits d'encre sur la photo ---------- */
  var encre = $('.c-hero__encre'), photo = $('.c-hero__photo');
  G.set(photo, { clipPath: 'inset(8% 6% 10% 6%)', opacity: 0, rotation: 5 });
  G.set(encre, { clipPath: 'inset(0 100% 0 0)' });
  G.set('.c-hero__texte > *:not(h1)', { y: 22, opacity: 0 });
  WC.apresOuverture(function () {
    G.timeline()
      .to(photo, { clipPath: 'inset(0% 0% 0% 0%)', opacity: 1, rotation: 1.2, duration: 1.4, ease: 'power3.out' }, 0)
      .to('.c-hero__texte > *:not(h1)', { y: 0, opacity: 1, stagger: .1, duration: .9 }, .4)
      .to(encre, { clipPath: 'inset(0 0% 0 0)', duration: 2.2, ease: 'power2.inOut' }, 1);
  });

  /* ---------- Plan : tracé à la plume ---------- */
  if (svg) {
    var allees = $$('.plan__allees path', svg), fonds = $$('.zone__fond, .zone__ile', svg), traits = $$('.zone__trait', svg), empl = $$('.empl', svg), arb = $$('.plan__arbres path', svg);
    G.set(contour, { drawSVG: '0%', fillOpacity: 0 }); G.set(allees, { drawSVG: '0%' });
    G.set(fonds, { opacity: 0, scale: .85, transformOrigin: '50% 50%' }); G.set(traits, { drawSVG: '0%' });
    G.set(empl, { opacity: 0, scale: 0, transformOrigin: '50% 50%' }); G.set(arb, { opacity: 0, scale: .3, transformOrigin: '50% 50%' });
    WC.auDefilement(plan, function () {
      G.timeline()
        .to(contour, { drawSVG: '100%', duration: 2, ease: 'power2.inOut' })
        .to(contour, { fillOpacity: 1, duration: .8 }, 1.4)
        .to(arb, { opacity: 1, scale: 1, duration: .5, stagger: { each: .008, from: 'random' }, ease: 'back.out(2)' }, .6)
        .to(allees, { drawSVG: '100%', duration: 1.4, stagger: .2 }, 1)
        .to(fonds, { opacity: 1, scale: 1, duration: .7, stagger: .05, ease: 'back.out(1.4)' }, 1.6)
        .to(traits, { drawSVG: '100%', duration: .8, stagger: .03 }, 2)
        .to(empl, { opacity: 1, scale: 1, duration: .4, stagger: .03, ease: 'back.out(2.5)' }, 2.2);
    }, 'top 70%');
  }

  /* ---------- La part sauvage : les fleurs poussent ---------- */
  if (fleurs) {
    var herbes = $$('.brin-herbe, .fleur .tige', fleurs), tetes = $$('.fleur > :not(.tige)', fleurs);
    G.set(herbes, { drawSVG: '0%' }); G.set(tetes, { scale: 0, transformOrigin: '50% 50%' });
    var tlf = G.timeline({ scrollTrigger: { trigger: '.sauvage', start: 'top 70%', end: 'bottom 85%', scrub: 1.2 } });
    tlf.to(herbes, { drawSVG: '100%', stagger: { each: .004, from: 'random' }, duration: 1 })
      .to(tetes, { scale: 1, stagger: { each: .006, from: 'random' }, duration: .4, ease: 'back.out(2)' }, .6);
  }

  /* ---------- Nourrir : l'encadré ---------- */
  var nourrir = $('.nourrir');
  if (nourrir) { G.set(nourrir, { opacity: 0, y: 40, rotation: 2 }); WC.auDefilement(nourrir, function () { G.to(nourrir, { opacity: 1, y: 0, rotation: -.6, duration: 1 }); }); }
})();
