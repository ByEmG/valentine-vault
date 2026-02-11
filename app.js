// Step-by-step (one screen at a time), keeps same aesthetics.
// New features added ONLY: date=10/10/25, "wow soon 6months", 2 photos,
// bg music loop, stop bg music after teddy, then video reveal.

const EXPECTED = { q1:"mimineee", q2:"brown", q3:"101025" };
const ATTEMPTS_MAX = 5;
const TIMER_SECONDS = 180;
const LOCKOUT_MINUTES = 10;
const STORAGE_KEY = "valentineVaultLockoutUntil";

const HIM_NAME = "My Love";
const HER_NAME = "Baby";

const $ = (id) => document.getElementById(id);

// Steps
const stepQuiz = $("stepQuiz");
const stepLetter = $("stepLetter");
const stepAsk = $("stepAsk");
const stepPlan = $("stepPlan");
const stepVideo = $("stepVideo");

// Quiz
const quizForm = $("quizForm");
const statusEl = $("status");
const resetBtn = $("resetBtn");
const lockNote = $("lockNote");
const timerEl = $("timer");
const attemptsEl = $("attempts");
const c1 = $("c1"), c2 = $("c2"), c3 = $("c3");

// Terminal
const terminal = $("terminal");
const terminalBody = $("terminalBody");

// Audio
const bgAudio = $("bgAudio");
const unlockAudio = $("unlockAudio");

// Letter -> Ask
const nextToAsk = $("nextToAsk");

// Ask
const yesBtn = $("yesBtn");
const noBtn = $("noBtn");
const answerNote = $("answerNote");

// Photos
const tile1 = $("tile1");
const tile2 = $("tile2");

// Plan
const datePick = $("datePick");
const timePick = $("timePick");
const genBtn = $("genBtn");
const teddyScene = $("teddyScene");
const happyMsg = $("happyMsg");
const copyBox = $("copyBox");
const messageOut = $("messageOut");
const copyBtn = $("copyBtn");

// Video
const playVideoBtn = $("playVideoBtn");
const videoWrap = $("videoWrap");
const compVideo = $("compVideo");

// Confetti
const confettiCanvas = $("confetti");
const ctx = confettiCanvas.getContext("2d");
let W, H, pieces = [], confettiRunning = false;

// State
let attempts = ATTEMPTS_MAX;
let timeLeft = TIMER_SECONDS;
let tickHandle = null;
let lockedOut = false;
let girlfriendAnswer = "";

// Utils
function normalize(s){ return (s||"").trim().toLowerCase().replace(/\s+/g," "); }
function digitsOnly(s){ return (s||"").replace(/\D/g,""); }
function setStatus(type,msg){
  statusEl.className = "status " + (type||"");
  statusEl.textContent = msg||"";
}
function formatTime(s){
  const mm = String(Math.floor(s/60)).padStart(2,"0");
  const ss = String(s%60).padStart(2,"0");
  return `${mm}:${ss}`;
}
function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
function shake(el){
  el.animate([{transform:"translateX(0)"},{transform:"translateX(-6px)"},{transform:"translateX(6px)"},{transform:"translateX(0)"}],
             {duration:260,easing:"ease-out"});
}

