// Essay Memoriser logic (client-only)

// ---------- Elements ----------
const essayInput = document.getElementById('essayInput');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');

const chunkTypeSel = document.getElementById('chunkType');
const difficultySel = document.getElementById('difficulty');
const caseSensitiveSel = document.getElementById('caseSensitive');

const promptEl = document.getElementById('prompt');
const recallInput = document.getElementById('recallInput');
const feedbackEl = document.getElementById('feedback');
const progressText = document.getElementById('progressText');
const stageLabel = document.getElementById('stageLabel');

const copyChunkBtn = document.getElementById('copyChunkBtn');
const showBtn = document.getElementById('showBtn');
const checkBtn = document.getElementById('checkBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

// New UI elements for improved UX
const progressBar = document.getElementById('progressBar');
const pillRead = document.getElementById('pillRead');
const pillCloze = document.getElementById('pillCloze');
const pillRecall = document.getElementById('pillRecall');

// Settings and utilities
const themeSwitch = document.getElementById('themeSwitch');
const clozeEnabledSel = document.getElementById('clozeEnabled');
const cumulativeStepSel = document.getElementById('cumulativeStep');
const autoAdvanceSel = document.getElementById('autoAdvance');
const passThresholdRange = document.getElementById('passThreshold');
const passValue = document.getElementById('passValue');
const fontSizeRange = document.getElementById('fontSize');
const lineHeightRange = document.getElementById('lineHeight');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');
const exportBtn = document.getElementById('exportBtn');
const ttsBtn = document.getElementById('ttsBtn');
const fsBtn = document.getElementById('fsBtn');
const mPrev = document.getElementById('mPrev');
const mShow = document.getElementById('mShow');
const mCheck = document.getElementById('mCheck');
const mNext = document.getElementById('mNext');

// ---------- Defaults (preload essay) ----------
const defaultEssay = `Eli hadn’t planned to stop.

He told his mother he’d only drive through, that there was nothing left to see. But when the road bent toward the hills, his hands turned the wheel without asking. The valley drew him down the way water finds its old path.

The track was narrower than he remembered. Grass brushed his jeans, seedheads shivering in the heat. Dust rose around his shoes, tasting of rust. At the base of the hill, the hollow opened — wide, pale, and silent.

The creek that once split the paddock had vanished, leaving a scar of cracked soil. It had been three summers since the flood, three summers since Tom. People in town still called it an accident, the kind you couldn’t prevent. But Eli knew how easily a dare could sound like courage, how quickly laughter could drown.

He stopped by the old gum. The rope swing hung there, bleached and stiff, twisting slowly in the breeze. When he touched it, the fibres broke apart, drifting upward like dust. For a moment they caught the light and glimmered before disappearing.

He walked further along the hollow. Each step released the faint scent of sap and clay. The air was heavy, almost metallic, as though something below the surface waited to breathe again. The place seemed both smaller and endless — shrunken by drought, expanded by memory.

He crouched near the centre of the bed. The soil was warm on top, cool beneath, a pulse of hidden moisture under his fingertips. (palimpsest) It felt as if another time lay just under this one, the water still moving somewhere deeper, unseen.

A sound flickered — maybe wind through the trees, maybe something else. He imagined it forming his name, but when he looked up there was only the swing, turning in slow circles. He wasn’t sure whether the voice came from the air or from the part of himself that still waited here.

The sky had begun to change. Light thinned to amber, the colour of old photographs. Beyond the ridge, clouds gathered, a storm forming or fading — he couldn’t tell. The land sat between stillness and motion, between what it had been and what it might be again.

He stayed like that for a while, tracing small cracks with his thumb, following where they led until they vanished into the dark. The earth gave slightly under his weight, soft as skin.

A drop of water struck the ground beside him. Another followed. The dust hissed and darkened. Soon the smell of rain — iron and eucalyptus — folded through the air. He should have turned back; the road would be slick, the car miles away. But he didn’t move. The rain wasn’t heavy, just steady enough to make the surface tremble.

He watched it pool in the hollowed shapes the flood had carved years before. The lines of the creek returned, faint but sure, water remembering its way home. 

The rope creaked against the gum trunk, a sound that might once have been laughter. Eli closed his eyes. The noise of the world dimmed to the patter of rain and the slow breath of the land.

When he opened them again, the light had changed. It was neither day nor night — that thin hour when both coexist and neither wins. Between the two lights, everything was uncertain. He felt that uncertainty settle in him, not as confusion but as space — the kind that allows something new to form.

The rain eased. Steam rose from the ground, soft as smoke. The hollow shimmered, edges blurring, the whole valley breathing out. He stood, brushing wet soil from his palms, and for a moment thought he saw movement in the water — not Tom, not anyone, just the idea of a figure turning away.

He stayed until the smell of rain became clean and the air lightened. Then he began to climb the hill. Behind him, water continued to collect, thin silver threads joining, widening, remembering.

At the top, he paused. The valley below was a faint mirror, holding both the shadow and the reflection of the sky. He couldn’t tell which was which, and maybe that was the point.

He walked on. The sound of the creek followed him only for a little while before fading into something quieter — a rhythm that might have been his own breath.
`;

if (essayInput && !essayInput.value.trim()) {
  essayInput.value = defaultEssay;
}

// ---------- State ----------
let chunks = [];
let idx = 0; // current chunk index
let stage = 'read'; // 'read' | 'cloze' | 'recall' | 'recall_all'
let showOriginal = false;

// ---------- Utilities ----------
function flash(msg) {
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.position = 'fixed';
  el.style.bottom = '18px';
  el.style.right = '18px';
  el.style.background = 'rgba(15, 23, 42, .9)';
  el.style.border = '1px solid #223059';
  el.style.padding = '8px 12px';
  el.style.borderRadius = '10px';
  el.style.zIndex = '9999';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1400);
}

