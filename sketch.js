let balls = [];
let pg; // buffer para render suave
let osc;
let audioOn = false;

// Ajusta calidad/performance (2 = más calidad, 3 = más rápido)
const SCALE = 2;

// Ferro: look
const BG = 241;          // #F1F1F1
const BASE_DARK = 33;    // #212121
const EDGE_SOFT = 0.18;  // suavidad del borde

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);

  pg = createGraphics(Math.floor(width / SCALE), Math.floor(height / SCALE));
  pg.pixelDensity(1);

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
  // 1) Render ferrofluido en el buffer
  renderFerro(pg);

  // 2) Dibujar al canvas grande (suave)
  background(BG);
  image(pg, 0, 0, width, height);

  // 3) Movimiento de bolas
  updateBalls(pg);

  // 4) Audio mapping (opcional)
  if (audioOn) {
    const freq = map(mouseX, 0, width, 120, 900, true);
    const amp = map(mouseY, height, 0, 0, 0.35, true);
    osc.freq(freq, 0.05);
    osc.amp(amp, 0.05);
  }

  // texto sutil
  noStroke();
  fill(0, 80);
  textSize(13);
  text("Click para activar sonido", 16, height - 16);
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

      // Suavizado de borde tipo "smoothstep"
      // a = 0 fuera, 1 dentro
      const a = smoothstep(threshold - EDGE_SOFT, threshold + EDGE_SOFT, f);

      // Si no hay masa, fondo directo
      if (a <= 0.001) {
        setGray(g, x, y, BG, 255);
        continue;
      }

      // Look 2D plano: sin luces ni volumen
      let col = BASE_DARK;

      // mezcla con fondo por alpha (bordes suaves)
      col = lerp(BG, col, a);

      setGray(g, x, y, col, 255);
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

function mousePressed() {
  userStartAudio();
  audioOn = true;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  pg = createGraphics(Math.floor(width / SCALE), Math.floor(height / SCALE));
  pg.pixelDensity(1);

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

function smoothstep(e0, e1, x) {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
