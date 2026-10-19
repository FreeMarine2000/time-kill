import * as THREE from 'three';
import './style.css';

// TIME KILL — combat-first FPS prototype.
// All gameplay geometry and audio are generated locally; no game assets or APIs required.

const app = document.querySelector('#app');
const overlay = document.querySelector('#overlay');
const startButton = document.querySelector('#start-button');
const hud = document.querySelector('#hud');
const waveEl = document.querySelector('#wave');
const enemyCountEl = document.querySelector('#enemy-count');
const healthEl = document.querySelector('#health');
const healthMeter = document.querySelector('#health-meter');
const killsEl = document.querySelector('#kills');
const scoreEl = document.querySelector('#score');
const hitMarker = document.querySelector('#hit-marker');
const damageFlash = document.querySelector('#damage-flash');
const centerMessage = document.querySelector('#center-message');
const dashStatus = document.querySelector('#dash-status');
const ammoEl = document.querySelector('#ammo-count');
const reloadEl = document.querySelector('#reload-status');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x090c11);
scene.fog = new THREE.Fog(0x090c11, 22, 68);
const camera = new THREE.PerspectiveCamera(78, innerWidth / innerHeight, 0.08, 120);
camera.rotation.order = 'YXZ';
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
app.prepend(renderer.domElement);

scene.add(new THREE.HemisphereLight(0x9aabc8, 0x242027, 2.0));
const keyLight = new THREE.DirectionalLight(0xffb49a, 2.3);
keyLight.position.set(-7, 13, 8); scene.add(keyLight);
const redLight = new THREE.PointLight(0xff321b, 22, 28);
redLight.position.set(0, 5, -10); scene.add(redLight);
const blueLight = new THREE.PointLight(0x3c6fba, 14, 24);
blueLight.position.set(9, 4, 7); scene.add(blueLight);

const mat = (color, roughness=0.75, metalness=0.15, emissive=null) => new THREE.MeshStandardMaterial({
  color, roughness, metalness, ...(emissive ? {emissive: new THREE.Color(emissive), emissiveIntensity: 1.8} : {})
});

// Simple arena: combat readability over scenery.
const floorMat = mat(0x171c24, .88, .25);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), floorMat);
floor.rotation.x = -Math.PI/2; floor.position.y = -0.04; scene.add(floor);
const grid = new THREE.GridHelper(60, 40, 0x343d4b, 0x252c36);
grid.position.y = -0.025; scene.add(grid);
const wallMat = mat(0x202630, .7, .35);
const solidOccluders = [];
function addWall(x,y,z,w,h,d) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), wallMat);
  mesh.position.set(x,y,z); scene.add(mesh); solidOccluders.push(mesh);
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), new THREE.LineBasicMaterial({color:0x46505f, transparent:true, opacity:.55}));
  edge.position.copy(mesh.position); scene.add(edge);
}
addWall(0, 2.5, -20, 40, 5, 1);
addWall(0, 2.5, 20, 40, 5, 1);
addWall(-20, 2.5, 0, 1, 5, 40);
addWall(20, 2.5, 0, 1, 5, 40);
// Small cover blocks. They're visual cover in this prototype; enemies and player stay inside the arena.
const coverMat = mat(0x303946, .55, .5);
for (const [x,z,sx,sz] of [[-7,-5,2.5,1.2],[7,-4,1.6,2.5],[-8,7,2,2],[8,8,2.5,1.2],[0,-10,3,1]]) {
  const block = new THREE.Mesh(new THREE.BoxGeometry(sx,1.2,sz), coverMat);
  block.position.set(x,.6,z); scene.add(block);
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(block.geometry), new THREE.LineBasicMaterial({color:0x596575, transparent:true, opacity:.5}));
  edge.position.copy(block.position); scene.add(edge);
}
// Red lane markers
const stripMat = new THREE.MeshBasicMaterial({color:0x9b2b20});
for (let i=-2;i<=2;i++) {
  const strip = new THREE.Mesh(new THREE.BoxGeometry(.045,.01,34), stripMat);
  strip.position.set(i*5,.005,0); scene.add(strip);
}


