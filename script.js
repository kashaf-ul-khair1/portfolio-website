/* CONFIG: paste image URLs here later */
const CONFIG = { avatar: "", project1: "assets/desktop.png", project2: "assets/mobile.jpg" };

const $ = id => document.getElementById(id);
const clamp = v => Math.min(1, Math.max(0, v));
const ease = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
const lerp = (a, b, t) => a + (b - a) * t;
const R = (p, a, b) => ease(clamp((p - a) / (b - a)));
const track = $('track'), intro = $('intro'), desk = $('desk'), laptop = $('laptop'), cap1 = $('cap1');
const phone = $('phone'), phoneEl = $('phoneEl'), cap2 = $('cap2'), contact = $('contact'), bar = $('bar');
let MX = .5, MY = .5, baseD = 1, baseP = 1, coverD = 1, coverP = 1, SPIN = true;

function progress() { const max = track.offsetHeight - innerHeight; return max > 0 ? clamp(scrollY / max) : 0; }
function sizes() {
  const laptopW = laptop.offsetWidth || 588;
  const phoneW = phoneEl.offsetWidth || 262;
  const phoneH = phoneEl.offsetHeight || 542;
  const screenW = laptop.querySelector('.screen')?.offsetWidth || 560;
  const screenH = laptop.querySelector('.screen')?.offsetHeight || 350;
  const mobileW = phoneEl.querySelector('.screen-m')?.offsetWidth || 234;
  const mobileH = phoneEl.querySelector('.screen-m')?.offsetHeight || 514;
  baseD = Math.min(1, innerWidth * .9 / laptopW);
  // Phones: the mockup turns sideways and is sized so it fits fully on screen.
  // Desktop keeps the original sizing.
  SPIN = innerWidth > 820;
  coverD = Math.min(innerWidth / screenW, innerHeight / screenH);
  if (SPIN) {
    baseP = Math.min(1, innerHeight * .7 / phoneH);
    coverP = Math.max(innerWidth / mobileW, innerHeight / mobileH);
  } else {
    // turned sideways, the phone's height runs across the screen width and its width runs across the height
    baseP = Math.min(1, innerHeight * .7 / phoneH, innerWidth * .85 / phoneH, innerHeight * .85 / phoneW);
    coverP = Math.min(innerWidth * .92 / mobileW, innerHeight * .92 / mobileH);
  }
}

/* ---------- WebGL shader background: living maroon-rose noise field ---------- */
let SCROLL = 0;
(function shader() {
  const cv = $('gl');
  const gl = cv.getContext('webgl');
  if (!gl) return;
  const vs = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;
  const fs = `precision mediump float;
  uniform vec2 uRes;uniform float uT;uniform vec2 uM;uniform float uP;
  float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
    return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
  float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p*=2.02;a*=.5;}return v;}
  void main(){
    vec2 uv=gl_FragCoord.xy/uRes;
    vec2 p=(gl_FragCoord.xy-.5*uRes)/uRes.y;
    vec2 m=(uM-.5)*vec2(.8,-.8);
    float t=uT*.04+uP*.6;
    vec2 q=vec2(fbm(p*1.5+vec2(t,0.)+m),fbm(p*1.5+vec2(0.,t)));
    vec2 r=vec2(fbm(p*1.7+1.9*q+vec2(1.7,9.2)+.2*t),fbm(p*1.7+1.9*q+vec2(8.3,2.8)+.15*t));
    float f=fbm(p*1.3+2.4*r);
    vec3 c1=vec3(.03,.01,.03), c2=vec3(.36,.04,.13), c3=vec3(1.,.31,.49), c4=vec3(1.,.9,.95);
    vec3 col=mix(c1,c2,clamp(f*f*3.2,0.,1.));
    col=mix(col,c3,clamp(length(q)*.55-.25,0.,1.)*.55);
    col+=c4*pow(clamp(r.x,0.,1.),7.)*.35;
    float vig=smoothstep(1.25,.25,length(uv-.5)*1.5);
    col*=vig*.95+.05;
    gl_FragColor=vec4(col,1.);
  }`;
  const mk = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const pr = gl.createProgram();
  gl.attachShader(pr, mk(gl.VERTEX_SHADER, vs));
  gl.attachShader(pr, mk(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(pr); gl.useProgram(pr);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'a');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(pr, n);
  const uRes = U('uRes'), uT = U('uT'), uM = U('uM'), uP = U('uP');
  function resize() {
    const small = innerWidth < 820 || matchMedia('(pointer:coarse)').matches;
    const s = small ? .4 : Math.min(devicePixelRatio, 1.5) * .7;   // lower render scale on phones/tablets
    cv.width = innerWidth * s; cv.height = innerHeight * s;
    gl.viewport(0, 0, cv.width, cv.height);
    gl.uniform2f(uRes, cv.width, cv.height);
  }
  resize(); addEventListener('resize', resize);
  const t0 = performance.now();
  (function draw() {
    gl.uniform1f(uT, (performance.now() - t0) / 1000);
    gl.uniform2f(uM, MX, 1 - MY);
    gl.uniform1f(uP, SCROLL);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!document.hidden) requestAnimationFrame(draw); else setTimeout(() => requestAnimationFrame(draw), 250);
  })();
})();

