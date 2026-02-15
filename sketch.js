let synth;
let audioOn = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(200);

  // Crear oscilador (p5.sound)
  synth = new p5.Oscillator("sine");
  synth.start();
  synth.amp(0); // empieza en silencio (hasta que haya click)
}

function draw() {
  background(200);
  ellipse(mouseX, mouseY, 50);

  // Solo controlamos sonido si el usuario ya activó audio
  if (audioOn) {
    const freq = map(mouseX, 0, width, 100, 800, true);
    const volume = map(mouseY, height, 0, 0, 0.5, true);

    synth.freq(freq, 0.05);
    synth.amp(volume, 0.05);
  }

  noStroke();
  fill(0, 120);
  textSize(14);
  text("Click para activar sonido · R para limpiar", 16, height - 16);
}

function mousePressed() {
  // Desbloquea audio en navegador
  userStartAudio();
  audioOn = true;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function keyPressed() {
  if (key === "r") background(200);
}
