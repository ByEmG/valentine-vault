// ==============================
// 1) EDIT THESE 5 "correct" answers
// ==============================
const ANSWERS = [
  "my love",      // q1: nickname you call her
  "leeds",        // q2: city you met/connected
  "pizza",        // q3: comfort food
  "i miss you",   // q4: what you say when you miss her
  "banana"        // q5: inside word/joke
];

// Optional: personalize the final message:
const YOUR_NAME = "Pierre-Emmanuel";
const HER_NAME = "My Love";

// ==============================
// Utilities
// ==============================
const $ = (id) => document.getElementById(id);

function normalize(str){
  return (str || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " "); // collapse spaces
}

async function sha256(text){
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,"0")).join("");
}

async function hashAnswers(arr){
  // Combine all in order (prevents partial guessing)
  const combined = arr.map(normalize).join("||");
  return sha256(combined);
}

// ==============================
// Confetti (tiny, no libs)
// ==============================
const confettiCanvas = $("confetti");
const ctx = confettiCanvas.getContext("2d");
let W, H, pieces = [], running = false;

function resizeCanvas(){
  W = confettiCanvas.width = window.innerWidth;
  H = confettiCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function makeConfetti(n=140){
  pieces = Array.from({length:n}, () => ({
    x: Math.random() * W,
    y: -20 - Math.random() * H,
    r: 4 + Math.random() * 6,
    vy: 2 + Math.random() * 4,
    vx: -1.2 + Math.random() * 2.4,
    rot: Math.random() * Math.PI,
    vr: -0.08 + Math.random() * 0.16
  }));
}

function drawConfetti(){
  if(!running) return;
  ctx.clearRect(0,0,W,H);
  for(const p of pieces){
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;

    // Wrap
    if(p.y > H + 30) p.y = -20;
    if(p.x < -30) p.x = W + 30;
    if(p.x > W + 30) p.x = -30;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = 0.95;

    // No fixed palette: use HSL for variety
    const hue = (p.x / W) * 360;
    ctx.fillStyle = `hsl(${hue}, 90%, 65%)`;
    ctx.fillRect(-p.r/2, -p.r/2, p.r*1.2, p.r*0.8);
    ctx.restore();
  }
  requestAnimationFrame(drawConfetti);
}

function startConfetti(){
  running = true;
  makeConfetti();
  drawConfetti();
  setTimeout(() => { running = false; ctx.clearRect(0,0,W,H); }, 6500);
}

// ==============================
// App logic
// ==============================
const quizForm = $("quizForm");
const statusEl = $("status");
const resetBtn = $("resetBtn");
const lockedView = $("lockedView");
const unlockedView = $("unlockedView");

const yesBtn = $("yesBtn");
const maybeBtn = $("maybeBtn");
const planner = $("planner");
const sendBtn = $("sendBtn");
const customSlot = $("customSlot");
const copyBox = $("copyBox");
const messageOut = $("messageOut");
const copyBtn = $("copyBtn");

let chosenSlot = "";

function setStatus(type, msg){
  statusEl.className = "status " + (type || "");
  statusEl.textContent = msg || "";
}

async function init(){
  // Pre-hash the correct combo once
  const correctHash = await hashAnswers(ANSWERS);

  quizForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("", "");

    const inputs = ["q1","q2","q3","q4","q5"].map(id => $(id).value);
    if(inputs.some(v => normalize(v).length === 0)){
      setStatus("bad", "Please answer all 5 questions 🙂");
      return;
    }

    const userHash = await hashAnswers(inputs);

    if(userHash === correctHash){
      setStatus("ok", "Key accepted. Unlocking…");
      setTimeout(() => {
        lockedView.classList.add("hidden");
        unlockedView.classList.remove("hidden");
        startConfetti();
      }, 450);
    }else{
      setStatus("bad", "Wrong key fragment 😅 Try again — you’re close.");
      // subtle shake
      lockedView.animate(
        [{transform:"translateX(0)"},{transform:"translateX(-6px)"},{transform:"translateX(6px)"},{transform:"translateX(0)"}],
        {duration: 260, easing:"ease-out"}
      );
    }
  });

  resetBtn.addEventListener("click", () => {
    quizForm.reset();
    setStatus("", "");
  });

  yesBtn.addEventListener("click", () => {
    planner.classList.remove("hidden");
    planner.scrollIntoView({behavior:"smooth", block:"start"});
    setMessageTemplate("YES ❤️ (tell me when you’re free)");
  });

  maybeBtn.addEventListener("click", () => {
    planner.classList.remove("hidden");
    planner.scrollIntoView({behavior:"smooth", block:"start"});
    setMessageTemplate("Let’s plan a moment 📅");
  });

  document.querySelectorAll(".slot").forEach(btn => {
    btn.addEventListener("click", () => {
      chosenSlot = btn.dataset.slot || "";
      customSlot.value = chosenSlot;
      customSlot.focus();
    });
  });

  sendBtn.addEventListener("click", () => {
    const when = normalize(customSlot.value);
    if(!when){
      alert("Type a day/time or pick a slot first 🙂");
      return;
    }

    const pretty = customSlot.value.trim();
    const msg =
`Hey ${YOUR_NAME} 💗
I unlocked the vault 😌

Yes — I’ll be your Valentine.
I’m free: ${pretty}

Tell me where we’re going 👀✨
— ${HER_NAME}`;

    messageOut.value = msg;
    copyBox.classList.remove("hidden");
    copyBox.scrollIntoView({behavior:"smooth", block:"start"});
  });

  copyBtn.addEventListener("click", async () => {
    try{
      await navigator.clipboard.writeText(messageOut.value);
      copyBtn.textContent = "Copied ✅";
      setTimeout(() => (copyBtn.textContent = "Copy"), 1200);
    }catch{
      alert("Copy failed. You can manually select and copy the text.");
    }
  });
}

function setMessageTemplate(title){
  const base =
`${title}

(Choose a time below and send it back to me.)`;
  // no UI element needed; just a gentle nudge
}

init();
