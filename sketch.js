let balls = [];
let pg; // buffer para render
let osc;
let audioOn = false;

// 1 = color sólido real, sin interpolación visual al escalar
const SCALE = 1;

// Flat 2D palette
const BG = 255;          // #FFFFFF
const SHAPE_COLOR = 33;  // #212121

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  noSmooth();

  pg = createGraphics(Math.floor(width / SCALE), Math.floor(height / SCALE));
  pg.pixelDensity(1);
  pg.noSmooth();

  // bolas (metaballs)
  for (let i = 0; i < 7; i++) {
    balls.push({
      x: random(pg.width),
      y: random(pg.height),
      r: random(30, 55),
      vx: random(-0.6, 0.6),
      vy: random(-0.6, 0.6),
    });
  }

  // audio (si ya lo estabas usando)
  osc = new p5.Oscillator("sine");
  osc.start();
  osc.amp(0);
}

function draw() {
  // 1) Movimiento de bolas
  updateBalls(pg);
  eatTouchedBalls(pg);

  // 2) Render ferrofluido en el buffer
  renderFerro(pg);

  // 3) Dibujar al canvas grande
  background(BG);
  image(pg, 0, 0, width, height);

  // 4) Audio mapping (opcional)
  if (audioOn) {
    const freq = map(mouseX, 0, width, 120, 900, true);
    const amp = map(mouseY, height, 0, 0, 0.35, true);
    osc.freq(freq, 0.05);
    osc.amp(amp, 0.05);
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
  balls[0].x = (mouseX / width) * g.width;
  balls[0].y = (mouseY / height) * g.height;

  for (let i = 1; i < balls.length; i++) {
    const b = balls[i];
    b.x += b.vx;
    b.y += b.vy;

    if (b.x < 0 || b.x > g.width) b.vx *= -1;
    if (b.y < 0 || b.y > g.height) b.vy *= -1;
  }
}

function eatTouchedBalls(g) {
  const hunter = balls[0];

  for (let i = 1; i < balls.length; i++) {
    const prey = balls[i];
    const dx = hunter.x - prey.x;
    const dy = hunter.y - prey.y;
    const d2 = dx * dx + dy * dy;
    const rSum = hunter.r + prey.r;

    if (d2 <= rSum * rSum) {
      // Conserva "masa" aproximada por area al absorber.
      const hunterArea = hunter.r * hunter.r;
      const preyArea = prey.r * prey.r;
      hunter.r = Math.sqrt(hunterArea + preyArea);
      hunter.r = Math.min(hunter.r, 140);

      // Reaparece la bola comida en otra posicion.
      prey.x = random(g.width);
      prey.y = random(g.height);
      prey.r = random(20, 45);
      prey.vx = random(-0.6, 0.6);
      prey.vy = random(-0.6, 0.6);
    }
  }
}

function mousePressed() {
  userStartAudio();
  audioOn = true;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  noSmooth();

  pg = createGraphics(Math.floor(width / SCALE), Math.floor(height / SCALE));
  pg.pixelDensity(1);
  pg.noSmooth();

  // re-escala posiciones para que no se vayan a la nada
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
