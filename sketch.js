let balls = [];
let pg; // buffer para render
let osc;
let blipOsc;
let blipEnv;
let audioOn = false;
let gameWon = false;
let baseHunterR = 40;
let eatPulse = 0;

// 1 = color sólido real, sin interpolación visual al escalar
const SCALE = 1;
const INITIAL_BALL_COUNT = 7;

// Flat 2D palette
const BG = 255;          // #FFFFFF
const SHAPE_COLOR = 33;  // #212121
const FUSION_TOUCH_FACTOR = 1.35; // ajusta colision para que coincida con contacto visual metaball

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  noSmooth();

  pg = createGraphics(Math.floor(width / SCALE), Math.floor(height / SCALE));
  pg.pixelDensity(1);
  pg.noSmooth();

  initGame();

  // audio (si ya lo estabas usando)
  osc = new p5.Oscillator("square");
  osc.start();
  osc.amp(0);

  // sonido corto de "fusion" al comer una bola
  blipOsc = new p5.Oscillator("triangle");
  blipOsc.start();
  blipOsc.amp(0);
  blipEnv = new p5.Envelope();
  blipEnv.setADSR(0.005, 0.07, 0.0, 0.05);
  blipEnv.setRange(0.7, 0);
}

function draw() {
  // 1) Movimiento de bolas
  updateBalls(pg);
  if (!gameWon) {
    eatTouchedBalls();
    gameWon = balls.length <= 1;
  }

  // 2) Render ferrofluido en el buffer
  renderFerro(pg);

  // 3) Dibujar al canvas grande
  background(BG);
  image(pg, 0, 0, width, height);

  // 4) Audio mapping (opcional)
  if (audioOn) {
    const hunter = balls[0];
    const growth = constrain(hunter.r / baseHunterR, 1, 10);
    const freq = map(growth, 1, 10, 900, 60, true);
    const baseAmp = map(growth, 1, 10, 0.04, 0.6, true);
    const amp = constrain(baseAmp + eatPulse, 0, 0.65);
    osc.freq(freq, 0.01);
    osc.amp(amp, 0.01);
    eatPulse *= 0.82;
  }

  if (gameWon) {
    noStroke();
    fill(SHAPE_COLOR);
    textAlign(CENTER, CENTER);
    textSize(22);
    text("You ate all balls - click to restart", width / 2, 36);
  }
}

function renderFerro(g) {
  g.loadPixels();

  const w = g.width;
  const h = g.height;

  // umbral de "superficie" (más alto = más gordo)
  const threshold = 1.25;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {

      // Campo metaballs
      let f = 0;
      for (const b of balls) {
        const dx = x - b.x;
        const dy = y - b.y;
        const d2 = dx * dx + dy * dy + 0.0001;
        f += (b.r * b.r) / d2;
      }

      // Bordes duros: solo dentro/fuera, sin degradados ni volumen.
      if (f < threshold) {
        setGray(g, x, y, BG, 255);
        continue;
      }
      setGray(g, x, y, SHAPE_COLOR, 255);
    }
  }

  g.updatePixels();
}

function updateBalls(g) {
  // una bola sigue el mouse (convertido a coords del buffer)
  const mx = constrain(mouseX, 0, width);
  const my = constrain(mouseY, 0, height);
  balls[0].x = (mx / width) * g.width;
  balls[0].y = (my / height) * g.height;

  for (let i = 1; i < balls.length; i++) {
    const b = balls[i];
    b.x += b.vx;
    b.y += b.vy;

    if (b.x < 0 || b.x > g.width) b.vx *= -1;
    if (b.y < 0 || b.y > g.height) b.vy *= -1;
  }
}

function eatTouchedBalls() {
  const hunter = balls[0];

  for (let i = 1; i < balls.length; i++) {
    const prey = balls[i];
    const dx = hunter.x - prey.x;
    const dy = hunter.y - prey.y;
    const d2 = dx * dx + dy * dy;
    const rSum = (hunter.r + prey.r) * FUSION_TOUCH_FACTOR;

    if (d2 <= rSum * rSum) {
      // Fusion directa: suma el tamano de la bola tocada.
      hunter.r += prey.r;
      eatPulse = 0.2;
      if (audioOn) {
        blipOsc.freq(map(prey.r, 30, 55, 1200, 400, true));
        blipEnv.play(blipOsc);
      }

      // La bola tocada se elimina (comida).
      balls.splice(i, 1);
      i--;
    }
  }
}

function mousePressed() {
  userStartAudio();
  audioOn = true;

  if (gameWon) {
    initGame();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  noSmooth();

  pg = createGraphics(Math.floor(width / SCALE), Math.floor(height / SCALE));
  pg.pixelDensity(1);
  pg.noSmooth();

  // reubica bolas al nuevo tamano de pantalla
  for (const b of balls) {
    b.x = random(pg.width);
    b.y = random(pg.height);
  }
}

/* helpers */
function setGray(g, x, y, c, a) {
  const i = 4 * (x + y * g.width);
  g.pixels[i] = c;
  g.pixels[i + 1] = c;
  g.pixels[i + 2] = c;
  g.pixels[i + 3] = a;
}

function createBall(g, isHunter = false) {
  const r = isHunter ? random(35, 50) : random(30, 55);
  return {
    x: random(g.width),
    y: random(g.height),
    r,
    vx: random(-0.6, 0.6),
    vy: random(-0.6, 0.6),
  };
}

function initGame() {
  balls = [];
  for (let i = 0; i < INITIAL_BALL_COUNT; i++) {
    balls.push(createBall(pg, i === 0));
  }
  baseHunterR = balls[0].r;
  gameWon = false;
}