function normalise(str, caseSensitive) {
  const s = caseSensitive ? str : str.toLowerCase();
  return s.replace(/\s+/g, ' ').trim();
}

function splitIntoParagraphs(text) {
  return text
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean);
}

function splitIntoSentences(text) {
  // Simple sentence splitter that keeps punctuation
  const parts = text
    .replace(/\s+/g, ' ')
    .match(/[^.!?\n]+[.!?]+|[^.!?\n]+$/g);
  if (!parts) return [];
  // Group sentences into paragraphs based on original newlines
  const paras = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  if (paras.length <= 1) return parts.map(s => s.trim());
  // If multiple paragraphs, split each paragraph separately
  const result = [];
  for (const para of paras) {
    const ps = para.match(/[^.!?\n]+[.!?]+|[^.!?\n]+$/g) || [];
    result.push(...ps.map(s => s.trim()));
  }
  return result;
}

function buildChunks(text, by = 'sentence') {
  if (by === 'paragraph') {
    return splitIntoParagraphs(text);
  }
  // Sentence mode: return individual sentences (we will insert cumulative recalls separately)
  return splitIntoSentences(text);
}

function maskWord(word, keepFirst = true) {
  // Keep punctuation as-is
  const core = word.match(/([A-Za-zÀ-ÖØ-öø-ÿ']+)([^A-Za-zÀ-ÖØ-öø-ÿ']*)/);
  if (!core) return word.replace(/\S/g, '_');
  const letters = core[1];
  const punct = core[2] || '';
  if (!letters) return word;
  if (letters.length <= 2) return '_'.repeat(letters.length) + punct;
  if (keepFirst) return letters[0] + '_'.repeat(letters.length - 1) + punct;
  return '_'.repeat(letters.length) + punct;
}

function cloze(text, difficulty = 'medium') {
  const words = text.split(/(\s+)/); // keep spaces
  const tokens = words.filter(Boolean);
  const candidateIdxs = [];
  for (let i = 0; i < tokens.length; i++) {
    if (!/\s+/.test(tokens[i]) && /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(tokens[i]) && tokens[i].length > 2) {
      candidateIdxs.push(i);
    }
  }
  const ratio = difficulty === 'easy' ? 0.25 : difficulty === 'hard' ? 0.7 : 0.5;
  const maskCount = Math.max(1, Math.floor(candidateIdxs.length * ratio));
  // choose spread-out indices
  const step = Math.max(1, Math.floor(candidateIdxs.length / maskCount));
  const maskIdxs = new Set(candidateIdxs.filter((_, i) => i % step === 0).slice(0, maskCount));

  const out = tokens.map((t, i) => {
    if (maskIdxs.has(i)) return maskWord(t, true);
    return t;
  });
  return out.join('');
}