// Procedural weapon viewmodel attached to the camera: a compact, stylized service pistol.
// No external model files: slide, frame, sights, trigger, grip panels and muzzle are geometry.
const weapon = new THREE.Group();
camera.add(weapon); scene.add(camera);
const gunMat = new THREE.MeshStandardMaterial({color:0x343c47, roughness:.27, metalness:.88});
const slideMat = new THREE.MeshStandardMaterial({color:0x59616a, roughness:.22, metalness:.94});
const gunDark = new THREE.MeshStandardMaterial({color:0x10151b, roughness:.55, metalness:.35});
const gripMat = new THREE.MeshStandardMaterial({color:0x20262d, roughness:.8, metalness:.12});
const gunAccent = new THREE.MeshStandardMaterial({color:0xff5636, emissive:0x9e1909, emissiveIntensity:1.15, roughness:.32, metalness:.35});
function gunPart(geometry, material, position, rotation=[0,0,0]) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(...position); m.rotation.set(...rotation); weapon.add(m); return m;
}
// Main frame and upper slide
gunPart(new THREE.BoxGeometry(.235,.17,.52), gunMat, [.34,-.285,-.64]);
gunPart(new THREE.BoxGeometry(.205,.12,.52), slideMat, [.34,-.213,-.66]);
gunPart(new THREE.BoxGeometry(.16,.10,.32), gunDark, [.34,-.245,-.91]);
// Barrel and muzzle
gunPart(new THREE.CylinderGeometry(.041,.041,.36,12), gunDark, [.34,-.21,-.91], [Math.PI/2,0,0]);
gunPart(new THREE.CylinderGeometry(.049,.049,.06,12), slideMat, [.34,-.21,-1.085], [Math.PI/2,0,0]);
gunPart(new THREE.CylinderGeometry(.026,.026,.063,12), gunDark, [.34,-.21,-1.09], [Math.PI/2,0,0]);
// Grip angled back, plus textured grip panels
gunPart(new THREE.BoxGeometry(.145,.255,.19), gripMat, [.34,-.455,-.49], [-.20,0,0]);
gunPart(new THREE.BoxGeometry(.151,.19,.025), gunDark, [.34,-.455,-.389], [-.20,0,0]);
for(let i=0;i<5;i++) gunPart(new THREE.BoxGeometry(.12,.008,.008), gunMat, [.34,-.39-i*.027,-.372], [-.20,0,0]);
// Detachable procedural magazine, seated in the pistol grip.
const magazine = new THREE.Group();
// Its top meets the bottom of the grip; the base plate remains visibly exposed.
const magazineHome = new THREE.Vector3(.34,-.655,-.49);
magazine.position.copy(magazineHome);
magazine.rotation.x=-.20;
weapon.add(magazine);
const magazineBody = new THREE.Mesh(new THREE.BoxGeometry(.105,.19,.125), gunDark);
magazine.add(magazineBody);
const magazineBase = new THREE.Mesh(new THREE.BoxGeometry(.13,.025,.145), slideMat);
magazineBase.position.y=-.095;
magazine.add(magazineBase);
const magazineFollower = new THREE.Mesh(new THREE.BoxGeometry(.075,.012,.085), gunAccent);
magazineFollower.position.y=.099;
magazine.add(magazineFollower);
// Trigger guard, trigger and safety detail
gunPart(new THREE.TorusGeometry(.065,.009,5,16,Math.PI), gunMat, [.34,-.34,-.64], [Math.PI/2,0,Math.PI]);
gunPart(new THREE.BoxGeometry(.018,.075,.018), slideMat, [.34,-.34,-.60], [.18,0,0]);
gunPart(new THREE.BoxGeometry(.045,.025,.018), gunAccent, [.34,-.275,-.48]);
// Front and rear sights
gunPart(new THREE.BoxGeometry(.04,.025,.035), gunDark, [.34,-.156,-.98]);
gunPart(new THREE.BoxGeometry(.05,.026,.035), gunDark, [.34,-.156,-.43]);
gunPart(new THREE.BoxGeometry(.014,.009,.014), gunAccent, [.34,-.139,-.98]);
// Slide serrations
for(let i=0;i<5;i++) gunPart(new THREE.BoxGeometry(.009,.065,.012), gunDark, [.425,-.22,-.49-i*.035], [-.12,0,0]);
// Tiny side screw / ejection port
gunPart(new THREE.BoxGeometry(.065,.025,.012), gunDark, [.437,-.21,-.69]);
gunPart(new THREE.CylinderGeometry(.012,.012,.008,10), slideMat, [.445,-.255,-.78], [0,0,Math.PI/2]);
// Muzzle flash is hidden until a shot fires
const muzzleFlash = new THREE.Mesh(new THREE.IcosahedronGeometry(.105,1), new THREE.MeshBasicMaterial({color:0xffc17a}));
muzzleFlash.position.set(.34,-.215,-1.13); muzzleFlash.visible=false; weapon.add(muzzleFlash);
const muzzleLight = new THREE.PointLight(0xff7a3d, 0, 3.5);
muzzleLight.position.set(.34,-.215,-1.12); weapon.add(muzzleLight);
weapon.position.set(0,-.015,0);

// Player state
const player = { pos: new THREE.Vector3(0,1.65,12), velY:0, health:100, score:0, kills:0, wave:1, alive:true, grounded:true, dashReady:true, dashTimer:0, invuln:0 };
let yaw = 0, pitch = 0, running = false, started = false, gameOver = false;
let recoil = 0, recoilAngle = 0, recoilYaw = 0;
const MAG_SIZE = 7; // Seven rounds per magazine; reserve ammunition is unlimited.
const RELOAD_DURATION = 1.35;
const RELOAD_SETTLE_DURATION = .16;
let ammo = MAG_SIZE, reloading = false, reloadTimer = 0;
let reloadAmmoCommitted = false, reloadSettleTimer = 0;
const keys = new Set();
const clock = new THREE.Clock();
const enemies = [];
let waveTransition = false;
const effects = [];
const projectiles = [];
const raycaster = new THREE.Raycaster();
raycaster.far = 42;
const center = new THREE.Vector2(0,0);
let audioCtx = null;
let reloadInsertPlayed = false;

function unlockAudio() {
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch {}
}

