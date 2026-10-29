/* Willow Camp — comportements communs aux trois pages */
(function () {
  'use strict';
  var html = document.documentElement;
  var WC = window.WC || {}; var T = WC.t || {};
  var D = window.WCDessins;
  var calme = html.classList.contains('calme');
  var fin = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function lire(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function ecrire(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function sLire(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function sEcrire(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  WC.$ = $; WC.$$ = $$; WC.calme = calme; WC.fin = fin;

  var attente = [], ouvert = false;
  WC.apresOuverture = function (fn) { if (ouvert) fn(); else attente.push(fn); };
  function ouvrir() { if (ouvert) return; ouvert = true; attente.forEach(function (fn) { try { fn(); } catch (e) { console.error(e); } }); attente = []; }

  /* ---------- Sans GSAP : tout afficher ---------- */
  if (!window.gsap || !window.ScrollTrigger) {
    html.classList.add('calme'); html.classList.remove('premiere-visite', 'transition-entree');
    calme = WC.calme = true;
  } else {
    gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, MorphSVGPlugin, MotionPathPlugin, CustomEase);
    CustomEase.create('plume', '0.22,0.8,0.24,1');
    gsap.defaults({ ease: 'plume', duration: .9 });
    html.classList.add('anime-pret');
  }
  var G = window.gsap;

  /* ---------- Dessins générés ---------- */
  $$('[data-icone]').forEach(D.icone);
  $$('[data-feuille]').forEach(function (s) { D.feuilleArbre(s, s.getAttribute('data-feuille')); });
  $$('[data-cadran]').forEach(D.cadran);
  $$('.ouverture__bord path, .feuille-transition__bord path').forEach(function (p, i) { D.bordDechire(p, 3 + i); });
  var sauleHero = $('[data-saule="hero"]');
  var brinsHero = sauleHero ? D.saule(sauleHero, { n: 22, seed: 5, feuille: 30, pas: 15, longueur: function (t) { return t < .4 ? [.05, .14] : (t < .5 ? [.2, .45] : [.35, .8]); } }) : [];
  WC.brinsHero = brinsHero;

  /* ---------- Défilement fluide ---------- */
  var lisse = (!calme && fin && window.WCLissage) ? new window.WCLissage({ lerp: .1 }) : null;
  WC.lisse = lisse;
  function hauteurEntete() { var e = $('.entete'); return e ? e.offsetHeight + 12 : 80; }
  function allerA(cible) {
    if (lisse) lisse.scrollTo(cible, { offset: hauteurEntete() });
    else window.scrollTo({ top: cible.getBoundingClientRect().top + window.scrollY - hauteurEntete(), behavior: calme ? 'auto' : 'smooth' });
    if (!cible.hasAttribute('tabindex')) cible.setAttribute('tabindex', '-1');
    setTimeout(function () { cible.focus({ preventScroll: true }); }, 600);
  }
  WC.allerA = allerA;

  /* ---------- Liens : ancres et transitions de page ---------- */
  var feuille = $('.feuille-transition');
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank' || a.hasAttribute('download')) return;
    var url; try { url = new URL(a.getAttribute('href'), location.href); } catch (er) { return; }
    if (url.origin !== location.origin) return;
    var memePage = url.pathname.replace(/index\.html$/, '') === location.pathname.replace(/index\.html$/, '');
    if (memePage && url.hash) {
      var cible = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (cible) { e.preventDefault(); fermerMenu(); allerA(cible); }
      return;
    }
    if (calme || !G || !feuille) return;
    e.preventDefault(); fermerMenu();
    sEcrire('wc-transition', '1');
    G.fromTo(feuille, { yPercent: -110 }, { yPercent: 0, duration: .6, ease: 'power3.inOut', onComplete: function () { location.href = url.href; } });
  });
  window.addEventListener('pageshow', function (e) { if (e.persisted && G && feuille) G.set(feuille, { yPercent: -110 }); });

  /* ---------- En-tête ---------- */
  var entete = $('[data-entete]'), dernierY = window.scrollY;
  function majEntete() {
    var y = window.scrollY;
    if (!entete) return;
    entete.classList.toggle('est-plein', y > 30);
    if (!menuOuvert && y > 320 && y - dernierY > 6) entete.classList.add('est-cache');
    else if (dernierY - y > 6 || y < 200) entete.classList.remove('est-cache');
    dernierY = y;
  }
  window.addEventListener('scroll', majEntete, { passive: true }); majEntete();
  entete && entete.addEventListener('focusin', function () { entete.classList.remove('est-cache'); });

  /* ---------- Menu mobile ---------- */
  var burger = $('[data-burger]'), menu = $('#menu-mobile'), menuOuvert = false;
  function ouvrirMenu() {
    menuOuvert = true; menu.hidden = false; burger.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; if (lisse) lisse.stop();
    entete.classList.remove('est-cache');
    if (G && !calme) G.from($$('li, .menu-mobile__bas > *', menu), { y: 28, opacity: 0, stagger: .05, duration: .6 });
    var premier = $('a', menu); premier && premier.focus();
    majBarre();
  }
  function fermerMenu() {
    if (!menuOuvert) return; menuOuvert = false; menu.hidden = true; burger.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; if (lisse) lisse.start();
    majBarre();
  }
  burger && burger.addEventListener('click', function () { menuOuvert ? (fermerMenu(), burger.focus()) : ouvrirMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuOuvert) { fermerMenu(); burger.focus(); } });

  /* ---------- Hauteurs réelles de l'en-tête et de la barre du bas ---------- */
  function mesurerBarres() {
    if (entete) html.style.setProperty('--entete-h', $('.entete__barre', entete).offsetHeight + 'px');
    html.style.setProperty('--barres-h', (barre && getComputedStyle(barre).display !== 'none' ? barre.offsetHeight : 0) + 'px');
  }

  /* ---------- Barre du bas (téléphone) : Réserver et Appeler, repris de la page ---------- */
  var barre = null, vus = { hero: true, pied: false, form: false };
  var lienResa = $('.entete__outils > .bouton'), lienTel = $('a[href^="tel:"]');
  if (lienResa && lienTel) {
    barre = document.createElement('nav');
    barre.className = 'barre-bas';
    barre.setAttribute('aria-label', { nl: 'Snelle acties', en: 'Quick actions' }[WC.lang] || 'Actions rapides');
    var resa = lienResa.cloneNode(true); resa.className = 'bouton bouton--encre';
    var tel = document.createElement('a'); tel.className = 'bouton bouton--trait'; tel.href = lienTel.getAttribute('href');
    tel.textContent = { nl: 'Bellen', en: 'Call' }[WC.lang] || 'Appeler';
    barre.appendChild(resa); barre.appendChild(tel);
    document.body.appendChild(barre);
    html.classList.add('barre-active');
    var suivre = function (el, cle) {
      if (!el) return;
      new IntersectionObserver(function (en) { vus[cle] = en[0].isIntersecting; majBarre(); }).observe(el);
    };
    suivre($('main > section'), 'hero'); suivre($('.pied'), 'pied'); suivre($('form'), 'form');
  }
  function majBarre() {
    if (!barre) return;
    var montrer = !vus.hero && !vus.pied && !vus.form && !menuOuvert;
    barre.classList.toggle('est-visible', montrer);
    if (montrer) barre.removeAttribute('inert'); else barre.setAttribute('inert', '');
  }
  majBarre();
  mesurerBarres();
  if (window.ResizeObserver) { var ro = new ResizeObserver(mesurerBarres); entete && ro.observe(entete); barre && ro.observe(barre); }
  else window.addEventListener('resize', mesurerBarres);

  /* ---------- Copier ---------- */
  $$('[data-copier]').forEach(function (b) {
    b.addEventListener('click', function () {
      var txt = b.getAttribute('data-copier'), ok = function () { var o = b.textContent; b.textContent = T.copie || 'Copié'; setTimeout(function () { b.textContent = o; }, 1600); };
      var repli = function () { var r = document.createRange(); var cible = b.previousElementSibling || b; r.selectNodeContents(cible); var s = getSelection(); s.removeAllRanges(); s.addRange(r); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, repli); else repli();
    });
  });
  // libellé du bouton copier (traduit côté gabarit : on garde le texte d'origine)

  /* ---------- Mode calme ---------- */
  $$('[data-calme-toggle]').forEach(function (b) {
    b.setAttribute('aria-pressed', calme ? 'true' : 'false');
    b.addEventListener('click', function () { ecrire('wc-calme', calme ? '0' : '1'); location.reload(); });
  });

  /* ---------- Son ---------- */
  var boutonsSon = $$('[data-son]');
  boutonsSon.forEach(function (b) {
    b.addEventListener('click', function () {
      if (!window.WCAmbiance) return;
      var on = window.WCAmbiance.basculer();
      boutonsSon.forEach(function (x) {
        x.setAttribute('aria-pressed', on ? 'true' : 'false');
        var t = x.querySelector('.bouton-son__txt'); if (t) t.textContent = on ? t.getAttribute('data-on') : t.getAttribute('data-off');
      });
    });
  });

  /* ---------- Cadran de la réception (heure de Bruxelles) ---------- */
  var FEN = { 1: [930, 1110], 2: [930, 1110], 3: [930, 1110], 4: [930, 1110], 5: [930, 1140], 6: [930, 1140], 0: null };
  function maintenant() {
    var parts = {}, fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Brussels', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    fmt.formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
    var jours = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { j: jours[parts.weekday], m: parseInt(parts.hour, 10) * 60 + parseInt(parts.minute, 10) };
  }
  function fH(min) { var h = Math.floor(min / 60), m = min % 60; return (T.h || '{h}h{m}').replace('{h}', h).replace('{m}', (m < 10 ? '0' : '') + m); }
  function fD(min) { if (min < 60) return (T.dureeMin || '{m} min').replace('{m}', min); var h = Math.floor(min / 60), m = min % 60; return (T.duree || '{h} h {m}').replace('{h}', h).replace('{m}', (m < 10 ? '0' : '') + m); }
  function majCadrans() {
    var n = maintenant(), f = FEN[n.j], etat, suite, cls = '';
    if (f && n.m >= f[0] && n.m < f[1]) { etat = T.ouvert; suite = (T.encore || '').replace('{d}', fD(f[1] - n.m)); cls = 'etat-ouvert'; }
    else if (f && n.m < f[0]) { etat = (T.bientot || '').replace('{h}', fH(f[0])); suite = (T.dans || '').replace('{d}', fD(f[0] - n.m)); }
    else {
      etat = n.j === 0 ? T.dimanche : T.ferme; cls = 'etat-ferme';
      var k = 1; while (!FEN[(n.j + k) % 7]) k++;
      var jn = (n.j + k) % 7, nom = k === 1 ? T.demain : (T.jours ? T.jours[jn] : '');
      suite = (T.prochaine || '').replace('{j}', nom).replace('{h}', fH(FEN[jn][0]));
    }
    $$('[data-statut]').forEach(function (box) {
      var e = $('[data-etat]', box), s = $('[data-suite]', box);
      if (e) { e.textContent = etat; e.className = e.className.replace(/\betat-\w+/g, '').trim() + (cls ? ' ' + cls : ''); }
      if (s) s.textContent = suite;
      var svg = $('[data-cadran]', box); if (!svg) return;
      var h = Math.floor(n.m / 60), m = n.m % 60;
      var ha = ((h % 12) + m / 60) * 30, ma = m * 6;
      var hEl = $('[data-h]', svg), mEl = $('[data-m]', svg), arc = $('[data-arc]', svg);
      if (hEl) hEl.setAttribute('transform', 'rotate(' + ha + ' 60 60)');
      if (mEl) mEl.setAttribute('transform', 'rotate(' + ma + ' 60 60)');
      if (arc) { if (f) { arc.setAttribute('d', D.arc(f[0] / 60, f[1] / 60)); arc.setAttribute('class', 'cadran__arc' + (cls === 'etat-ferme' ? ' cadran__arc--ferme' : '')); } else arc.setAttribute('d', ''); }
    });
  }
  majCadrans(); setInterval(majCadrans, 20000);

  /* ---------- Lucioles du pied de page ---------- */
  (function lucioles() {
    var cv = $('.pied__lucioles'); if (!cv) return;
    var x = cv.getContext('2d'), pts = [], w = 0, h = 0, run = false, raf;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    function taille() { var r = cv.getBoundingClientRect(); w = r.width; h = r.height; cv.width = w * dpr; cv.height = h * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function init() { pts = []; var n = Math.round(Math.min(70, w / 18)); var r = D.rng(9); for (var i = 0; i < n; i++) pts.push({ x: r() * w, y: h * (.35 + r() * .6), vx: (r() - .5) * .3, vy: (r() - .5) * .2, p: r() * 6.28, s: .6 + r() * 1.6 }); }
    function frame(t) {
      x.clearRect(0, 0, w, h);
      pts.forEach(function (p) {
        p.x += p.vx + Math.sin(t / 2400 + p.p) * .25; p.y += p.vy + Math.cos(t / 3100 + p.p) * .18;
        if (p.x < -10) p.x = w + 10; if (p.x > w + 10) p.x = -10; if (p.y < h * .25) p.vy = Math.abs(p.vy); if (p.y > h) p.vy = -Math.abs(p.vy);
        var a = .25 + .75 * Math.max(0, Math.sin(t / 700 * p.s + p.p));
        var g = x.createRadialGradient(p.x, p.y, 0, p.x, p.y, 9 * p.s);
        g.addColorStop(0, 'rgba(242,210,122,' + a + ')'); g.addColorStop(1, 'rgba(242,210,122,0)');
        x.fillStyle = g; x.beginPath(); x.arc(p.x, p.y, 9 * p.s, 0, 6.29); x.fill();
        x.fillStyle = 'rgba(255,240,190,' + a + ')'; x.beginPath(); x.arc(p.x, p.y, 1.3, 0, 6.29); x.fill();
      });
      if (run) raf = requestAnimationFrame(frame);
    }
    taille(); init();
    if (calme) { frame(1200); return; }
    new IntersectionObserver(function (en) { var v = en[0].isIntersecting; if (v && !run) { run = true; raf = requestAnimationFrame(frame); } else if (!v) { run = false; cancelAnimationFrame(raf); } }).observe(cv);
    window.addEventListener('resize', function () { taille(); init(); });
  })();

  if (!G) { ouvrir(); WC.pret = true; return; }

  /* ---------- Son : mélange selon la section ---------- */
  $$('[data-ambiance]').forEach(function (s) {
    ScrollTrigger.create({ trigger: s, start: 'top 55%', end: 'bottom 55%', onToggle: function (self) { if (self.isActive && window.WCAmbiance) window.WCAmbiance.melange(s.getAttribute('data-ambiance')); } });
  });

  if (calme) {
    $$('.tampon, .etiquette, [data-apparait]').forEach(function (n) { n.style.opacity = 1; n.style.transform = ''; });
    ouvrir(); WC.pret = true;
    return;
  }

  /* ---------- Curseur et loupe ---------- */
  if (fin) {
    var cur = $('.curseur'), lab = $('.curseur__label'), loupe = $('.loupe'), verre = $('.loupe__verre');
    var cx = G.quickTo(cur, 'x', { duration: .18, ease: 'power3' }), cy = G.quickTo(cur, 'y', { duration: .18, ease: 'power3' });
    var lx = G.quickTo(loupe, 'x', { duration: .25, ease: 'power3' }), ly = G.quickTo(loupe, 'y', { duration: .25, ease: 'power3' });
    var imgLoupe = null;
    window.addEventListener('pointermove', function (e) {
      cx(e.clientX); cy(e.clientY); lx(e.clientX); ly(e.clientY);
      if (imgLoupe) {
        var r = imgLoupe.getBoundingClientRect(), z = 2.4;
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        verre.style.backgroundSize = (r.width * z) + 'px ' + (r.height * z) + 'px';
        verre.style.backgroundPosition = (95 - px * r.width * z) + 'px ' + (95 - py * r.height * z) + 'px';
      }
    }, { passive: true });
    document.addEventListener('pointerover', function (e) {
      var t = e.target;
      var loupeImg = t.closest && t.closest('img[data-loupe]');
      var etiquette = t.closest && t.closest('[data-curseur]');
      var lien = t.closest && t.closest('a, button, [role="button"], summary, label, .zone, input, select');
      cur.classList.toggle('est-lien', !!lien && !etiquette);
      cur.classList.toggle('est-label', !!etiquette);
      if (etiquette) lab.textContent = etiquette.getAttribute('data-curseur');
      if (loupeImg !== imgLoupe) {
        imgLoupe = loupeImg;
        if (loupeImg) { verre.innerHTML = ''; verre.style.backgroundImage = 'url("' + loupeImg.getAttribute('data-loupe') + '")'; loupe.classList.add('est-visible'); cur.classList.add('est-loupe'); }
        else if (!WC.loupePlan) { loupe.classList.remove('est-visible'); cur.classList.remove('est-loupe'); }
      }
    });
    document.addEventListener('pointerleave', function () { G.to(cur, { opacity: 0, duration: .2 }); });
    document.addEventListener('pointerenter', function () { G.to(cur, { opacity: 1, duration: .2 }); });
    WC.loupe = { el: loupe, verre: verre, curseur: cur };
  }

  /* ---------- Boutons à l'encre, aimantés ---------- */
  $$('.bouton').forEach(function (b) {
    var bx = G.quickTo(b, 'x', { duration: .5, ease: 'elastic.out(1, .5)' }), by = G.quickTo(b, 'y', { duration: .5, ease: 'elastic.out(1, .5)' });
    b.addEventListener('pointermove', function (e) {
      var r = b.getBoundingClientRect();
      b.style.setProperty('--x', (e.clientX - r.left) + 'px'); b.style.setProperty('--y', (e.clientY - r.top) + 'px');
      if (fin) { bx((e.clientX - r.left - r.width / 2) * .22); by((e.clientY - r.top - r.height / 2) * .3); }
    });
    b.addEventListener('pointerleave', function () { bx(0); by(0); });
  });

  /* ---------- Révélations au défilement ---------- */
  function auDefilement(cible, fn, debut) { ScrollTrigger.create({ trigger: cible, start: debut || 'top 85%', once: true, onEnter: fn }); }
  WC.auDefilement = auDefilement;

  $$('[data-revele]').forEach(function (h) {
    var split = new SplitText(h, { type: 'words', wordsClass: 'mot' });
    G.set(split.words, { display: 'inline-block' });
    G.set(split.words, { yPercent: 35, opacity: 0, filter: 'blur(7px)', rotation: 2 });
    var jouer = function () { G.to(split.words, { yPercent: 0, opacity: 1, filter: 'blur(0px)', rotation: 0, duration: 1, stagger: .07, clearProps: 'filter' }); };
    if (h.closest('.hero, .r-hero, .c-hero')) WC.apresOuverture(function () { setTimeout(jouer, 250); });
    else auDefilement(h, jouer, 'top 88%');
  });
  $$('[data-apparait]').forEach(function (n) { auDefilement(n, function () { G.to(n, { opacity: 1, y: 0, duration: 1 }); }, 'top 90%'); });

  $$('.note').forEach(function (n) {
    G.set(n, { clipPath: 'inset(-20% 100% -20% 0)' });
    auDefilement(n, function () { G.to(n, { clipPath: 'inset(-20% 0% -20% 0)', duration: 1.6, ease: 'power2.inOut' }); }, 'top 88%');
  });
  $$('.fleche').forEach(function (s) {
    var ps = $$('path', s); G.set(ps, { drawSVG: '0%' });
    var jouer = function () { G.to(ps, { drawSVG: '100%', duration: .8, stagger: .5, ease: 'power2.inOut' }); };
    if (s.closest('.hero, .r-hero')) WC.apresOuverture(function () { setTimeout(jouer, 1300); });
    else auDefilement(s, jouer, 'top 85%');
  });

  $$('.tirage').forEach(function (t) {
    if (t.closest('.hero, .r-hero, .c-hero, .plan__zone, .autre')) return;
    var sc = $$('.scotch', t);
    G.set(sc, { scaleX: 0, opacity: 0 });
    G.set(t, { opacity: 0, y: 70, rotation: '+=7' });
    auDefilement(t, function () {
      G.to(t, { opacity: 1, y: 0, rotation: '-=7', duration: 1.25, ease: 'power3.out' });
      G.to(sc, { scaleX: 1, opacity: 1, duration: .45, delay: .75, stagger: .12, ease: 'back.out(2)' });
    }, 'top 92%');
  });
  $$('[data-parallaxe]').forEach(function (t) {
    var v = parseFloat(t.getAttribute('data-parallaxe')) || 8;
    G.fromTo(t, { yPercent: v }, { yPercent: -v, ease: 'none', scrollTrigger: { trigger: t, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  $$('.tampon').forEach(function (s) {
    if (s.closest('.confirmation')) return;
    var rot = s.classList.contains('tampon--petit') ? 10 : -8;
    auDefilement(s, function () {
      G.fromTo(s, { scale: 2.6, opacity: 0, rotation: rot - 18 }, { scale: 1, opacity: .92, rotation: rot, duration: .42, ease: 'power4.in', onComplete: function () { G.fromTo(s, { x: -2 }, { x: 0, duration: .3, ease: 'elastic.out(1,.3)' }); } });
    }, 'top 80%');
  });
  var adn = $$('.adn .etiquette');
  if (adn.length) auDefilement(adn[0].parentNode, function () { G.fromTo(adn, { y: -50, opacity: 0, rotation: function () { return (Math.random() - .5) * 40; } }, { y: 0, opacity: 1, rotation: function (i, el) { return parseFloat(getComputedStyle(el).getPropertyValue('--r')) || 0; }, duration: .9, stagger: .08, ease: 'back.out(1.6)' }); });

  $$('.fiches').forEach(function (l) {
    var cartes = $$('.fiche', l);
    G.set(cartes, { opacity: 0, y: 140, rotation: function () { return (Math.random() - .5) * 26; } });
    auDefilement(l, function () { G.to(cartes, { opacity: 1, y: 0, rotation: function (i, el) { return parseFloat(el.style.getPropertyValue('--r')) || 0; }, duration: 1.1, stagger: .11, ease: 'power3.out', onComplete: function () { G.set(cartes, { clearProps: 'transform' }); } }); }, 'top 82%');
  });
  $$('.coupures, .post-its, .lieux, .equip__liste, .autres__liste, .interieur__photos').forEach(function (l) {
    var items = $$(':scope > li, :scope > figure', l); if (!items.length) return;
    var pop = l.classList.contains('post-its');
    G.set(items, { opacity: 0, y: pop ? 20 : 50, scale: pop ? .7 : 1 });
    auDefilement(l, function () { G.to(items, { opacity: 1, y: 0, scale: 1, duration: pop ? .7 : 1, stagger: .09, ease: pop ? 'back.out(1.8)' : 'power3.out', clearProps: 'transform,opacity' }); }, 'top 85%');
  });
  $$('.liste-oui').forEach(function (l) {
    var ps = $$('path', l); G.set(ps, { drawSVG: '0%' });
    auDefilement(l, function () { G.to(ps, { drawSVG: '100%', duration: .5, stagger: .12, ease: 'power2.out' }); });
  });
  $$('.liste-non li').forEach(function (li, i) {
    var p = $('path', li); G.set(p, { drawSVG: '0%' });
    ScrollTrigger.create({ trigger: li, start: 'top 75%', once: true, onEnter: function () { G.to(p, { drawSVG: '100%', duration: .55, delay: i * .08, ease: 'power3.in' }); G.to(li, { color: 'rgba(106,88,74,.6)', duration: .4, delay: .4 + i * .08 }); } });
  });
  $$('[data-trace-groupe]').forEach(function (s) {
    var ps = $$('path', s); G.set(ps, { drawSVG: '0%' });
    auDefilement(s, function () { G.to(ps, { drawSVG: '100%', duration: 1.4, stagger: .2, ease: 'power2.inOut' }); });
  });
  $$('.icone').forEach(function (s) {
    var ps = $$('path, circle, rect', s); G.set(ps, { drawSVG: '0%' });
    auDefilement(s, function () { G.to(ps, { drawSVG: '100%', duration: 1, stagger: .12, ease: 'power2.inOut' }); }, 'top 90%');
  });
  $$('.charte').forEach(function (c) {
    $$('li', c).forEach(function (li) {
      var cad = $('.charte__cadre', li), co = $('.charte__coche', li);
      G.set([cad, co], { drawSVG: '0%' });
      ScrollTrigger.create({ trigger: li, start: 'top 80%', once: true, onEnter: function () { G.to(cad, { drawSVG: '100%', duration: .5 }); G.to(co, { drawSVG: '100%', duration: .4, delay: .35, ease: 'power3.in' }); } });
    });
  });

  /* ---------- Brins de saule : balancement ---------- */
  brinsHero.forEach(function (b, i) {
    var x0 = b.getAttribute('data-x');
    G.to(b, { rotation: (i % 2 ? 1 : -1) * (1.2 + Math.random()), svgOrigin: x0 + ' 0', duration: 3 + Math.random() * 2.5, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: Math.random() * 2 });
  });

  /* ---------- Feuilles qui tombent au défilement ---------- */
  (function feuillesVolantes() {
    var calqueF = document.createElement('div'); calqueF.className = 'feuilles-volantes'; calqueF.setAttribute('aria-hidden', 'true'); document.body.appendChild(calqueF);
    var vivantes = 0, cumul = 0, dernier = window.scrollY;
    window.addEventListener('scroll', function () {
      var y = window.scrollY, d = Math.abs(y - dernier); dernier = y; cumul += d;
      if (cumul < 420 || vivantes > 7 || d < 3) return;
      cumul = 0; vivantes++;
      var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      s.setAttribute('viewBox', '0 0 40 12');
      s.innerHTML = '<path d="' + D.feuilleSaule(2, 6, 0, 36, 5) + '"/>';
      calqueF.appendChild(s);
      var x0 = Math.random() * window.innerWidth, H = window.innerHeight;
      G.set(s, { x: x0, y: -30, rotation: Math.random() * 360 });
      G.to(s, { y: H + 40, duration: 5 + Math.random() * 3, ease: 'none', onComplete: function () { s.remove(); vivantes--; } });
      G.to(s, { x: x0 + (Math.random() - .5) * 260, rotation: '+=' + (180 + Math.random() * 360), duration: 6, ease: 'sine.inOut' });
    }, { passive: true });
  })();

  /* ---------- Fougères dans les marges ---------- */
  (function fougeres() {
    if (window.innerWidth < 1440) return;
    ['g', 'd'].forEach(function (c, i) {
      var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      s.setAttribute('viewBox', '0 0 120 620'); s.setAttribute('class', 'fougere fougere--' + c); s.setAttribute('aria-hidden', 'true');
      document.body.appendChild(s); D.fougere(s, 21 + i * 7);
      var ps = $$('path', s); G.set(ps, { drawSVG: '0%' });
      G.to(ps, { drawSVG: '100%', stagger: { each: .02, from: 'start' }, ease: 'none', scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 1 } });
    });
  })();

  /* ---------- Pied de page : la nuit tombe ---------- */
  var pt = $('.pied__titre');
  if (pt) {
    var sp = new SplitText(pt, { type: 'lines', linesClass: 'ligne' });
    G.set(sp.lines, { yPercent: 60, opacity: 0 });
    auDefilement(pt, function () { G.to(sp.lines, { yPercent: 0, opacity: 1, duration: 1.4, stagger: .25 }); }, 'top 90%');
  }

  /* ---------- Ouverture ---------- */
  var ouv = $('.ouverture');
  if (html.classList.contains('premiere-visite') && ouv) {
    sEcrire('wc-vu', '1');
    var tige = $('.of-tige', ouv), fs = $$('.of-f', ouv), nom = $$('.ouverture__nom span', ouv), sous = $('.ouverture__sous', ouv);
    G.set(tige, { drawSVG: '0%' }); G.set(fs, { drawSVG: '0%' });
    G.set(nom, { yPercent: 40, opacity: 0, filter: 'blur(8px)' }); G.set(sous, { clipPath: 'inset(-20% 100% -20% 0)' });
    var tl = G.timeline({ defaults: { ease: 'power2.inOut' } });
    tl.to(tige, { drawSVG: '100%', duration: .6 })
      .to(fs, { drawSVG: '100%', fill: 'rgba(122,139,90,.35)', duration: .45, stagger: .06 }, .2)
      .to(nom, { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: .7, stagger: .12, ease: 'plume' }, .35)
      .to(sous, { clipPath: 'inset(-20% 0% -20% 0)', duration: .6 }, .85)
      .add(function () { $$('.entete, main').forEach(function (n) { n.style.visibility = 'visible'; }); }, 1.55)
      .to(ouv, { yPercent: -112, duration: .9, ease: 'power3.inOut' }, 1.6)
      .add(ouvrir, 1.75)
      .add(function () { ouv.style.display = 'none'; html.classList.remove('premiere-visite'); }, 2.55);
  } else if (html.classList.contains('transition-entree') && feuille) {
    G.fromTo(feuille, { yPercent: 0 }, { yPercent: -110, duration: .7, ease: 'power3.inOut', delay: .05, onStart: function () { setTimeout(ouvrir, 150); }, onComplete: function () { html.classList.remove('transition-entree'); G.set(feuille, { yPercent: -110 }); } });
  } else {
    ouvrir();
  }
  sEcrire('wc-vu', '1');
  WC.pret = true;
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
