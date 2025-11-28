const container = document.getElementById('container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000010);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 1, 4000);
camera.position.set(0, 0, 600);

const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enabled = true;

scene.add(new THREE.AmbientLight(0xffffff, 0.35));
const pl = new THREE.PointLight(0xffffff, 0.8);
pl.position.set(300,300,300);
scene.add(pl);

let whiteStars;
(function createWhiteStars(){
  const geo = new THREE.BufferGeometry();
  const count = 10000;
  const pos = new Float32Array(count*3);
  for(let i=0;i<count;i++){
    pos[i*3]   = (Math.random()-0.5)*1600;
    pos[i*3+1] = (Math.random()-0.5)*1200;
    pos[i*3+2] = (Math.random()-0.5)*1200;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
  const tex = new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/disc.png');
  const mat = new THREE.PointsMaterial({ size:3.5, map:tex, transparent:true, blending:THREE.AdditiveBlending, color:0xffffff, depthWrite:false });
  whiteStars = new THREE.Points(geo, mat);
  scene.add(whiteStars);
})();

let pinkStars;
(function createPinkConstellation(){
  const coords = [
    [ -40,  40, -80],
    [  40,  40, -60],
    [ -70,  0,  -50],
    [  70,  0,  -40],
    [ -30, -40, -30],
    [  30, -40, -20],
    [   0,  10, -30],
    [   0, -10, -10]
  ];
  const count = coords.length;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count*3);
  for(let i=0;i<count;i++){
    pos[i*3]   = coords[i][0] * 4; 
    pos[i*3+1] = coords[i][1] * 4;
    pos[i*3+2] = coords[i][2] * 2;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
  const tex = new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/disc.png');
  const mat = new THREE.PointsMaterial({ size:8.5, map:tex, transparent:true, blending:THREE.AdditiveBlending, color:0xff6f9b, depthWrite:false });
  pinkStars = new THREE.Points(geo, mat);
  scene.add(pinkStars);
})();

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const heartPopup = document.getElementById('heart-popup');
const pinkboard = document.getElementById('pinkboard');
const closeHeartBtn = document.getElementById('close-heart');

const cakePopup = document.getElementById('cake-popup');
const closeCakeBtn = document.getElementById('close-cake');

let heartLoopHandle = null;
let heartRunning = false;

function startHeartAnimation(){
  if (heartRunning) return;
  heartRunning = true;

  heartPopup.classList.remove('hidden');
  heartPopup.setAttribute('aria-hidden','false');

  const canvas = pinkboard;
  const context = canvas.getContext('2d');

  const setting = {
    particles: { length: 1000, duration: 2, velocity: 100, effect: -0.75, size: 8 }
  };

  function Point(x,y){ this.x = x||0; this.y = y||0; }
  Point.prototype.clone = function(){ return new Point(this.x,this.y); };
  Point.prototype.length = function(len){
    if (len === undefined) return Math.sqrt(this.x*this.x + this.y*this.y);
    this.normalize(); this.x *= len; this.y *= len; return this;
  };
  Point.prototype.normalize = function(){
    const l = Math.sqrt(this.x*this.x + this.y*this.y);
    if (l>0){ this.x /= l; this.y /= l; } return this;
  };

  function Particle(){ this.position = new Point(); this.velocity = new Point(); this.acceleration = new Point(); this.age = 0; }
  Particle.prototype.initialize = function(x,y,dx,dy){
    this.position.x = x; this.position.y = y; this.velocity.x = dx; this.velocity.y = dy;
    this.acceleration.x = dx * setting.particles.effect; this.acceleration.y = dy * setting.particles.effect; this.age = 0;
  };
  Particle.prototype.update = function(dt){
    this.position.x += this.velocity.x * dt; this.position.y += this.velocity.y * dt;
    this.velocity.x += this.acceleration.x * dt; this.velocity.y += this.acceleration.y * dt; this.age += dt;
  };
  Particle.prototype.draw = function(ctx, image){
    function ease(t){ return (--t) * t * t + 1; }
    const size = image.width * ease(this.age / setting.particles.duration);
    ctx.globalAlpha = 1 - this.age / setting.particles.duration;
    ctx.drawImage(image, this.position.x - size/2, this.position.y - size/2, size, size);
  };

  function ParticlePool(length){
    this.particles = new Array(length);
    for (let i=0;i<length;i++) this.particles[i] = new Particle();
    this.firstActive = 0; this.firstFree = 0; this.duration = setting.particles.duration;
  }
  ParticlePool.prototype.add = function(x,y,dx,dy){
    const p = this.particles[this.firstFree];
    p.initialize(x,y,dx,dy);
    this.firstFree++;
    if (this.firstFree === this.particles.length) this.firstFree = 0;
    if (this.firstActive === this.firstFree) { this.firstActive++; if (this.firstActive === this.particles.length) this.firstActive = 0; }
  };
  ParticlePool.prototype.update = function(deltaTime){
    if (this.firstActive < this.firstFree){
      for (let i=this.firstActive;i<this.firstFree;i++) this.particles[i].update(deltaTime);
    } else {
      for (let i=this.firstActive;i<this.particles.length;i++) this.particles[i].update(deltaTime);
      for (let i=0;i<this.firstFree;i++) this.particles[i].update(deltaTime);
    }
    while (this.particles[this.firstActive].age >= this.duration && this.firstActive != this.firstFree){
      this.firstActive++;
      if (this.firstActive === this.particles.length) this.firstActive = 0;
    }
  };
  ParticlePool.prototype.draw = function(ctx,image){
    if (this.firstActive < this.firstFree){
      for (let i=this.firstActive;i<this.firstFree;i++) this.particles[i].draw(ctx,image);
    } else {
      for (let i=this.firstActive;i<this.particles.length;i++) this.particles[i].draw(ctx,image);
      for (let i=0;i<this.firstFree;i++) this.particles[i].draw(ctx,image);
    }
  };

  const particles = new ParticlePool(setting.particles.length);
  const particleRate = setting.particles.length / setting.particles.duration;
  let time = 0;

  function pointOnHeart(t){
    return new Point(
      160 * Math.pow(Math.sin(t),3),
      130 * Math.cos(t) - 50 * Math.cos(2*t) - 20 * Math.cos(3*t) - 10 * Math.cos(4*t) + 25
    );
  }

  const image = (function(){
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    c.width = setting.particles.size; c.height = setting.particles.size;
    function to(t){
      const p = pointOnHeart(t);
      p.x = setting.particles.size/2 + p.x * setting.particles.size/350;
      p.y = setting.particles.size/2 - p.y * setting.particles.size/350;
      return p;
    }
    ctx.beginPath();
    let t = -Math.PI;
    let pt = to(t);
    ctx.moveTo(pt.x, pt.y);
    while (t < Math.PI){
      t += 0.01;
      pt = to(t);
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.closePath();
    ctx.fillStyle = '#f50B02';
    ctx.fill();
    const img = new Image();
    img.src = c.toDataURL();
    return img;
  })();

  let rafId = null;
  function render(){
    rafId = requestAnimationFrame(render);
    const newTime = Date.now()/1000;
    const deltaTime = newTime - (time || newTime);
    time = newTime;

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    context.clearRect(0,0,canvas.width, canvas.height);

    const amount = particleRate * deltaTime;
    for (let i=0;i<amount;i++){
      const pos = pointOnHeart(Math.PI - 2 * Math.PI * Math.random());
      const dir = pos.clone().length(setting.particles.velocity);
      particles.add(canvas.width/2 + pos.x, canvas.height/2 - pos.y, dir.x, -dir.y);
    }
    particles.update(deltaTime);
    particles.draw(context, image);
  }
  render();

  heartLoopHandle = function cleanup(){
    if (rafId) cancelAnimationFrame(rafId);
    context.clearRect(0,0,canvas.width,canvas.height);
  };
}

function stopHeartAnimation(){
  if (heartLoopHandle) heartLoopHandle();
  heartLoopHandle = null;
  heartRunning = false;
  heartPopup.classList.add('hidden');
  heartPopup.setAttribute('aria-hidden','true');
  if (pinkboard && pinkboard.getContext) {
    const ctx = pinkboard.getContext('2d');
    ctx && ctx.clearRect(0,0,pinkboard.width,pinkboard.height);
  }
}

let fireworksRunning = false;
let fireworksAnimationId = null;

function startFireworks() {
  if (fireworksRunning) return;
  fireworksRunning = true;

  const canvas = document.getElementById('fireworks-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  const fireworks = [];
  const particles = [];

  class Firework {
    constructor(x, y) {
      this.x = x;
      this.y = canvas.height;
      this.targetY = y;
      this.speed = 3;
      this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
      this.exploded = false;
    }

    update() {
      if (!this.exploded) {
        this.y -= this.speed;
        if (this.y <= this.targetY) {
          this.explode();
          this.exploded = true;
        }
      }
    }

    draw() {
      if (!this.exploded) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
    }

    explode() {
      const particleCount = 50;
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(this.x, this.y, this.color));
      }
    }
  }

  class Particle {
    constructor(x, y, color) {
      this.x = x;
      this.y = y;
      this.color = color;
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.gravity = 0.1;
      this.alpha = 1;
      this.decay = Math.random() * 0.015 + 0.015;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += this.gravity;
      this.alpha -= this.decay;
    }

    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.restore();
    }
  }

  function animateFireworks() {
    fireworksAnimationId = requestAnimationFrame(animateFireworks);
    ctx.fillStyle = 'rgba(255, 235, 240, 0.1)';
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (Math.random() < 0.05) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height * 0.5;
      fireworks.push(new Firework(x, y));
    }

    for (let i = fireworks.length - 1; i >= 0; i--) {
      fireworks[i].update();
      fireworks[i].draw();
      if (fireworks[i].exploded) {
        fireworks.splice(i, 1);
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      particles[i].draw();
      if (particles[i].alpha <= 0) {
        particles.splice(i, 1);
      }
    }
  }

  animateFireworks();
  setTimeout(() => {
    stopFireworks();
  }, 10000);
}

function stopFireworks() {
  if (fireworksAnimationId) {
    cancelAnimationFrame(fireworksAnimationId);
    fireworksAnimationId = null;
  }
  fireworksRunning = false;
  const canvas = document.getElementById('fireworks-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function startCakePopup(){
  cakePopup.classList.remove('hidden');
  cakePopup.setAttribute('aria-hidden','false');

  const flames = cakePopup.querySelectorAll('.flame, .flame2, .flame3');
  const text = cakePopup.querySelector('.text');
  flames.forEach(f => f.style.opacity = '1');

  function blow(){
    flames.forEach(f => f.style.opacity = '0');
    if (text) { 
        text.style.opacity = '1'; 
        text.style.transform = 'translateY(-10px)';
        startFireworks();

    }
  }

  flames.forEach(f => {
    f.addEventListener('click', blow, { once: true });
  });
}

function stopCakePopup(){
    stopFireworks();
    cakePopup.classList.add('hidden');
    cakePopup.setAttribute('aria-hidden','true');
    const flames = cakePopup.querySelectorAll('.flame, .flame2, .flame3');
    const text = cakePopup.querySelector('.text');
    flames.forEach(f => { f.style.opacity = '1'; });
    if (text) { text.style.opacity = '0'; text.style.transform = ''; }
}

closeHeartBtn.addEventListener('click', () => {
  stopHeartAnimation();
});
closeCakeBtn.addEventListener('click', () => {
  stopCakePopup();
});

document.addEventListener('click', (ev)=>{
  if (!heartPopup.classList.contains('hidden') || !cakePopup.classList.contains('hidden')) return;

  mouse.x = (ev.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(ev.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const pinkHits = raycaster.intersectObject(pinkStars);
  if (pinkHits && pinkHits.length > 0) {
    startCakePopup();
    return;
  }

  const whiteHits = raycaster.intersectObject(whiteStars);
  if (whiteHits && whiteHits.length > 0) {
    startHeartAnimation();
    return;
  }
});

function animate(){
  requestAnimationFrame(animate);
  scene.rotation.y += 0.00012;
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', ()=>{
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});