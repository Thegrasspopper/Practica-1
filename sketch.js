let balls = [];
let osc;
let audioOn = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();

  // Crear varias "burbujas"
  for (let i = 0; i < 5; i++) {
    balls.push({
      x: random(width),
      y: random(height),
      r: random(80, 140),
      vx: random(-1, 1),
      vy: random(-1, 1)
    });
  }

  osc = new p5.Oscillator("sine");
  osc.start();
  osc.amp(0);
}

function draw() {
  background(20);

  loadPixels();

  for (let x = 0; x < width; x += 2) {
    for (let y = 0; y < height; y += 2) {

      let sum = 0;

      for (let b of balls) {
        let d = dist(x, y, b.x, b.y);
        sum += b.r * 200 / d;
      }

      if (sum > 300) {
        fill(80, 120, 255);
        rect(x, y, 4, 4);
      }
    }
  }

  updateBalls();

  if (audioOn) {
    let freq = map(mouseX, 0, width, 100, 900);
    let amp = map(mouseY, height, 0, 0, 0.4);
    osc.freq(freq, 0.05);
    osc.amp(amp, 0.05);
  }
}

function updateBalls() {
  for (let b of balls) {
    b.x += b.vx;
    b.y += b.vy;

    if (b.x < 0 || b.x > width) b.vx *= -1;
    if (b.y < 0 || b.y > height) b.vy *= -1;
  }

  // Una burbuja sigue al mouse
  balls[0].x = mouseX;
  balls[0].y = mouseY;
}

function mousePressed() {
  userStartAudio();
  audioOn = true;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
