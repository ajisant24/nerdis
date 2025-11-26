// main.js
// Pyodide + Tone.js bridge. Users write Python; Python calls exposed JS functions.
// NOTE: keep this file unchanged for classroom usage.

let pyodide = null;
let pyReady = false;
let userStarted = false;

// === Tone.js setup ===
const master = new Tone.Gain(0.9).toDestination();
const reverb = new Tone.Reverb(2).toDestination();
const masterDelay = new Tone.FeedbackDelay("8n", 0.2).toDestination();
const synth = new Tone.PolySynth(Tone.Synth).connect(reverb);
synth.connect(master);

Tone.start(); // attempt (will actually require user gesture on mobile)

function ensureUserGesture() {
  if (!userStarted) {
    userStarted = true;
    Tone.start();
  }
}

// Simple sample map (will load on demand)
const SAMPLES = {
  doa: "sounds/doa.wav",
  angin: "sounds/angin.wav",
  langkah: "sounds/langkah.wav",
  gong: "sounds/gong.wav"
};
const loadedPlayers = {};

async function loadSample(name) {
  if (!SAMPLES[name]) return;
  if (loadedPlayers[name]) return;
  const p = new Tone.Player(SAMPLES[name]).toDestination();
  loadedPlayers[name] = p;
  await p.load();
}

// Exposed functions used from Python via pyodide's js module
function js_playNote(note, dur) {
  synth.triggerAttackRelease(note, dur);
}
function js_setBpm(n) {
  Tone.Transport.bpm.value = n;
}
function js_startTransport() {
  Tone.Transport.start();
}
function js_stopTransport() {
  Tone.Transport.stop();
  synth.releaseAll();
}
function js_setReverb(s) {
  reverb.decay = s;
}
function js_pan(v) {
  // create a panner on the fly for one-shot
  const p = new Tone.Panner(v).connect(master);
  const s = new Tone.Synth().connect(p);
  s.triggerAttackRelease("C4", "8n");
}
async function js_playSample(name) {
  await loadSample(name);
  if (loadedPlayers[name]) loadedPlayers[name].start();
}
function js_log(msg) { console.log("[py]", msg); }

// attach functions to window for pyodide access
window.playNote = js_playNote;
window.setBpm = js_setBpm;
window.startTransport = js_startTransport;
window.stopTransport = js_stopTransport;
window.setReverb = js_setReverb;
window.pan = js_pan;
window.playSample = js_playSample;
window._py_log = js_log;

// === Pyodide init ===
async function initPyodideAndBridge() {
  if (pyReady) return;
  pyodide = await loadPyodide();
  // expose our JS functions to Python easily via a tiny helper module
  pyodide.runPython(`
from js import playNote, setBpm, startTransport, stopTransport, setReverb, pan, playSample, _py_log

def play(note, dur=0.5):
    playNote(note, dur)

def set_bpm(n):
    setBpm(n)

def start():
    startTransport()

def stop():
    stopTransport()

def set_reverb(s):
    setReverb(s)

def play_sample(name):
    playSample(name)

def log(msg):
    _py_log(msg)
`);
  pyReady = true;
  document.getElementById("runBtn").disabled = false;
  document.getElementById("stopBtn").disabled = false;
}

// init
initPyodideAndBridge();

// === UI wiring ===
const initBtn = document.getElementById("initBtn");
initBtn.addEventListener("click", async () => {
  ensureUserGesture();
  // warm-up: load Tone audio context and pyodide if not ready
  if (!pyReady) {
    initBtn.textContent = "Memuat engine...";
    await initPyodideAndBridge();
    initBtn.textContent = "Audio Siap ✓";
    setTimeout(()=> initBtn.style.display = "none", 900);
  } else {
    initBtn.style.display = "none";
  }
});

document.getElementById("runBtn").addEventListener("click", async () => {
  ensureUserGesture();
  if (!pyReady) return alert("Pyodide belum siap");
  const code = document.getElementById("pythonCode").value;
  try {
    pyodide.runPython(code);
  } catch (e) {
    console.error(e);
    alert("Error di kode Python: " + e);
  }
});

document.getElementById("stopBtn").addEventListener("click", () => {
  js_stopTransport();
});

// Preset loader (simple fetch of .py text)
document.getElementById("loadPresetBtn").addEventListener("click", async () => {
  const sel = document.getElementById("presetSelect").value;
  if (!sel) return alert("Pilih preset terlebih dahulu");
  const res = await fetch(sel);
  const txt = await res.text();
  document.getElementById("pythonCode").value = txt;
});

// quick buttons
document.getElementById("btnAmbience").addEventListener("click", async ()=>{
  const r = await fetch("preset/ambient.py"); document.getElementById("pythonCode").value = await r.text();
});
document.getElementById("btnGamelan").addEventListener("click", async ()=>{
  const r = await fetch("preset/gamelan.py"); document.getElementById("pythonCode").value = await r.text();
});
document.getElementById("btnHoror").addEventListener("click", async ()=>{
  const r = await fetch("preset/horor.py"); document.getElementById("pythonCode").value = await r.text();
});

// visitor samples buttons
document.querySelectorAll(".visitor-sound").forEach(btn=>{
  btn.addEventListener("click", async (e)=>{
    ensureUserGesture();
    const name = e.target.dataset.sound;
    // if visitorControls disabled, ignore
    if (!document.getElementById("visitorControls").checked) return;
    await js_playSample(name);
  });
});

// sliders
document.getElementById("bpm").addEventListener("input", (e)=>{
  js_setBpm(parseInt(e.target.value));
});
document.getElementById("reverb").addEventListener("input", (e)=>{
  js_setReverb(parseFloat(e.target.value));
});

// auto play on expo mode open (if chosen)
window.addEventListener("load", ()=>{
  const autoPlay = document.getElementById("autoPlayExpo");
  const modeRadios = document.getElementsByName("mode");
  modeRadios.forEach(r=>{
    r.addEventListener("change", ()=>{
      if (r.value === "expo") {
        document.getElementById("visitorControls").checked = true;
      } else {
        document.getElementById("visitorControls").checked = false;
      }
    });
  });

  // if expo mode + auto play checked, run preset ambient
  autoPlay.addEventListener("change", async ()=>{
    if (autoPlay.checked) {
      ensureUserGesture();
      const r = await fetch("preset/ambient.py");
      const txt = await r.text();
      document.getElementById("pythonCode").value = txt;
      try{ pyodide.runPython(txt); }catch(e){console.warn(e)}
    }
  });
});
