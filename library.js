// Simple client-side Library manager using localStorage
(function(){
  const LS_KEY = 'memoriser_library';
  const libName = document.getElementById('libName');
  const libText = document.getElementById('libText');
  const libImport = document.getElementById('libImport');
  const libImportBtn = document.getElementById('libImportBtn');
  const libAddBtn = document.getElementById('libAddBtn');
  const libList = document.getElementById('libList');
  const emptyHint = document.getElementById('emptyHint');

  function loadAll() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }
  function saveAll(arr) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(arr)); } catch {}
  }
  function uid() {
    return 'e' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
  function fmtDate(ts){
    try { return new Date(ts).toLocaleString(); } catch { return ''+ts; }
  }

  function renderList() {
    const items = loadAll();
    libList.innerHTML = '';
    if (!items.length) {
      emptyHint.style.display = 'block';
      return;
    }
    emptyHint.style.display = 'none';
    for (const it of items) {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="flex:1 1 auto; min-width:0;">
            <div style="font-weight:600;">${escapeHtml(it.title || 'Untitled')}</div>
            <div class="help">Saved ${fmtDate(it.createdAt)} • ${it.text ? it.text.split(/\s+/).filter(Boolean).length : 0} words</div>
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <a href="index.html?load=${encodeURIComponent(it.id)}" class="btn small primary">Open</a>
            <button class="btn small" data-action="copy" data-id="${it.id}">Copy</button>
            <button class="btn small" data-action="export" data-id="${it.id}">Export</button>
            <button class="btn small warn" data-action="delete" data-id="${it.id}">Delete</button>
          </div>
        </div>
      `;
      libList.appendChild(card);
    }
  }

  function onListClick(e){
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    const action = btn.getAttribute('data-action');
    if (!id || !action) return;
    const items = loadAll();
    const idx = items.findIndex(x => x.id === id);
    if (idx === -1) return;
    const item = items[idx];
    if (action === 'delete') {
      if (confirm('Delete this essay?')) {
        items.splice(idx, 1); saveAll(items); renderList();
      }
    } else if (action === 'export') {
      const blob = new Blob([item.text || ''], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = (item.title || 'essay') + '.txt'; a.click();
      URL.revokeObjectURL(url);
    } else if (action === 'copy') {
      navigator.clipboard.writeText(item.text || '').then(()=>{
        toast('Copied to clipboard');
      }).catch(()=>toast('Copy failed'));
    }
  }

  function toast(msg){
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
  function escapeHtml(str){
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  libImportBtn?.addEventListener('click', (e)=>{ e.preventDefault(); libImport?.click(); });
  libImport?.addEventListener('change', async (e)=>{
    const file = e.target.files?.[0];
    if (!file) return;
    libText.value = await file.text();
    toast('Loaded file');
  });
  libAddBtn?.addEventListener('click', (e)=>{
    e.preventDefault();
    const title = (libName.value || '').trim();
    const text = (libText.value || '').trim();
    if (!text) { toast('Please provide text'); return; }
    const items = loadAll();
    const id = uid();
    items.unshift({ id, title: title || 'Untitled', text, createdAt: Date.now() });
    saveAll(items);
    libName.value = ''; libText.value = '';
    renderList();
    toast('Saved to library');
  });
  libList?.addEventListener('click', onListClick);

  renderList();
})();