function sound(type='shot', frequency=160) {
  // Procedural, offline audio with a restrained output limiter.
  try {
    unlockAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const master = audioCtx.createGain();
    master.gain.value = type === 'shot' ? .62 : .45;
    const limiter = audioCtx.createDynamicsCompressor();
    limiter.threshold.setValueAtTime(-12, now);
    limiter.knee.setValueAtTime(5, now);
    limiter.ratio.setValueAtTime(12, now);
    limiter.attack.setValueAtTime(.002, now);
    limiter.release.setValueAtTime(.12, now);
    master.connect(limiter); limiter.connect(audioCtx.destination);
    const variation = .94 + Math.random() * .12;

    const noiseBuffer = (duration) => {
      const buffer = audioCtx.createBuffer(1, Math.max(1, Math.floor(audioCtx.sampleRate * duration)), audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i=0;i<data.length;i++) data[i]=(Math.random()*2-1) * (1-i/data.length);
      return buffer;
    };
    const noiseBurst = (duration, cutoff, gainValue, delay=0) => {
      const src=audioCtx.createBufferSource(); src.buffer=noiseBuffer(duration);
      const filter=audioCtx.createBiquadFilter(); filter.type='lowpass'; filter.frequency.setValueAtTime(cutoff,now+delay);
      const gain=audioCtx.createGain();
      gain.gain.setValueAtTime(.0001,now+delay);
      gain.gain.exponentialRampToValueAtTime(gainValue,now+delay+.003);
      gain.gain.exponentialRampToValueAtTime(.0001,now+delay+duration);
      src.connect(filter); filter.connect(gain); gain.connect(master); src.start(now+delay); src.stop(now+delay+duration);
    };
    const tone = (wave, startFreq, endFreq, duration, gainValue, delay=0) => {
      const osc=audioCtx.createOscillator(), gain=audioCtx.createGain();
      osc.type=wave; osc.frequency.setValueAtTime(startFreq,now+delay);
      osc.frequency.exponentialRampToValueAtTime(Math.max(25,endFreq),now+delay+duration);
      gain.gain.setValueAtTime(.0001,now+delay);
      gain.gain.exponentialRampToValueAtTime(gainValue,now+delay+.002);
      gain.gain.exponentialRampToValueAtTime(.0001,now+delay+duration);
      osc.connect(gain); gain.connect(master); osc.start(now+delay); osc.stop(now+delay+duration+.01);
    };

    if(type==='shot') {
      // Noise-forward report, a short low body, and a quiet mechanical return.
      noiseBurst(.17, 11800 * variation, .72);
      noiseBurst(.24, 2100 * variation, .44, .002);
      noiseBurst(.085, 5400, .20, .009);
      tone('sine', 86 * variation, 34, .17, .42);
      tone('triangle', 175 * variation, 48, .14, .25, .002);
      tone('sawtooth', 820 * variation, 160, .045, .055, .008);
      noiseBurst(.075, 2900, .15, .062);
      tone('square', 1760 * variation, 640, .04, .045, .055);
      tone('triangle', 590 * variation, 235, .055, .04, .10);
    } else if(type==='enemy-shot') {
      noiseBurst(.11, 3400, .20);
      tone('triangle', frequency, frequency*.48, .18, .18);
      tone('sine', frequency*.6, 58, .22, .13, .015);
    } else if(type==='reload') {
      // Magazine release and handling at the start of reload.
      noiseBurst(.035, 1900, .18); tone('triangle', 410, 190, .075, .10, .012);
      noiseBurst(.065, 2700, .16, .11);
    } else if(type==='insert') {
      // Magazine seats with a firm, compact polymer/metal clack.
      noiseBurst(.045, 3200, .24);
      tone('triangle', 520, 180, .085, .12, .003);
      tone('sine', 115, 62, .065, .09);
    } else if(type==='empty') {
      tone('square', 690, 365, .045, .09); noiseBurst(.035, 1450, .09, .004);
      tone('triangle', 220, 95, .05, .06, .012);
    } else if(type==='hit' || type==='impact') {
      noiseBurst(.065, 5200, .28);
      noiseBurst(.095, 1450, .18, .003);
      tone('triangle', 128, 52, .10, .20);
    } else if(type==='damage') {
      noiseBurst(.11, 900, .3);
      tone('sawtooth', 120, 42, .19, .3);
    } else if(type==='death') {
      noiseBurst(.22, 2200, .36);
      tone('triangle', 180, 38, .28, .4);
      tone('square', 780, 90, .13, .13, .025);
    } else if(type==='ready') {
      tone('triangle', 620, 420, .11, .16);
      tone('sine', 930, 700, .09, .07, .055);
    } else {
      tone('triangle', frequency, 40, .16, .24);
    }
  } catch {}
}