// LCS-based matching so skipped words that are recalled later still count
function lcsAlign(A, B) {
  const n = A.length, m = B.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] = A[i - 1] === B[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  // reconstruct path
  const pairs = [];
  let i = n, j = m;
  while (i > 0 && j > 0) {
    if (A[i - 1] === B[j - 1]) { pairs.push([i - 1, j - 1]); i--; j--; }
    else if (dp[i - 1][j] >= dp[i][j - 1]) i--;
    else j--;
  }
  pairs.reverse();
  return { pairs, lcsLen: dp[n][m] };
}

function wordAccuracy(a, b, caseSensitive) {
  const A = normalise(a, caseSensitive).split(' ').filter(Boolean);
  const B = normalise(b, caseSensitive).split(' ').filter(Boolean);
  if (A.length === 0) return B.length === 0 ? 1 : 0;
  const { lcsLen } = lcsAlign(A, B);
  // Accuracy measured against target length to reward recalling all target words
  return lcsLen / A.length;
}

// Render a side-by-side diff of target vs guess
function diffRender(target, guess, caseSensitive) {
  const T = normalise(target, caseSensitive).split(' ').filter(Boolean);
  const G = normalise(guess, caseSensitive).split(' ').filter(Boolean);
  const { pairs } = lcsAlign(T, G);
  const matchedT = new Set(pairs.map(p => p[0]));
  const matchedG = new Set(pairs.map(p => p[1]));

  const baseStyle = 'display:inline-block; margin:2px 4px; padding:2px 4px; border-radius:6px; border:1px solid ';
  const tRow = T.map((tok, i) => {
    let style = baseStyle;
    if (matchedT.has(i)) style += '#1f9d55; background: rgba(34,197,94,.15);'; // correct
    else style += '#7c3aed; background: rgba(124,58,237,.15);'; // missing
    return `<span style="${style}">${escapeHtml(tok)}</span>`;
  });

  const gRow = G.map((tok, j) => {
    let style = baseStyle;
    if (matchedG.has(j)) style += '#1f9d55; background: rgba(34,197,94,.15);'; // correct
    else style += '#eab308; background: rgba(234,179,8,.15);'; // extra
    return `<span style="${style}">${escapeHtml(tok)}</span>`;
  });

  const legend = `
    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:8px; font-size:12px; color:#9fb0d3;">
      <span><span style="display:inline-block;width:10px;height:10px;background:rgba(34,197,94,.6);border:1px solid #1f9d55;border-radius:3px;margin-right:6px;"></span>Correct (matched)</span>
      <span><span style="display:inline-block;width:10px;height:10px;background:rgba(124,58,237,.6);border:1px solid #7c3aed;border-radius:3px;margin-right:6px;"></span>Missing (in target, not typed)</span>
      <span><span style="display:inline-block;width:10px;height:10px;background:rgba(234,179,8,.6);border:1px solid #eab308;border-radius:3px;margin-right:6px;"></span>Extra (typed but not in target)</span>
    </div>`;

  return `
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-top:10px;">
      <div>
        <div class="label" style="margin-bottom:6px;">Target</div>
        <div>${tRow.join(' ')}</div>
      </div>
      <div>
        <div class="label" style="margin-bottom:6px;">Your recall</div>
        <div>${gRow.join(' ')}</div>
      </div>
    </div>
    ${legend}
  `;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ---------- Rendering ----------
function render() {
  const total = chunks.length;
  progressText.textContent = `Progress: ${Math.min(idx + 1, total)} / ${total}`;
  stageLabel.textContent = `Stage: ${stage.toUpperCase()}`;
  // progress bar
  const pct = total ? Math.round(((idx + 1) / total) * 100) : 0;
  if (progressBar) progressBar.style.width = `${pct}%`;
  // stage pills
  [pillRead, pillCloze, pillRecall].forEach(p => p && p.classList.remove('active'));
  if (stage === 'read' && pillRead) pillRead.classList.add('active');
  if (stage === 'cloze' && pillCloze) pillCloze.classList.add('active');
  if ((stage === 'recall' || stage === 'recall_all') && pillRecall) pillRecall.classList.add('active');

  if (!total) {
    promptEl.textContent = 'Paste your essay and press Start.';
    feedbackEl.textContent = 'Feedback will appear here.';
    recallInput.value = '';
    return;
  }

  const current = chunks[idx];
  feedbackEl.textContent = '';
  recallInput.placeholder = 'Type the chunk here…';

  if (stage === 'read') {
    promptEl.textContent = current;
    recallInput.value = '';
  } else if (stage === 'cloze') {
    const diff = difficultySel.value;
    promptEl.textContent = cloze(current, diff);
    recallInput.value = '';
  } else if (stage === 'recall') {
    promptEl.textContent = showOriginal ? current : 'Recall the text. Type it below and press Check.';
  } else if (stage === 'recall_all') {
    const cumulative = chunks.slice(0, idx + 1).join(' ');
    promptEl.textContent = showOriginal ? cumulative : 'Cumulative recall: type everything learned so far.';
  }
}

function goNextStage() {
  if (!chunks.length) return;
  const clozeOn = !clozeEnabledSel || clozeEnabledSel.value !== 'no';
  if (stage === 'read') stage = clozeOn ? 'cloze' : 'recall';
  else if (stage === 'cloze') stage = 'recall';
  else if (stage === 'recall') {
    // after every 2 sentences, insert cumulative recall stage
    const isSentenceMode = chunkTypeSel.value === 'sentence';
    const step = parseInt(cumulativeStepSel?.value || '2', 10) || 2;
    if (isSentenceMode && ((idx + 1) % step === 0)) {
      stage = 'recall_all';
    } else if (idx < chunks.length - 1) {
      idx++;
      stage = 'read';
    }
  } else if (stage === 'recall_all') {
    if (idx < chunks.length - 1) { idx++; stage = 'read'; }
  }
  render();
}

function goPrev() {
  if (!chunks.length) return;
  if (stage === 'recall_all') stage = 'recall';
  else if (stage === 'recall') stage = 'cloze';
  else if (stage === 'cloze') stage = 'read';
  else if (stage === 'read' && idx > 0) { idx--; stage = 'recall'; }
  render();
}

// ---------- Actions ----------
startBtn.addEventListener('click', (e) => {
  e.preventDefault();
  const text = (essayInput.value || '').trim();
  if (!text) { flash('Please paste your essay text.'); return; }
  chunks = buildChunks(text, chunkTypeSel.value);
  idx = 0;
  stage = 'read';
  showOriginal = false;
  render();
});

resetBtn.addEventListener('click', (e) => {
  e.preventDefault();
  chunks = [];
  idx = 0;
  stage = 'read';
  showOriginal = false;
  render();
});

copyChunkBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  if (!chunks.length) return;
  try {
    await navigator.clipboard.writeText(chunks[idx]);
    flash('Chunk copied');
  } catch { flash('Copy failed'); }
});

