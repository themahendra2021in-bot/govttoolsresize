/* plus-image.js — photo / document image tools (sab browser mein) */
(function () {
  'use strict';
  var P = window.PLUS, H = P.H, A = P.add, esc = H.esc, $ = H.$;
  var IMG = 'image/*';
  var FMT = { id: 'fmt', label: 'Output format', type: 'select', value: 'jpg', options: [['jpg', 'JPG'], ['png', 'PNG']] };
  var KB = { id: 'kb', label: 'अधिकतम KB (वैकल्पिक)', type: 'number', value: '', min: 5, help: 'सिर्फ़ JPG में लागू होता है' };

  function flatten(cv) { var o = H.canvas(cv.width, cv.height, '#fff'); o.getContext('2d').drawImage(cv, 0, 0); return o; }
  async function emit(c, canvas, name, forcePng) {
    var fi = H.fmtInfo(forcePng ? 'png' : c.v('fmt'));
    var cv = fi.type === 'image/jpeg' ? flatten(canvas) : canvas;
    var kb = forcePng ? 0 : c.v('kb'), blob = await H.toBlobKB(cv, fi.type, kb);
    if (kb && blob.size / 1024 > kb) c.S.big = true;
    c.out(blob, name + '.' + fi.ext);
  }
  async function batch(c, suffix, fn, forcePng) {
    var files = c.files('f'); c.S.big = false;
    for (var i = 0; i < files.length; i++) {
      c.status('⏳ ' + (i + 1) + '/' + files.length + ' : ' + files[i].name);
      var img = await H.loadImg(files[i]);
      var cv = await fn(img, files[i], i);
      await emit(c, cv, H.base(files[i].name) + suffix, forcePng);
    }
    return files.length + ' फोटो तैयार हुईं।' + (c.S.big ? ' ⚠️ कुछ फोटो target KB से बड़ी रह गईं — पहले Resize से px घटाएँ।' : '');
  }
  function pix(cv) { return cv.getContext('2d').getImageData(0, 0, cv.width, cv.height); }
  function put(cv, id) { cv.getContext('2d').putImageData(id, 0, 0); return cv; }
  function limit(img, maxPx) {
    var w = img.naturalWidth, h = img.naturalHeight, s = Math.min(1, Math.sqrt(maxPx / (w * h)));
    var cv = H.canvas(w * s, h * s); var x = cv.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, cv.width, cv.height); return cv;
  }
  // achhi quality ka resize (step-down)
  function resizeCv(src, w, h) {
    w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
    var cur = src;
    while (cur.width / 2 > w && cur.height / 2 > h) {
      var t = H.canvas(Math.max(w, Math.round(cur.width / 2)), Math.max(h, Math.round(cur.height / 2)));
      var tx = t.getContext('2d'); tx.imageSmoothingQuality = 'high'; tx.drawImage(cur, 0, 0, t.width, t.height); cur = t;
    }
    var o = H.canvas(w, h); var x = o.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(cur, 0, 0, w, h); return o;
  }
  H.resizeCv = resizeCv;
  function ptr(e, cv) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height }; }

  /* ---------- 1. Rotate / Flip ---------- */
  A({
    cat: 'photo', icon: '🔄', title: 'Rotate / Flip Image', desc: 'फोटो को घुमाएँ या पलटें (एक साथ कई)', tag: 'Photo',
    inputs: [{ id: 'f', label: 'फोटो चुनें (कई चुन सकते हैं)', accept: IMG, multiple: true }],
    fields: [
      { id: 'angle', label: 'घड़ी की दिशा में घुमाएँ', type: 'select', value: '90', options: [['0', 'बिना घुमाए'], ['90', '90°'], ['180', '180°'], ['270', '270° (बाएँ 90°)']] },
      { id: 'fh', label: 'दाएँ-बाएँ पलटें (Mirror)', type: 'checkbox', value: false },
      { id: 'fv', label: 'ऊपर-नीचे पलटें', type: 'checkbox', value: false }, FMT
    ],
    run: function (c) {
      return batch(c, '_rotated', function (img) {
        var w = img.naturalWidth, h = img.naturalHeight, a = +c.v('angle'), sw = a === 90 || a === 270;
        var cv = H.canvas(sw ? h : w, sw ? w : h), x = cv.getContext('2d');
        x.translate(cv.width / 2, cv.height / 2); x.rotate(a * Math.PI / 180); x.scale(c.v('fh') ? -1 : 1, c.v('fv') ? -1 : 1); x.drawImage(img, -w / 2, -h / 2);
        return cv;
      });
    }
  });

  /* ---------- 2. Name & Date strip ---------- */
  A({
    cat: 'exam', icon: '🏷️', title: 'Photo Name & Date Strip', desc: 'फोटो के नीचे नाम और तारीख की पट्टी जोड़ें (परीक्षा फॉर्म वाली फोटो)', tag: 'Exam',
    inputs: [{ id: 'f', label: 'फोटो चुनें', accept: IMG, multiple: true }],
    fields: [
      { id: 'l1', label: 'नाम (पहली लाइन)', type: 'text', placeholder: 'RAMESH KUMAR', full: true },
      { id: 'l2', label: 'तारीख / दूसरी लाइन', type: 'text', value: function () { return H.today(); } },
      { id: 'pos', label: 'पट्टी कहाँ', type: 'select', value: 'bottom', options: [['bottom', 'नीचे'], ['top', 'ऊपर']] },
      { id: 'pct', label: 'पट्टी की ऊँचाई (फोटो का %)', type: 'number', value: 16, min: 6, max: 40 },
      { id: 'theme', label: 'रंग', type: 'select', value: 'wb', options: [['wb', 'सफ़ेद पट्टी, काले अक्षर'], ['bw', 'काली पट्टी, सफ़ेद अक्षर']] }, FMT, KB
    ],
    hint: 'फोटो का size पहले ठीक करें (Photo Resize से), फिर यहाँ पट्टी जोड़ें। पट्टी फोटो के साथ जुड़ती है, फोटो को ढकती नहीं।',
    run: function (c) {
      if (!String(c.v('l1')).trim() && !String(c.v('l2')).trim()) throw new Error('नाम या तारीख में से कुछ तो लिखें।');
      return batch(c, '_strip', function (img) {
        var w = img.naturalWidth, h = img.naturalHeight, sh = Math.round(h * c.v('pct') / 100), dark = c.v('theme') === 'bw';
        var lines = [String(c.v('l1')).trim(), String(c.v('l2')).trim()].filter(Boolean);
        var cv = H.canvas(w, h + sh, dark ? '#000' : '#fff'), x = cv.getContext('2d'), top = c.v('pos') === 'top';
        x.drawImage(img, 0, top ? sh : 0);
        var size = Math.floor(sh / (lines.length === 1 ? 1.6 : 2.3));
        x.fillStyle = dark ? '#fff' : '#000'; x.textAlign = 'center'; x.textBaseline = 'middle';
        function fit() { x.font = 'bold ' + size + 'px ' + H.fontStack; return Math.max.apply(null, lines.map(function (l) { return x.measureText(l).width; })); }
        while (size > 6 && fit() > w * 0.94) size--;
        x.font = 'bold ' + size + 'px ' + H.fontStack;
        var y0 = top ? 0 : h, lh = size * 1.25, startY = y0 + sh / 2 - (lines.length - 1) * lh / 2;
        lines.forEach(function (l, i) { x.fillText(l, w / 2, startY + i * lh); });
        return cv;
      });
    }
  });

  /* ---------- 3. Text watermark ---------- */
  A({
    cat: 'photo', icon: '💧', title: 'Image Watermark', desc: 'फोटो पर text watermark लगाएँ (हिंदी भी)', tag: 'Photo',
    inputs: [{ id: 'f', label: 'फोटो चुनें (कई चुन सकते हैं)', accept: IMG, multiple: true }],
    fields: [
      { id: 'text', label: 'Watermark text', type: 'text', value: 'COPY', full: true },
      { id: 'size', label: 'अक्षर का size (फोटो का %)', type: 'number', value: 8, min: 2, max: 40 },
      { id: 'op', label: 'हल्कापन', type: 'range', value: 0.35, min: 0.05, max: 1, step: 0.05 },
      { id: 'angle', label: 'दिशा', type: 'select', value: '-30', options: [['0', 'सीधा'], ['-30', 'तिरछा'], ['-45', '45° तिरछा'], ['-90', 'खड़ा']] },
      { id: 'color', label: 'रंग', type: 'select', value: '#ffffff', options: [['#ffffff', 'सफ़ेद'], ['#000000', 'काला'], ['#d00000', 'लाल'], ['#0a4da8', 'नीला']] },
      { id: 'tile', label: 'पूरी फोटो पर दोहराएँ', type: 'checkbox', value: true }, FMT, KB
    ],
    run: function (c) {
      var text = String(c.v('text')).trim(); if (!text) throw new Error('Watermark का text लिखें।');
      return batch(c, '_watermark', function (img) {
        var w = img.naturalWidth, h = img.naturalHeight, cv = H.imgCanvas(img), x = cv.getContext('2d');
        var px = Math.max(12, Math.round(Math.min(w, h) * c.v('size') / 100)), tc = H.textCanvas(text, { px: px, color: c.v('color'), bold: true }), a = +c.v('angle') * Math.PI / 180;
        x.globalAlpha = c.v('op');
        function at(cx, cy) { x.save(); x.translate(cx, cy); x.rotate(a); x.drawImage(tc, -tc.width / 2, -tc.height / 2); x.restore(); }
        if (!c.v('tile')) at(w / 2, h / 2);
        else { var sx = tc.width * 1.6, sy = tc.height * 3, r = 0; for (var y = sy / 2; y < h + sy; y += sy, r++) for (var xx = sx / 2 - (r % 2 ? sx / 2 : 0); xx < w + sx; xx += sx) at(xx, y); }
        x.globalAlpha = 1; return cv;
      });
    }
  });

  /* ---------- 4. Photo Joiner ---------- */
  A({
    cat: 'document', icon: '🧩', title: 'Photo Joiner (Front + Back)', desc: 'दो या ज़्यादा फोटो एक पेज में जोड़ें — जैसे आधार का आगे-पीछे एक A4 पर', tag: 'Document',
    inputs: [{ id: 'f', label: 'फोटो चुनें (क्रम ↑↓ से बदलें)', accept: IMG, multiple: true }],
    fields: [
      { id: 'layout', label: 'कैसे जोड़ें', type: 'select', value: 'v', options: [['v', 'ऊपर-नीचे'], ['h', 'साथ-साथ'], ['g', '2 कॉलम (grid)']] },
      { id: 'out', label: 'Output', type: 'select', value: 'pdf', options: [['pdf', 'A4 PDF'], ['jpg', 'JPG फोटो'], ['png', 'PNG फोटो']] },
      { id: 'gap', label: 'बीच की दूरी (px)', type: 'number', value: 40, min: 0, max: 400 }
    ],
    hint: 'आधार/PAN का आगे और पीछे दोनों फोटो चुनें, “ऊपर-नीचे” और “A4 PDF” रखें।',
    run: async function (c) {
      var files = c.files('f'); if (files.length < 2) throw new Error('कम से कम 2 फोटो चुनें।');
      var imgs = []; for (var i = 0; i < files.length; i++) imgs.push(await H.loadImg(files[i]));
      var gap = c.v('gap'), L = c.v('layout'), cv, x;
      if (L === 'v') {
        var W = Math.max.apply(null, imgs.map(function (m) { return m.naturalWidth; })), hs = imgs.map(function (m) { return m.naturalHeight * W / m.naturalWidth; }), T = hs.reduce(function (a, b) { return a + b; }, 0) + gap * (imgs.length + 1);
        cv = H.canvas(W + gap * 2, T, '#fff'); x = cv.getContext('2d'); var y = gap; imgs.forEach(function (m, k) { x.drawImage(m, gap, y, W, hs[k]); y += hs[k] + gap; });
      } else if (L === 'h') {
        var Hh = Math.max.apply(null, imgs.map(function (m) { return m.naturalHeight; })), ws = imgs.map(function (m) { return m.naturalWidth * Hh / m.naturalHeight; }), TW = ws.reduce(function (a, b) { return a + b; }, 0) + gap * (imgs.length + 1);
        cv = H.canvas(TW, Hh + gap * 2, '#fff'); x = cv.getContext('2d'); var xx = gap; imgs.forEach(function (m, k) { x.drawImage(m, xx, gap, ws[k], Hh); xx += ws[k] + gap; });
      } else {
        var cw = Math.max.apply(null, imgs.map(function (m) { return m.naturalWidth; })), ch = Math.max.apply(null, imgs.map(function (m) { return m.naturalHeight; })), rows = Math.ceil(imgs.length / 2);
        cv = H.canvas(cw * 2 + gap * 3, ch * rows + gap * (rows + 1), '#fff'); x = cv.getContext('2d');
        imgs.forEach(function (m, k) { var f = H.fitInto(m.naturalWidth, m.naturalHeight, cw, ch), col = k % 2, row = Math.floor(k / 2); x.drawImage(m, gap + col * (cw + gap) + (cw - f.w) / 2, gap + row * (ch + gap) + (ch - f.h) / 2, f.w, f.h); });
      }
      if (c.v('out') === 'pdf') {
        var PL = await H.pdfLib(), doc = await PL.PDFDocument.create(), img = await doc.embedJpg(await H.bytes(await H.toBlob(cv, 'image/jpeg', 0.93)));
        var land = cv.width > cv.height && L === 'h', PW = land ? 841.89 : 595.28, PH = land ? 595.28 : 841.89, f2 = H.fitInto(cv.width, cv.height, PW - 40, PH - 40);
        doc.addPage([PW, PH]).drawImage(img, { x: (PW - f2.w) / 2, y: PH - 20 - f2.h, width: f2.w, height: f2.h });
        c.out(new Blob([await doc.save()], { type: 'application/pdf' }), 'Joined.pdf');
      } else {
        var png = c.v('out') === 'png'; c.out(await H.toBlob(png ? cv : flatten(cv), png ? 'image/png' : 'image/jpeg', 0.93), 'Joined.' + (png ? 'png' : 'jpg'));
      }
      return files.length + ' फोटो एक में जुड़ गईं।';
    }
  });

  /* ---------- 5. Document Mask / Redact ---------- */
  A({
    cat: 'document', icon: '🕶️', title: 'Document Mask (Aadhaar छुपाएँ)', desc: 'आधार/दस्तावेज़ के नंबर या हिस्से छुपाएँ (काला/सफ़ेद/blur)', tag: 'Document',
    inputs: [{ id: 'f', label: 'फोटो या PDF चुनें', accept: IMG + ',application/pdf,.pdf', onFiles: function (arr, S) { if (S.maskLoad) S.maskLoad(arr[0]); } }],
    fields: [
      { id: 'mode', label: 'छुपाने का तरीका', type: 'select', value: 'black', options: [['black', 'काला डिब्बा'], ['white', 'सफ़ेद डिब्बा'], ['blur', 'Blur (धुंधला)']] },
      { id: 'page', label: 'PDF का page', type: 'number', value: 1, min: 1 },
      { id: 'pw', label: 'PDF Password (अगर हो)', type: 'password' }, FMT
    ],
    action: '✅ Mask करके तैयार करें',
    hint: 'फाइल चुनने के बाद नीचे तस्वीर पर उँगली/माउस से डिब्बा खींचें (जैसे आधार के पहले 8 अंक)। गलती हो तो “पिछला हटाएँ”। PDF का password/page बदलकर फिर फ़ाइल चुनें।',
    custom: function (c) {
      var S = c.S, root = $('#plusCustom');
      root.innerHTML = '<div class="plus-cvwrap"><canvas id="maskCv" class="plus-cv" width="600" height="360" aria-label="Mask करने के लिए तस्वीर"></canvas></div><div class="v41-actions"><button class="secondary-btn" id="maskUndo" type="button">↶ पिछला हटाएँ</button><button class="secondary-btn" id="maskClear" type="button">सब हटाएँ</button><button class="secondary-btn" id="maskReload" type="button">🔄 PDF दोबारा खोलें</button></div>';
      var cv = $('#maskCv'), x = cv.getContext('2d'), st = S.mask = { base: null, rects: [] }, drag = null;
      function draw() {
        if (!st.base) { x.fillStyle = '#f2f4f7'; x.fillRect(0, 0, cv.width, cv.height); x.fillStyle = '#667085'; x.font = '20px sans-serif'; x.textAlign = 'center'; x.fillText('पहले फोटो/PDF चुनें', cv.width / 2, cv.height / 2); return; }
        x.drawImage(st.base, 0, 0);
        var lw = Math.max(2, cv.width / 300);
        st.rects.concat(drag ? [drag] : []).forEach(function (r) { x.fillStyle = 'rgba(220,0,0,.28)'; x.fillRect(r.x, r.y, r.w, r.h); x.strokeStyle = '#d00000'; x.lineWidth = lw; x.strokeRect(r.x, r.y, r.w, r.h); });
      }
      draw();
      S.maskLoad = async function (file) {
        try {
          c.status('⏳ खोल रहे हैं…'); var base;
          if (H.isPdf(file)) {
            var lib = await H.pdfjs(), task = lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()), password: c.v('pw') || undefined }), doc;
            try { doc = await task.promise; } catch (e) { throw new Error(e && e.name === 'PasswordException' ? (e.code === 2 ? 'Password गलत है।' : 'PDF password-protected है। Password भरकर “PDF दोबारा खोलें” दबाएँ।') : 'PDF खुल नहीं सकी।'); }
            var n = Math.min(doc.numPages, Math.max(1, Math.floor(c.v('page')))), pg = await doc.getPage(n), vp = pg.getViewport({ scale: 2.5 });
            base = H.canvas(Math.ceil(vp.width), Math.ceil(vp.height), '#fff'); await pg.render({ canvasContext: base.getContext('2d'), viewport: vp }).promise;
          } else base = H.imgCanvas(await H.loadImg(file));
          st.base = base; st.rects = []; cv.width = base.width; cv.height = base.height; draw();
          c.status('तैयार। अब तस्वीर पर डिब्बा खींचकर छुपाने वाला हिस्सा चुनें।');
        } catch (e) { c.status('❌ ' + e.message, 'err'); }
      };
      $('#maskReload').addEventListener('click', function () { var f = c.file(); if (f) S.maskLoad(f); });
      cv.addEventListener('pointerdown', function (e) { if (!st.base) return; cv.setPointerCapture(e.pointerId); var p = ptr(e, cv); drag = { sx: p.x, sy: p.y, x: p.x, y: p.y, w: 0, h: 0 }; e.preventDefault(); });
      cv.addEventListener('pointermove', function (e) { if (!drag) return; var p = ptr(e, cv); drag.x = Math.min(drag.sx, p.x); drag.y = Math.min(drag.sy, p.y); drag.w = Math.abs(p.x - drag.sx); drag.h = Math.abs(p.y - drag.sy); draw(); });
      function end() { if (!drag) return; if (drag.w > 4 && drag.h > 4) st.rects.push({ x: drag.x, y: drag.y, w: drag.w, h: drag.h }); drag = null; draw(); c.status(st.rects.length + ' हिस्से चुने गए। और जोड़ें या नीचे “Mask करके तैयार करें” दबाएँ।'); }
      cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
      $('#maskUndo').addEventListener('click', function () { st.rects.pop(); draw(); });
      $('#maskClear').addEventListener('click', function () { st.rects = []; draw(); });
    },
    run: async function (c) {
      var st = c.S.mask; if (!st || !st.base) throw new Error('पहले फोटो/PDF चुनें।');
      if (!st.rects.length) throw new Error('छुपाने के लिए तस्वीर पर कम से कम एक डिब्बा खींचें।');
      var b = st.base, out = H.canvas(b.width, b.height), x = out.getContext('2d'); x.drawImage(b, 0, 0);
      st.rects.forEach(function (r) {
        var m = c.v('mode');
        if (m === 'blur') {
          var bs = Math.max(10, Math.round(Math.min(r.w, r.h) / 3)), t = H.canvas(Math.max(1, Math.round(r.w / bs)), Math.max(1, Math.round(r.h / bs)));
          t.getContext('2d').drawImage(b, r.x, r.y, r.w, r.h, 0, 0, t.width, t.height); x.imageSmoothingEnabled = false; x.drawImage(t, 0, 0, t.width, t.height, r.x, r.y, r.w, r.h); x.imageSmoothingEnabled = true;
        } else { x.fillStyle = m === 'white' ? '#fff' : '#000'; x.fillRect(r.x, r.y, r.w, r.h); }
      });
      await emit(c, out, 'masked');
      return st.rects.length + ' हिस्से छुपाए गए।';
    }
  });

  /* ---------- 6. Signature draw ---------- */
  A({
    cat: 'photo', icon: '✒️', title: 'Signature Maker (हाथ से बनाएँ)', desc: 'स्क्रीन पर signature बनाएँ और पारदर्शी PNG/JPG लें', tag: 'Signature',
    fields: [
      { id: 'pen', label: 'कलम की मोटाई', type: 'range', value: 4, min: 2, max: 12, step: 1 },
      { id: 'color', label: 'स्याही', type: 'select', value: '#000000', options: [['#000000', 'काली'], ['#0a2a8a', 'नीली']] },
      { id: 'out', label: 'Output', type: 'select', value: 'png', options: [['png', 'PNG (पारदर्शी)'], ['jpg', 'JPG (सफ़ेद पीछे)']] },
      { id: 'w', label: 'चौड़ाई px (वैकल्पिक)', type: 'number', value: '', min: 20 }, KB
    ],
    action: '✅ Signature तैयार करें',
    hint: 'नीचे के सफ़ेद डिब्बे में माउस/उँगली से signature करें।',
    ready: 'नीचे signature करें, फिर “Signature तैयार करें” दबाएँ।',
    custom: function (c) {
      var root = $('#plusCustom');
      root.innerHTML = '<div class="plus-cvwrap plus-sigwrap"><canvas id="sigCv" class="plus-cv plus-sig" width="900" height="320" aria-label="यहाँ signature करें"></canvas></div><div class="v41-actions"><button class="secondary-btn" id="sigUndo" type="button">↶ पिछला stroke</button><button class="secondary-btn" id="sigClear" type="button">साफ़ करें</button></div>';
      var cv = $('#sigCv'), x = cv.getContext('2d'), strokes = [], cur = null;
      c.S.sig = { strokes: strokes, cv: cv };
      function redraw() {
        x.clearRect(0, 0, cv.width, cv.height);
        var lw = c.v('pen') * 2; x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = x.fillStyle = c.v('color'); x.lineWidth = lw;
        strokes.concat(cur ? [cur] : []).forEach(function (s) {
          if (s.length === 1) { x.beginPath(); x.arc(s[0].x, s[0].y, lw / 2, 0, 7); x.fill(); return; }
          x.beginPath(); x.moveTo(s[0].x, s[0].y);
          for (var i = 1; i < s.length - 1; i++) { var mx = (s[i].x + s[i + 1].x) / 2, my = (s[i].y + s[i + 1].y) / 2; x.quadraticCurveTo(s[i].x, s[i].y, mx, my); }
          x.lineTo(s[s.length - 1].x, s[s.length - 1].y); x.stroke();
        });
      }
      c.S.sig.redraw = redraw;
      cv.addEventListener('pointerdown', function (e) { cv.setPointerCapture(e.pointerId); cur = [ptr(e, cv)]; redraw(); e.preventDefault(); });
      cv.addEventListener('pointermove', function (e) { if (!cur) return; cur.push(ptr(e, cv)); redraw(); });
      function end() { if (!cur) return; strokes.push(cur); cur = null; redraw(); }
      cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
      $('#sigUndo').addEventListener('click', function () { strokes.pop(); redraw(); });
      $('#sigClear').addEventListener('click', function () { strokes.length = 0; redraw(); });
      ['pen', 'color'].forEach(function (id) { document.getElementById('pf_' + id).addEventListener('input', redraw); });
    },
    run: async function (c) {
      var s = c.S.sig; if (!s.strokes.length) throw new Error('पहले ऊपर के डिब्बे में signature करें।');
      s.redraw();
      var bb = bbox(pix(s.cv), 8); if (!bb) throw new Error('Signature नहीं दिखी। दोबारा करें।');
      var pad = 14, out = H.canvas(bb.w + pad * 2, bb.h + pad * 2); out.getContext('2d').drawImage(s.cv, bb.x, bb.y, bb.w, bb.h, pad, pad, bb.w, bb.h);
      var tw = Math.floor(c.v('w')); if (tw >= 20) out = resizeCv(out, tw, out.height * tw / out.width);
      var jpg = c.v('out') === 'jpg', blob = jpg ? await H.toBlobKB(flatten(out), 'image/jpeg', c.v('kb')) : await H.toBlob(out, 'image/png');
      c.out(blob, 'signature.' + (jpg ? 'jpg' : 'png'));
      return 'Signature ' + out.width + '×' + out.height + ' px की बनी।';
    }
  });
  // alpha>thr wale pixels ka bounding box
  function bbox(id, thr) {
    var d = id.data, w = id.width, h = id.height, x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > thr) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  }

  /* ---------- 7. Signature -> transparent ---------- */
  A({
    cat: 'photo', icon: '🪄', title: 'Signature Transparent PNG', desc: 'कागज़ पर किए signature की फोटो से सफ़ेद पीछे का हिस्सा हटाएँ', tag: 'Signature',
    inputs: [{ id: 'f', label: 'Signature की फोटो चुनें', accept: IMG, multiple: true }],
    fields: [
      { id: 'thr', label: 'पीछे का हिस्सा हटाने की सीमा', type: 'range', value: 170, min: 80, max: 245, step: 1, help: 'signature कटे तो बढ़ाएँ, पीछे धब्बे बचें तो घटाएँ' },
      { id: 'ink', label: 'स्याही का रंग', type: 'select', value: 'orig', options: [['orig', 'जैसा है'], ['black', 'काला करें'], ['blue', 'नीला करें']] },
      { id: 'trim', label: 'खाली किनारे काटें', type: 'checkbox', value: true },
      { id: 'w', label: 'चौड़ाई px (वैकल्पिक)', type: 'number', value: '', min: 20 }
    ],
    run: function (c) {
      return batch(c, '_transparent', function (img) {
        var cv = limit(img, 8e6), id = pix(cv), d = id.data, t = c.v('thr'), ink = c.v('ink');
        for (var i = 0; i < d.length; i += 4) {
          var lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2], a = lum >= t ? 0 : lum <= t * 0.6 ? 255 : 255 * (t - lum) / (t * 0.4);
          if (ink === 'black') { d[i] = d[i + 1] = d[i + 2] = 0; } else if (ink === 'blue') { d[i] = 10; d[i + 1] = 42; d[i + 2] = 138; }
          d[i + 3] = a;
        }
        put(cv, id);
        if (c.v('trim')) { var bb = bbox(id, 8); if (bb) { var pad = 10, o = H.canvas(bb.w + 2 * pad, bb.h + 2 * pad); o.getContext('2d').drawImage(cv, bb.x, bb.y, bb.w, bb.h, pad, pad, bb.w, bb.h); cv = o; } }
        var tw = Math.floor(c.v('w')); if (tw >= 20) cv = resizeCv(cv, tw, cv.height * tw / cv.width);
        return cv;
      }, true);
    }
  });

  /* ---------- 8. Scan enhance ---------- */
  A({
    cat: 'document', icon: '📄', title: 'Scan Enhance (दस्तावेज़ साफ़ करें)', desc: 'मोबाइल से खींचे दस्तावेज़ को scan जैसा साफ़ और पढ़ने लायक बनाएँ', tag: 'Document',
    inputs: [{ id: 'f', label: 'दस्तावेज़ की फोटो चुनें', accept: IMG, multiple: true }],
    fields: [
      { id: 'mode', label: 'तरीका', type: 'select', value: 'doc', options: [['doc', 'काला-सफ़ेद scan (text के लिए सबसे अच्छा)'], ['auto', 'रंगीन — चमक/रंग ठीक करें'], ['gray', 'ग्रे — साफ़ करें']] },
      { id: 'str', label: 'काला-सफ़ेद की तीव्रता', type: 'range', value: 12, min: 4, max: 30, step: 1, show: function (v) { return v('mode') === 'doc'; } }, FMT, KB
    ],
    run: function (c) {
      return batch(c, '_scan', function (img) {
        var cv = limit(img, 12e6), w = cv.width, h = cv.height, id = pix(cv), d = id.data, mode = c.v('mode');
        var g = new Uint8ClampedArray(w * h);
        for (var i = 0, j = 0; i < d.length; i += 4, j++) g[j] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        function stretch(lo, hi) { var s = 255 / Math.max(1, hi - lo); return function (v) { v = (v - lo) * s; return v < 0 ? 0 : v > 255 ? 255 : v; }; }
        function pct(arr) { var hist = new Uint32Array(256); for (var k = 0; k < arr.length; k += 3) hist[arr[k]]++; var tot = arr.length / 3, acc = 0, lo = 0, hi = 255; for (var v = 0; v < 256; v++) { acc += hist[v]; if (acc > tot * 0.01) { lo = v; break; } } acc = 0; for (v = 255; v >= 0; v--) { acc += hist[v]; if (acc > tot * 0.01) { hi = v; break; } } return [lo, hi]; }
        if (mode === 'doc') {
          var W = w + 1, ii = new Uint32Array(W * (h + 1));
          for (var y = 0; y < h; y++) { var row = 0; for (var x = 0; x < w; x++) { row += g[y * w + x]; ii[(y + 1) * W + x + 1] = ii[y * W + x + 1] + row; } }
          var r = Math.max(8, Math.round(Math.min(w, h) / 40)), C = c.v('str') / 100;
          for (y = 0; y < h; y++) { var y0 = Math.max(0, y - r), y1 = Math.min(h, y + r + 1); for (x = 0; x < w; x++) { var x0 = Math.max(0, x - r), x1 = Math.min(w, x + r + 1), cnt = (x1 - x0) * (y1 - y0), sum = ii[y1 * W + x1] - ii[y0 * W + x1] - ii[y1 * W + x0] + ii[y0 * W + x0], mean = sum / cnt, v = g[y * w + x] < mean * (1 - C) ? 0 : 255, p = (y * w + x) * 4; d[p] = d[p + 1] = d[p + 2] = v; d[p + 3] = 255; } }
        } else if (mode === 'gray') {
          var q = pct(g), f = stretch(q[0], Math.max(q[0] + 20, q[1] - 10));
          for (i = 0, j = 0; i < d.length; i += 4, j++) { var v2 = f(g[j]); d[i] = d[i + 1] = d[i + 2] = v2; d[i + 3] = 255; }
        } else {
          var q2 = pct(g), lo = q2[0], hi = Math.max(q2[0] + 20, q2[1] - 5), f2 = stretch(lo, hi);
          for (i = 0; i < d.length; i += 4) { d[i] = f2(d[i]); d[i + 1] = f2(d[i + 1]); d[i + 2] = f2(d[i + 2]); d[i + 3] = 255; }
        }
        return put(cv, id);
      });
    }
  });

  /* ---------- 9. B&W / Grayscale ---------- */
  A({
    cat: 'photo', icon: '⚫', title: 'Black & White / Grayscale', desc: 'फोटो को ग्रे, काला-सफ़ेद, sepia या उल्टे रंग में बदलें', tag: 'Photo',
    inputs: [{ id: 'f', label: 'फोटो चुनें (कई चुन सकते हैं)', accept: IMG, multiple: true }],
    fields: [
      { id: 'mode', label: 'क्या करना है', type: 'select', value: 'gray', options: [['gray', 'ग्रे (Grayscale)'], ['bw', 'काला-सफ़ेद (B&W)'], ['sepia', 'Sepia'], ['invert', 'रंग उल्टे करें']] },
      { id: 'thr', label: 'B&W की सीमा', type: 'range', value: 128, min: 20, max: 235, step: 1, show: function (v) { return v('mode') === 'bw'; } }, FMT, KB
    ],
    run: function (c) {
      return batch(c, '_' + c.v('mode'), function (img) {
        var cv = H.imgCanvas(img), id = pix(cv), d = id.data, m = c.v('mode'), t = c.v('thr');
        for (var i = 0; i < d.length; i += 4) {
          var r = d[i], g = d[i + 1], b = d[i + 2], l = 0.299 * r + 0.587 * g + 0.114 * b;
          if (m === 'gray') d[i] = d[i + 1] = d[i + 2] = l;
          else if (m === 'bw') d[i] = d[i + 1] = d[i + 2] = l >= t ? 255 : 0;
          else if (m === 'sepia') { d[i] = Math.min(255, 0.393 * r + 0.769 * g + 0.189 * b); d[i + 1] = Math.min(255, 0.349 * r + 0.686 * g + 0.168 * b); d[i + 2] = Math.min(255, 0.272 * r + 0.534 * g + 0.131 * b); }
          else { d[i] = 255 - r; d[i + 1] = 255 - g; d[i + 2] = 255 - b; }
        }
        return put(cv, id);
      });
    }
  });

  /* ---------- 10. Brightness / Contrast ---------- */
  A({
    cat: 'photo', icon: '☀️', title: 'Brightness / Contrast', desc: 'फोटो की चमक, contrast, रंग की गहराई और sharpness ठीक करें', tag: 'Photo',
    inputs: [{ id: 'f', label: 'फोटो चुनें (कई चुन सकते हैं)', accept: IMG, multiple: true }],
    fields: [
      { id: 'b', label: 'चमक (Brightness)', type: 'range', value: 0, min: -100, max: 100, step: 1 },
      { id: 'ct', label: 'Contrast', type: 'range', value: 0, min: -100, max: 100, step: 1 },
      { id: 's', label: 'रंग की गहराई (Saturation)', type: 'range', value: 0, min: -100, max: 100, step: 1 },
      { id: 'sh', label: 'Sharpness', type: 'range', value: 0, min: 0, max: 100, step: 1 }, FMT, KB
    ],
    run: function (c) {
      return batch(c, '_adjusted', function (img) {
        var cv = H.imgCanvas(img), w = cv.width, h = cv.height, id = pix(cv), d = id.data, b = c.v('b') * 2.55, ct = c.v('ct') * 2.55, s = 1 + c.v('s') / 100, sh = c.v('sh') / 100;
        var f = (259 * (ct + 255)) / (255 * (259 - ct)), lut = new Uint8ClampedArray(256);
        for (var k = 0; k < 256; k++) lut[k] = f * (k + b - 128) + 128;
        for (var i = 0; i < d.length; i += 4) {
          var r = lut[d[i]], g = lut[d[i + 1]], bl = lut[d[i + 2]];
          if (s !== 1) { var l = 0.299 * r + 0.587 * g + 0.114 * bl; r = l + (r - l) * s; g = l + (g - l) * s; bl = l + (bl - l) * s; }
          d[i] = r; d[i + 1] = g; d[i + 2] = bl;
        }
        if (sh > 0) {
          var src = new Uint8ClampedArray(d), a = sh * 1.2;
          for (var y = 1; y < h - 1; y++) for (var x = 1; x < w - 1; x++) { var p = (y * w + x) * 4; for (var ch = 0; ch < 3; ch++) { var v = src[p + ch] * (1 + 4 * a) - a * (src[p - 4 + ch] + src[p + 4 + ch] + src[p - w * 4 + ch] + src[p + w * 4 + ch]); d[p + ch] = v; } }
        }
        return put(cv, id);
      });
    }
  });

  /* ---------- 11. Border ---------- */
  A({
    cat: 'photo', icon: '🖼️', title: 'Photo Border / Frame', desc: 'फोटो के चारों ओर रंगीन किनारा (border) जोड़ें', tag: 'Photo',
    inputs: [{ id: 'f', label: 'फोटो चुनें (कई चुन सकते हैं)', accept: IMG, multiple: true }],
    fields: [
      { id: 'bw', label: 'किनारे की मोटाई (px)', type: 'number', value: 20, min: 1, max: 500 },
      { id: 'color', label: 'रंग', type: 'color', value: '#ffffff' },
      { id: 'mode', label: 'कहाँ', type: 'select', value: 'out', options: [['out', 'बाहर जोड़ें (फोटो बड़ी होगी)'], ['in', 'अंदर (फोटो उतनी ही रहेगी)']] }, FMT, KB
    ],
    run: function (c) {
      return batch(c, '_border', function (img) {
        var w = img.naturalWidth, h = img.naturalHeight, b = Math.floor(c.v('bw')), out = c.v('mode') === 'out', col = c.v('color');
        var cv = H.canvas(out ? w + 2 * b : w, out ? h + 2 * b : h, col), x = cv.getContext('2d');
        if (out) x.drawImage(img, b, b); else { x.drawImage(img, 0, 0); x.lineWidth = b * 2; x.strokeStyle = col; x.strokeRect(0, 0, w, h); }
        return cv;
      });
    }
  });

  /* ---------- 12. Resize by % ---------- */
  A({
    cat: 'resize', icon: '📏', title: 'Resize by Percent', desc: 'फोटो को % में, या चौड़ाई/ऊँचाई तय करके छोटा-बड़ा करें', tag: 'Resize',
    inputs: [{ id: 'f', label: 'फोटो चुनें (कई चुन सकते हैं)', accept: IMG, multiple: true }],
    fields: [
      { id: 'mode', label: 'कैसे', type: 'select', value: 'pct', options: [['pct', 'प्रतिशत (%)'], ['w', 'चौड़ाई px (ऊँचाई अपने-आप)'], ['h', 'ऊँचाई px (चौड़ाई अपने-आप)'], ['max', 'सबसे लंबी तरफ़ px']] },
      { id: 'val', label: 'मान', type: 'number', value: 50, min: 1 }, FMT, KB
    ],
    run: function (c) {
      return batch(c, '_resized', function (img) {
        var w = img.naturalWidth, h = img.naturalHeight, m = c.v('mode'), v = c.v('val'), s;
        if (v <= 0) throw new Error('मान 0 से ज़्यादा रखें।');
        s = m === 'pct' ? v / 100 : m === 'w' ? v / w : m === 'h' ? v / h : v / Math.max(w, h);
        if (w * s > 12000 || h * s > 12000) throw new Error('Output बहुत बड़ा हो जाएगा। छोटा मान रखें।');
        return resizeCv(H.imgCanvas(img), w * s, h * s);
      });
    }
  });

  /* ---------- 13. Auto trim ---------- */
  A({
    cat: 'document', icon: '✂️', title: 'Auto Trim Margins', desc: 'scan/फोटो के खाली सफ़ेद किनारे अपने-आप काटें', tag: 'Document',
    inputs: [{ id: 'f', label: 'फोटो चुनें (कई चुन सकते हैं)', accept: IMG, multiple: true }],
    fields: [
      { id: 'tol', label: 'संवेदनशीलता', type: 'range', value: 25, min: 5, max: 90, step: 1, help: 'कम = ज़्यादा बारीकी से काटेगा' },
      { id: 'pad', label: 'बचा हुआ किनारा (px)', type: 'number', value: 10, min: 0, max: 300 }, FMT, KB
    ],
    run: function (c) {
      return batch(c, '_trim', function (img) {
        var cv = H.imgCanvas(img), w = cv.width, h = cv.height, d = pix(cv).data, tol = c.v('tol');
        function avg(x0, y0) { var r = 0, g = 0, b = 0, n = 0; for (var y = y0; y < Math.min(h, y0 + 5); y++) for (var x = x0; x < Math.min(w, x0 + 5); x++) { var p = (y * w + x) * 4; r += d[p]; g += d[p + 1]; b += d[p + 2]; n++; } return [r / n, g / n, b / n]; }
        var cs = [avg(0, 0), avg(w - 5, 0), avg(0, h - 5), avg(w - 5, h - 5)], bg = [0, 1, 2].map(function (k) { return cs.reduce(function (a, c2) { return a + c2[k]; }, 0) / 4; });
        var x0 = w, y0 = h, x1 = -1, y1 = -1;
        for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) { var p = (y * w + x) * 4; if ((Math.abs(d[p] - bg[0]) + Math.abs(d[p + 1] - bg[1]) + Math.abs(d[p + 2] - bg[2])) / 3 > tol) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
        if (x1 < 0) throw new Error('"' + img.src.slice(-0) + '" में काटने लायक किनारा नहीं मिला।'.replace('"' + img.src.slice(-0) + '"', 'इस फोटो'));
        var pad = Math.floor(c.v('pad')); x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad);
        var o = H.canvas(x1 - x0 + 1, y1 - y0 + 1); o.getContext('2d').drawImage(cv, x0, y0, o.width, o.height, 0, 0, o.width, o.height); return o;
      });
    }
  });

  /* ---------- 14. Remove EXIF ---------- */
  A({
    cat: 'photo', icon: '🧹', title: 'Remove Photo Location (EXIF)', desc: 'फोटो से location, कैमरा और तारीख जैसी छुपी जानकारी हटाएँ', tag: 'Privacy',
    inputs: [{ id: 'f', label: 'फोटो चुनें (कई चुन सकते हैं)', accept: IMG, multiple: true }],
    fields: [{ id: 'q', label: 'Quality (%)', type: 'range', value: 95, min: 60, max: 100, step: 1 }, FMT],
    hint: 'फोटो को दोबारा बनाया जाता है, इसलिए GPS location, कैमरा model, तारीख जैसा metadata नई फोटो में नहीं जाता।',
    run: async function (c) {
      var files = c.files('f'), fi = H.fmtInfo(c.v('fmt'));
      for (var i = 0; i < files.length; i++) {
        c.status('⏳ ' + (i + 1) + '/' + files.length);
        var cv = H.imgCanvas(await H.loadImg(files[i])); if (fi.type === 'image/jpeg') cv = flatten(cv);
        c.out(await H.toBlob(cv, fi.type, c.v('q') / 100), H.base(files[i].name) + '_clean.' + fi.ext);
      }
      return files.length + ' फोटो साफ़ हुईं (metadata हटी)।';
    }
  });
})();