function makeClockEnemy(position, wave=1, type='runner') {
  const group = new THREE.Group();
  const bodyMat = mat(0x414956,.38,.8);
  const darkMat = mat(0x11151b,.35,.65);
  const faceMat = new THREE.MeshStandardMaterial({color:0xd8d3c5, roughness:.48, metalness:.12, emissive:0x24120d, emissiveIntensity:.25});
  const redMat = new THREE.MeshStandardMaterial({color:0xff3926, emissive:0xff1808, emissiveIntensity:2.2, roughness:.3});
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.57,.085,8,32), bodyMat);
  group.add(ring);
  const face = new THREE.Mesh(new THREE.CircleGeometry(.51,32), faceMat);
  face.position.z=.035; group.add(face);
  // Tick marks around the clock face.
  const marks = new THREE.Group();
  for (let i=0;i<12;i++) {
    const a=i*Math.PI/6;
    const mark = new THREE.Mesh(new THREE.BoxGeometry(.025, i%3===0?.13:.07,.018), darkMat);
    mark.position.set(Math.sin(a)*.4,Math.cos(a)*.4,.055); mark.rotation.z=-a; marks.add(mark);
  }
  group.add(marks);
  const hub = new THREE.Mesh(new THREE.SphereGeometry(.055,8,8), redMat); hub.position.z=.08; group.add(hub);
  const warningMat = new THREE.MeshStandardMaterial({color:0xff5636, emissive:0xff2d16, emissiveIntensity:2.2, roughness:.32});
  const telegraphRing = new THREE.Mesh(new THREE.TorusGeometry(.68,.028,6,24), warningMat);
  telegraphRing.position.z=.12; telegraphRing.visible=false; group.add(telegraphRing);
  // Three proper clock hands, all pivoting from the exact centre of the dial.
  // Geometry is offset upward from the pivot so rotation.z behaves like a real clock.
  const hourHand = new THREE.Group();
  hourHand.position.set(0, 0, .078);
  const hourHandMesh = new THREE.Mesh(new THREE.BoxGeometry(.052, .245, .025), darkMat);
  hourHandMesh.position.y = .1225;
  hourHand.add(hourHandMesh);
  group.add(hourHand);

  const minuteHand = new THREE.Group();
  minuteHand.position.set(0, 0, .096);
  const minuteHandMesh = new THREE.Mesh(new THREE.BoxGeometry(.032, .365, .021), darkMat);
  minuteHandMesh.position.y = .1825;
  minuteHand.add(minuteHandMesh);
  group.add(minuteHand);

  const secondHand = new THREE.Group();
  secondHand.position.set(0, 0, .114);
  const secondHandMesh = new THREE.Mesh(new THREE.BoxGeometry(.012, .425, .014), redMat);
  secondHandMesh.position.y = .205;
  secondHand.add(secondHandMesh);
  const secondCounterweight = new THREE.Mesh(new THREE.CircleGeometry(.027, 10), redMat);
  secondCounterweight.position.set(0, -.075, .002);
  secondHand.add(secondCounterweight);
  group.add(secondHand);
  // Each clock keeps the same dial and hands, with type-specific clockwork armor.
  if (type === 'tank') {
    const armorMat=mat(0x59616a,.32,.9);
    for (const side of [-1,1]) {
      const plate=new THREE.Mesh(new THREE.BoxGeometry(.42,.58,.22),armorMat);
      plate.position.set(side*.66,-.12,.01); plate.rotation.z=side*-.16; group.add(plate);
    }
    const crown=new THREE.Mesh(new THREE.TorusGeometry(.72,.12,8,28),armorMat);
    crown.position.z=-.02; group.add(crown);
  }
  // Four short metal legs, splayed slightly.
  const legs=[];
  for (let i=0;i<4;i++) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.055,.035,.5,7), bodyMat);
    const a=i*Math.PI/2 + Math.PI/4;
    leg.position.set(Math.cos(a)*.38,-.48,Math.sin(a)*.22);
    leg.rotation.z=-Math.cos(a)*.65;
    group.add(leg); legs.push(leg);
  }
  group.position.copy(position); group.position.y=1.05;
  // Face the player approximately; the clock front is local +Z.
  group.lookAt(player.pos.x,1.05,player.pos.z);
  const baseScale = type === 'runner' ? .72 : type === 'tank' ? 1.55 : .96;
  group.scale.setScalar(baseScale);
  scene.add(group);
  const stats = type === 'runner'
    ? {hp:34+wave*4, speed:3.65+Math.min(wave*.06,.5), damage:10+Math.min(wave*.7,5), attackRange:1.35, windup:.58, cooldown:1.35, recovery:.32}
    : type === 'tank'
      ? {hp:170+wave*18, speed:.82+Math.min(wave*.025,.18), damage:29+Math.min(wave*1.2,10), attackRange:1.85, windup:1.18, cooldown:2.65, recovery:1.0}
      : {hp:72+wave*9, speed:2.05+Math.min(wave*.05,.4), damage:15+Math.min(wave*.8,6), attackRange:7.5, windup:.82, cooldown:2.45, recovery:.42};
  const enemy = {
    group, face, hourHand, minuteHand, secondHand, legs, telegraphRing, type, baseScale,
    // Each clock starts at a different time; all hands advance at consistent ratios.
    clockOffset: Math.random() * Math.PI * 2,
    hp:stats.hp, maxHp:stats.hp, speed:stats.speed, damage:stats.damage,
    attackRange:stats.attackRange, windup:stats.windup, cooldown:stats.cooldown, recovery:stats.recovery,
    state:'approach', timer:Math.random()*.7, attackCooldown:.6+Math.random(),
    stagger:0, alive:true, phase:Math.random()*6.28,
    projectileCooldown:0,
    leapCooldown:2.4+Math.random()*.6,
    leapVector:new THREE.Vector3(), leapStart:new THREE.Vector3(), leapDuration:.38,
    strafeDirection:Math.random()<.5?-1:1, strafeTimer:1.0+Math.random()*.7
  };
  enemies.push(enemy);
  return enemy;
}
function spawnWave() {
  waveTransition = false;
  const count = Math.min(3 + player.wave*2, 15);
  const tankCount = player.wave >= 3 ? Math.min(1 + Math.floor((player.wave-3)/4), Math.floor(count*.25)) : 0;
  const strikerCount = player.wave >= 5 ? Math.min(1 + Math.floor((player.wave-5)/4), Math.floor(count*.22)) : 0;
  const types = [
    ...Array(count-tankCount-strikerCount).fill('runner'),
    ...Array(tankCount).fill('tank'),
    ...Array(strikerCount).fill('striker')
  ];
  // Shuffle the mix so the heavier types do not always enter in the same order.
  for (let i=types.length-1;i>0;i--) {
    const j=Math.floor(Math.random()*(i+1));
    [types[i],types[j]]=[types[j],types[i]];
  }
  for (let i=0;i<count;i++) {
    const a=(i/count)*Math.PI*2 + Math.random()*.35;
    const r=11+Math.random()*4;
    makeClockEnemy(new THREE.Vector3(Math.cos(a)*r,0,Math.sin(a)*r),player.wave,types[i]);
  }
  waveEl.textContent=String(player.wave).padStart(2,'0');
  centerMessage.textContent=`WAVE ${String(player.wave).padStart(2,'0')}`;
  centerMessage.style.opacity='1';
  setTimeout(()=>{centerMessage.style.opacity='0';},900);
  updateHUD();
}
function updateHUD() {
  healthEl.textContent=Math.max(0,Math.ceil(player.health));
  healthMeter.style.width=`${Math.max(0,player.health)}%`;
  enemyCountEl.textContent=String(enemies.filter(e=>e.alive).length).padStart(2,'0');
  killsEl.textContent=String(player.kills).padStart(3,'0');
  scoreEl.textContent=String(player.score).padStart(6,'0');
  dashStatus.innerHTML=`DASH <span style="color:${player.dashReady?'#8fffc0':'#ff6345'}">${player.dashReady?'READY':'CHARGING'}</span>`;
  if (ammoEl) { ammoEl.innerHTML = `${String(ammo).padStart(2,'0')} <i>/ 07</i>`; ammoEl.classList.toggle('low-ammo', ammo <= 2); }
  if (reloadEl) reloadEl.textContent = reloading ? 'RELOADING…' : (ammo === 0 ? 'EMPTY // R RELOAD' : 'R RELOAD');
}
function burst(position, color=0xff6345, amount=12, speed=3) {
  for(let i=0;i<amount;i++) {
    const mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(.035+Math.random()*.055,0),new THREE.MeshBasicMaterial({color,transparent:true}));
    mesh.position.copy(position);
    const v=new THREE.Vector3(Math.random()*2-1,Math.random()*1.8,Math.random()*2-1).normalize().multiplyScalar(speed*(.35+Math.random()));
    scene.add(mesh);
    effects.push({mesh,vel:v,life:.35+Math.random()*.6,maxLife:.95});
  }
}
function flashHit() {
  hitMarker.classList.add('show'); clearTimeout(flashHit.timer);
  flashHit.timer=setTimeout(()=>hitMarker.classList.remove('show'),100);
}
function startReload() {
  if (!running || gameOver || reloading || ammo === MAG_SIZE) return;
  reloading = true; reloadTimer = RELOAD_DURATION;
  reloadInsertPlayed = false; reloadAmmoCommitted = false; reloadSettleTimer = 0;
  sound('reload', 220); updateHUD();
}
function shoot() {
  if (!running || gameOver || !player.alive || reloading) return;
  if (ammo <= 0) { startReload(); sound('empty', 500); return; }
  ammo--; updateHUD();
  sound('shot',105);
  recoil = Math.min(recoil + .28, .72);
  // Strong, cumulative camera kick: each shot genuinely knocks the sight off target.
  recoilAngle = Math.min(recoilAngle + (.15 + Math.random() * .04), .56);
  recoilYaw = THREE.MathUtils.clamp(recoilYaw + (Math.random() - .5) * .065, -.14, .14);
  muzzleFlash.visible=true; muzzleFlash.scale.setScalar(.75+Math.random()*.9);
  muzzleLight.intensity=5.5;
  setTimeout(()=>{muzzleFlash.visible=false; muzzleLight.intensity=0;},48);
  weapon.position.z=.15;
  weapon.rotation.x=.12;
  weapon.rotation.z+=(Math.random()-.5)*.055;
  setTimeout(()=>{weapon.position.z=0;},105);
  camera.updateMatrixWorld();
  raycaster.setFromCamera(center,camera);
  const targets=enemies.filter(e=>e.alive).map(e=>e.group);
  const hits=raycaster.intersectObjects(targets,true);
  if (hits.length) {
    const object=hits[0].object;
    let enemy=enemies.find(e=>e.alive && (e.group===object || e.group.getObjectById(object.id)));
    if (!enemy) {
      let parent=object;
      while(parent && !enemy) { enemy=enemies.find(e=>e.alive && e.group===parent); parent=parent.parent; }
    }
    if (enemy) {
      const recoveryBonus = enemy.type === 'tank' && enemy.state === 'recovery' ? 2.2 : 1;
      enemy.hp-=25*recoveryBonus;
      enemy.stagger=.22;
      enemy.group.position.addScaledVector(raycaster.ray.direction,-.24);
      burst(hits[0].point,0xffc17a,9,2.2);
      burst(hits[0].point,0xc4d0df,4,1.2);
      recoil = Math.min(recoil + .035, .72);
      flashHit(); sound('hit',260);
      if(enemy.hp<=0) killEnemy(enemy);
    }
  }
}
function killEnemy(enemy) {
  enemy.alive=false; scene.remove(enemy.group);
  const deathColor = enemy.type === 'tank' ? 0xffb347 : enemy.type === 'striker' ? 0x83cfff : 0xff5636;
  const debrisCount = enemy.type === 'tank' ? 48 : enemy.type === 'striker' ? 24 : 16;
  burst(enemy.group.position.clone().add(new THREE.Vector3(0,.2,0)),deathColor,debrisCount,enemy.type==='tank'?6.2:4.8);
  burst(enemy.group.position.clone(),0xb2bdc9,enemy.type==='tank'?30:12,3.2);
  if (enemy.type === 'striker') burst(enemy.group.position.clone(),0xffc17a,18,5.1);
  player.kills++; player.score+=100+Math.max(0,Math.floor(player.health));
  sound('death',75); updateHUD();
}
function damagePlayer(amount) {
  if(player.invuln>0 || gameOver) return;
  player.health=Math.max(0,player.health-amount); player.invuln=.32;
  damageFlash.classList.add('show'); setTimeout(()=>damageFlash.classList.remove('show'),130);
  sound('damage',90); updateHUD();
  if(player.health<=0) {
    gameOver=true; running=false;
    centerMessage.innerHTML=`YOU RAN OUT OF TIME<br><span style="font:12px IBM Plex Mono;color:#c3c8d0">SCORE ${String(player.score).padStart(6,'0')} — PRESS R TO RETRY</span>`;
    centerMessage.style.opacity='1';
    document.exitPointerLock?.();
  }
}
function resetGame() {
  for(const e of enemies) scene.remove(e.group);
  enemies.length=0;
  for(const p of projectiles) removeProjectile(p);
  projectiles.length=0;
  for(const fx of effects) scene.remove(fx.mesh);
  effects.length=0;
  waveTransition=false;
  player.pos.set(0,1.65,12); player.velY=0; player.health=100; player.score=0; player.kills=0; player.wave=1; player.alive=true; player.dashReady=true; player.dashTimer=0; player.invuln=0;
  yaw=0; pitch=0; recoil=0; recoilAngle=0; recoilYaw=0; ammo=MAG_SIZE; reloading=false; reloadTimer=0; reloadInsertPlayed=false; reloadAmmoCommitted=false; reloadSettleTimer=0; magazine.position.copy(magazineHome); magazine.rotation.x=-.20; weapon.position.set(0,-.015,0); weapon.rotation.set(0,0,0); camera.position.copy(player.pos); camera.rotation.set(0,0,0); gameOver=false;
  centerMessage.style.opacity='0'; spawnWave(); updateHUD();
}
function begin() {
  unlockAudio();
  sound('ready');
  if(!started) { started=true; resetGame(); }
  overlay.classList.add('hidden'); hud.classList.remove('hidden');
  renderer.domElement.requestPointerLock?.();
}
startButton.addEventListener('click',begin);
document.addEventListener('pointerlockchange',()=>{
  running=document.pointerLockElement===renderer.domElement && !gameOver;
  if(!running && started && !gameOver) {
    hud.classList.add('hidden');
    overlay.classList.remove('hidden');
    startButton.textContent='RESUME COMBAT';
    overlay.querySelector('.title-lockup p').textContent='PAUSED — THE CLOCKS ARE STILL TICKING';
  } else if(running) { overlay.classList.add('hidden'); hud.classList.remove('hidden'); }
});
document.addEventListener('mousemove',e=>{
  if(!running)return;
  yaw-=e.movementX*.0022;
  pitch-=e.movementY*.0022;
  pitch=THREE.MathUtils.clamp(pitch,-1.25,1.25);
  camera.rotation.set(pitch,yaw,0,'YXZ');
});
document.addEventListener('keydown',e=>{
  keys.add(e.code);
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
  if(e.code==='Space' && player.grounded && running){player.velY=7.2;player.grounded=false;}
  if(e.code==='KeyQ' && running && player.dashReady){
    player.dashReady=false; player.dashTimer=.18; player.invuln=Math.max(player.invuln,.22);
    setTimeout(()=>{player.dashReady=true;updateHUD();},1100); updateHUD();
  }
  if(e.code==='KeyR' && gameOver) { resetGame(); begin(); }
  if(e.code==='KeyR' && running && !gameOver) startReload();
});
document.addEventListener('keyup',e=>keys.delete(e.code));
document.addEventListener('mousedown',e=>{if(e.button===0){if(!running && started && !gameOver && document.pointerLockElement===renderer.domElement)shoot();else shoot();}});
document.addEventListener('contextmenu',e=>e.preventDefault());

