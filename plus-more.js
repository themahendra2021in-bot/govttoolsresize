/* plus-more.js — Protect / Crop / Repair / Organize / Redact / Compare / Scan→PDF / HTML→PDF */
(function () {
  'use strict';
  var P = window.PLUS, H = P.H, A = P.add, esc = H.esc, $ = H.$, X = H.pdfx;
  var PDFACC = 'application/pdf,.pdf', MM = 72 / 25.4;
  function ptr(e, cv) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height }; }
  function hex(u8) { var s = ''; for (var i = 0; i < u8.length; i++) s += (u8[i] < 16 ? '0' : '') + u8[i].toString(16); return s; }
  function rand(n) { var a = new Uint8Array(n); crypto.getRandomValues(a); return a; }
  function cat(a, b) { var o = new Uint8Array(a.length + b.length); o.set(a, 0); o.set(b, a.length); return o; }

  /* ---------- MD5 + RC4 (PDF encryption ke liye) ---------- */
  var MS = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21], MK = [];
  for (var mi = 0; mi < 64; mi++) MK[mi] = Math.floor(Math.abs(Math.sin(mi + 1)) * 4294967296) >>> 0;
  function md5(bytes) {
    var len = bytes.length, total = (((len + 8) >>> 6) + 1) * 64, m = new Uint8Array(total); m.set(bytes); m[len] = 0x80;
    var dv = new DataView(m.buffer); dv.setUint32(total - 8, (len * 8) >>> 0, true); dv.setUint32(total - 4, Math.floor(len / 536870912), true);
    var a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
    for (var off = 0; off < total; off += 64) {
      var M = []; for (var j = 0; j < 16; j++) M[j] = dv.getUint32(off + j * 4, true);
      var a = a0, b = b0, c = c0, d = d0;
      for (var i = 0; i < 64; i++) {
        var f, g;
        if (i < 16) { f = (b & c) | (~b & d); g = i; } else if (i < 32) { f = (d & b) | (~d & c); g = (5 * i + 1) % 16; } else if (i < 48) { f = b ^ c ^ d; g = (3 * i + 5) % 16; } else { f = c ^ (b | ~d); g = (7 * i) % 16; }
        f = (f + a + MK[i] + M[g]) >>> 0; a = d; d = c; c = b; b = (b + ((f << MS[i]) | (f >>> (32 - MS[i])))) >>> 0;
      }
      a0 = (a0 + a) >>> 0; b0 = (b0 + b) >>> 0; c0 = (c0 + c) >>> 0; d0 = (d0 + d) >>> 0;
    }
    var o = new Uint8Array(16), ov = new DataView(o.buffer); ov.setUint32(0, a0, true); ov.setUint32(4, b0, true); ov.setUint32(8, c0, true); ov.setUint32(12, d0, true); return o;
  }
  H.md5 = md5;
  function rc4(key, data) {
    var s = [], i, j = 0, t, out = new Uint8Array(data.length);
    for (i = 0; i < 256; i++) s[i] = i;
    for (i = 0; i < 256; i++) { j = (j + s[i] + key[i % key.length]) & 255; t = s[i]; s[i] = s[j]; s[j] = t; }
    i = j = 0;
    for (var k = 0; k < data.length; k++) { i = (i + 1) & 255; j = (j + s[i]) & 255; t = s[i]; s[i] = s[j]; s[j] = t; out[k] = data[k] ^ s[(s[i] + s[j]) & 255]; }
    return out;
  }
  var PAD = new Uint8Array([0x28, 0xBF, 0x4E, 0x5E, 0x4E, 0x75, 0x8A, 0x41, 0x64, 0x00, 0x4E, 0x56, 0xFF, 0xFA, 0x01, 0x08, 0x2E, 0x2E, 0x00, 0xB6, 0xD0, 0x68, 0x3E, 0x80, 0x2F, 0x0C, 0xA9, 0xFE, 0x64, 0x53, 0x69, 0x7A]);
  function padPw(pw) { var b = new TextEncoder().encode(pw).slice(0, 32), o = new Uint8Array(32); o.set(b); o.set(PAD.slice(0, 32 - b.length), b.length); return o; }
  function rc4x(key, data, times) { var d = rc4(key, data); for (var i = 1; i <= times; i++) { var k = key.map(function (v) { return v ^ i; }); d = rc4(new Uint8Array(k), d); } return d; }
  async function aesEnc(key, data) {
    var iv = rand(16), k = await crypto.subtle.importKey('raw', key, 'AES-CBC', false, ['encrypt']);
    var ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-CBC', iv: iv }, k, data)); return cat(iv, ct);
  }
  async function protectPdf(L, bytes, userPw, ownerPw, allowPrint, allowCopy) {
    var src = await L.PDFDocument.load(bytes, { updateMetadata: false });
    var flat = await src.save({ useObjectStreams: false });
    var doc = await L.PDFDocument.load(flat, { updateMetadata: false }), ctx = doc.context;
    var id = rand(16), Pm = (0xFFFFF0C0 | 256 | 512 | (allowPrint ? 4 | 2048 : 0) | (allowCopy ? 16 : 0)) | 0;
    var O = rc4x(md5(padPw(ownerPw || userPw)).length ? (function () { var h = md5(padPw(ownerPw || userPw)); for (var i = 0; i < 50; i++) h = md5(h); return h.slice(0, 16); })() : null, padPw(userPw), 19);
    var pb = new Uint8Array(4); new DataView(pb.buffer).setInt32(0, Pm, true);
    var key = md5(cat(cat(cat(padPw(userPw), O), pb), id)); for (var i = 0; i < 50; i++) key = md5(key.slice(0, 16)); key = key.slice(0, 16);
    var U = cat(rc4x(key, md5(cat(PAD, id)), 19), new Uint8Array(16));
    var items = ctx.enumerateIndirectObjects();
    async function objKey(ref) {
      var t = new Uint8Array([ref.objectNumber & 255, (ref.objectNumber >> 8) & 255, (ref.objectNumber >> 16) & 255, ref.generationNumber & 255, (ref.generationNumber >> 8) & 255, 0x73, 0x41, 0x6c, 0x54]);
      return md5(cat(key, t)).slice(0, 16);
    }
    async function walk(v, k) {
      if (v instanceof L.PDFString || v instanceof L.PDFHexString) { var e = await aesEnc(k, v.asBytes()); return L.PDFHexString.of(hex(e)); }
      if (v instanceof L.PDFDict) { var es = v.entries(); for (var q = 0; q < es.length; q++) { var nv = await walk(es[q][1], k); if (nv !== es[q][1]) v.set(es[q][0], nv); } return v; }
      if (v instanceof L.PDFArray) { for (var z = 0; z < v.size(); z++) { var o0 = v.get(z), n0 = await walk(o0, k); if (n0 !== o0) v.set(z, n0); } return v; }
      return v;
    }
    for (var n = 0; n < items.length; n++) {
      var ref = items[n][0], obj = items[n][1], k = await objKey(ref);
      if (obj instanceof L.PDFRawStream) { obj.contents = await aesEnc(k, obj.contents); await walk(obj.dict, k); }
      else if (obj instanceof L.PDFStream) { var raw = obj.getContents(); var rs = L.PDFRawStream.of(obj.dict, await aesEnc(k, raw)); ctx.assign(ref, rs); await walk(obj.dict, k); }
      else await walk(obj, k);
    }
    var enc = ctx.obj({ Filter: 'Standard', V: 4, R: 4, Length: 128, CF: { StdCF: { AuthEvent: 'DocOpen', CFM: 'AESV2', Length: 16 } }, StmF: 'StdCF', StrF: 'StdCF', O: L.PDFHexString.of(hex(O)), U: L.PDFHexString.of(hex(U)), P: Pm });
    ctx.trailerInfo.Encrypt = ctx.register(enc);
    ctx.trailerInfo.ID = ctx.obj([L.PDFHexString.of(hex(id)), L.PDFHexString.of(hex(id))]);
    return doc.save({ useObjectStreams: false, addDefaultPage: false, updateFieldAppearances: false });
  }

  A({
    cat: 'pdf', icon: '🔒', title: 'Protect PDF', desc: 'PDF पर password लगाएँ (AES-128) — खोलने के लिए password चाहिए', tag: 'PDF', top: true,
    inputs: [{ id: 'f', label: 'PDF चुनें', accept: PDFACC }],
    fields: [
      { id: 'pw', label: 'नया Password', type: 'text', placeholder: 'कम से कम 4 अक्षर' }, { id: 'pw2', label: 'Password दोबारा', type: 'text' },
      { id: 'own', label: 'Owner password (वैकल्पिक)', type: 'text', help: 'खाली = वही password' },
      { id: 'pr', label: 'Print की अनुमति', type: 'checkbox', value: true }, { id: 'cp', label: 'Text copy की अनुमति', type: 'checkbox', value: true }
    ],
    hint: 'Password भूल गए तो फ़ाइल वापस नहीं खुलेगी — Password कहीं लिख लें। यह फ़ाइल में AES-128 encryption जोड़ता है; password आपके browser से बाहर नहीं जाता।',
    action: '🔒 Password लगाएँ',
    run: async function (c) {
      var pw = String(c.v('pw')); if (pw.length < 4) throw new Error('Password कम से कम 4 अक्षर का रखें।'); if (pw !== String(c.v('pw2'))) throw new Error('दोनों Password एक जैसे नहीं हैं।');
      var L = await H.pdfLib(), f = c.file(), bytes = new Uint8Array(await f.arrayBuffer());
      var out;
      try { out = await protectPdf(L, bytes, pw, String(c.v('own')), c.v('pr'), c.v('cp')); }
      catch (e) { if (/encrypt/i.test(e && e.message)) throw new Error('यह PDF पहले से password-protected है। पहले “Unlock PDF” करें।'); throw e; }
      c.out(new Blob([out], { type: 'application/pdf' }), H.base(f.name) + '_protected.pdf');
      return 'Password लगी PDF तैयार (AES-128)।';
    }
  });

  /* ---------- Crop PDF ---------- */
  A({
    cat: 'pdf', icon: '✂️', title: 'Crop PDF', desc: 'PDF pages के किनारे (margin) काटें — mm में', tag: 'PDF', top: true,
    inputs: [{ id: 'f', label: 'PDF चुनें', accept: PDFACC }],
    fields: [
      { id: 't', label: 'ऊपर से काटें (mm)', type: 'number', value: 10, min: 0 }, { id: 'b', label: 'नीचे से काटें (mm)', type: 'number', value: 10, min: 0 },
      { id: 'l', label: 'बाएँ से काटें (mm)', type: 'number', value: 10, min: 0 }, { id: 'r', label: 'दाएँ से काटें (mm)', type: 'number', value: 10, min: 0 },
      { id: 'pages', label: 'कौन से pages (खाली = सभी)', type: 'text', placeholder: '1-3,5', full: true }
    ],
    run: async function (c) {
      var L = await H.pdfLib(), f = c.file(), doc = await X.loadDoc(f), n = doc.getPageCount();
      var sel = String(c.v('pages')).trim() ? H.pages(c.v('pages'), n) : doc.getPages().map(function (_, i) { return i; });
      var m = { l: c.v('l') * MM, r: c.v('r') * MM, t: c.v('t') * MM, b: c.v('b') * MM };
      sel.forEach(function (i) {
        var pg = doc.getPage(i), info = X.pinfo(pg), rot = info.r, u;
        if (rot === 0) u = { l: m.l, r: m.r, t: m.t, b: m.b }; else if (rot === 90) u = { l: m.t, r: m.b, b: m.l, t: m.r }; else if (rot === 180) u = { r: m.l, l: m.r, b: m.t, t: m.b }; else u = { l: m.b, r: m.t, t: m.l, b: m.r };
        var cb = info.cb, nw = cb.width - u.l - u.r, nh = cb.height - u.t - u.b;
        if (nw < 20 || nh < 20) throw new Error('Page ' + (i + 1) + ' में इतना हिस्सा नहीं बचेगा। मान घटाएँ।');
        pg.setCropBox(cb.x + u.l, cb.y + u.b, nw, nh); pg.setMediaBox(cb.x + u.l, cb.y + u.b, nw, nh);
      });
      c.out(X.pdfBlob(await doc.save({ updateFieldAppearances: false })), H.base(f.name) + '_cropped.pdf');
      return sel.length + ' pages crop हुए।';
    }
  });

  /* ---------- Repair ---------- */
  A({
    cat: 'pdf', icon: '🛠️', title: 'Repair PDF', desc: 'खराब/अधूरी PDF को दोबारा बनाकर खोलने लायक करें', tag: 'PDF', top: true,
    inputs: [{ id: 'f', label: 'खराब PDF चुनें', accept: PDFACC }],
    fields: [X.pwField()],
    hint: 'पहले PDF की बनावट ठीक की जाती है। न हो सके तो pages को फोटो बनाकर नई PDF बनती है (तब text select नहीं होगा)। पूरी तरह नष्ट फ़ाइल वापस नहीं आ सकती।',
    run: async function (c) {
      var L = await H.pdfLib(), f = c.file(), bytes = new Uint8Array(await f.arrayBuffer()), out = null, how = '';
      try {
        var d = await L.PDFDocument.load(bytes, { ignoreEncryption: false, throwOnInvalidObject: false, updateMetadata: false });
        if (d.getPageCount() > 0) { out = await d.save({ useObjectStreams: false, updateFieldAppearances: false }); how = 'PDF की बनावट ठीक कर दी गई (text वैसा ही रहा)।'; }
      } catch (e) { out = null; }
      if (!out) {
        c.status('⏳ बनावट ठीक नहीं हुई, pages को फोटो बनाकर बना रहे हैं…');
        var js = await X.openJs(f, c.v('pw')), doc = await L.PDFDocument.create();
        for (var i = 1; i <= js.numPages; i++) { var cv = await X.renderPage(js, i, 2), emb = await X.embedCanvas(L, doc, cv, false), pg = doc.addPage([cv.width * 0.36, cv.height * 0.36]); pg.drawImage(emb, { x: 0, y: 0, width: pg.getWidth(), height: pg.getHeight() }); }
        out = await doc.save(); how = 'Pages को फोटो बनाकर नई PDF बनी (text select नहीं होगा)।';
      }
      c.out(new Blob([out], { type: 'application/pdf' }), H.base(f.name) + '_repaired.pdf');
      return how;
    }
  });

  /* ---------- Organize (visual) ---------- */
  A({
    cat: 'pdf', icon: '🗂️', title: 'Organize PDF', desc: 'pages देखकर आगे-पीछे करें, घुमाएँ या हटाएँ', tag: 'PDF', top: true,
    inputs: [{ id: 'f', label: 'PDF चुनें', accept: PDFACC, onFiles: function (arr, S, api) { if (S.orgLoad) S.orgLoad(arr[0]); } }],
    fields: [X.pwField()],
    action: '✅ नई PDF बनाएँ',
    hint: 'PDF चुनते ही pages नीचे दिखेंगे। ◀ ▶ से क्रम, ⟳ से घुमाव, ✕ से हटाना। फिर “नई PDF बनाएँ”। Password वाली PDF में पहले Password भरकर फिर फ़ाइल चुनें।',
    custom: function (c) {
      var S = c.S, root = $('#plusCustom'); root.innerHTML = '<div class="plus-org" id="orgGrid"></div>';
      var st = S.org = { items: [] };
      function draw() {
        var g = $('#orgGrid'); g.innerHTML = '';
        st.items.forEach(function (it, i) {
          var d = document.createElement('div'); d.className = 'plus-org-item' + (it.del ? ' is-del' : '');
          var wrap = document.createElement('div'); wrap.className = 'plus-org-th'; it.cv.style.transform = 'rotate(' + it.rot + 'deg)'; wrap.appendChild(it.cv);
          var cap = document.createElement('div'); cap.className = 'plus-org-cap'; cap.textContent = 'Page ' + (it.idx + 1) + (it.rot ? ' • ' + it.rot + '°' : '') + (it.del ? ' • हटेगा' : '');
          var bt = document.createElement('div'); bt.className = 'plus-btns';
          [['◀', 'l', 'पीछे'], ['▶', 'r', 'आगे'], ['⟳', 'rot', 'घुमाएँ'], [it.del ? '↩' : '✕', 'del', it.del ? 'वापस लाएँ' : 'हटाएँ']].forEach(function (b) { var bb = document.createElement('button'); bb.type = 'button'; bb.textContent = b[0]; bb.title = b[2]; bb.setAttribute('aria-label', b[2] + ' page ' + (it.idx + 1)); bb.addEventListener('click', function () {
            if (b[1] === 'l' && i > 0) { var t = st.items[i - 1]; st.items[i - 1] = it; st.items[i] = t; } else if (b[1] === 'r' && i < st.items.length - 1) { var t2 = st.items[i + 1]; st.items[i + 1] = it; st.items[i] = t2; } else if (b[1] === 'rot') it.rot = (it.rot + 90) % 360; else if (b[1] === 'del') it.del = !it.del;
            draw(); }); bt.appendChild(bb); });
          d.appendChild(wrap); d.appendChild(cap); d.appendChild(bt); g.appendChild(d);
        });
      }
      S.orgLoad = async function (file) {
        try {
          c.status('⏳ Pages खुल रहे हैं…'); var js = await X.openJs(file, c.v('pw')); st.items = []; st.n = js.numPages;
          if (js.numPages > 200) throw new Error('200 से ज़्यादा pages वाली PDF के लिए “Extract / Reorder Pages” इस्तेमाल करें।');
          for (var i = 1; i <= js.numPages; i++) { var cv = await X.renderPage(js, i, 0.3); st.items.push({ idx: i - 1, rot: 0, del: false, cv: cv }); if (i % 6 === 0) { draw(); await new Promise(function (r) { setTimeout(r, 0); }); } }
          draw(); c.status(js.numPages + ' pages खुल गए। अब क्रम/घुमाव/हटाना तय करके नीचे बटन दबाएँ।');
        } catch (e) { st.items = []; draw(); c.status('❌ ' + e.message, 'err'); }
      };
    },
    run: async function (c) {
      var st = c.S.org; if (!st || !st.items.length) throw new Error('पहले PDF चुनें।');
      var keep = st.items.filter(function (i) { return !i.del; }); if (!keep.length) throw new Error('सभी pages हटा दिए हैं। कम से कम एक रखें।');
      var L = await H.pdfLib(), f = c.file(), src = await X.loadDoc(f), out = await L.PDFDocument.create(), pages = await out.copyPages(src, keep.map(function (i) { return i.idx; }));
      pages.forEach(function (p, k) { if (keep[k].rot) p.setRotation(L.degrees((X.rotOf(p) + keep[k].rot) % 360)); out.addPage(p); });
      c.out(X.pdfBlob(await out.save({ updateFieldAppearances: false })), H.base(f.name) + '_organized.pdf');
      return keep.length + ' pages की नई PDF बनी।';
    }
  });

  /* ---------- Redact ---------- */
  A({
    cat: 'pdf', icon: '⬛', title: 'Redact PDF', desc: 'PDF के page पर नंबर/नाम हमेशा के लिए छुपाएँ (नीचे का text भी हट जाता है)', tag: 'PDF', top: true,
    inputs: [{ id: 'f', label: 'PDF चुनें', accept: PDFACC, onFiles: function (arr, S) { if (S.rdLoad) S.rdLoad(arr[0]); } }],
    fields: [{ id: 'page', label: 'कौन सा page', type: 'number', value: 1, min: 1 }, X.pwField(), { id: 'mode', label: 'रंग', type: 'select', value: 'black', options: [['black', 'काला'], ['white', 'सफ़ेद']] }],
    action: '✅ Redact करके PDF बनाएँ',
    hint: 'Page नंबर और password तय करके PDF चुनें, फिर तस्वीर पर डिब्बे खींचें। उस page को फोटो बनाकर बदला जाता है, इसलिए छुपाया हिस्सा PDF में बचता ही नहीं (बाकी pages जैसे थे वैसे)। दूसरे page के लिए यही PDF फिर चुनें।',
    custom: function (c) {
      var S = c.S, root = $('#plusCustom');
      root.innerHTML = '<div class="plus-cvwrap"><canvas id="rdCv" class="plus-cv" width="600" height="360" aria-label="Redact करने के लिए page"></canvas></div><div class="v41-actions"><button class="secondary-btn" id="rdUndo" type="button">↶ पिछला हटाएँ</button><button class="secondary-btn" id="rdClear" type="button">सब हटाएँ</button><button class="secondary-btn" id="rdReload" type="button">🔄 Page दोबारा खोलें</button></div>';
      var cv = $('#rdCv'), x = cv.getContext('2d'), st = S.rd = { base: null, rects: [] }, drag = null;
      function draw() {
        if (!st.base) { x.fillStyle = '#f2f4f7'; x.fillRect(0, 0, cv.width, cv.height); x.fillStyle = '#667085'; x.font = '20px sans-serif'; x.textAlign = 'center'; x.fillText('पहले PDF चुनें', cv.width / 2, cv.height / 2); return; }
        x.drawImage(st.base, 0, 0); var lw = Math.max(2, cv.width / 300);
        st.rects.concat(drag ? [drag] : []).forEach(function (r) { x.fillStyle = 'rgba(220,0,0,.28)'; x.fillRect(r.x, r.y, r.w, r.h); x.strokeStyle = '#d00000'; x.lineWidth = lw; x.strokeRect(r.x, r.y, r.w, r.h); });
      }
      draw();
      S.rdLoad = async function (file) {
        try {
          c.status('⏳ Page खुल रहा है…'); var js = await X.openJs(file, c.v('pw')), n = Math.min(js.numPages, Math.max(1, Math.floor(c.v('page'))));
          var base = await X.renderPage(js, n, 2.5); st.base = base; st.n = n; st.rects = []; cv.width = base.width; cv.height = base.height; draw();
          c.status('Page ' + n + ' खुला। अब छुपाने वाले हिस्सों पर डिब्बे खींचें।');
        } catch (e) { c.status('❌ ' + e.message, 'err'); }
      };
      $('#rdReload').addEventListener('click', function () { var f = c.file(); if (f) S.rdLoad(f); });
      cv.addEventListener('pointerdown', function (e) { if (!st.base) return; cv.setPointerCapture(e.pointerId); var p = ptr(e, cv); drag = { sx: p.x, sy: p.y, x: p.x, y: p.y, w: 0, h: 0 }; e.preventDefault(); });
      cv.addEventListener('pointermove', function (e) { if (!drag) return; var p = ptr(e, cv); drag.x = Math.min(drag.sx, p.x); drag.y = Math.min(drag.sy, p.y); drag.w = Math.abs(p.x - drag.sx); drag.h = Math.abs(p.y - drag.sy); draw(); });
      function end() { if (!drag) return; if (drag.w > 4 && drag.h > 4) st.rects.push({ x: drag.x, y: drag.y, w: drag.w, h: drag.h }); drag = null; draw(); c.status(st.rects.length + ' हिस्से चुने गए।'); }
      cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
      $('#rdUndo').addEventListener('click', function () { st.rects.pop(); draw(); }); $('#rdClear').addEventListener('click', function () { st.rects = []; draw(); });
    },
    run: async function (c) {
      var st = c.S.rd; if (!st || !st.base) throw new Error('पहले PDF चुनें।'); if (!st.rects.length) throw new Error('कम से कम एक डिब्बा खींचें।');
      var out = H.canvas(st.base.width, st.base.height), x = out.getContext('2d'); x.drawImage(st.base, 0, 0); x.fillStyle = c.v('mode') === 'white' ? '#fff' : '#000'; st.rects.forEach(function (r) { x.fillRect(r.x, r.y, r.w, r.h); });
      var L = await H.pdfLib(), f = c.file(), doc = await X.loadDoc(f), idx = st.n - 1, pg = doc.getPage(idx), info = X.pinfo(pg);
      var emb = await X.embedCanvas(L, doc, out, true), np = doc.insertPage(idx, [info.dw, info.dh]); np.drawImage(emb, { x: 0, y: 0, width: info.dw, height: info.dh }); doc.removePage(idx + 1);
      c.out(X.pdfBlob(await doc.save({ updateFieldAppearances: false })), H.base(f.name) + '_redacted.pdf');
      return 'Page ' + st.n + ' पर ' + st.rects.length + ' हिस्से छुपाए गए।';
    }
  });

  /* ---------- Compare ---------- */
  A({
    cat: 'pdf', icon: '🆚', title: 'Compare PDF', desc: 'दो PDF को pages के हिसाब से मिलाकर फ़र्क लाल रंग में देखें', tag: 'PDF', top: true,
    inputs: [{ id: 'a', label: 'पहली PDF (पुरानी)', accept: PDFACC }, { id: 'b', label: 'दूसरी PDF (नई)', accept: PDFACC }],
    fields: [{ id: 'sens', label: 'संवेदनशीलता', type: 'range', value: 60, min: 20, max: 150, step: 5, help: 'कम = छोटा फ़र्क भी पकड़ेगा' }],
    hint: 'यह page को फोटो बनाकर pixel से तुलना करता है (दृश्य तुलना), text की शब्द-दर-शब्द तुलना नहीं।',
    action: '🆚 तुलना करें',
    run: async function (c) {
      var L = await H.pdfLib(), ja = await X.openJs(c.file('a')), jb = await X.openJs(c.file('b')), n = Math.min(ja.numPages, jb.numPages), doc = await L.PDFDocument.create(), thr = c.v('sens') * 3, rows = '', changed = 0;
      if (n > 40) throw new Error('तुलना के लिए अधिकतम 40 pages।');
      for (var i = 1; i <= n; i++) {
        c.status('⏳ Page ' + i + '/' + n);
        var ca = await X.renderPage(ja, i, 1.0), cb0 = await X.renderPage(jb, i, 1.0), cb = H.canvas(ca.width, ca.height, '#fff'); cb.getContext('2d').drawImage(cb0, 0, 0, ca.width, ca.height);
        var da = ca.getContext('2d').getImageData(0, 0, ca.width, ca.height), db = cb.getContext('2d').getImageData(0, 0, ca.width, ca.height), dd = new ImageData(ca.width, ca.height), cnt = 0, tot = ca.width * ca.height;
        for (var p = 0; p < da.data.length; p += 4) {
          var df = Math.abs(da.data[p] - db.data[p]) + Math.abs(da.data[p + 1] - db.data[p + 1]) + Math.abs(da.data[p + 2] - db.data[p + 2]), g = 255 - (255 - (db.data[p] + db.data[p + 1] + db.data[p + 2]) / 3) * 0.35;
          if (df > thr) { dd.data[p] = 230; dd.data[p + 1] = 0; dd.data[p + 2] = 0; cnt++; } else { dd.data[p] = dd.data[p + 1] = dd.data[p + 2] = g; }
          dd.data[p + 3] = 255;
        }
        var cd = H.canvas(ca.width, ca.height); cd.getContext('2d').putImageData(dd, 0, 0);
        var w = ca.width, h = ca.height, W = w * 3 + 40, Hh = h + 90, sheet = H.canvas(W, Hh, '#fff'), sx = sheet.getContext('2d');
        sx.drawImage(ca, 10, 70); sx.drawImage(cb, w + 20, 70); sx.drawImage(cd, w * 2 + 30, 70); sx.strokeStyle = '#999'; [10, w + 20, w * 2 + 30].forEach(function (xx) { sx.strokeRect(xx, 70, w, h); });
        var pct = cnt / tot * 100, tcv = H.textCanvas('Page ' + i + '   |   पुरानी PDF          नई PDF          फ़र्क (लाल)   |   बदलाव ' + pct.toFixed(2) + '%', { px: 26, bold: true }); sx.drawImage(tcv, 10, 14, Math.min(tcv.width, W - 20), tcv.height * Math.min(1, (W - 20) / tcv.width));
        var emb = await X.embedCanvas(L, doc, sheet, false), pg = doc.addPage([W * 0.6, Hh * 0.6]); pg.drawImage(emb, { x: 0, y: 0, width: pg.getWidth(), height: pg.getHeight() });
        if (pct > 0.02) changed++; rows += '<tr><td>' + i + '</td><td>' + pct.toFixed(2) + '%</td><td>' + (pct > 0.02 ? '⚠️ बदलाव' : '✅ वही') + '</td></tr>';
      }
      var extra = ja.numPages !== jb.numPages ? '<p class="plus-warn">⚠️ Pages की संख्या अलग है: पहली PDF में ' + ja.numPages + ', दूसरी में ' + jb.numPages + '। सिर्फ़ पहले ' + n + ' pages मिलाए गए।</p>' : '';
      c.html(extra + '<div class="plus-scroll"><table class="plus-table"><thead><tr><th>Page</th><th>बदलाव</th><th>स्थिति</th></tr></thead><tbody>' + rows + '</tbody></table></div>');
      c.out(X.pdfBlob(await doc.save()), 'Compare_result.pdf');
      return n + ' pages में से ' + changed + ' में फ़र्क मिला।';
    }
  });

  /* ---------- Scan to PDF ---------- */
  function enhance(cv, mode, strength) {
    var w = cv.width, h = cv.height, x = cv.getContext('2d'), id = x.getImageData(0, 0, w, h), d = id.data, g = new Uint8ClampedArray(w * h), i, j;
    for (i = 0, j = 0; i < d.length; i += 4, j++) g[j] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    if (mode === 'bw') {
      var W = w + 1, ii = new Uint32Array(W * (h + 1)), yy, xx;
      for (yy = 0; yy < h; yy++) { var row = 0; for (xx = 0; xx < w; xx++) { row += g[yy * w + xx]; ii[(yy + 1) * W + xx + 1] = ii[yy * W + xx + 1] + row; } }
      var r = Math.max(8, Math.round(Math.min(w, h) / 40)), C = strength / 100;
      for (yy = 0; yy < h; yy++) { var y0 = Math.max(0, yy - r), y1 = Math.min(h, yy + r + 1); for (xx = 0; xx < w; xx++) { var x0 = Math.max(0, xx - r), x1 = Math.min(w, xx + r + 1), mean = (ii[y1 * W + x1] - ii[y0 * W + x1] - ii[y1 * W + x0] + ii[y0 * W + x0]) / ((x1 - x0) * (y1 - y0)), v = g[yy * w + xx] < mean * (1 - C) ? 0 : 255, p = (yy * w + xx) * 4; d[p] = d[p + 1] = d[p + 2] = v; d[p + 3] = 255; } }
    } else if (mode === 'color') {
      var hist = new Uint32Array(256); for (j = 0; j < g.length; j += 3) hist[g[j]]++; var tot = g.length / 3, acc = 0, lo = 0, hi = 255, v2;
      for (v2 = 0; v2 < 256; v2++) { acc += hist[v2]; if (acc > tot * 0.01) { lo = v2; break; } } acc = 0; for (v2 = 255; v2 >= 0; v2--) { acc += hist[v2]; if (acc > tot * 0.01) { hi = v2; break; } }
      hi = Math.max(lo + 20, hi - 5); var s = 255 / (hi - lo);
      for (i = 0; i < d.length; i += 4) for (var k = 0; k < 3; k++) { var q = (d[i + k] - lo) * s; d[i + k] = q < 0 ? 0 : q > 255 ? 255 : q; }
    }
    x.putImageData(id, 0, 0); return cv;
  }
  A({
    cat: 'pdf', icon: '📷', title: 'Scan to PDF', desc: 'मोबाइल से खींचे कागज़ की फोटो को साफ़ scan बनाकर PDF में जोड़ें', tag: 'PDF', top: true,
    inputs: [{ id: 'f', label: 'कागज़ों की फोटो चुनें (क्रम ↑↓ से बदलें)', accept: 'image/*', multiple: true }],
    fields: [
      { id: 'mode', label: 'सफ़ाई', type: 'select', value: 'bw', options: [['bw', 'काला-सफ़ेद scan (text के लिए बेस्ट)'], ['color', 'रंगीन — चमक ठीक करें'], ['none', 'जैसा है वैसा']] },
      { id: 'str', label: 'काला-सफ़ेद की तीव्रता', type: 'range', value: 12, min: 4, max: 30, step: 1, show: function (v) { return v('mode') === 'bw'; } },
      { id: 'size', label: 'Page', type: 'select', value: 'a4', options: [['a4', 'A4 (फोटो बीच में फिट)'], ['fit', 'फोटो के नाप का']] }
    ],
    run: async function (c) {
      var L = await H.pdfLib(), files = c.files('f'), doc = await L.PDFDocument.create();
      for (var i = 0; i < files.length; i++) {
        c.status('⏳ ' + (i + 1) + '/' + files.length);
        var img = await H.loadImg(files[i]), s = Math.min(1, Math.sqrt(10e6 / (img.naturalWidth * img.naturalHeight))), cv = H.canvas(img.naturalWidth * s, img.naturalHeight * s, '#fff');
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); if (c.v('mode') !== 'none') enhance(cv, c.v('mode'), c.v('str'));
        var emb = await X.embedCanvas(L, doc, cv, false);
        if (c.v('size') === 'a4') { var land = cv.width > cv.height, PW = land ? 841.89 : 595.28, PH = land ? 595.28 : 841.89, f2 = H.fitInto(cv.width, cv.height, PW - 20, PH - 20); doc.addPage([PW, PH]).drawImage(emb, { x: (PW - f2.w) / 2, y: (PH - f2.h) / 2, width: f2.w, height: f2.h }); }
        else doc.addPage([cv.width * 0.36, cv.height * 0.36]).drawImage(emb, { x: 0, y: 0, width: cv.width * 0.36, height: cv.height * 0.36 });
      }
      c.out(X.pdfBlob(await doc.save()), 'Scan.pdf'); return files.length + ' pages की scan PDF बनी।';
    }
  });

  /* ---------- HTML / Text -> PDF ---------- */
  function cleanHtml(src) {
    var d = new DOMParser().parseFromString(src, 'text/html');
    d.querySelectorAll('script,iframe,object,embed,link,meta,base,form').forEach(function (n) { n.remove(); });
    d.querySelectorAll('*').forEach(function (n) { Array.prototype.slice.call(n.attributes).forEach(function (a) { if (/^on/i.test(a.name) || (/^(src|href|xlink:href|poster)$/i.test(a.name) && !/^data:image\//i.test(a.value) && !/^#/.test(a.value) && a.name !== 'href')) n.removeAttribute(a.name); }); });
    return new XMLSerializer().serializeToString(d.body).replace(/^<body[^>]*>|<\/body>$/g, '');
  }
  A({
    cat: 'pdf', icon: '🌐', title: 'HTML / Text → PDF', desc: 'लिखा हुआ text या HTML paste करके PDF बनाएँ (हिंदी भी)', tag: 'PDF', top: true,
    fields: [
      { id: 'kind', label: 'क्या paste कर रहे हैं', type: 'select', value: 'text', options: [['text', 'सादा text'], ['html', 'HTML code']] },
      { id: 'body', label: 'Text / HTML', type: 'textarea', rows: 10, full: true, placeholder: 'यहाँ paste करें…' },
      { id: 'fs', label: 'अक्षर का size (px)', type: 'number', value: 16, min: 8, max: 40 }, { id: 'mg', label: 'किनारा (mm)', type: 'number', value: 15, min: 5, max: 40 }
    ],
    hint: 'बाहर की फोटो/CSS/script नहीं चलते (सुरक्षा के लिए)। inline style और data: फोटो चलेंगी। लंबा हिस्सा pages में बँटता है, कभी लाइन बीच से कट सकती है।',
    action: '📄 PDF बनाएँ',
    run: async function (c) {
      var raw = String(c.v('body')); if (!raw.trim()) throw new Error('पहले text या HTML लिखें/paste करें।');
      var fs = c.v('fs'), mg = c.v('mg'), Wpx = 794, inner = c.v('kind') === 'html' ? cleanHtml(raw) : '<div style="white-space:pre-wrap">' + esc(raw) + '</div>';
      var padPx = Math.round(mg * 96 / 25.4), style = 'width:' + (Wpx - 2 * padPx) + 'px;padding:' + padPx + 'px;font:' + fs + 'px/1.5 ' + H.fontStack.replace(/"/g, "'") + ';color:#000;background:#fff;box-sizing:content-box;';
      var probe = document.createElement('div'); probe.style.cssText = 'position:fixed;left:-99999px;top:0;' + style; probe.innerHTML = inner; document.body.appendChild(probe);
      var Ht = Math.ceil(probe.scrollHeight); document.body.removeChild(probe);
      var PH = Math.round(Wpx * 297 / 210), pages = Math.ceil(Ht / PH); if (pages > 30) throw new Error('बहुत लंबा है (30 pages तक)।');
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + Wpx + '" height="' + (pages * PH) + '"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="' + style + 'min-height:' + (pages * PH - 2 * padPx) + 'px">' + inner + '</div></foreignObject></svg>';
      var img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      await new Promise(function (ok, no) { img.onload = ok; img.onerror = function () { no(new Error('HTML को दिखाया नहीं जा सका। Code जाँचें।')); }; });
      var sc = 2, big = H.canvas(Wpx * sc, pages * PH * sc, '#fff'), bx = big.getContext('2d'); bx.drawImage(img, 0, 0, big.width, big.height);
      var L = await H.pdfLib(), doc = await L.PDFDocument.create();
      for (var p = 0; p < pages; p++) { var cv = H.canvas(Wpx * sc, PH * sc, '#fff'); cv.getContext('2d').drawImage(big, 0, p * PH * sc, Wpx * sc, PH * sc, 0, 0, Wpx * sc, PH * sc); var emb = await X.embedCanvas(L, doc, cv, false); doc.addPage([595.28, 841.89]).drawImage(emb, { x: 0, y: 0, width: 595.28, height: 841.89 }); }
      c.out(X.pdfBlob(await doc.save()), 'Document.pdf'); return pages + ' page की PDF बनी (text select नहीं होगा)।';
    }
  });
})();
