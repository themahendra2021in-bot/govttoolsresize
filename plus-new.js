/* plus-new.js — Passport Photo (crop + border) aur drag-crop helper (sab browser mein) */
(function () {
  'use strict';
  var P = window.PLUS, H = P.H, A = P.add, esc = H.esc, $ = H.$, X = H.pdfx;
  var PDFACC = 'application/pdf,.pdf', A4W = 595.28, A4H = 841.89;

  /* ---------- JPEG mein DPI likhna ---------- */
  H.jpegDpi = async function (blob, dpi) {
    var u = await H.bytes(blob);
    if (u[0] === 0xff && u[1] === 0xd8 && u[2] === 0xff && u[3] === 0xe0 && u[6] === 0x4a && u[7] === 0x46) {
      u[13] = 1; u[14] = dpi >> 8; u[15] = dpi & 255; u[16] = dpi >> 8; u[17] = dpi & 255;
      return new Blob([u], { type: 'image/jpeg' });
    }
    return blob;
  };

  /* ---------- drag-crop helper (naya selection banayein / andar se khiskayein) ---------- */
  function ptr(e, cv) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height }; }
  H.cropper = function (cv, st, o) {
    o = o || {}; var x = cv.getContext('2d'), drag = null;
    function size() { var s = st.src; if (!s) return; st.sc = Math.min(1, (o.maxW || 1000) / s.width, (o.maxH || 900) / s.height); cv.width = Math.max(1, Math.round(s.width * st.sc)); cv.height = Math.max(1, Math.round(s.height * st.sc)); }
    function draw() {
      if (!st.src) { cv.width = 600; cv.height = 240; x.fillStyle = '#f2f4f7'; x.fillRect(0, 0, 600, 240); x.fillStyle = '#667085'; x.font = '20px sans-serif'; x.textAlign = 'center'; x.fillText(o.empty || 'पहले फ़ाइल चुनें', 300, 125); return; }
      x.drawImage(st.src, 0, 0, cv.width, cv.height);
      var list = (st.rects || []).concat(st.sel ? [st.sel] : []);
      if (st.sel && !st.rects) { x.fillStyle = 'rgba(0,0,0,.45)'; var r = sc(st.sel); x.fillRect(0, 0, cv.width, r.y); x.fillRect(0, r.y + r.h, cv.width, cv.height - r.y - r.h); x.fillRect(0, r.y, r.x, r.h); x.fillRect(r.x + r.w, r.y, cv.width - r.x - r.w, r.h); x.drawImage(st.src, st.sel.x, st.sel.y, st.sel.w, st.sel.h, r.x, r.y, r.w, r.h); }
      list.forEach(function (q) { var r = sc(q); if (st.rects) { x.fillStyle = 'rgba(220,0,0,.3)'; x.fillRect(r.x, r.y, r.w, r.h); } x.lineWidth = 2; x.strokeStyle = st.rects ? '#d00000' : '#fff'; x.setLineDash(st.rects ? [] : [8, 5]); x.strokeRect(r.x, r.y, r.w, r.h); x.setLineDash([]); if (!st.rects) { x.strokeStyle = '#1683d8'; x.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2); } });
    }
    function sc(q) { return { x: q.x * st.sc, y: q.y * st.sc, w: q.w * st.sc, h: q.h * st.sc }; }
    function src(p) { return { x: Math.max(0, Math.min(st.src.width, p.x / st.sc)), y: Math.max(0, Math.min(st.src.height, p.y / st.sc)) }; }
    cv.addEventListener('pointerdown', function (e) {
      if (!st.src) return; cv.setPointerCapture(e.pointerId); var p = src(ptr(e, cv)), s = st.sel;
      if (!st.rects && s && p.x >= s.x && p.x <= s.x + s.w && p.y >= s.y && p.y <= s.y + s.h) drag = { mv: true, ox: p.x - s.x, oy: p.y - s.y };
      else drag = { sx: p.x, sy: p.y }; e.preventDefault();
    });
    cv.addEventListener('pointermove', function (e) {
      if (!drag) return; var p = src(ptr(e, cv)), W = st.src.width, Hh = st.src.height;
      if (drag.mv) { st.sel.x = Math.max(0, Math.min(W - st.sel.w, p.x - drag.ox)); st.sel.y = Math.max(0, Math.min(Hh - st.sel.h, p.y - drag.oy)); }
      else {
        var rt = o.ratio ? o.ratio() : 0, dx = p.x - drag.sx, dy = p.y - drag.sy, w = Math.abs(dx), h = Math.abs(dy);
        if (rt) { if (w / rt > h) h = w / rt; else w = h * rt; var mw = dx < 0 ? drag.sx : W - drag.sx, mh = dy < 0 ? drag.sy : Hh - drag.sy; if (w > mw) { w = mw; h = w / rt; } if (h > mh) { h = mh; w = h * rt; } }
        var nx = dx < 0 ? drag.sx - w : drag.sx, ny = dy < 0 ? drag.sy - h : drag.sy;
        st.cur = { x: nx, y: ny, w: w, h: h }; if (st.rects) { st.sel = st.cur; } else st.sel = st.cur;
      }
      draw();
    });
    function end() {
      if (!drag) return; var d = drag; drag = null;
      if (st.rects) { if (st.sel && st.sel.w > 4 && st.sel.h > 4) st.rects.push(st.sel); st.sel = null; }
      else if (!d.mv && (!st.sel || st.sel.w < 8 || st.sel.h < 8)) st.sel = null;
      draw(); if (o.onChange) o.onChange();
    }
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    return { draw: draw, size: size, set: function (canvas) { st.src = canvas; st.sel = null; if (st.rects) st.rects = []; size(); draw(); } };
  };
  var CV_HTML = function (id, label) { return '<div class="plus-cvwrap"><canvas id="' + id + '" class="plus-cv" width="600" height="240" aria-label="' + label + '"></canvas></div>'; };

  /* =================== Passport Photo: Crop + Black Border =================== */
  function mmpx(mm, dpi) { return Math.max(1, Math.round(mm * dpi / 25.4)); }
  A({
    cat: 'photo', icon: '📸', title: 'Passport Photo (Crop + Black Border)', desc: 'फोटो पर खुद crop चुनें, काला border लगाएँ और A4 sheet में कई photos बनाएँ', tag: 'नया', top: true,
    inputs: [{ id: 'f', label: 'फोटो चुनें', accept: 'image/*', onFiles: function (a, S) { if (S.load) S.load(a[0]); } }],
    fields: [
      { id: 'w', label: 'फोटो चौड़ाई (mm)', type: 'number', value: 35, min: 5, step: 0.1 }, { id: 'h', label: 'फोटो ऊँचाई (mm)', type: 'number', value: 45, min: 5, step: 0.1 },
      { id: 'dpi', label: 'DPI', type: 'select', value: '300', options: [['200', '200'], ['300', '300 (सामान्य)'], ['600', '600 (HQ)']] },
      { id: 'lock', label: 'Crop इसी अनुपात (35:45) में रखें', type: 'checkbox', value: true },
      { id: 'bmm', label: 'Border मोटाई (mm) — 0 = नहीं', type: 'number', value: 0.4, min: 0, max: 5, step: 0.1 },
      { id: 'bcol', label: 'Border का रंग', type: 'select', value: '#000000', options: [['#000000', 'काला'], ['#444444', 'गहरा ग्रे'], ['#ffffff', 'सफ़ेद']] },
      { id: 'sheet', label: 'A4 sheet भी बनाएँ', type: 'checkbox', value: true },
      { id: 'n', label: 'Sheet पर कितनी फोटो', type: 'number', value: 8, min: 1, max: 100, show: function (v) { return v('sheet'); } },
      { id: 'gap', label: 'फोटो के बीच दूरी (mm)', type: 'number', value: 3, min: 0, max: 30, step: 0.5, show: function (v) { return v('sheet'); } }
    ],
    hint: 'फोटो चुनने के बाद तस्वीर पर उँगली/माउस से चेहरे वाला हिस्सा खींचकर चुनें (चुना हुआ डिब्बा अंदर से खिसका भी सकते हैं)। कुछ न चुनें तो बीच से अपने-आप crop होगा। Border फोटो के अंदर बनता है, इसलिए size वही रहता है।',
    action: '✅ फोटो तैयार करें',
    custom: function (c) {
      var S = c.S, st = S.st = { src: null, sel: null };
      $('#plusCustom').innerHTML = CV_HTML('ppCv', 'Crop के लिए फोटो');
      var cr = H.cropper($('#ppCv'), st, { ratio: function () { return c.v('lock') ? c.v('w') / c.v('h') : 0; }, maxH: 560 });
      cr.draw();
      S.load = async function (f) { try { c.status('⏳ खोल रहे हैं…'); var im = await H.loadImg(f), cv = H.canvas(im.naturalWidth, im.naturalHeight, '#fff'); cv.getContext('2d').drawImage(im, 0, 0); cr.set(cv); c.status('तैयार — तस्वीर पर crop चुनें (या सीधे “फोटो तैयार करें” दबाएँ)।'); } catch (e) { c.status('❌ फोटो खुल नहीं सकी।', 'err'); } };
    },
    run: async function (c) {
      var st = c.S.st; if (!st.src) throw new Error('पहले फोटो चुनें।');
      var dpi = +c.v('dpi'), pw = mmpx(c.v('w'), dpi), ph = mmpx(c.v('h'), dpi), sel = st.sel;
      if (!sel) { var rt = pw / ph, w = st.src.width, h = w / rt; if (h > st.src.height) { h = st.src.height; w = h * rt; } sel = { x: (st.src.width - w) / 2, y: (st.src.height - h) / 2, w: w, h: h }; }
      var part = H.canvas(Math.round(sel.w), Math.round(sel.h)); part.getContext('2d').drawImage(st.src, sel.x, sel.y, sel.w, sel.h, 0, 0, part.width, part.height);
      var one = H.resizeCv(part, pw, ph), x = one.getContext('2d'), b = c.v('bmm') > 0 ? mmpx(c.v('bmm'), dpi) : 0;
      if (b) { x.fillStyle = c.v('bcol'); x.fillRect(0, 0, pw, b); x.fillRect(0, ph - b, pw, b); x.fillRect(0, 0, b, ph); x.fillRect(pw - b, 0, b, ph); }
      c.out(await H.jpegDpi(await H.toBlob(one, 'image/jpeg', 0.97), dpi), 'passport-photo-' + c.v('w') + 'x' + c.v('h') + 'mm.jpg');
      var msg = 'फोटो ' + pw + '×' + ph + ' px (' + dpi + ' DPI)';
      if (c.v('sheet')) {
        var W = mmpx(210, dpi), Hh = mmpx(297, dpi), m = mmpx(8, dpi), g = mmpx(c.v('gap'), dpi), cols = Math.max(1, Math.floor((W - 2 * m + g) / (pw + g))), n = Math.floor(c.v('n')), rows = Math.floor((Hh - 2 * m + g) / (ph + g)), cap = cols * rows;
        if (cap < 1) throw new Error('फोटो A4 में नहीं आ रही — size घटाएँ।');
        var use = Math.min(n, cap), rn = Math.ceil(use / cols), sheet = H.canvas(W, Hh, '#fff'), sx = sheet.getContext('2d'), rowsW = Math.min(use, cols) * (pw + g) - g, x0 = Math.round((W - rowsW) / 2);
        for (var i = 0; i < use; i++) sx.drawImage(one, x0 + (i % cols) * (pw + g), m + Math.floor(i / cols) * (ph + g));
        c.out(await H.jpegDpi(await H.toBlob(sheet, 'image/jpeg', 0.97), dpi), 'passport-photos-A4-sheet.jpg');
        var PL = await H.pdfLib(), doc = await PL.PDFDocument.create(), img = await doc.embedJpg(await H.bytes(await H.toBlob(sheet, 'image/jpeg', 0.97)));
        doc.addPage([595.28, 841.89]).drawImage(img, { x: 0, y: 0, width: 595.28, height: 841.89 });
        c.out(new Blob([await doc.save()], { type: 'application/pdf' }), 'passport-photos-A4-sheet.pdf');
        msg += ' • A4 sheet पर ' + use + ' फोटो' + (use < n ? ' (सिर्फ़ इतनी ही आ सकीं)' : '');
      }
      return msg;
    }
  });

})();