function hasLineOfSight(origin, target) {
  const direction=target.clone().sub(origin);
  const distance=direction.length();
  direction.normalize();
  raycaster.set(origin,direction); raycaster.far=distance;
  const blocked=raycaster.intersectObjects(solidOccluders,false).length>0;
  raycaster.far=42;
  return !blocked;
}
function launchStrikerShot(enemy) {
  const origin=enemy.group.position.clone().add(new THREE.Vector3(0,.12,0));
  const target=player.pos.clone();
  if (!hasLineOfSight(origin,target)) return false;
  const direction=target.sub(origin).normalize();
  const material=new THREE.MeshStandardMaterial({color:0xff4938,emissive:0xff1908,emissiveIntensity:2.6,roughness:.3});
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(.16,10,10),material);
  mesh.position.copy(origin); scene.add(mesh);
  const projectileSpeed=10.5;
  projectiles.push({mesh,velocity:direction.multiplyScalar(projectileSpeed),speed:projectileSpeed,turnRate:.82,homing:true,damage:enemy.damage,life:3.2});
  sound('enemy-shot',190);
  return true;
}
function removeProjectile(projectile) {
  scene.remove(projectile.mesh);
  projectile.mesh.geometry.dispose();
  if (Array.isArray(projectile.mesh.material)) projectile.mesh.material.forEach(material=>material.dispose());
  else projectile.mesh.material.dispose();
}
function updateProjectiles(dt) {
  for (let i=projectiles.length-1;i>=0;i--) {
    const p=projectiles[i];
    if(p.homing) {
      const target=new THREE.Vector3(player.pos.x,player.pos.y-.2,player.pos.z);
      const desired=target.sub(p.mesh.position).normalize();
      const heading=p.velocity.clone().normalize();
      const angle=Math.acos(THREE.MathUtils.clamp(heading.dot(desired),-1,1));
      const steer=angle>1e-5?Math.min(1,p.turnRate*dt/angle):1;
      heading.lerp(desired,steer).normalize();
      p.velocity.copy(heading.multiplyScalar(p.speed));
    }
    const step=p.velocity.clone().multiplyScalar(dt);
    const length=step.length();
    raycaster.set(p.mesh.position,p.velocity.clone().normalize()); raycaster.far=length;
    const wallHit=raycaster.intersectObjects(solidOccluders,false)[0];
    raycaster.far=42;
    if (wallHit) {
      burst(wallHit.point,0xff6345,5,1.5); removeProjectile(p); projectiles.splice(i,1); continue;
    }
    const next=p.mesh.position.clone().add(step);
    const playerPoint=new THREE.Vector3(player.pos.x,player.pos.y-.2,player.pos.z);
    const segment=next.clone().sub(p.mesh.position);
    const t=THREE.MathUtils.clamp(playerPoint.clone().sub(p.mesh.position).dot(segment)/Math.max(segment.lengthSq(),.0001),0,1);
    const closest=p.mesh.position.clone().addScaledVector(segment,t);
    if (closest.distanceTo(playerPoint)<.62) {
      damagePlayer(p.damage); burst(closest,0xff6345,8,2.1);
      removeProjectile(p); projectiles.splice(i,1); continue;
    }
    p.mesh.position.copy(next); p.life-=dt;
    if (p.life<=0) { removeProjectile(p); projectiles.splice(i,1); }
  }
}
function updateEnemies(dt, now) {
  for(const e of enemies) {
    if(!e.alive)continue;
    e.phase+=dt*7;
    e.group.position.y=1.05+Math.sin(e.phase)*(e.type==='tank'?.025:.045);

    const clockSeconds=now*10+e.clockOffset;
    e.secondHand.rotation.z=-clockSeconds*(Math.PI*2/60);
    e.minuteHand.rotation.z=-clockSeconds*(Math.PI*2/3600);
    e.hourHand.rotation.z=-clockSeconds*(Math.PI*2/43200);
    e.attackCooldown-=dt;
    e.leapCooldown-=dt;
    e.strafeTimer-=dt;
    if(e.strafeTimer<=0){e.strafeDirection*=-1;e.strafeTimer=1.1+Math.random()*.8;}
    if(e.stagger>0){e.stagger=Math.max(0,e.stagger-dt);continue;}

    const toPlayer=new THREE.Vector3(player.pos.x-e.group.position.x,0,player.pos.z-e.group.position.z);
    const dist=toPlayer.length();
    const targetPoint=new THREE.Vector3(player.pos.x,1.2,player.pos.z);
    const origin=e.group.position.clone().add(new THREE.Vector3(0,.1,0));
    if(e.state==='leap-windup') {
      e.timer-=dt;
      e.telegraphRing.visible=true;
      e.telegraphRing.material.color.set(0xffb347);
      e.telegraphRing.material.emissive.set(0xff7518);
      e.group.scale.setScalar(e.baseScale*(1+Math.sin(now*22)*.06));
      if(e.timer<=0) {
        const towardPlayer=new THREE.Vector3(player.pos.x-e.group.position.x,0,player.pos.z-e.group.position.z);
        const distance=towardPlayer.length();
        const travel=THREE.MathUtils.clamp(distance-2.4,1.7,4.8);
        e.leapStart.copy(e.group.position);
        e.leapVector.copy(towardPlayer.normalize().multiplyScalar(travel));
        e.timer=e.leapDuration; e.state='leap'; e.telegraphRing.visible=false;
      }
      continue;
    }
    if(e.state==='leap') {
      e.timer-=dt;
      const progress=1-THREE.MathUtils.clamp(e.timer/e.leapDuration,0,1);
      e.group.position.x=e.leapStart.x+e.leapVector.x*progress;
      e.group.position.z=e.leapStart.z+e.leapVector.z*progress;
      e.group.position.x=THREE.MathUtils.clamp(e.group.position.x,-18,18);
      e.group.position.z=THREE.MathUtils.clamp(e.group.position.z,-18,18);
      e.group.position.y=1.05+Math.sin(progress*Math.PI)*1.45;
      e.group.lookAt(player.pos.x,1.05,player.pos.z);
      if(e.timer<=0){e.group.position.y=1.05;e.state='approach';}
      continue;
    }
    if (e.state==='recovery') {
      e.timer-=dt;
      e.telegraphRing.visible=e.type==='tank';
      if(e.type==='tank') {
        e.telegraphRing.material.color.set(0x68d8ff);
        e.telegraphRing.material.emissive.set(0x168bc9);
        e.group.scale.setScalar(e.baseScale*(.94+Math.sin(now*18)*.025));
      }
      if(e.timer<=0){e.state='approach';e.telegraphRing.visible=false;}
      continue;
    }
    if(e.state==='windup' || e.state==='ranged-windup') {
      e.timer-=dt;
      e.telegraphRing.visible=true;
      e.telegraphRing.material.color.set(e.type==='tank'?0xffb347:0xff4938);
      e.telegraphRing.material.emissive.set(e.type==='tank'?0xff7518:0xff2410);
      const pulse=e.type==='tank'?.035:.075;
      e.group.scale.setScalar(e.baseScale*(1+Math.sin(now*(e.type==='tank'?13:29))*pulse));
      if(e.timer<=0) {
        e.telegraphRing.visible=false; e.group.scale.setScalar(e.baseScale);
        if(e.state==='ranged-windup') {
          launchStrikerShot(e);
          e.state='recovery'; e.timer=e.recovery;
        } else {
          const reach=e.type==='tank'?2.75:2.0;
          if(dist<=reach) damagePlayer(e.damage);
          else if(e.type==='runner' && dist<2.8) {
            const lunge=toPlayer.normalize(); e.group.position.addScaledVector(lunge,.65);
          }
          e.state='recovery'; e.timer=e.recovery;
        }
      }
      continue;
    }

    e.group.scale.lerp(new THREE.Vector3(e.baseScale,e.baseScale,e.baseScale),dt*8);
    let moveDirection=toPlayer;
    let shouldMove=false;
    if(e.type==='striker') {
      const minRange=6.4, maxRange=9.0;
      const hasSight=hasLineOfSight(origin,targetPoint);
      if(dist<minRange || dist>maxRange) {
        const radial=dist<minRange?toPlayer.clone().negate():toPlayer.clone();
        const tangent=new THREE.Vector3(-toPlayer.z,0,toPlayer.x).multiplyScalar(e.strafeDirection*.45);
        moveDirection=radial.add(tangent); shouldMove=true;
      } else if(e.attackCooldown<=0 && hasSight) {
        e.state='ranged-windup'; e.timer=e.windup; e.attackCooldown=e.cooldown;
        e.group.lookAt(player.pos.x,1.05,player.pos.z);
      } else {
        // Circle while aiming, and use the orbit to look for a clear firing lane.
        moveDirection.set(-toPlayer.z,0,toPlayer.x).multiplyScalar(e.strafeDirection);
        shouldMove=true;
      }
    } else if(e.type==='tank' && dist>3.6 && e.leapCooldown<=0) {
      e.state='leap-windup'; e.timer=.48;
      e.leapCooldown=2.4+Math.random()*.6;
      e.group.lookAt(player.pos.x,1.05,player.pos.z);
    } else if(dist>e.attackRange) {
      shouldMove=true;
    } else if(e.attackCooldown<=0) {
      e.state='windup'; e.timer=e.windup; e.attackCooldown=e.cooldown;
      e.group.lookAt(player.pos.x,1.05,player.pos.z);
    }
    if(shouldMove && moveDirection.lengthSq()>0) {
      moveDirection.normalize();
      e.group.position.x+=moveDirection.x*e.speed*dt;
      e.group.position.z+=moveDirection.z*e.speed*dt;
    }
    e.group.lookAt(player.pos.x,1.05,player.pos.z);
    if(e.type==='runner') for(let i=0;i<e.legs.length;i++) e.legs[i].rotation.z=Math.sin(now*17+i*Math.PI)*.42;
    if(e.type==='striker') e.telegraphRing.rotation.z=now*1.2;
    e.group.position.x=THREE.MathUtils.clamp(e.group.position.x,-18,18);
    e.group.position.z=THREE.MathUtils.clamp(e.group.position.z,-18,18);
  }
  updateProjectiles(dt);
  if(enemies.length && enemies.every(e=>!e.alive) && !gameOver && !waveTransition) {
    waveTransition=true; player.wave++;
    centerMessage.textContent='ARENA CLEARED'; centerMessage.style.opacity='1';
    setTimeout(()=>{
      if(!gameOver && started){enemies.length=0;spawnWave();}
      centerMessage.style.opacity='0';
    },1200);
  }
}
function updateEffects(dt) {
  for(let i=effects.length-1;i>=0;i--) {
    const fx=effects[i]; fx.life-=dt;
    fx.mesh.position.addScaledVector(fx.vel,dt); fx.vel.y-=8*dt;
    fx.mesh.scale.multiplyScalar(Math.max(.01,1-dt*1.5));
    fx.mesh.material.opacity=Math.max(0,fx.life/fx.maxLife);
    if(fx.life<=0){scene.remove(fx.mesh);effects.splice(i,1);}
  }
}
function updatePlayer(dt) {
  if(!running || gameOver)return;
  player.invuln=Math.max(0,player.invuln-dt);
  const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));
  const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
  const move=new THREE.Vector3();
  if(keys.has('KeyW'))move.add(forward);
  if(keys.has('KeyS'))move.sub(forward);
  if(keys.has('KeyD'))move.add(right);
  if(keys.has('KeyA'))move.sub(right);
  if(move.lengthSq()>0)move.normalize();
  const speed=(keys.has('ShiftLeft')||keys.has('ShiftRight'))?9.0:6.1;
  player.pos.addScaledVector(move,speed*dt);
  if(player.dashTimer>0) {
    player.dashTimer-=dt;
    const dashDir=move.lengthSq()>0?move:forward;
    player.pos.addScaledVector(dashDir,25*dt);
  }
  player.velY-=19*dt;
  player.pos.y+=player.velY*dt;
  if(player.pos.y<1.65){player.pos.y=1.65;player.velY=0;player.grounded=true;}
  // Stay inside the arena.
  player.pos.x=THREE.MathUtils.clamp(player.pos.x,-18.5,18.5);
  player.pos.z=THREE.MathUtils.clamp(player.pos.z,-18.5,18.5);
  camera.position.copy(player.pos);
  // Brief vertical camera kick, then a fast controlled return.
  recoil = Math.max(0, recoil - dt*1.05);
  // Deliberately slower recovery so rapid fire climbs and needs manual correction.
  recoilAngle = THREE.MathUtils.damp(recoilAngle, 0, 3.0, dt);
  recoilYaw = THREE.MathUtils.damp(recoilYaw, 0, 4.2, dt);
  camera.rotation.set(THREE.MathUtils.clamp(pitch - recoilAngle,-1.25,1.25),yaw + recoilYaw,0,'YXZ');
  let reloadProgress = 0;
  let settleProgress = 0;
  if (reloading) {
    reloadTimer = Math.max(0, reloadTimer - dt);
    reloadProgress = 1 - reloadTimer / RELOAD_DURATION;
    if (!reloadInsertPlayed && reloadProgress >= .78) {
      reloadInsertPlayed = true;
      sound('insert');
    }
    if (reloadTimer === 0) {
      if (!reloadAmmoCommitted) {
        ammo = MAG_SIZE;
        reloadAmmoCommitted = true;
      }
      reloading = false;
      reloadSettleTimer = RELOAD_SETTLE_DURATION;
      updateHUD();
    }
  } else if (reloadSettleTimer > 0) {
    reloadSettleTimer = Math.max(0, reloadSettleTimer - dt);
    settleProgress = 1 - reloadSettleTimer / RELOAD_SETTLE_DURATION;
  }
  const smooth = t => { t=THREE.MathUtils.clamp(t,0,1); return t*t*(3-2*t); };
  // Pull the mag down and slightly forward, then guide it back into the grip.
  const magOut = reloading
    ? smooth((reloadProgress - .08) / .20) * (1 - smooth((reloadProgress - .59) / .23))
    : 0;
  magazine.position.set(magazineHome.x, magazineHome.y - .27*magOut, magazineHome.z + .09*magOut);
  magazine.rotation.x=-.20-.25*magOut;
  magazine.visible = true;
  // Subtle movement bob and weapon sway.
  const moving=move.lengthSq()>0;
  const reloadDip = reloading
    ? smooth(reloadProgress/.12) * (1 - smooth((reloadProgress-.72)/.24))
    : 0;
  // A small decaying recoil-like wobble settles the weapon just after seating.
  const settleWobble = settleProgress < 1
    ? Math.sin(settleProgress * Math.PI * 2) * (1 - settleProgress)
    : 0;
  weapon.position.y=(moving?Math.sin(performance.now()*.012)*.016:0) - recoil*.30 - reloadDip*.15 + settleWobble*.025;
  weapon.position.z = THREE.MathUtils.lerp(weapon.position.z, -recoil*1.55 + reloadDip*.11 + settleWobble*.018, dt*14);
  weapon.rotation.x=THREE.MathUtils.lerp(weapon.rotation.x,recoil*1.05 + reloadDip*.24 + settleWobble*.04,dt*14);
  weapon.rotation.z=THREE.MathUtils.lerp(weapon.rotation.z,(moving?-move.dot(right)*.018:0) - reloadDip*.15 - settleWobble*.025,dt*7);
}
let lastShot=0;
function animate() {
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.035);
  const now=performance.now()/1000;
  updatePlayer(dt);
  updateEnemies(dt,now);
  updateEffects(dt);
  redLight.intensity=20+Math.sin(now*2)*3;
  renderer.render(scene,camera);
}
animate();

addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
});
updateHUD();
