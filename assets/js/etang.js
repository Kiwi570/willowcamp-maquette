/* Willow Camp — « Ronds dans l'étang » : la photo aérienne réagit au doigt et au curseur (WebGL, OGL).
   Sans WebGL ou en mode calme : cercles d'encre en CSS. */
import { Renderer } from '../vendor/ogl/core/Renderer.js';
import { Program } from '../vendor/ogl/core/Program.js';
import { Mesh } from '../vendor/ogl/core/Mesh.js';
import { Texture } from '../vendor/ogl/core/Texture.js';
import { Triangle } from '../vendor/ogl/extras/Triangle.js';
import { Flowmap } from '../vendor/ogl/extras/Flowmap.js';
import { Vec2 } from '../vendor/ogl/math/Vec2.js';

const html = document.documentElement;
const zone = document.querySelector('[data-etang]');
const NMAX = 6;

function ondesCSS() {
  if (!zone) return;
  let dernier = 0;
  const onde = (x, y) => {
    const r = zone.getBoundingClientRect();
    const o = document.createElement('span');
    o.className = 'onde-css';
    o.style.left = (x - r.left) + 'px'; o.style.top = (y - r.top) + 'px';
    zone.appendChild(o); setTimeout(() => o.remove(), 1700);
  };
  zone.addEventListener('pointerdown', (e) => onde(e.clientX, e.clientY));
  if (!html.classList.contains('calme')) zone.addEventListener('pointermove', (e) => { const t = performance.now(); if (t - dernier > 260) { dernier = t; onde(e.clientX, e.clientY); } });
}

function demarrer() {
  const img = zone.querySelector('img');
  let renderer;
  try { renderer = new Renderer({ dpr: Math.min(2, window.devicePixelRatio || 1), alpha: false, antialias: false }); } catch (e) { return ondesCSS(); }
  const gl = renderer.gl;
  if (!gl) return ondesCSS();
  gl.clearColor(0.95, 0.93, 0.89, 1);
  zone.appendChild(gl.canvas);
  gl.canvas.setAttribute('aria-hidden', 'true');

  const flowmap = new Flowmap(gl, { falloff: 0.22, dissipation: 0.965, alpha: 1 });
  const texture = new Texture(gl, { generateMipmaps: false, minFilter: gl.LINEAR });
  const ripples = Array.from({ length: NMAX }, () => [-10, -10, -10]);
  let ri = 0;

  const program = new Program(gl, {
    vertex: /* glsl */`
      attribute vec2 uv; attribute vec2 position; varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = vec4(position, 0., 1.); }`,
    fragment: /* glsl */`
      precision highp float;
      uniform sampler2D tImage; uniform sampler2D tFlow; uniform float uTime; uniform vec2 uRes; uniform vec2 uImg; uniform vec3 uRip[${NMAX}];
      varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main(){
        float ra = uRes.x / uRes.y, ia = uImg.x / uImg.y;
        vec2 s = ra > ia ? vec2(1., ia / ra) : vec2(ra / ia, 1.);
        vec2 uv = (vUv - .5) * s + .5;
        vec3 flow = texture2D(tFlow, vUv).rgb;
        uv -= flow.xy * 0.045;
        vec2 asp = vec2(ra, 1.);
        float lum = 0.;
        for (int i = 0; i < ${NMAX}; i++) {
          vec3 r = uRip[i];
          float t = uTime - r.z;
          if (t > 0. && t < 3.5) {
            vec2 d = (vUv - r.xy) * asp;
            float dist = length(d);
            float front = t * .32;
            float w = sin((dist - front) * 70.) * exp(-abs(dist - front) * 18.) * exp(-t * 1.25);
            uv += normalize(d + 1e-5) * w * .0065 / asp;
            lum += w * .05;
          }
        }
        vec3 c = texture2D(tImage, uv).rgb;
        c += vec3(.98, .95, .86) * (length(flow.xy) * .06 + max(lum, 0.));
        c = mix(c, c * vec3(1.03, 1., .94), .35);
        float v = smoothstep(1.15, .35, length((vUv - .5) * vec2(1.2, 1.)));
        c *= mix(.9, 1., v);
        c += (hash(vUv * uRes + uTime) - .5) * .025;
        gl_FragColor = vec4(c, 1.);
      }`,
    uniforms: {
      tImage: { value: texture }, tFlow: flowmap.uniform, uTime: { value: 0 },
      uRes: { value: new Vec2(1, 1) }, uImg: { value: new Vec2(16, 9) }, uRip: { value: ripples }
    }
  });
  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

  const source = new Image();
  source.decoding = 'async';
  source.onload = () => { texture.image = source; program.uniforms.uImg.value.set(source.naturalWidth, source.naturalHeight); zone.classList.add('webgl-ok'); };
  source.src = img.currentSrc || img.src;

  function taille() {
    const r = zone.getBoundingClientRect();
    renderer.setSize(r.width, r.height);
    program.uniforms.uRes.value.set(r.width, r.height);
    flowmap.aspect = r.width / Math.max(1, r.height);
  }
  taille();
  new ResizeObserver(taille).observe(zone);

  const souris = new Vec2(-1), vitesse = new Vec2();
  let dernierT = 0, dernierPos = null, dernierOnde = 0, bouge = false;
  function poser(x, y, force) {
    const r = zone.getBoundingClientRect();
    const px = (x - r.left) / r.width, py = 1 - (y - r.top) / r.height;
    souris.set(px, py);
    const t = performance.now();
    if (dernierPos) {
      const dt = Math.max(14, t - dernierT);
      vitesse.x = (px - dernierPos[0]) / dt * 16; vitesse.y = (py - dernierPos[1]) / dt * 16;
    }
    dernierPos = [px, py]; dernierT = t; bouge = true;
    if (force || t - dernierOnde > 420) { dernierOnde = t; onde(px, py); }
  }
  function onde(px, py) { const r = ripples[ri]; r[0] = px; r[1] = py; r[2] = program.uniforms.uTime.value; ri = (ri + 1) % NMAX; }
  zone.addEventListener('pointermove', (e) => poser(e.clientX, e.clientY, false));
  zone.addEventListener('pointerdown', (e) => poser(e.clientX, e.clientY, true));
  zone.addEventListener('pointerleave', () => { dernierPos = null; });

  let visible = true;
  new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (visible) requestAnimationFrame(boucle); }).observe(zone);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible) requestAnimationFrame(boucle); });

  // une première onde douce, comme un caillou jeté dans l'étang
  setTimeout(() => onde(.56, .7), 1800);
  setTimeout(() => onde(.5, .22), 3200);

  function boucle(t) {
    if (!visible || document.hidden) return;
    program.uniforms.uTime.value = t * .001;
    if (!bouge) vitesse.multiply(.9);
    bouge = false;
    flowmap.mouse.copy(souris);
    flowmap.velocity.lerp(vitesse, vitesse.len() ? .18 : .1);
    flowmap.update();
    renderer.render({ scene: mesh });
    requestAnimationFrame(boucle);
  }
  requestAnimationFrame(boucle);
}

function webglDispo() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } }

if (zone) {
  if (html.classList.contains('calme') || !webglDispo()) ondesCSS();
  else { try { demarrer(); } catch (e) { console.warn('WebGL indisponible', e); ondesCSS(); } }
}
