/* plus-core.js — extra tools ka framework (helpers, ZIP, panel, registration) */
(function () {
  'use strict';
  var P = window.PLUS = { defs: Object.create(null), order: [], H: {}, urls: [] };
  var H = P.H;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]; }); };
  H.esc = esc;
  H.$ = $;
  H.kb = function (n) { return n >= 1048576 ? (n / 1048576).toFixed(2) + ' MB' : (n / 1024).toFixed(n < 10240 ? 1 : 0) + ' KB'; };
  H.base = function (name) { return String(name || 'file').replace(/\.[^.]+$/, '').replace(/[^\wऀ-ॿ\-]+/g, '_').slice(0, 60) || 'file'; };
  H.isPdf = function (f) { return f && (f.type === 'application/pdf' || /\.pdf$/i.test(f.name)); };
  H.isImg = function (f) { return f && (/^image\//.test(f.type) || /\.(jpe?g|png|webp|bmp|gif)$/i.test(f.name)); };
  H.today = function () { var d = new Date(); return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear(); };
  H.todayISO = function () { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

  /* ---------- script / library loaders ---------- */
  H.loadScript = function (src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = new URL(src, document.baseURI).href;
      s.onload = res;
      s.onerror = function () { rej(new Error('Library load नहीं हो सकी। इंटरनेट/साइट की फ़ाइलें जाँचें।')); };
      document.head.appendChild(s);
    });
  };
  H.pdfLib = async function () {
    if (!window.PDFLib) await H.loadScript('lib/pdf-lib/pdf-lib.min.js');
    return window.PDFLib;
  };
  H.pdfjs = function () { return window.mahendraLoadPdfJs(); };

  /* ---------- ZIP (store) ---------- */
  var crcT = (function () { var t = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  H.crc32 = function (b) { var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = crcT[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  H.zip = function (entries) {
    var enc = new TextEncoder(), parts = [], cds = [], off = 0, used = {};
    var d = new Date();
    var dt = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    var tm = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    entries.forEach(function (e) {
      var name = e.name, n = 1;
      while (used[name]) { name = e.name.replace(/(\.[^.]*)?$/, '_' + (++n) + '$1'); }
      used[name] = 1;
      var nb = enc.encode(name), crc = H.crc32(e.bytes), sz = e.bytes.length;
      var lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
      lh.setUint16(10, tm, true); lh.setUint16(12, dt, true); lh.setUint32(14, crc, true); lh.setUint32(18, sz, true); lh.setUint32(22, sz, true);
      lh.setUint16(26, nb.length, true); lh.setUint16(28, 0, true);
      parts.push(new Uint8Array(lh.buffer), nb, e.bytes);
      var ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
      ch.setUint16(12, tm, true); ch.setUint16(14, dt, true); ch.setUint32(16, crc, true); ch.setUint32(20, sz, true); ch.setUint32(24, sz, true);
      ch.setUint16(28, nb.length, true); ch.setUint32(42, off, true);
      cds.push(new Uint8Array(ch.buffer), nb);
      off += 30 + nb.length + sz;
    });
    var cdSize = 0; cds.forEach(function (b) { cdSize += b.length; });
    var end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, entries.length, true); end.setUint16(10, entries.length, true);
    end.setUint32(12, cdSize, true); end.setUint32(16, off, true);
    return new Blob(parts.concat(cds, [new Uint8Array(end.buffer)]), { type: 'application/zip' });
  };

  /* ---------- image helpers ---------- */
  H.loadImg = function (file) {
    return new Promise(function (res, rej) {
      var u = URL.createObjectURL(file), i = new Image();
      i.onload = function () { res(i); setTimeout(function () { URL.revokeObjectURL(u); }, 4000); };
      i.onerror = function () { URL.revokeObjectURL(u); rej(new Error('"' + file.name + '" एक सही image नहीं है।')); };
      i.src = u;
    });
  };
  H.canvas = function (w, h, bg) {
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
    var x = c.getContext('2d');
    if (bg) { x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height); }
    return c;
  };
  H.imgCanvas = function (img, bg) {
    var c = H.canvas(img.naturalWidth || img.width, img.naturalHeight || img.height, bg);
    c.getContext('2d').drawImage(img, 0, 0);
    return c;
  };
  H.toBlob = function (c, type, q) {
    return new Promise(function (res, rej) { c.toBlob(function (b) { b ? res(b) : rej(new Error('Image बनाई नहीं जा सकी।')); }, type || 'image/jpeg', q == null ? 0.92 : q); });
  };
  H.toBlobKB = async function (c, type, kb) {
    type = type || 'image/jpeg';
    if (!kb || type === 'image/png') return H.toBlob(c, type, 0.92);
    var lo = 0.05, hi = 0.97, best = await H.toBlob(c, type, lo);
    if (best.size / 1024 > kb) return best;
    for (var i = 0; i < 10; i++) {
      var mid = (lo + hi) / 2, b = await H.toBlob(c, type, mid);
      if (b.size / 1024 <= kb) { best = b; lo = mid; } else hi = mid;
    }
    return best;
  };
  H.fmtInfo = function (fmt) { return fmt === 'png' ? { type: 'image/png', ext: 'png' } : { type: 'image/jpeg', ext: 'jpg' }; };
  H.bytes = async function (blob) { return new Uint8Array(await blob.arrayBuffer()); };
  H.fitInto = function (w, h, bw, bh) { var s = Math.min(bw / w, bh / h); return { w: w * s, h: h * s, s: s }; };
  H.fontStack = '"Noto Sans Devanagari","Nirmala UI","Mangal","Lohit Devanagari",Arial,sans-serif';
  // text -> transparent PNG (Hindi bhi chalega)
  H.textCanvas = function (text, opt) {
    opt = opt || {};
    var px = opt.px || 48, lines = String(text).split('\n'), pad = Math.round(px * 0.25);
    var font = (opt.bold ? 'bold ' : '') + px + 'px ' + H.fontStack;
    var m = H.canvas(10, 10).getContext('2d'); m.font = font;
    var w = 0; lines.forEach(function (l) { w = Math.max(w, m.measureText(l).width); });
    var lh = Math.round(px * 1.3);
    var c = H.canvas(Math.ceil(w) + pad * 2, lh * lines.length + pad * 2);
    var x = c.getContext('2d'); x.font = font; x.fillStyle = opt.color || '#000'; x.textBaseline = 'top';
    lines.forEach(function (l, i) { x.fillText(l, pad, pad + i * lh + Math.round(px * 0.08)); });
    return c;
  };

  /* ---------- page range parser ---------- */
  H.pages = function (str, n, opts) {
    opts = opts || {};
    str = String(str == null ? '' : str).trim().toLowerCase().replace(/last|end|अंतिम/g, String(n)).replace(/[–—]/g, '-');
    if (!str || str === 'all' || str === 'सभी') {
      if (opts.all || str === 'all' || str === 'सभी') return Array.from({ length: n }, function (_, i) { return i; });
      throw new Error('Pages लिखें, जैसे 1-3,5');
    }
    var out = [];
    str.split(/[,\s;]+/).filter(Boolean).forEach(function (part) {
      var m = part.match(/^(\d+)$/), r = part.match(/^(\d+)-(\d+)$/);
      if (!m && !r) throw new Error('"' + part + '" सही page नहीं है। ऐसे लिखें: 1-3,5');
      var a = m ? +m[1] : +r[1], b = m ? +m[1] : +r[2];
      [a, b].forEach(function (p) { if (p < 1 || p > n) throw new Error('Page ' + p + ' मौजूद नहीं है। इस PDF में ' + n + ' pages हैं।'); });
      if (a <= b) for (var i = a; i <= b; i++) out.push(i - 1); else for (var j = a; j >= b; j--) out.push(j - 1);
    });
    return out;
  };

  /* ---------- registration ---------- */
  P.add = function (def) { P.defs[def.title] = def; P.order.push(def.title); };

  /* ---------- panel ---------- */
  function fieldHTML(f) {
    var id = 'pf_' + f.id, inner, val = typeof f.value === 'function' ? f.value() : f.value;
    var attrs = (f.min != null ? ' min="' + f.min + '"' : '') + (f.max != null ? ' max="' + f.max + '"' : '') + (f.step != null ? ' step="' + f.step + '"' : '') + (f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : '') + (f.maxlength ? ' maxlength="' + f.maxlength + '"' : '');
    if (f.type === 'select') {
      inner = '<select id="' + id + '">' + f.options.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(val) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>';
    } else if (f.type === 'textarea') {
      inner = '<textarea id="' + id + '" rows="' + (f.rows || 4) + '"' + attrs + '>' + esc(val == null ? '' : val) + '</textarea>';
    } else if (f.type === 'checkbox') {
      return '<label class="plus-check" data-f="' + f.id + '"><input type="checkbox" id="' + id + '"' + (val ? ' checked' : '') + '> <span>' + esc(f.label) + '</span></label>';
    } else if (f.type === 'range') {
      inner = '<span class="plus-range"><input type="range" id="' + id + '"' + attrs + ' value="' + val + '"><output id="' + id + '_o">' + val + '</output></span>';
    } else {
      inner = '<input type="' + (f.type || 'text') + '" id="' + id + '" value="' + esc(val == null ? '' : val) + '"' + attrs + (f.type === 'number' ? ' inputmode="decimal"' : '') + '>';
    }
    return '<label data-f="' + f.id + '"' + (f.full ? ' class="plus-full"' : '') + '>' + esc(f.label) + inner + (f.help ? '<small>' + esc(f.help) + '</small>' : '') + '</label>';
  }
  function inputHTML(i) {
    return '<div class="plus-file" data-i="' + i.id + '"><label>' + esc(i.label) + '<input type="file" id="pfile_' + i.id + '" accept="' + esc(i.accept || '') + '"' + (i.multiple ? ' multiple' : '') + '></label><div class="plus-list" id="plist_' + i.id + '"></div></div>';
  }

  function openPlus(def) {
    P.urls.forEach(function (u) { try { URL.revokeObjectURL(u); } catch (e) {} });
    P.urls = [];
    var S = { def: def, files: {}, outs: [] };
    var inputs = def.inputs || [];
    var root = $('#toolContent');
    root.innerHTML =
      '<div class="v41-wrap plus-wrap"><div class="v41-head"><div><h2>' + def.icon + ' ' + esc(def.title) + '</h2><p>' + esc(def.desc || '') + '</p></div><span class="v35-local">🔒 स्थानीय प्रोसेसिंग</span></div>' +
      '<div class="v41-box">' +
      (def.hint ? '<p class="plus-hint">' + def.hint + '</p>' : '') +
      inputs.map(inputHTML).join('') +
      '<div class="v41-controls plus-fields" id="plusFields">' + (def.fields || []).map(fieldHTML).join('') + '</div>' +
      '<div id="plusCustom"></div>' +
      (def.noRun ? '' : '<div class="v41-actions"><button class="primary-btn" id="plusRun" type="button">' + esc(def.action || '▶ शुरू करें') + '</button><button class="secondary-btn" id="plusReset" type="button">साफ़ करें</button></div>') +
      '<div class="v41-status" id="plusStatus" role="status">' + esc(def.ready || (inputs.length ? 'फ़ाइल चुनें और बटन दबाएँ।' : 'जानकारी भरें।')) + '</div>' +
      '<div id="plusResult" class="plus-result"></div><div id="plusOut" class="plus-out"></div></div></div>';
    $('#modal').classList.remove('hidden');
    $('.modal-card').scrollTop = 0;

    function v(id) {
      var e = document.getElementById('pf_' + id);
      if (!e) return undefined;
      if (e.type === 'checkbox') return e.checked;
      if (e.type === 'number' || e.type === 'range') { var n = parseFloat(e.value); return isNaN(n) ? 0 : n; }
      return e.value;
    }
    function status(msg, kind) {
      var s = $('#plusStatus'); if (!s) return;
      s.textContent = msg; s.className = 'v41-status' + (kind === 'err' ? ' plus-err' : kind === 'ok' ? ' plus-ok' : '');
    }
    function html(h) { var r = $('#plusResult'); if (r) r.innerHTML = h; }
    function out(blob, name, extra) {
      if (!(blob instanceof Blob)) blob = new Blob([blob], { type: 'application/octet-stream' });
      S.outs.push({ blob: blob, name: name, url: null });
    }
    function clearOuts() { S.outs = []; var o = $('#plusOut'); if (o) o.innerHTML = ''; }
    function renderOuts() {
      var o = $('#plusOut'); if (!o) return;
      if (!S.outs.length) { o.innerHTML = ''; return; }
      var items = S.outs.map(function (f, i) {
        if (!f.url) { f.url = URL.createObjectURL(f.blob); P.urls.push(f.url); }
        var isImg = /^image\//.test(f.blob.type);
        return '<div class="plus-card">' + (isImg && S.outs.length <= 12 ? '<img class="plus-prev" src="' + f.url + '" alt="' + esc(f.name) + '">' : '<div class="plus-doc" aria-hidden="true">' + (/pdf/.test(f.blob.type) ? '📄' : isImg ? '🖼️' : '📦') + '</div>') +
          '<div class="plus-meta"><b>' + esc(f.name) + '</b><span>' + H.kb(f.blob.size) + '</span></div>' +
          '<a class="primary-btn plus-dl" href="' + f.url + '" download="' + esc(f.name) + '">⬇️ Download</a></div>';
      }).join('');
      var zip = S.outs.length > 1 ? '<button class="secondary-btn" id="plusZip" type="button">📦 सब ZIP में डाउनलोड करें (' + S.outs.length + ' files)</button>' : '';
      o.innerHTML = '<div class="plus-cards">' + items + '</div>' + zip;
      var z = $('#plusZip');
      if (z) z.addEventListener('click', async function () {
        z.disabled = true;
        try {
          var entries = [];
          for (var i = 0; i < S.outs.length; i++) entries.push({ name: S.outs[i].name, bytes: await H.bytes(S.outs[i].blob) });
          var blob = H.zip(entries), url = URL.createObjectURL(blob); P.urls.push(url);
          var a = document.createElement('a'); a.href = url; a.download = H.base(def.title) + '_files.zip'; document.body.appendChild(a); a.click(); a.remove();
        } catch (e) { status('❌ ZIP नहीं बन सका: ' + e.message, 'err'); }
        z.disabled = false;
      });
    }

    /* ---- file inputs with ordered list ---- */
    inputs.forEach(function (inp) {
      S.files[inp.id] = [];
      var el = $('#pfile_' + inp.id), list = $('#plist_' + inp.id);
      function drawList() {
        var arr = S.files[inp.id];
        list.innerHTML = arr.map(function (f, i) {
          return '<div class="plus-li"><span class="plus-name">' + (inp.multiple ? (i + 1) + '. ' : '') + esc(f.name) + ' <em>(' + H.kb(f.size) + ')</em></span>' +
            (inp.multiple ? '<span class="plus-btns"><button type="button" data-a="up" data-i="' + i + '" aria-label="ऊपर" ' + (i === 0 ? 'disabled' : '') + '>↑</button><button type="button" data-a="dn" data-i="' + i + '" aria-label="नीचे" ' + (i === arr.length - 1 ? 'disabled' : '') + '>↓</button><button type="button" data-a="rm" data-i="' + i + '" aria-label="हटाएँ">✕</button></span>' : '') + '</div>';
        }).join('');
        if (inp.onFiles) inp.onFiles(arr, S, api);
      }
      el.addEventListener('change', function () {
        var picked = Array.prototype.slice.call(el.files || []);
        if (!picked.length) return;
        S.files[inp.id] = inp.multiple ? S.files[inp.id].concat(picked) : picked.slice(0, 1);
        el.value = '';
        drawList();
        clearOuts();
        if (!def.custom) status(S.files[inp.id].length + ' file चुनी गई। अब बटन दबाएँ।');
      });
      list.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        var i = +b.dataset.i, arr = S.files[inp.id];
        if (b.dataset.a === 'rm') arr.splice(i, 1);
        else if (b.dataset.a === 'up' && i > 0) { var t = arr[i - 1]; arr[i - 1] = arr[i]; arr[i] = t; }
        else if (b.dataset.a === 'dn' && i < arr.length - 1) { var t2 = arr[i + 1]; arr[i + 1] = arr[i]; arr[i] = t2; }
        drawList();
      });
      S['draw_' + inp.id] = drawList;
    });

    /* ---- conditional fields ---- */
    function refreshShow() {
      (def.fields || []).forEach(function (f) {
        var el = $('#plusFields [data-f="' + f.id + '"]');
        if (el && f.show) el.style.display = f.show(v) ? '' : 'none';
      });
    }
    (def.fields || []).forEach(function (f) {
      var e = document.getElementById('pf_' + f.id);
      if (!e) return;
      e.addEventListener('input', function () {
        if (f.type === 'range') { var o = document.getElementById('pf_' + f.id + '_o'); if (o) o.textContent = e.value; }
        refreshShow();
        if (def.live) { clearTimeout(S.t); S.t = setTimeout(run, 120); }
      });
      e.addEventListener('change', function () { refreshShow(); if (def.live) { clearTimeout(S.t); S.t = setTimeout(run, 120); } });
    });
    refreshShow();

    var api = { blank: function (id) { var e = document.getElementById('pf_' + id); return !e || String(e.value).trim() === ''; }, files: function (id) { return S.files[id || 'f'] || []; }, file: function (id) { return (S.files[id || 'f'] || [])[0]; }, v: v, status: status, out: out, html: html, clearOuts: clearOuts, render: renderOuts, S: S, def: def, root: root };

    async function run() {
      var btn = $('#plusRun');
      if (S.running) return;
      S.running = true; if (btn) btn.disabled = true;
      clearOuts(); if (!def.live) html('');
      try {
        for (var k = 0; k < inputs.length; k++) {
          var inp = inputs[k];
          if (!inp.optional && !(S.files[inp.id] || []).length) throw new Error(inp.missing || ('पहले ' + inp.label.replace(/\s*\(.*\)\s*$/, '') + ' चुनें।'));
        }
        if (!def.live) status('⏳ प्रोसेस हो रहा है…');
        var r = await def.run(api);
        if (!def.live || S.outs.length) status('✅ ' + (typeof r === 'string' && r ? r : 'तैयार है।') + (S.outs.length ? ' नीचे Download दबाएँ।' : ''), 'ok');
        else if (typeof r === 'string' && r) status(r);
      } catch (e) {
        if (window.console) console.warn(e);
        status('❌ ' + ((e && e.message) || 'कुछ गड़बड़ हुई। दोबारा कोशिश करें।'), 'err');
      } finally {
        S.running = false; if (btn) btn.disabled = false; renderOuts();
      }
    }
    api.run = run;
    if (btn0()) btn0().addEventListener('click', run);
    function btn0() { return $('#plusRun'); }
    var rs = $('#plusReset');
    if (rs) rs.addEventListener('click', function () {
      openPlus(def);
    });
    if (def.custom) def.custom(api);
    if (def.live && !inputs.length) run();
  }
  P.open = openPlus;

  /* ---------- hook into the existing app ---------- */
  P.install = function () {
    var prev = window.openToolData;
    window.openToolData = function (t) {
      var d = P.defs[t[2]];
      if (d) return openPlus(d);
      return prev(t);
    };
    P.order.forEach(function (title) {
      var d = P.defs[title];
      var idx = -1;
      for (var i = 0; i < tools.length; i++) if (tools[i][2] === title) { idx = i; break; }
      if (idx >= 0) { if (d.desc) tools[idx][3] = d.desc; if (d.tag) tools[idx][4] = d.tag; if (d.icon) tools[idx][1] = d.icon; }
      else tools.push([d.cat, d.icon, d.title, d.desc, d.tag || '']);
    });
    if (typeof searchTools === 'function') searchTools();
  };
})();