// Lockout
function getLockoutUntil(){
  const v = localStorage.getItem(STORAGE_KEY);
  if(!v) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function setLockoutMinutes(mins){
  const until = Date.now() + mins*60*1000;
  localStorage.setItem(STORAGE_KEY, String(until));
}
function clearLockout(){ localStorage.removeItem(STORAGE_KEY); }

function disableForm(disabled){
  ["q1","q2","q3"].forEach(id => $(id).disabled = disabled);
  [c1,c2,c3].forEach(x => x.disabled = disabled);
  quizForm.querySelector('button[type="submit"]').disabled = disabled;
}
function applyLockState(){
  const until = getLockoutUntil();
  if(until > Date.now()){
    lockedOut = true;
    const minsLeft = Math.max(1, Math.ceil((until - Date.now())/60000));
    lockNote.textContent = `Locked for ${minsLeft} minute(s). Come back soon 💗`;
    disableForm(true);
  } else {
    lockedOut = false;
    lockNote.textContent = "";
    disableForm(false);
    clearLockout();
  }
}

// Timer
function startTimer(){
  timerEl.textContent = formatTime(timeLeft);
  tickHandle = setInterval(() => {
    if(lockedOut) return;
    timeLeft -= 1;
    timerEl.textContent = formatTime(Math.max(0,timeLeft));
    if(timeLeft <= 0){
      clearInterval(tickHandle);
      setStatus("bad","Time’s up 😭 Reset and try again.");
      disableForm(true);
      lockNote.textContent = "Press Reset to restart the timer.";
    }
  },1000);
}
function resetTimer(){
  clearInterval(tickHandle);
  timeLeft = TIMER_SECONDS;
  disableForm(false);
  lockNote.textContent = "";
  timerEl.textContent = formatTime(timeLeft);
  startTimer();
}

// Confetti
function resizeCanvas(){
  W = confettiCanvas.width = window.innerWidth;
  H = confettiCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function makeConfetti(n=150){
  pieces = Array.from({length:n}, () => ({
    x: Math.random()*W,
    y: -20 - Math.random()*H,
    r: 4 + Math.random()*6,
    vy: 2 + Math.random()*4,
    vx: -1.2 + Math.random()*2.4,
    rot: Math.random()*Math.PI,
    vr: -0.08 + Math.random()*0.16
  }));
}
function drawConfetti(){
  if(!confettiRunning) return;
  ctx.clearRect(0,0,W,H);
  for(const p of pieces){
    p.x += p.vx; p.y += p.vy; p.rot += p.vr;
    if(p.y > H+30) p.y = -20;
    if(p.x < -30) p.x = W+30;
    if(p.x > W+30) p.x = -30;

    ctx.save();
    ctx.translate(p.x,p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = 0.95;
    const hue = (p.x/W)*360;
    ctx.fillStyle = `hsl(${hue}, 90%, 65%)`;
    ctx.fillRect(-p.r/2, -p.r/2, p.r*1.2, p.r*0.8);
    ctx.restore();
  }
  requestAnimationFrame(drawConfetti);
}
function startConfetti(){
  confettiRunning = true;
  makeConfetti();
  drawConfetti();
  setTimeout(()=>{ confettiRunning=false; ctx.clearRect(0,0,W,H); }, 6500);
}

// Audio
async function startBgMusic(){
  if(!bgAudio) return;
  try{
    if(bgAudio.paused){
      bgAudio.volume = 0.75;
      await bgAudio.play();
    }
  }catch{}
}
async function stopBgMusic(){
  if(!bgAudio) return;
  try{
    const steps = 12;
    const startV = bgAudio.volume ?? 1;
    for(let i=steps;i>=0;i--){
      bgAudio.volume = startV*(i/steps);
      await sleep(60);
    }
    bgAudio.pause();
    bgAudio.currentTime = 0;
  }catch{}
}
async function playUnlockSound(){
  if(!unlockAudio) return;
  try{ unlockAudio.volume = 0.9; await unlockAudio.play(); }catch{}
}

// Terminal
async function terminalSequence(){
  terminal.classList.remove("hidden");
  terminalBody.textContent = "";
  const lines = [
    ">> connecting to SECURE_VAULT…",
    ">> verifying key fragments…",
    ">> checksum: OK",
    ">> decrypting payload: LOVE_FLOW.enc",
    ">> bypassing firewall: butterflies.exe",
    ">> elevating permissions: her_access=true",
    ">> restoring memories…",
    ">> AUTH SUCCESS ✅",
    ">> opening vault…"
  ];
  for(const l of lines){
    terminalBody.textContent += l + "\n";
    terminalBody.scrollTop = terminalBody.scrollHeight;
    await sleep(230 + Math.random()*170);
  }
  await sleep(600);
  terminal.classList.add("hidden");
}

// Validation
function validate(){
  const q1 = normalize($("q1").value);
  const q2 = normalize($("q2").value);
  const q3 = digitsOnly($("q3").value);
  const q4ok = c1.checked && c2.checked && c3.checked;

  if(!q1||!q2||!q3) return {ok:false,msg:"Answer all fields 🙂"};
  if(!q4ok) return {ok:false,msg:"Q4 needs ALL 3 ticked 😌"};

  if(q1!==EXPECTED.q1) return {ok:false,msg:"Q1 is wrong 😅"};
  if(q2!==EXPECTED.q2) return {ok:false,msg:"Q2 is wrong 😅"};
  if(q3!==EXPECTED.q3) return {ok:false,msg:"Q3 is wrong 😅 (use 10/10/25 style)"};

  return {ok:true};
}
function decrementAttempts(){
  attempts -= 1;
  attemptsEl.textContent = String(attempts);
  if(attempts <= 0){
    setStatus("bad", `Too many attempts. Locked for ${LOCKOUT_MINUTES} minutes.`);
    setLockoutMinutes(LOCKOUT_MINUTES);
    applyLockState();
  }
}

// Step navigation (only one visible)
function showStep(step){
  [stepQuiz, stepLetter, stepAsk, stepPlan, stepVideo].forEach(s => s.classList.add("hidden"));
  step.classList.remove("hidden");
  step.scrollIntoView({behavior:"smooth", block:"start"});
}

// Photo reveal
async function revealPhotos(){
  tile1.classList.remove("hidden");
  await sleep(360);
  tile2.classList.remove("hidden");
}

// Unlock flow
async function unlock(){
  setStatus("ok","Key accepted. Decrypting…");
  clearInterval(tickHandle);

  await startBgMusic(); // starts after user click
  await Promise.all([terminalSequence(), playUnlockSound()]);

  startConfetti();
  showStep(stepLetter);
}

// Ask step
function goAsk(){
  showStep(stepAsk);
  revealPhotos();
}

// Calendar step
function goPlan(note){
  answerNote.textContent = note;
  showStep(stepPlan);
}

// Teddy + then stop music + show video
function generateMessage(){
  const d = datePick.value;
  const t = timePick.value;
  if(!d){ alert("Pick a date first 🙂"); return; }

  const readableDate = (() => {
    try{
      const dt = new Date(d + "T00:00:00");
      return dt.toLocaleDateString(undefined, { weekday:"long", year:"numeric", month:"long", day:"numeric" });
    }catch{ return d; }
  })();

  const timePart = t ? ` at ${t}` : "";

  messageOut.value =
`Hey ${HIM_NAME} 💗

I unlocked your vault 😌

Answer: ${girlfriendAnswer}

I’m free on ${readableDate}${timePart}.
Let’s make it a real moment.

— ${HER_NAME}`;

  copyBox.classList.remove("hidden");

  teddyScene.classList.remove("hidden");
  teddyScene.classList.remove("play");
  void teddyScene.offsetWidth;
  teddyScene.classList.add("play");

  happyMsg.classList.add("hidden");
  setTimeout(async () => {
    happyMsg.classList.remove("hidden");
    await stopBgMusic();        // music ends here (your rule)
    showStep(stepVideo);        // then show video section
  }, 2400);
}

// Video
async function playVideo(){
  try{
    if(bgAudio){ bgAudio.pause(); bgAudio.volume = 0; }
  }catch{}
  videoWrap.classList.remove("hidden");
  compVideo.currentTime = 0;
  try{ await compVideo.play(); }catch{}
}

// Init
function init(){
  attemptsEl.textContent = String(attempts);
  applyLockState();
  startTimer();

  showStep(stepQuiz);

  quizForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if(lockedOut) return;
    if(timeLeft <= 0){ setStatus("bad","Reset to try again."); return; }

    const res = validate();
    if(res.ok){
      await unlock();
    }else{
      setStatus("bad", res.msg);
      shake(stepQuiz);
      decrementAttempts();
    }
  });

  resetBtn.addEventListener("click", () => {
    quizForm.reset();
    setStatus("", "");
    attempts = ATTEMPTS_MAX;
    attemptsEl.textContent = String(attempts);
    clearLockout();
    applyLockState();
    resetTimer();
  });

  nextToAsk.addEventListener("click", goAsk);

  yesBtn.addEventListener("click", () => {
    girlfriendAnswer = "YES";
    goPlan("She said YES 💘 Now choose a date/time.");
  });

  noBtn.addEventListener("click", () => {
    girlfriendAnswer = "NO";
    goPlan("She said NO 🙈 Now choose a date/time to talk properly.");
  });

  genBtn.addEventListener("click", generateMessage);

  copyBtn.addEventListener("click", async () => {
    try{
      await navigator.clipboard.writeText(messageOut.value);
      copyBtn.textContent = "Copied ✅";
      setTimeout(() => (copyBtn.textContent = "Copy"), 1200);
    }catch{
      alert("Copy failed. You can manually select and copy the text.");
    }
  });

  playVideoBtn.addEventListener("click", playVideo);

  compVideo.addEventListener("play", () => {
    try{ if(bgAudio){ bgAudio.pause(); bgAudio.volume = 0; } }catch{}
  });
}

init();
