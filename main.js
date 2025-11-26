let pyodide;
const reverb = new Tone.Reverb(3).toDestination();
const synthLead=new Tone.PolySynth(Tone.Synth).connect(reverb);
const synthBass=new Tone.PolySynth(Tone.MonoSynth).connect(reverb);
const synthPad=new Tone.PolySynth(Tone.AMSynth).connect(reverb);
const synthPluck=new Tone.PolySynth(Tone.PluckSynth).connect(reverb);
const synthMetal=new Tone.PolySynth(Tone.FMSynth).connect(reverb);
let currentSynth=synthLead;

function js_setInstrument(n){
if(n==="lead")currentSynth=synthLead;
if(n==="bass")currentSynth=synthBass;
if(n==="pad")currentSynth=synthPad;
if(n==="pluck")currentSynth=synthPluck;
if(n==="metal")currentSynth=synthMetal;
}
function js_playNote(n,d){currentSynth.triggerAttackRelease(n,d);}
function js_setReverb(v){reverb.decay=v;}

const players={
kick:new Tone.Player("sounds/kick.wav").toDestination(),
snare:new Tone.Player("sounds/snare.wav").toDestination(),
hihat:new Tone.Player("sounds/hihat.wav").toDestination()
}
function js_drum(n){players[n].start();}

async function initPy(){
pyodide=await loadPyodide();
pyodide.runPython(`from js import js_playNote as playNote, js_setInstrument as setInstrument, js_setReverb as setReverb, js_drum as drum
def play(n,d=0.5): playNote(n,d)
def instrument(n): setInstrument(n)
def reverb(v): setReverb(v)
def kick(): drum("kick")
def snare(): drum("snare")
def hihat(): drum("hihat")`);
}

initPy();
document.getElementById("runBtn").onclick = async () => {
  await Tone.start();              // ✅ AKTIFKAN AUDIO CONTEXT
  Tone.Transport.start();          // ✅ AKTIFKAN ENGINE AUDIO
  pyodide.runPython(
    document.getElementById("pythonCode").value
  );
};

document.getElementById("stopBtn").onclick=()=>Tone.Transport.stop();

async function loadPreset(n){
const r=await fetch(`preset/${n}.py`);
document.getElementById("pythonCode").value=await r.text();
}

document.addEventListener("keydown",(e)=>{
if(e.ctrlKey&&e.key==="Enter")document.getElementById("runBtn").click();
if(e.ctrlKey&&e.key===".")document.getElementById("stopBtn").click();
});