showBtn.addEventListener('click', (e) => {
  e.preventDefault();
  if (!chunks.length) return;
  if (stage !== 'recall' && stage !== 'recall_all') { flash('Show/Hide is for Recall stage.'); return; }
  showOriginal = !showOriginal;
  render();
});

checkBtn.addEventListener('click', (e) => {
  e.preventDefault();
  if (!chunks.length) return;
  // pick target: current sentence or cumulative
  const target = (stage === 'recall_all') ? chunks.slice(0, idx + 1).join(' ') : chunks[idx];
  const guess = recallInput.value || '';
  const caseSensitive = caseSensitiveSel.value === 'yes';

  const accuracy = wordAccuracy(target, guess, caseSensitive);
  const pct = Math.round(accuracy * 100);
  const diffHtml = diffRender(target, guess, caseSensitive);
  let msg = '';
  const autoAdvance = autoAdvanceSel?.value !== 'no';
  const threshold = parseInt(passThresholdRange?.value || '100', 10) || 100;
  if (pct >= threshold) {
    msg = 'Perfect! Moving to next chunk.';
    feedbackEl.innerHTML = `<div class="help">${msg}</div>${diffHtml}`;
    setTimeout(() => { goNextStage(); }, 500);
  } else if (pct >= 80) {
    msg = `Great! ${pct}% correct. Try once more or Next.`;
    feedbackEl.innerHTML = `<div class="help">${msg}</div>${diffHtml}`;
  } else if (pct >= 50) {
    msg = `Not bad: ${pct}% correct. Review with Show, then try again.`;
    feedbackEl.innerHTML = `<div class="help">${msg}</div>${diffHtml}`;
  } else {
    msg = `${pct}% correct. Re-read the chunk and try again.`;
    feedbackEl.innerHTML = `<div class="help">${msg}</div>${diffHtml}`;
  }
  if (autoAdvance && pct >= threshold) {
    // already scheduled above
  }
});

