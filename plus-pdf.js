/* plus-pdf.js — PDF tools (pdf-lib + pdf.js, sab browser mein) */
(function () {
  'use strict';
  var P = window.PLUS, H = P.H, A = P.add, esc = H.esc;
  var PDFACC = 'application/pdf,.pdf';
  var A4W = 595.28, A4H = 841.89;
  var MM = 72 / 25.4;

  /* ---------- helpers ---------- */
  async function loadDoc(file) {
    var L = await H.pdfLib();
    var bytes = new Uint8Array(await file.arrayBuffer());
    try { return await L.PDFDocument.load(bytes, { updateMetadata: false }); }
    catch (e) {
      if (/encrypt/i.test(e && e.message)) throw new Error('"' + file.name + '" password-protected है। पहले “Unlock PDF” टूल से password हटाएँ।');
      throw new Error('"' + file.name + '" पढ़ी नहीं जा सकी (फ़ाइल खराब या असमर्थित है)।');
    }
  }
  function pdfBlob(bytes) { return new Blob([bytes], { type: 'application/pdf' }); }
  function rotOf(page) { return ((Math.round(page.getRotation().angle) % 360) + 360) % 360; }
  function pinfo(page) {
    var cb = page.getCropBox ? page.getCropBox() : page.getMediaBox();
    var r = rotOf(page), w = cb.width, h = cb.height, sw = (r === 90 || r === 270);
    return { cb: cb, r: r, w: w, h: h, dw: sw ? h : w, dh: sw ? w : h };
  }
  // display coords (bottom-left origin) -> user-space coords + extra rotation
  function place(info, dx, dy) {
    var cb = info.cb, w = info.w, h = info.h;
    if (info.r === 90) return { x: cb.x + (w - dy), y: cb.y + dx, rot: 90 };
    if (info.r === 180) return { x: cb.x + (w - dx), y: cb.y + (h - dy), rot: 180 };
    if (info.r === 270) return { x: cb.x + dy, y: cb.y + (h - dx), rot: -90 };
    return { x: cb.x + dx, y: cb.y + dy, rot: 0 };
  }
  H.pinfo = pinfo; H.place = place;
  // embedded page ko box mein (rotation ke saath) fit karke banayein
  function drawFit(page, emb, rot, bx, by, bw, bh, L) {
    var ew = emb.width, eh = emb.height, sw = (rot === 90 || rot === 270);
    var dw = sw ? eh : ew, dh = sw ? ew : eh, s = Math.min(bw / dw, bh / dh);
    var W = dw * s, Hh = dh * s, ox = bx + (bw - W) / 2, oy = by + (bh - Hh) / 2, w = ew * s, h = eh * s;
    var o = { width: w, height: h, x: ox, y: oy };
    if (rot === 90) { o.y = oy + w; o.rotate = L.degrees(-90); }
    else if (rot === 180) { o.x = ox + w; o.y = oy + h; o.rotate = L.degrees(-180); }
    else if (rot === 270) { o.x = ox + h; o.rotate = L.degrees(90); }
    page.drawPage(emb, o);
  }
  async function embedImg(L, doc, file, maxSide) {
    var img = await H.loadImg(file), w = img.naturalWidth, h = img.naturalHeight;
    if (maxSide && Math.max(w, h) > maxSide) { var s = maxSide / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); }
    var png = file.type === 'image/png';
    var c = H.canvas(w, h, png ? null : '#fff'); c.getContext('2d').drawImage(img, 0, 0, w, h);
    var bytes = await H.bytes(await H.toBlob(c, png ? 'image/png' : 'image/jpeg', 0.93));
    return { emb: png ? await doc.embedPng(bytes) : await doc.embedJpg(bytes), w: w, h: h };
  }
  async function embedCanvas(L, doc, canvas, png) {
    var bytes = await H.bytes(await H.toBlob(canvas, png ? 'image/png' : 'image/jpeg', 0.92));
    return png ? doc.embedPng(bytes) : doc.embedJpg(bytes);
  }
  async function addImagePage(L, out, file, fit) {
    var r = await embedImg(L, out, file), w = r.w, h = r.h;
    if (fit) {
      var land = w > h, PW = land ? A4H : A4W, PH = land ? A4W : A4H, m = 20, f = H.fitInto(w, h, PW - 2 * m, PH - 2 * m);
      out.addPage([PW, PH]).drawImage(r.emb, { x: (PW - f.w) / 2, y: (PH - f.h) / 2, width: f.w, height: f.h });
    } else out.addPage([w * 0.75, h * 0.75]).drawImage(r.emb, { x: 0, y: 0, width: w * 0.75, height: h * 0.75 });
  }
  async function openJs(file, password) {
    var lib = await H.pdfjs();
    var task = lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()), password: password || undefined });
    try { return await task.promise; }
    catch (e) {
      if (e && e.name === 'PasswordException') throw new Error(e.code === 2 ? 'Password गलत है। सही password डालें।' : 'यह PDF password-protected है। नीचे Password भरें।');
      throw new Error('PDF खुल नहीं सकी (फ़ाइल खराब या असमर्थित है)।');
    }
  }
  async function renderPage(doc, n, scale) {
    var p = await doc.getPage(n), v = p.getViewport({ scale: scale });
    var c = H.canvas(Math.ceil(v.width), Math.ceil(v.height), '#fff');
    await p.render({ canvasContext: c.getContext('2d'), viewport: v }).promise;
    return c;
  }
  async function copyInto(L, out, src, idx) {
    var pages = await out.copyPages(src, idx);
    pages.forEach(function (p) { out.addPage(p); });
  }
  function pwField(show) { var f = { id: 'pw', label: 'PDF Password (अगर हो)', type: 'password', placeholder: 'सही original password' }; return f; }
  var angleOpts = [['0', 'सीधा (0°)'], ['45', 'तिरछा (45°)'], ['315', 'उल्टा तिरछा (-45°)'], ['90', 'खड़ा (90°)']];
  var colorOpts = [['#888888', 'ग्रे'], ['#d00000', 'लाल'], ['#0a4da8', 'नीला'], ['#000000', 'काला']];
  function hexRgb(L, hex) { var n = parseInt(hex.replace('#', ''), 16); return L.rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255); }

  /* ================= upgraded existing tools ================= */
  A({
    cat: 'pdf', icon: '➕', title: 'Merge PDF', desc: 'कई PDF/फोटो को एक PDF में जोड़ें — quality और text वैसा ही रहता है', tag: 'PDF',
    inputs: [{ id: 'f', label: 'PDF या फोटो चुनें (क्रम ↑↓ से बदलें)', accept: PDFACC + ',image/*', multiple: true }],
    fields: [{ id: 'fit', type: 'checkbox', label: 'फोटो को A4 page में fit करें', value: true }],
    hint: 'जितनी फ़ाइलें चाहें जोड़ें, फिर ↑ ↓ से क्रम ठीक करें।',
    run: async function (c) {
      var L = await H.pdfLib(), files = c.files('f');
      if (files.length < 2) throw new Error('कम से कम 2 files चुनें।');
      var out = await L.PDFDocument.create();
      for (var i = 0; i < files.length; i++) {
        c.status('⏳ ' + (i + 1) + '/' + files.length + ' : ' + files[i].name);
        if (H.isPdf(files[i])) { var src = await loadDoc(files[i]); await copyInto(L, out, src, src.getPageIndices()); }
        else if (H.isImg(files[i])) await addImagePage(L, out, files[i], c.v('fit'));
        else throw new Error('"' + files[i].name + '" PDF या फोटो नहीं है।');
      }
      c.out(pdfBlob(await out.save()), 'Merged.pdf');
      return out.getPageCount() + ' pages की एक PDF बन गई।';
    }
  });

  A({
    cat: 'pdf', icon: '✂️', title: 'Split PDF', desc: 'PDF को pages या हिस्सों में बाँटें', tag: 'PDF',
    inputs: [{ id: 'f', label: 'PDF चुनें', accept: PDFACC }],
    fields: [
      { id: 'mode', label: 'कैसे बाँटना है', type: 'select', value: 'each', options: [['each', 'हर page की अलग PDF'], ['ranges', 'दिए हुए हिस्सों की अलग PDF'], ['every', 'हर N pages पर बाँटें']], full: true },
      { id: 'ranges', label: 'हिस्से (कॉमा से अलग)', type: 'text', value: '1-3,4-6', placeholder: '1-3,4-6,7', show: function (v) { return v('mode') === 'ranges'; }, full: true, help: 'हर कॉमा के बाद वाला हिस्सा एक अलग PDF बनेगा।' },
      { id: 'n', label: 'N (हर कितने pages)', type: 'number', value: 2, min: 1, show: function (v) { return v('mode') === 'every'; } }
    ],
    run: async function (c) {
      var L = await H.pdfLib(), f = c.file(), src = await loadDoc(f), n = src.getPageCount(), b = H.base(f.name), mode = c.v('mode'), groups = [];
      if (mode === 'each') for (var i = 0; i < n; i++) groups.push({ idx: [i], name: b + '_page_' + (i + 1) + '.pdf' });
      else if (mode === 'every') {
        var k = Math.max(1, Math.floor(c.v('n')));
        for (var s = 0; s < n; s += k) { var idx = []; for (var j = s; j < Math.min(n, s + k); j++) idx.push(j); groups.push({ idx: idx, name: b + '_pages_' + (s + 1) + '-' + (s + idx.length) + '.pdf' }); }
      } else {
        String(c.v('ranges')).split(',').map(function (x) { return x.trim(); }).filter(Boolean).forEach(function (part) {
          groups.push({ idx: H.pages(part, n), name: b + '_pages_' + part.replace(/\s/g, '') + '.pdf' });
        });
        if (!groups.length) throw new Error('कम से कम एक हिस्सा लिखें, जैसे 1-3');
      }
      if (groups.length > 300) throw new Error('बहुत ज़्यादा files बनेंगी। हिस्से कम करें।');
      for (var g = 0; g < groups.length; g++) {
        c.status('⏳ ' + (g + 1) + '/' + groups.length);
        var d = await L.PDFDocument.create(); await copyInto(L, d, src, groups[g].idx);
        c.out(pdfBlob(await d.save()), groups[g].name);
      }
      return groups.length + ' PDF files बनीं।';
    }
  });

  A({
    cat: 'pdf', icon: '🗜️', title: 'Compress PDF', desc: 'PDF का size तय KB तक कम करें (scan/photo वाली PDF के लिए)', tag: 'PDF',
    inputs: [{ id: 'f', label: 'PDF चुनें', accept: PDFACC }],
    fields: [{ id: 'kb', label: 'अधिकतम size (KB)', type: 'number', value: 200, min: 10, help: 'जैसे 100, 200, 500' }, pwField()],
    hint: 'Pages को image बनाकर छोटा किया जाता है, इसलिए text select/copy नहीं होगा। तेज़ और भारी scan PDF के लिए सबसे अच्छा।',
    run: async function (c) {
      var L = await H.pdfLib(), f = c.file(), target = Math.max(10, c.v('kb')) * 1024;
      if (f.size <= target) { c.out(f, f.name); return 'यह PDF पहले से ' + H.kb(f.size) + ' की है, जो target से कम है। बदलाव की ज़रूरत नहीं।'; }
      var doc = await openJs(f, c.v('pw')), n = doc.numPages;
      var scales = [1.6, 1.3, 1.05, 0.85, 0.7, 0.55], qs = [0.8, 0.65, 0.5, 0.38, 0.28], best = null;
      var sizes = [];
      for (var p = 1; p <= n; p++) { var pg = await doc.getPage(p), vp = pg.getViewport({ scale: 1 }); sizes.push([vp.width, vp.height]); }
      outer:
      for (var si = 0; si < scales.length; si++) {
        c.status('⏳ Quality जाँची जा रही है (' + (si + 1) + '/' + scales.length + ')…');
        var cans = []; for (var q = 1; q <= n; q++) cans.push(await renderPage(doc, q, scales[si]));
        for (var qi = 0; qi < qs.length; qi++) {
          var parts = [], total = 1500;
          for (var k = 0; k < cans.length; k++) { var by = await H.bytes(await H.toBlob(cans[k], 'image/jpeg', qs[qi])); parts.push(by); total += by.length + 400; }
          best = { parts: parts, total: total };
          if (total <= target * 0.97) break outer;
        }
      }
      var out = await L.PDFDocument.create();
      for (var i = 0; i < n; i++) { var img = await out.embedJpg(best.parts[i]); out.addPage(sizes[i]).drawImage(img, { x: 0, y: 0, width: sizes[i][0], height: sizes[i][1] }); }
      var blob = pdfBlob(await out.save());
      c.out(blob, H.base(f.name) + '_compressed.pdf');
      if (blob.size > target) return 'Target ' + H.kb(target) + ' तक नहीं पहुँच सके; सबसे छोटी PDF ' + H.kb(blob.size) + ' की बनी (पहले ' + H.kb(f.size) + ')।';
      return H.kb(f.size) + ' → ' + H.kb(blob.size) + ' हो गई।';
    }
  });

  function rasterTool(title, mime, ext, icon) {
    A({
      cat: 'pdf', icon: icon, title: title, desc: 'PDF के pages को ' + ext.toUpperCase() + ' फोटो में बदलें', tag: 'PDF',
      inputs: [{ id: 'f', label: 'PDF चुनें', accept: PDFACC }],
      fields: [
        { id: 'pages', label: 'Pages (खाली = सभी)', type: 'text', placeholder: 'जैसे 1-3,5' },
        { id: 'dpi', label: 'Quality (DPI)', type: 'select', value: '150', options: [['100', '100 — हल्की'], ['150', '150 — सामान्य'], ['200', '200 — अच्छी'], ['300', '300 — बहुत उच्च']] },
        pwField()
      ],
      run: async function (c) {
        var f = c.file(), doc = await openJs(f, c.v('pw')), idx = H.pages(c.v('pages'), doc.numPages, { all: true }), b = H.base(f.name);
        for (var i = 0; i < idx.length; i++) {
          c.status('⏳ Page ' + (idx[i] + 1) + ' (' + (i + 1) + '/' + idx.length + ')');
          var cv = await renderPage(doc, idx[i] + 1, c.v('dpi') / 72);
          c.out(await H.toBlob(cv, mime, 0.93), b + '_page_' + (idx[i] + 1) + '.' + ext);
        }
        return idx.length + ' ' + ext.toUpperCase() + ' फोटो बनीं।';
      }
    });
  }
  rasterTool('PDF → JPG', 'image/jpeg', 'jpg', '🖼️');
  rasterTool('PDF → PNG', 'image/png', 'png', '🖼️');

  /* ================= new PDF tools ================= */
  A({
    cat: 'pdf', icon: '🗑️', title: 'Delete PDF Pages', desc: 'PDF के अनचाहे pages हटाएँ', tag: 'PDF',
    inputs: [{ id: 'f', label: 'PDF चुनें', accept: PDFACC }],
    fields: [{ id: 'pages', label: 'जो pages हटाने हैं', type: 'text', placeholder: 'जैसे 2,5-7', full: true }],
    run: async function (c) {
      var L = await H.pdfLib(), f = c.file(), src = await loadDoc(f), n = src.getPageCount();
      var del = {}; H.pages(c.v('pages'), n).forEach(function (i) { del[i] = 1; });
      var keep = []; for (var i = 0; i < n; i++) if (!del[i]) keep.push(i);
      if (!keep.length) throw new Error('सारे pages हट जाएँगे। कम से कम एक page रखें।');
      var out = await L.PDFDocument.create(); await copyInto(L, out, src, keep);
      c.out(pdfBlob(await out.save()), H.base(f.name) + '_deleted.pdf');
      return (n - keep.length) + ' pages हटे, ' + keep.length + ' बचे।';
    }
  });

  A({
    cat: 'pdf', icon: '📑', title: 'Extract / Reorder Pages', desc: 'चुने हुए pages निकालें या pages का क्रम बदलें', tag: 'PDF',
    inputs: [{ id: 'f', label: 'PDF चुनें', accept: PDFACC }],
    fields: [{ id: 'pages', label: 'नया क्रम / चुने pages', type: 'text', placeholder: 'जैसे 3,1,2 या 1-3,7', full: true, help: 'जो pages नहीं लिखेंगे वे नई PDF में नहीं आएँगे। क्रम वही रहेगा जो आप लिखेंगे।' }],
    run: async function (c) {
      var L = await H.pdfLib(), f = c.file(), src = await loadDoc(f), idx = H.pages(c.v('pages'), src.getPageCount());
      var out = await L.PDFDocument.create(); await copyInto(L, out, src, idx);
      c.out(pdfBlob(await out.save()), H.base(f.name) + '_extracted.pdf');
      return idx.length + ' pages की नई PDF बनी।';
    }
  });

  A({
    cat: 'pdf', icon: '🔄', title: 'Rotate PDF Pages', desc: 'PDF के pages को घुमाएँ (सीधा करें)', tag: 'PDF',
    inputs: [{ id: 'f', label: 'PDF चुनें', accept: PDFACC }],
    fields: [
      { id: 'angle', label: 'घड़ी की दिशा में घुमाएँ', type: 'select', value: '90', options: [['90', '90°'], ['180', '180° (उल्टा)'], ['270', '270° (बाएँ 90°)']] },
      { id: 'pages', label: 'Pages (खाली = सभी)', type: 'text', placeholder: 'जैसे 1,3-4' }
    ],
    run: async function (c) {
      var L = await H.pdfLib(), f = c.file(), doc = await loadDoc(f), pgs = doc.getPages(), idx = H.pages(c.v('pages'), pgs.length, { all: true }), a = +c.v('angle');
      idx.forEach(function (i) { pgs[i].setRotation(L.degrees((rotOf(pgs[i]) + a) % 360)); });
      c.out(pdfBlob(await doc.save()), H.base(f.name) + '_rotated.pdf');
      return idx.length + ' pages ' + a + '° घुमे।';
    }
  });

  A({
    cat: 'pdf', icon: '↕️', title: 'Reverse PDF Pages', desc: 'PDF के pages का क्रम उल्टा करें', tag: 'PDF',
    inputs: [{ id: 'f', label: 'PDF चुनें', accept: PDFACC }],
    run: async function (c) {
      var L = await H.pdfLib(), f = c.file(), src = await loadDoc(f), idx = src.getPageIndices().reverse();
      var out = await L.PDFDocument.create(); await copyInto(L, out, src, idx);
      c.out(pdfBlob(await out.save()), H.base(f.name) + '_reversed.pdf');
      return idx.length + ' pages उल्टे क्रम में।';
    }
  });

  A({
    cat: 'pdf', icon: '🔢', title: 'Odd / Even Pages', desc: 'सिर्फ़ विषम (1,3,5…) या सम (2,4,6…) pages निकालें — दोनों तरफ़ print के लिए', tag: 'PDF',
    inputs: [{ id: 'f', label: 'PDF चुनें', accept: PDFACC }],
    fields: [{ id: 'kind', label: 'कौन से pages', type: 'select', value: 'odd', options: [['odd', 'विषम — 1, 3, 5…'], ['even', 'सम — 2, 4, 6…']] }],
    run: async function (c) {
      var L = await H.pdfLib(), f = c.file(), src = await loadDoc(f), n = src.getPageCount(), idx = [];
      for (var i = 0; i < n; i++) if ((i % 2 === 0) === (c.v('kind') === 'odd')) idx.push(i);
      if (!idx.length) throw new Error('इस PDF में ' + (c.v('kind') === 'odd' ? 'विषम' : 'सम') + ' page नहीं है।');
      var out = await L.PDFDocument.create(); await copyInto(L, out, src, idx);
      c.out(pdfBlob(await out.save()), H.base(f.name) + '_' + c.v('kind') + '.pdf');
      return idx.length + ' pages निकले।';
    }
  });

  A({
    cat: 'pdf', icon: '#️⃣', title: 'PDF Page Numbers', desc: 'PDF के हर page पर page number लगाएँ', tag: 'PDF',
    inputs: [{ id: 'f', label: 'PDF चुनें', accept: PDFACC }],
    fields: [
      { id: 'pos', label: 'जगह', type: 'select', value: 'bc', options: [['bc', 'नीचे बीच'], ['br', 'नीचे दाएँ'], ['bl', 'नीचे बाएँ'], ['tc', 'ऊपर बीच'], ['tr', 'ऊपर दाएँ'], ['tl', 'ऊपर बाएँ']] },
      { id: 'fmt', label: 'रूप', type: 'select', value: 'n', options: [['n', '1'], ['pn', 'Page 1'], ['nN', '1 / 10'], ['pnN', 'Page 1 of 10']] },
      { id: 'start', label: 'शुरू का number', type: 'number', value: 1, min: 0 },
      { id: 'size', label: 'अक्षर का size', type: 'number', value: 12, min: 6, max: 40 },
      { id: 'skip', label: 'पहले page पर number न लगाएँ', type: 'checkbox', value: false }
    ],
    run: async function (c) {
      var L = await H.pdfLib(), f = c.file(), doc = await loadDoc(f), font = await doc.embedFont(L.StandardFonts.Helvetica), pgs = doc.getPages(), N = pgs.length, size = c.v('size'), start = Math.floor(c.v('start')), pos = c.v('pos'), fmt = c.v('fmt');
      pgs.forEach(function (pg, i) {
        if (c.v('skip') && i === 0) return;
        var num = start + i - (c.v('skip') ? 1 : 0), total = start + N - 1 - (c.v('skip') ? 1 : 0);
        var txt = fmt === 'n' ? '' + num : fmt === 'pn' ? 'Page ' + num : fmt === 'nN' ? num + ' / ' + total : 'Page ' + num + ' of ' + total;
        var info = pinfo(pg), tw = font.widthOfTextAtSize(txt, size), mg = 22, dx, dy;
        dx = pos[1] === 'l' ? mg : pos[1] === 'r' ? info.dw - mg - tw : (info.dw - tw) / 2;
        dy = pos[0] === 'b' ? mg : info.dh - mg - size;
        var pl = place(info, dx, dy);
        pg.drawText(txt, { x: pl.x, y: pl.y, size: size, font: font, color: L.rgb(0.1, 0.1, 0.1), rotate: L.degrees(pl.rot) });
      });
      c.out(pdfBlob(await doc.save()), H.base(f.name) + '_numbered.pdf');
      return N + ' pages पर number लगे।';
    }
  });

  A({
    cat: 'pdf', icon: '💧', title: 'PDF Watermark', desc: 'PDF पर text watermark लगाएँ (हिंदी भी चलेगा)', tag: 'PDF',
    inputs: [{ id: 'f', label: 'PDF चुनें', accept: PDFACC }],
    fields: [
      { id: 'text', label: 'Watermark text', type: 'text', value: 'COPY', full: true },
      { id: 'size', label: 'अक्षर का size', type: 'number', value: 60, min: 8, max: 200 },
      { id: 'opacity', label: 'हल्कापन', type: 'range', value: 0.25, min: 0.05, max: 1, step: 0.05 },
      { id: 'angle', label: 'दिशा', type: 'select', value: '45', options: angleOpts },
      { id: 'color', label: 'रंग', type: 'select', value: '#888888', options: colorOpts },
      { id: 'tile', label: 'पूरे page पर दोहराएँ', type: 'checkbox', value: false }
    ],
    run: async function (c) {
      var L = await H.pdfLib(), f = c.file(), doc = await loadDoc(f), text = String(c.v('text')).trim();
      if (!text) throw new Error('Watermark का text लिखें।');
      var px = 160, size = c.v('size'), k = size / px, cv = H.textCanvas(text, { px: px, color: c.v('color'), bold: true });
      var img = await embedCanvas(L, doc, cv, true), iw = cv.width * k, ih = cv.height * k, al = +c.v('angle'), a = al * Math.PI / 180, op = c.v('opacity');
      doc.getPages().forEach(function (pg) {
        var info = pinfo(pg);
        function put(cx, cy) {
          var ax = cx - (iw / 2 * Math.cos(a) - ih / 2 * Math.sin(a)), ay = cy - (iw / 2 * Math.sin(a) + ih / 2 * Math.cos(a)), pl = place(info, ax, ay);
          pg.drawImage(img, { x: pl.x, y: pl.y, width: iw, height: ih, rotate: L.degrees(al + pl.rot), opacity: op });
        }
        if (!c.v('tile')) put(info.dw / 2, info.dh / 2);
        else { var sx = iw * 1.5 + 30, sy = ih * 2.6 + 30; for (var y = sy / 2; y < info.dh + sy; y += sy) for (var x = sx / 2 - ((Math.round(y / sy) % 2) ? sx / 2 : 0); x < info.dw + sx; x += sx) put(x, y); }
      });
      c.out(pdfBlob(await doc.save()), H.base(f.name) + '_watermark.pdf');
      return doc.getPageCount() + ' pages पर watermark लगा।';
    }
  });

  A({
    cat: 'pdf', icon: '🔓', title: 'Unlock PDF', desc: 'सही password डालकर PDF का password हटाएँ (नई बिना-password PDF)', tag: 'PDF',
    inputs: [{ id: 'f', label: 'Password वाली PDF चुनें', accept: PDFACC }],
    fields: [
      { id: 'pw', label: 'PDF का सही Password', type: 'password', placeholder: 'जो password PDF खोलने का है', full: true },
      { id: 'dpi', label: 'Quality', type: 'select', value: '200', options: [['150', 'सामान्य (150 DPI)'], ['200', 'अच्छी (200 DPI)'], ['300', 'बहुत उच्च (300 DPI)']] }
    ],
    hint: 'यह password तोड़ता नहीं है — आपको सही password पता होना चाहिए। बनी हुई PDF में हर page फोटो के रूप में होगा (text select/copy नहीं होगा)।',
    run: async function (c) {
      var L = await H.pdfLib(), f = c.file(), pw = c.v('pw');
      var lib = await H.pdfjs(), data = new Uint8Array(await f.arrayBuffer());
      // pehle bina password koshish: agar khul jaye to password tha hi nahi
      try {
        var t0 = lib.getDocument({ data: data.slice() }); var d0 = await t0.promise; var n0 = d0.numPages; await d0.destroy();
        c.out(f, H.base(f.name) + '_unlocked.pdf');
        return 'इस PDF में open-password नहीं था (' + n0 + ' pages)। वही फ़ाइल नीचे है।';
      } catch (e) { if (!(e && e.name === 'PasswordException')) throw new Error('PDF खुल नहीं सकी (फ़ाइल खराब या असमर्थित है)।'); }
      if (!pw) throw new Error('यह PDF password-protected है। ऊपर सही Password भरें।');
      var doc = await openJs(f, pw), n = doc.numPages, out = await L.PDFDocument.create(), scale = c.v('dpi') / 72;
      for (var i = 1; i <= n; i++) {
        c.status('⏳ Page ' + i + '/' + n);
        var pg = await doc.getPage(i), vp = pg.getViewport({ scale: 1 }), cv = await renderPage(doc, i, scale);
        var img = await embedCanvas(L, out, cv, false);
        out.addPage([vp.width, vp.height]).drawImage(img, { x: 0, y: 0, width: vp.width, height: vp.height });
      }
      c.out(pdfBlob(await out.save()), H.base(f.name) + '_unlocked.pdf');
      return n + ' pages की बिना-password PDF बन गई।';
    }
  });

  A({
    cat: 'pdf', icon: '📝', title: 'PDF → Text', desc: 'PDF में लिखा text निकालें (copy / .txt)', tag: 'PDF',
    inputs: [{ id: 'f', label: 'PDF चुनें', accept: PDFACC }],
    fields: [{ id: 'pages', label: 'Pages (खाली = सभी)', type: 'text', placeholder: 'जैसे 1-3' }, pwField()],
    hint: 'सिर्फ़ उन PDF से text निकलता है जिनमें असली text हो। Scan/फोटो वाली PDF में text नहीं मिलेगा।',
    run: async function (c) {
      var f = c.file(), doc = await openJs(f, c.v('pw')), idx = H.pages(c.v('pages'), doc.numPages, { all: true }), all = [];
      for (var i = 0; i < idx.length; i++) {
        var pg = await doc.getPage(idx[i] + 1), tc = await pg.getTextContent(), line = '', lastY = null, lastX = 0, txt = '';
        tc.items.forEach(function (it) {
          if (typeof it.str !== 'string') return;
          var x = it.transform[4], y = it.transform[5];
          if (lastY !== null && Math.abs(y - lastY) > 2) txt += '\n'; else if (lastY !== null && x - lastX > 1 && it.str && !/^\s/.test(it.str) && !/\s$/.test(txt)) txt += ' ';
          txt += it.str; lastY = y; lastX = x + (it.width || 0);
          if (it.hasEOL) { txt += '\n'; lastY = null; }
        });
        all.push('--- Page ' + (idx[i] + 1) + ' ---\n' + txt.trim());
      }
      var text = all.join('\n\n'), clean = text.replace(/--- Page \d+ ---/g, '').trim();
      if (!clean) { c.html('<p class="plus-warn">इस PDF में कोई text नहीं मिला। यह शायद scan/फोटो वाली PDF है।</p>'); throw new Error('कोई text नहीं मिला।'); }
      c.out(new Blob(['﻿' + text], { type: 'text/plain;charset=utf-8' }), H.base(f.name) + '.txt');
      c.html('<textarea class="plus-text" id="plusTextOut" rows="10" readonly>' + esc(text.slice(0, 20000)) + '</textarea><button type="button" class="secondary-btn" id="plusCopy">📋 Text copy करें</button>');
      var b = document.getElementById('plusCopy');
      if (b) b.addEventListener('click', function () { var t = document.getElementById('plusTextOut'); t.select(); try { navigator.clipboard.writeText(text).then(function () { b.textContent = '✅ Copy हो गया'; }, function () { document.execCommand('copy'); }); } catch (e) { document.execCommand('copy'); } });
      return idx.length + ' pages से ' + clean.length + ' अक्षर निकले।';
    }
  });

  var NUP = { 2: [2, 1, true], 4: [2, 2, false], 6: [3, 2, true], 9: [3, 3, false] };
  A({
    cat: 'pdf', icon: '🗂️', title: '2-in-1 / 4-in-1 Print', desc: 'एक A4 sheet पर 2, 4, 6 या 9 pages — कागज़ बचाएँ', tag: 'PDF',
    inputs: [{ id: 'f', label: 'PDF चुनें', accept: PDFACC }],
    fields: [
      { id: 'per', label: 'एक sheet पर pages', type: 'select', value: '2', options: [['2', '2 pages'], ['4', '4 pages'], ['6', '6 pages'], ['9', '9 pages']] },
      { id: 'border', label: 'हर page के चारों ओर लाइन', type: 'checkbox', value: true }
    ],
    run: async function (c) {
      var L = await H.pdfLib(), f = c.file(), src = await loadDoc(f), n = src.getPageCount(), per = +c.v('per'), cfg = NUP[per];
      var out = await L.PDFDocument.create(), emb = await out.embedPdf(src, src.getPageIndices()), PW = cfg[2] ? A4H : A4W, PH = cfg[2] ? A4W : A4H, g = 10, cw = (PW - g * (cfg[0] + 1)) / cfg[0], ch = (PH - g * (cfg[1] + 1)) / cfg[1];
      for (var s = 0; s < n; s += per) {
        var pg = out.addPage([PW, PH]);
        for (var k = 0; k < per && s + k < n; k++) {
          var col = k % cfg[0], row = Math.floor(k / cfg[0]), bx = g + col * (cw + g), by = PH - g - (row + 1) * ch - row * g;
          drawFit(pg, emb[s + k], rotOf(src.getPage(s + k)), bx, by, cw, ch, L);
          if (c.v('border')) pg.drawRectangle({ x: bx, y: by, width: cw, height: ch, borderColor: L.rgb(0.6, 0.6, 0.6), borderWidth: 0.5 });
        }
      }
      c.out(pdfBlob(await out.save()), H.base(f.name) + '_' + per + 'in1.pdf');
      return n + ' pages से ' + out.getPageCount() + ' sheets बनीं।';
    }
  });

  A({
    cat: 'pdf', icon: '📐', title: 'PDF → A4 Size', desc: 'किसी भी size की PDF को A4 page में लाएँ', tag: 'PDF',
    inputs: [{ id: 'f', label: 'PDF चुनें', accept: PDFACC }],
    fields: [
      { id: 'orient', label: 'दिशा', type: 'select', value: 'auto', options: [['auto', 'अपने-आप (page जैसा)'], ['p', 'हमेशा सीधा (Portrait)'], ['l', 'हमेशा आड़ा (Landscape)']] },
      { id: 'mg', label: 'किनारा (mm)', type: 'number', value: 5, min: 0, max: 40 }
    ],
    run: async function (c) {
      var L = await H.pdfLib(), f = c.file(), src = await loadDoc(f), out = await L.PDFDocument.create(), emb = await out.embedPdf(src, src.getPageIndices()), mg = c.v('mg') * MM;
      emb.forEach(function (e, i) {
        var r = rotOf(src.getPage(i)), sw = (r === 90 || r === 270), dw = sw ? e.height : e.width, dh = sw ? e.width : e.height, land = c.v('orient') === 'l' || (c.v('orient') === 'auto' && dw > dh);
        var PW = land ? A4H : A4W, PH = land ? A4W : A4H, pg = out.addPage([PW, PH]);
        drawFit(pg, e, r, mg, mg, PW - 2 * mg, PH - 2 * mg, L);
      });
      c.out(pdfBlob(await out.save()), H.base(f.name) + '_A4.pdf');
      return out.getPageCount() + ' pages A4 में आ गए।';
    }
  });

  var POS = [['br', 'नीचे दाएँ'], ['bl', 'नीचे बाएँ'], ['bc', 'नीचे बीच'], ['c', 'बिल्कुल बीच'], ['tr', 'ऊपर दाएँ'], ['tl', 'ऊपर बाएँ'], ['tc', 'ऊपर बीच'], ['x', 'अपनी जगह (% में)']];
  A({
    cat: 'pdf', icon: '✍️', title: 'Add Signature to PDF', desc: 'PDF पर signature / फोटो / stamp लगाएँ', tag: 'PDF',
    inputs: [{ id: 'pdf', label: 'PDF चुनें', accept: PDFACC }, { id: 'img', label: 'Signature / फोटो चुनें (PNG पारदर्शी हो तो बेहतर)', accept: 'image/*' }],
    fields: [
      { id: 'pages', label: 'किन pages पर', type: 'text', value: 'last', placeholder: 'last, all या 1,3', help: 'last = आख़िरी page, all = सभी' },
      { id: 'pos', label: 'जगह', type: 'select', value: 'br', options: POS },
      { id: 'w', label: 'चौड़ाई (mm)', type: 'number', value: 40, min: 5, max: 300 },
      { id: 'mg', label: 'किनारे से दूरी (mm)', type: 'number', value: 12, min: 0, max: 100 },
      { id: 'xp', label: 'बाएँ से % (बीच तक)', type: 'number', value: 50, min: 0, max: 100, show: function (v) { return v('pos') === 'x'; } },
      { id: 'yp', label: 'ऊपर से % (बीच तक)', type: 'number', value: 50, min: 0, max: 100, show: function (v) { return v('pos') === 'x'; } }
    ],
    run: async function (c) {
      var L = await H.pdfLib(), doc = await loadDoc(c.file('pdf')), pgs = doc.getPages(), idx = H.pages(c.v('pages'), pgs.length, { all: true });
      var r = await embedImg(L, doc, c.file('img'), 1600), iw = c.v('w') * MM, ih = iw * r.h / r.w, mg = c.v('mg') * MM, pos = c.v('pos');
      idx.forEach(function (i) {
        var info = pinfo(pgs[i]), dx, dy;
        if (pos === 'x') { dx = c.v('xp') / 100 * info.dw - iw / 2; dy = info.dh - c.v('yp') / 100 * info.dh - ih / 2; }
        else {
          dx = pos[pos.length - 1] === 'l' ? mg : pos[pos.length - 1] === 'r' ? info.dw - mg - iw : (info.dw - iw) / 2;
          dy = pos[0] === 'b' ? mg : pos[0] === 't' ? info.dh - mg - ih : (info.dh - ih) / 2;
          if (pos === 'c') { dx = (info.dw - iw) / 2; dy = (info.dh - ih) / 2; }
        }
        var pl = place(info, dx, dy);
        pgs[i].drawImage(r.emb, { x: pl.x, y: pl.y, width: iw, height: ih, rotate: L.degrees(pl.rot) });
      });
      c.out(pdfBlob(await doc.save()), H.base(c.file('pdf').name) + '_signed.pdf');
      return idx.length + ' page(s) पर लगा।';
    }
  });

  A({
    cat: 'pdf', icon: '🖋️', title: 'Write Text on PDF', desc: 'PDF पर कहीं भी text लिखें (हिंदी/अंग्रेज़ी) — form भरने के लिए', tag: 'PDF',
    inputs: [{ id: 'f', label: 'PDF चुनें', accept: PDFACC }],
    fields: [
      { id: 'text', label: 'क्या लिखना है', type: 'textarea', rows: 3, value: '', placeholder: 'यहाँ text लिखें', full: true },
      { id: 'pages', label: 'किन pages पर', type: 'text', value: '1', placeholder: '1, all या last' },
      { id: 'size', label: 'अक्षर का size (pt)', type: 'number', value: 14, min: 5, max: 120 },
      { id: 'xp', label: 'बाएँ से दूरी (% में)', type: 'number', value: 10, min: 0, max: 100 },
      { id: 'yp', label: 'ऊपर से दूरी (% में)', type: 'number', value: 10, min: 0, max: 100 },
      { id: 'color', label: 'रंग', type: 'select', value: '#000000', options: [['#000000', 'काला'], ['#0a4da8', 'नीला'], ['#d00000', 'लाल']] },
      { id: 'bold', label: 'मोटे अक्षर', type: 'checkbox', value: false }
    ],
    run: async function (c) {
      var L = await H.pdfLib(), f = c.file(), doc = await loadDoc(f), pgs = doc.getPages(), text = String(c.v('text'));
      if (!text.trim()) throw new Error('जो text लिखना है वह भरें।');
      var idx = H.pages(c.v('pages'), pgs.length, { all: true }), px = Math.round(c.v('size') * 4), k = c.v('size') / px;
      var cv = H.textCanvas(text, { px: px, color: c.v('color'), bold: c.v('bold') }), img = await embedCanvas(L, doc, cv, true), iw = cv.width * k, ih = cv.height * k;
      idx.forEach(function (i) {
        var info = pinfo(pgs[i]), dx = c.v('xp') / 100 * info.dw, dy = info.dh - c.v('yp') / 100 * info.dh - ih, pl = place(info, dx, dy);
        pgs[i].drawImage(img, { x: pl.x, y: pl.y, width: iw, height: ih, rotate: L.degrees(pl.rot) });
      });
      c.out(pdfBlob(await doc.save()), H.base(f.name) + '_text.pdf');
      return idx.length + ' page(s) पर text लिखा गया।';
    }
  });

  A({
    cat: 'pdf', icon: 'ℹ️', title: 'PDF Info & Clean', desc: 'PDF की जानकारी देखें और छुपी metadata (नाम, software) हटाएँ', tag: 'PDF',
    inputs: [{ id: 'f', label: 'PDF चुनें', accept: PDFACC }],
    action: '▶ जानकारी देखें और साफ़ PDF बनाएँ',
    run: async function (c) {
      var L = await H.pdfLib(), f = c.file(), doc = await loadDoc(f), pgs = doc.getPages();
      function d(x) { try { return x ? x.toLocaleString('hi-IN') : '—'; } catch (e) { return '—'; } }
      var rows = [['फ़ाइल', f.name], ['Size', H.kb(f.size)], ['Pages', pgs.length], ['पहले page का आकार', Math.round(pgs[0].getWidth() / MM) + ' × ' + Math.round(pgs[0].getHeight() / MM) + ' mm'], ['Title', doc.getTitle() || '—'], ['Author', doc.getAuthor() || '—'], ['Creator', doc.getCreator() || '—'], ['Producer', doc.getProducer() || '—'], ['बनाने की तारीख', d(doc.getCreationDate())], ['बदलने की तारीख', d(doc.getModificationDate())]];
      c.html('<table class="plus-table"><tbody>' + rows.map(function (r) { return '<tr><th>' + esc(r[0]) + '</th><td>' + esc(r[1]) + '</td></tr>'; }).join('') + '</tbody></table>');
      doc.setTitle(''); doc.setAuthor(''); doc.setSubject(''); doc.setKeywords([]); doc.setCreator(''); doc.setProducer('');
      doc.context.trailerInfo.Info = undefined;
      try { doc.catalog.delete(L.PDFName.of('Metadata')); } catch (e) {}
      c.out(pdfBlob(await doc.save({ updateFieldAppearances: false })), H.base(f.name) + '_clean.pdf');
      return 'जानकारी ऊपर है। Metadata हटी हुई PDF तैयार है।';
    }
  });
  H.pdfx = { loadDoc: loadDoc, pdfBlob: pdfBlob, openJs: openJs, renderPage: renderPage, copyInto: copyInto, pwField: pwField, rotOf: rotOf, pinfo: pinfo, embedCanvas: embedCanvas, hexRgb: hexRgb };
})();
