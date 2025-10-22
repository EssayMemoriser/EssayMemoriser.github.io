// Engtest UI script
// 1) Edit formFields to match your Engtest.py inputs
// 2) Implement runComputation() to mirror your Python logic in JS
// 3) Or paste Python in the Pyodide section of the page and run in-browser

// ---------- Configure your form here ----------
const formFields = [
    {
      id: 'name',
      label: 'Name',
      type: 'text',
      placeholder: 'Alice',
      required: true,
    },
    {
      id: 'age',
      label: 'Age',
      type: 'number',
      min: 0,
      step: 1,
    },
    {
      id: 'level',
      label: 'Level',
      type: 'select',
      options: ['Beginner', 'Intermediate', 'Advanced'],
    },
    {
      id: 'newsletter',
      label: 'Subscribe to updates',
      type: 'checkbox',
      default: true,
    },
    {
      id: 'notes',
      label: 'Notes',
      type: 'textarea',
      placeholder: 'Any extra details…',
    },
  ];
  
  // ---------- UI Wiring ----------
  const formEl = document.getElementById('eng-form');
  const runBtn = document.getElementById('runBtn');
  const resetBtn = document.getElementById('resetBtn');
  const outputEl = document.getElementById('output');
  const copyBtn = document.getElementById('copyBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  
  const pyTextArea = document.getElementById('pyCode');
  const runPyBtn = document.getElementById('runPyBtn');
  const pyOutputEl = document.getElementById('pyOutput');
  
  function createFieldRow(field) {
    const row = document.createElement('div');
    row.className = 'form-row';
  
    if (field.type === 'checkbox') {
      const wrap = document.createElement('div');
      wrap.className = 'checkbox-row';
  
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.id = field.id;
      input.checked = !!field.default;
  
      const label = document.createElement('label');
      label.htmlFor = field.id;
      label.textContent = field.label;
  
      wrap.appendChild(input);
      wrap.appendChild(label);
      row.appendChild(wrap);
      return row;
    }
  
    const label = document.createElement('label');
    label.className = 'label';
    label.htmlFor = field.id;
    label.textContent = field.label + (field.required ? ' *' : '');
  
    let input;
    if (field.type === 'select') {
      input = document.createElement('select');
      input.id = field.id;
      (field.options || []).forEach(opt => {
        const o = document.createElement('option');
        o.value = opt;
        o.textContent = opt;
        input.appendChild(o);
      });
    } else if (field.type === 'textarea') {
      input = document.createElement('textarea');
      input.id = field.id;
      input.rows = field.rows || 3;
      if (field.placeholder) input.placeholder = field.placeholder;
    } else {
      input = document.createElement('input');
      input.id = field.id;
      input.type = field.type || 'text';
      if (field.placeholder) input.placeholder = field.placeholder;
      if (field.min !== undefined) input.min = field.min;
      if (field.max !== undefined) input.max = field.max;
      if (field.step !== undefined) input.step = field.step;
    }
    input.className = 'input';
    if (field.required) input.required = true;
  
    row.appendChild(label);
    row.appendChild(input);
    return row;
  }
  
  function renderForm() {
    formEl.innerHTML = '';
    formFields.forEach(f => formEl.appendChild(createFieldRow(f)));
  }
  
  function getFormData() {
    const data = {};
    for (const f of formFields) {
      const el = document.getElementById(f.id);
      if (!el) continue;
      if (f.type === 'checkbox') data[f.id] = !!el.checked;
      else data[f.id] = el.value;
    }
    return data;
  }
  
  function resetForm() {
    renderForm();
    setOutput('Waiting to run…');
  }
  
  function setOutput(text) {
    outputEl.textContent = typeof text === 'string' ? text : JSON.stringify(text, null, 2);
  }
  
  function toFileName(prefix = 'engtest-output') {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${prefix}-${stamp}.txt`;
  }
  
  async function copyOutput() {
    try {
      await navigator.clipboard.writeText(outputEl.textContent || '');
      flash('Copied to clipboard');
    } catch (e) {
      flash('Copy failed');
    }
  }
  
  function downloadOutput() {
    const blob = new Blob([outputEl.textContent || ''], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = toFileName();
    a.click();
    URL.revokeObjectURL(url);
  }
  
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
    setTimeout(() => el.remove(), 1600);
  }
  
  // ---------- Replace this with your Engtest.py logic ----------
  // This function receives the form data and returns a result to show in Output.
  function runComputation(input) {
    // Example: mimic some processing
    const lines = [];
    lines.push(`Hello ${input.name || 'friend'}!`);
    if (input.age) {
      const a = Number(input.age);
      if (!isNaN(a)) lines.push(`You will be ${a + 1} next year.`);
    }
    if (input.level) lines.push(`Selected level: ${input.level}`);
    lines.push(`Subscribed: ${input.newsletter ? 'Yes' : 'No'}`);
    if (input.notes) lines.push(`Notes: ${input.notes}`);
  
    return lines.join('\n');
  }
  
  // ---------- Optional: Pyodide (run Python in browser) ----------
  let pyodideReady = null;
  async function ensurePyodide() {
    if (pyodideReady) return pyodideReady;
    pyOutputEl.textContent = 'Loading Pyodide…';
    // Load Pyodide CDN lazily to avoid heavy initial load
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js';
    document.head.appendChild(script);
    await new Promise((res, rej) => {
      script.onload = res; script.onerror = rej;
    });
    // globalThis.loadPyodide is provided by the script above
    const py = await globalThis.loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/' });
    pyodideReady = py;
    pyOutputEl.textContent = 'Pyodide ready.';
    return py;
  }
  
  async function runPythonInBrowser(code) {
    try {
      const py = await ensurePyodide();
      pyOutputEl.textContent = 'Running…';
      const result = await py.runPythonAsync(code);
      pyOutputEl.textContent = String(result ?? '');
    } catch (err) {
      pyOutputEl.textContent = `Error: ${err.message || err}`;
    }
  }
  
  // ---------- Event bindings ----------
  runBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const data = getFormData();
    setOutput('Running…');
    try {
      const res = runComputation(data);
      setOutput(res);
    } catch (err) {
      setOutput(`Error: ${err.message || err}`);
    }
  });
  
  resetBtn.addEventListener('click', (e) => {
    e.preventDefault();
    resetForm();
  });
  
  copyBtn.addEventListener('click', (e) => {
    e.preventDefault();
    copyOutput();
  });
  
  downloadBtn.addEventListener('click', (e) => {
    e.preventDefault();
    downloadOutput();
  });
  
  runPyBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    await runPythonInBrowser(pyTextArea.value || "print('Hello from Engtest')\n");
  });
  
  // Initial render
  renderForm();
  setOutput('Waiting to run…');
  