prevBtn.addEventListener('click', (e) => { e.preventDefault(); goPrev(); });
nextBtn.addEventListener('click', (e) => { e.preventDefault(); goNextStage(); });

// Keyboard shortcuts
window.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    // Cmd/Ctrl+Enter = Check
    checkBtn.click();
  } else if (e.key === 'ArrowRight') {
    nextBtn.click();
  } else if (e.key === 'ArrowLeft') {
    prevBtn.click();
  }
});

// Initial render
render();

// ---------- New features wiring ----------
// Theme
function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'light') root.setAttribute('data-theme', 'light');
  else root.removeAttribute('data-theme');
}
const savedTheme = localStorage.getItem('memoriser_theme');
if (savedTheme) { applyTheme(savedTheme); if (themeSwitch) themeSwitch.value = savedTheme; }
themeSwitch?.addEventListener('change', () => {
  const t = themeSwitch.value;
  applyTheme(t);
  localStorage.setItem('memoriser_theme', t);
});

// Font size / line height
function applyTypography() {
  const fs = fontSizeRange ? `${fontSizeRange.value}px` : '15px';
  const lh = lineHeightRange ? `${lineHeightRange.value}` : '1.6';
  const root = document.documentElement.style;
  root.setProperty('--out-font-size', fs);
  root.setProperty('--out-line-height', lh);
}
fontSizeRange?.addEventListener('input', applyTypography);
lineHeightRange?.addEventListener('input', applyTypography);
applyTypography();

// Pass threshold display
function updatePassLabel() {
  if (passValue && passThresholdRange) passValue.textContent = `${passThresholdRange.value}%`;
}
passThresholdRange?.addEventListener('input', updatePassLabel);
updatePassLabel();

// Import/Export
importBtn?.addEventListener('click', (e) => { e.preventDefault(); importFile?.click(); });
importFile?.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  essayInput.value = text;
  flash('Essay imported');
});
exportBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  const blob = new Blob([essayInput.value || ''], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'essay.txt'; a.click();
  URL.revokeObjectURL(url);
});

// TTS (speech synthesis)
ttsBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  const synth = window.speechSynthesis;
  if (!synth) { flash('SpeechSynthesis not supported'); return; }
  if (synth.speaking) { synth.cancel(); return; }
  let text = promptEl.textContent || '';
  // Prefer actual target for recall stages
  if (stage === 'recall') text = chunks[idx];
  if (stage === 'recall_all') text = chunks.slice(0, idx + 1).join(' ');
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1.0; utter.pitch = 1.0;
  synth.speak(utter);
});

// Fullscreen toggle
fsBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  const doc = document;
  const el = document.documentElement;
  if (!doc.fullscreenElement) el.requestFullscreen?.();
  else doc.exitFullscreen?.();
});

// Mobile bar
mPrev?.addEventListener('click', (e) => { e.preventDefault(); prevBtn.click(); });
mShow?.addEventListener('click', (e) => { e.preventDefault(); showBtn.click(); });
mCheck?.addEventListener('click', (e) => { e.preventDefault(); checkBtn.click(); });
mNext?.addEventListener('click', (e) => { e.preventDefault(); nextBtn.click(); });

// ---------- Persistence (localStorage) ----------
const LS_KEYS = {
  essay: 'memoriser_essay',
  settings: 'memoriser_settings',
  progress: 'memoriser_progress'
};