/* ---------- Typewriter role line ---------- */
(function typer() {
  const words = ['Frontend engineer.', 'React builder.', 'AI learner.', 'Motion designer.'];
  const el = $('typed'); let w = 0, c = 0, del = false;
  (function tick() {
    const word = words[w];
    el.textContent = word.slice(0, c);
    if (!del && c < word.length) c++;
    else if (!del) { del = true; return setTimeout(tick, 1600); }
    else if (c > 0) c--;
    else { del = false; w = (w + 1) % words.length; return setTimeout(tick, 300); }
    setTimeout(tick, del ? 40 : 75);
  })();
})();

/* ---------- Scroll choreography ---------- */
function frame() {
  const p = progress();
  SCROLL = p;

  const out = R(p, .08, .16);
  intro.style.opacity = 1 - out;
  intro.style.transform = `translateY(${-out * 80}px)`;

  const dIn = R(p, .12, .2), dOut = R(p, .40, .47);
  const zD = R(p, .24, .32) - R(p, .34, .41);
  const tilt = (1 - R(p, .14, .24)) * 60;
  desk.style.opacity = dIn * (1 - dOut);
  desk.style.transform = `translateY(${(1 - dIn) * 70 - dOut * 140}px)`;
  laptop.style.transform = `perspective(1400px) rotateX(${tilt}deg) rotateY(${(MX - .5) * 18 * (1 - zD)}deg) scale(${lerp(baseD, coverD, zD)})`;
  cap1.style.opacity = 1 - zD;

  const pIn = R(p, .42, .5), pOut = R(p, .8, .86);
  const rot = 90 * (R(p, .48, .55) - R(p, .58, .65));
  const zP = R(p, .67, .73) - R(p, .77, .82);
  phone.style.opacity = pIn * (1 - pOut);
  phone.style.transform = `translateY(${(1 - pIn) * 90}px)`;
  phoneEl.style.transform = `perspective(1200px) rotateX(${(1 - pIn) * 35 + (MY - .5) * 12 * (1 - zP)}deg) rotateY(${(MX - .5) * 16 * (1 - zP)}deg) rotateZ(${rot}deg) scale(${lerp(baseP, coverP, zP)})`;
  cap2.style.opacity = 1 - zP;

  const cIn = R(p, .86, .95);
  contact.style.opacity = cIn;
  contact.style.pointerEvents = cIn > .5 ? "auto" : "none";
  contact.style.transform = `translateY(${(1 - cIn) * 60}px)`;

  bar.style.transform = `scaleX(${p})`;
}

let ticking = false;
addEventListener('scroll', () => {
  if (!ticking) { ticking = true; requestAnimationFrame(() => { frame(); ticking = false; }); }
}, { passive: true });
addEventListener('resize', () => { sizes(); frame(); });
addEventListener('pointermove', e => {
  if (e.pointerType === 'touch') return;
  MX = e.clientX / innerWidth; MY = e.clientY / innerHeight;
  const id = $('idcard');
  if (id) {
    id.style.setProperty('--ry', ((MX - .5) * 14) + 'deg');
    id.style.setProperty('--rx', (-(MY - .5) * 14) + 'deg');
  }
  const glow = document.querySelector('.cursor-glow');
  if (glow) { glow.style.left = e.clientX + 'px'; glow.style.top = e.clientY + 'px'; }
  frame();
},{passive:true});

/* Your images */
if (CONFIG.avatar && $('avatar')) $('avatar').innerHTML = `<img src="${CONFIG.avatar}" alt="Kashaf Ul Khair Khalid">`;
if (CONFIG.project1) $('s1').innerHTML = `<img src="${CONFIG.project1}" alt="Desktop project screenshot">`;
if (CONFIG.project2) $('s2').innerHTML = `<img src="${CONFIG.project2}" alt="Mobile project screenshot">`;

$('form').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target;
  const [name, email, subject, message] = [...f.querySelectorAll('input,textarea')].map(el => el.value.trim());
  const body = `From: ${name} (${email})\n\n${message}`;
  location.href = `mailto:kashafulkhairkhalid@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const b = $('send'); b.textContent = 'Opening mail ✓';
  f.reset();
  setTimeout(() => b.textContent = 'Send message →', 3000);
  b.blur();
});

sizes();
frame();