function saveEssay() {
  try { localStorage.setItem(LS_KEYS.essay, essayInput.value || ''); } catch {}
}
function loadEssay() {
  try {
    const e = localStorage.getItem(LS_KEYS.essay);
    if (e && e.trim()) essayInput.value = e;
  } catch {}
}
function getSettingsObj() {
  return {
    theme: themeSwitch?.value,
    chunkType: chunkTypeSel?.value,
    difficulty: difficultySel?.value,
    clozeEnabled: clozeEnabledSel?.value,
    caseSensitive: caseSensitiveSel?.value,
    cumulativeStep: cumulativeStepSel?.value,
    autoAdvance: autoAdvanceSel?.value,
    passThreshold: passThresholdRange?.value,
    fontSize: fontSizeRange?.value,
    lineHeight: lineHeightRange?.value
  };
}
function applySettingsObj(s) {
  if (!s) return;
  if (themeSwitch && s.theme) { themeSwitch.value = s.theme; applyTheme(s.theme); }
  if (chunkTypeSel && s.chunkType) chunkTypeSel.value = s.chunkType;
  if (difficultySel && s.difficulty) difficultySel.value = s.difficulty;
  if (clozeEnabledSel && s.clozeEnabled) clozeEnabledSel.value = s.clozeEnabled;
  if (caseSensitiveSel && s.caseSensitive) caseSensitiveSel.value = s.caseSensitive;
  if (cumulativeStepSel && s.cumulativeStep) cumulativeStepSel.value = s.cumulativeStep;
  if (autoAdvanceSel && s.autoAdvance) autoAdvanceSel.value = s.autoAdvance;
  if (passThresholdRange && s.passThreshold) { passThresholdRange.value = s.passThreshold; updatePassLabel(); }
  if (fontSizeRange && s.fontSize) { fontSizeRange.value = s.fontSize; }
  if (lineHeightRange && s.lineHeight) { lineHeightRange.value = s.lineHeight; }
  applyTypography();
}
function saveSettings() {
  try { localStorage.setItem(LS_KEYS.settings, JSON.stringify(getSettingsObj())); } catch {}
}
function loadSettings() {
  try {
    const raw = localStorage.getItem(LS_KEYS.settings);
    if (raw) applySettingsObj(JSON.parse(raw));
  } catch {}
}
function saveProgress() {
  try { localStorage.setItem(LS_KEYS.progress, JSON.stringify({ idx, stage })); } catch {}
}
function loadProgress() {
  try {
    const raw = localStorage.getItem(LS_KEYS.progress);
    if (!raw) return;
    const p = JSON.parse(raw);
    if (typeof p.idx === 'number') idx = p.idx;
    if (typeof p.stage === 'string') stage = p.stage;
  } catch {}
}

// Hook events to persist
essayInput?.addEventListener('input', () => saveEssay());
['change','input'].forEach(evt => {
  themeSwitch?.addEventListener(evt, saveSettings);
  chunkTypeSel?.addEventListener(evt, saveSettings);
  difficultySel?.addEventListener(evt, saveSettings);
  clozeEnabledSel?.addEventListener(evt, saveSettings);
  caseSensitiveSel?.addEventListener(evt, saveSettings);
  cumulativeStepSel?.addEventListener(evt, saveSettings);
  autoAdvanceSel?.addEventListener(evt, saveSettings);
  passThresholdRange?.addEventListener(evt, saveSettings);
  fontSizeRange?.addEventListener(evt, saveSettings);
  lineHeightRange?.addEventListener(evt, saveSettings);
});

['click','keydown','input'].forEach(evt => {
  document.addEventListener(evt, () => saveProgress(), { passive: true });
});

// Initial load from localStorage
loadEssay();
loadSettings();
// Rebuild chunks after loading essay/settings if user clicks resume
startBtn?.addEventListener('contextmenu', (e) => {
  // Right-click Start to resume last saved position
  e.preventDefault();
  const text = (essayInput.value || '').trim();
  if (!text) { flash('No essay to resume'); return; }
  chunks = buildChunks(text, chunkTypeSel.value);
  loadProgress();
  idx = Math.min(Math.max(0, idx), Math.max(0, chunks.length - 1));
  render();
  flash('Resumed last session');
});

// Load from Library via URL param ?load=<id>
function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}
function loadFromLibraryById(id) {
  try {
    const raw = localStorage.getItem('memoriser_library');
    if (!raw) return false;
    const arr = JSON.parse(raw);
    const item = Array.isArray(arr) ? arr.find(x => x && x.id === id) : null;
    if (!item) return false;
    essayInput.value = item.text || '';
    saveEssay();
    chunks = buildChunks(essayInput.value, chunkTypeSel.value);
    idx = 0; stage = 'read'; render();
    flash(`Loaded: ${item.title || 'Untitled'}`);
    return true;
  } catch { return false; }
}

const loadId = getQueryParam('load');
if (loadId) {
  loadFromLibraryById(loadId);
}
