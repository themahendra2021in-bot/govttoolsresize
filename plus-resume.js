/* plus-resume.js — Resume / बायोडाटा Maker (3 formats, हिंदी + English, A4 PDF/PNG) */
(function () {
  'use strict';
  var P = window.PLUS, H = P.H, A = P.add;
  var L = {
    en: { obj: 'Career Objective', edu: 'Educational Qualification', exp: 'Experience', skills: 'Skills', lang: 'Languages', hob: 'Hobbies', pers: 'Personal Details', decl: 'Declaration', cont: 'Contact', eh: ['Qualification', 'Board / University', 'Year', 'Percentage'], dtxt: 'I hereby declare that the above information is true to the best of my knowledge.', place: 'Place', date: 'Date', sign: 'Signature', bio: 'BIO-DATA', father: "Father's Name", dob: 'Date of Birth', gender: 'Gender', marital: 'Marital Status', nat: 'Nationality', addr: 'Address', ph: 'Mobile', em: 'Email' },
    hi: { obj: 'करियर उद्देश्य', edu: 'शैक्षणिक योग्यता', exp: 'अनुभव', skills: 'कौशल', lang: 'भाषाएँ', hob: 'रुचियाँ', pers: 'व्यक्तिगत जानकारी', decl: 'घोषणा', cont: 'संपर्क', eh: ['योग्यता', 'बोर्ड / विश्वविद्यालय', 'वर्ष', 'प्रतिशत'], dtxt: 'मैं घोषणा करता/करती हूँ कि ऊपर दी गई सभी जानकारी मेरी जानकारी में सही है।', place: 'स्थान', date: 'दिनांक', sign: 'हस्ताक्षर', bio: 'बायोडाटा', father: 'पिता का नाम', dob: 'जन्म तिथि', gender: 'लिंग', marital: 'वैवाहिक स्थिति', nat: 'राष्ट्रीयता', addr: 'पता', ph: 'मोबाइल', em: 'ईमेल' }
  };
  function lines(s) { return String(s || '').split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean); }
  function fmtDate(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? m[3] + '/' + m[2] + '/' + m[1] : (iso || ''); }

  function build(d, photo) {
    var W = 1240, HH = 1754, M = 78, SW = 390, pages = [], cv, g, y, sy, T = L[d.lang], acc = d.color, side = d.tpl === 'side', form = d.tpl === 'form';
    var X0 = side ? SW + 56 : M, CW = side ? W - X0 - 64 : W - 2 * M;
    function font(px, b) { g.font = (b ? 'bold ' : '') + px + 'px ' + H.fontStack; }
    function wrap(t, px, b, mw) {
      font(px, b); var out = [];
      String(t).split('\n').forEach(function (par) {
        var words = par.split(/\s+/).filter(Boolean), cur = '';
        if (!words.length) { out.push(''); return; }
        words.forEach(function (w) {
          var tst = cur ? cur + ' ' + w : w;
          if (g.measureText(tst).width <= mw || !cur) { cur = tst; } else { out.push(cur); cur = w; }
          while (g.measureText(cur).width > mw && cur.length > 1) { var k = cur.length - 1; while (k > 1 && g.measureText(cur.slice(0, k)).width > mw) k--; out.push(cur.slice(0, k)); cur = cur.slice(k); }
        });
        out.push(cur);
      });
      return out;
    }
    function newPage() {
      cv = H.canvas(W, HH, '#fff'); g = cv.getContext('2d'); pages.push(cv); g.textBaseline = 'top';
      if (side) { g.fillStyle = acc; g.fillRect(0, 0, SW, HH); }
      y = side ? 70 : M;
    }
    function ensure(h) { if (y + h > HH - M) newPage(); }
    function text(t, px, o) {
      o = o || {}; var x0 = o.x == null ? X0 : o.x, mw = o.w || CW, ls = wrap(t, px, o.b, mw), lh = Math.round(px * (o.lh || 1.4));
      ls.forEach(function (l) { ensure(lh); font(px, o.b); g.fillStyle = o.color || '#1a1a1a'; g.textAlign = o.align || 'left'; g.fillText(l, o.align === 'center' ? x0 + mw / 2 : o.align === 'right' ? x0 + mw : x0, y + (lh - px) / 2 - 2); y += lh; });
      g.textAlign = 'left';
    }
    function head(title) { y += 14; ensure(70); text(title.toUpperCase ? (d.lang === 'en' ? title.toUpperCase() : title) : title, 30, { b: true, color: side ? acc : acc }); g.fillStyle = acc; g.fillRect(X0, y, CW, 3); y += 14; }
    function photoBox(x0, y0, w, h) {
      if (!photo) return false; var s = Math.max(w / photo.width, h / photo.height), sw = w / s, sh = h / s;
      g.drawImage(photo, (photo.width - sw) / 2, (photo.height - sh) / 2, sw, sh, x0, y0, w, h); g.strokeStyle = side ? '#fff' : '#222'; g.lineWidth = 3; g.strokeRect(x0, y0, w, h); return true;
    }
    newPage();
    var pers = [[T.father, d.father], [T.dob, fmtDate(d.dob)], [T.gender, d.gender], [T.marital, d.marital], [T.nat, d.nat]].concat(lines(d.more).map(function (l) { var i = l.indexOf(':'); return i > 0 ? [l.slice(0, i).trim(), l.slice(i + 1).trim()] : ['', l]; })).filter(function (r) { return r[1]; });
    var contact = [[T.ph, d.phone], [T.em, d.email], [T.addr, d.addr]].filter(function (r) { return r[1]; });

    if (side) {
      // sidebar
      sy = 70; var px0 = 40;
      if (photo) { photoBox(px0 + 30, sy, SW - 140, Math.round((SW - 140) * 1.25)); sy += Math.round((SW - 140) * 1.25) + 40; }
      function sideBlock(title, rows, plain) {
        var save = y; y = sy; var gg = g; g.fillStyle = '#fff'; font(26, true); g.fillText(title.toUpperCase ? (d.lang === 'en' ? title.toUpperCase() : title) : title, px0, y); y += 40; g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(px0, y - 4, SW - 2 * px0, 2); y += 10;
        rows.forEach(function (r) { var t = plain ? r : (r[0] ? r[0] + ': ' : '') + r[1]; wrap(t, 23, false, SW - 2 * px0).forEach(function (l) { font(23); g.fillStyle = '#fff'; g.fillText(l, px0, y); y += 32; }); y += plain ? 4 : 8; });
        sy = y + 18; y = save;
      }
      if (contact.length) sideBlock(T.cont, contact);
      if (pers.length) sideBlock(T.pers, pers);
      var sk = lines(d.skills.replace(/,/g, '\n')); if (sk.length) sideBlock(T.skills, sk.map(function (s) { return '• ' + s; }), true);
      var lg = lines(d.langs.replace(/,/g, '\n')); if (lg.length) sideBlock(T.lang, lg.map(function (s) { return '• ' + s; }), true);
      var hb = lines(d.hobby.replace(/,/g, '\n')); if (hb.length) sideBlock(T.hob, hb.map(function (s) { return '• ' + s; }), true);
      y = 70; text(d.name, 64, { b: true, color: '#111', lh: 1.15 }); if (d.title) text(d.title, 32, { color: acc, b: true }); y += 10;
    } else if (form) {
      text(T.bio, 52, { b: true, align: 'center', color: acc, w: W - 2 * M - (photo ? 240 : 0) }); y += 6;
      g.fillStyle = acc; g.fillRect(M, y, W - 2 * M, 4); y += 24;
      var top0 = y, rowsF = [[d.lang === 'en' ? 'Name' : 'नाम', d.name]].concat(d.title ? [[d.lang === 'en' ? 'Post Applied' : 'पद', d.title]] : [], pers, contact);
      var lw = 300, vw = W - 2 * M - lw - (photo ? 250 : 0);
      rowsF.forEach(function (r) { if (!r[1]) return; var ls = wrap(r[1], 28, false, vw - 20), h = Math.max(1, ls.length) * 40 + 8; ensure(h); g.fillStyle = '#1a1a1a'; font(28, true); g.fillText(r[0] + ' :', M, y + 6); ls.forEach(function (l, k) { font(28); g.fillText(l, M + lw, y + 6 + k * 40); }); y += h; g.fillStyle = '#ddd'; g.fillRect(M, y - 2, W - 2 * M - (photo ? 250 : 0), 1); });
      if (photo) { photoBox(W - M - 220, top0, 220, 280); if (y < top0 + 300) y = top0 + 300; }
      y += 6;
    } else {
      var hw = CW - (photo ? 240 : 0); text(d.name, 62, { b: true, color: acc, w: hw, lh: 1.15 }); if (d.title) text(d.title, 32, { b: true, color: '#333', w: hw });
      y += 6; contact.forEach(function (r) { text(r[0] + ': ' + r[1], 25, { color: '#333', w: hw }); });
      if (photo) photoBox(W - M - 210, M, 210, 262); if (photo && y < M + 280) y = M + 280; y += 4; g.fillStyle = acc; g.fillRect(M, y, W - 2 * M, 4); y += 14;
      if (pers.length) { head(T.pers); pers.forEach(function (r) { var save = y; font(27, true); g.fillStyle = '#1a1a1a'; ensure(40); g.fillText((r[0] ? r[0] : '') , X0, y + 4); var sv = y; y = sv; text(r[1], 27, { x: X0 + 330, w: CW - 330 }); g.textAlign = 'left'; }); }
    }

    if (d.obj.trim()) { head(T.obj); text(d.obj.trim(), 27, { lh: 1.5 }); }
    var ed = lines(d.edu).map(function (l) { return l.split('|').map(function (c) { return c.trim(); }); });
    if (ed.length) {
      head(T.edu); var fr = [0.26, 0.34, 0.14, 0.26], cx = [], acc2 = 0; fr.forEach(function (f) { cx.push(X0 + acc2); acc2 += CW * f; });
      var hrow = function (cells, b, bg) { var cl = cells.map(function (c, i) { return wrap(c || '', 24, b, CW * fr[i] - 16); }), mh = Math.max.apply(null, cl.map(function (a) { return a.length; })) * 34 + 14; ensure(mh); if (bg) { g.fillStyle = bg; g.fillRect(X0, y, CW, mh); } g.strokeStyle = '#999'; g.lineWidth = 1; g.strokeRect(X0, y, CW, mh); cl.forEach(function (ls, i) { if (i) { g.beginPath(); g.moveTo(cx[i], y); g.lineTo(cx[i], y + mh); g.stroke(); } ls.forEach(function (l, k) { font(24, b); g.fillStyle = '#1a1a1a'; g.fillText(l, cx[i] + 8, y + 8 + k * 34); }); }); y += mh; };
      hrow(T.eh, true, '#eef1f5'); ed.forEach(function (r) { hrow([r[0], r[1], r[2], r[3]], false); });
    }
    var ex = lines(d.exp);
    if (ex.length) { head(T.exp); ex.forEach(function (l) { var p = l.split('|').map(function (c) { return c.trim(); }), t = p[0] + (p[1] ? ' — ' + p[1] : '') + (p[2] ? '  (' + p[2] + ')' : ''); text(t, 27, { b: true }); if (p[3]) text(p[3], 25, { color: '#333', lh: 1.45 }); y += 8; }); }
    if (!side) {
      var sk2 = lines(d.skills.replace(/,/g, '\n')); if (sk2.length) { head(T.skills); text(sk2.map(function (s) { return '• ' + s; }).join('   '), 26, { lh: 1.5 }); }
      var lg2 = lines(d.langs.replace(/,/g, '\n')); if (lg2.length) { head(T.lang); text(lg2.join(', '), 26); }
      var hb2 = lines(d.hobby.replace(/,/g, '\n')); if (hb2.length) { head(T.hob); text(hb2.join(', '), 26); }
    }
    if (d.decl) {
      ensure(260); head(T.decl); text(T.dtxt, 26, { lh: 1.5 }); y += 40;
      var yy = y; font(26); g.fillStyle = '#1a1a1a'; g.fillText(T.place + ': ' + (d.place || '__________'), X0, yy); g.fillText(T.date + ': ' + (fmtDate(d.dt) || '__________'), X0, yy + 40);
      g.textAlign = 'right'; g.fillText(T.sign + ' ____________________', X0 + CW, yy + 40); g.textAlign = 'left';
      if (d.name) { font(26, true); g.textAlign = 'right'; g.fillText('(' + d.name + ')', X0 + CW, yy + 84); g.textAlign = 'left'; }
      y = yy + 120;
    }
    return pages;
  }

  A({
    cat: 'document', icon: '📄', title: 'Resume / Biodata Maker', desc: 'नौकरी/फॉर्म के लिए Resume या बायोडाटा बनाएँ — हिंदी/English, 3 डिज़ाइन, A4 PDF', tag: 'नया', top: true,
    inputs: [{ id: 'p', label: 'फोटो (वैकल्पिक)', accept: 'image/*', optional: true }],
    fields: [
      { id: 'tpl', label: 'डिज़ाइन', type: 'select', value: 'classic', options: [['classic', 'Classic — सीधा एक कॉलम'], ['side', 'Modern — रंगीन साइड-पट्टी'], ['form', 'सरकारी बायोडाटा फ़ॉर्म']] },
      { id: 'lang', label: 'शीर्षकों की भाषा', type: 'select', value: 'hi', options: [['hi', 'हिंदी'], ['en', 'English']] },
      { id: 'color', label: 'मुख्य रंग', type: 'select', value: '#0f4c81', options: [['#0f4c81', 'नीला'], ['#1b6b3a', 'हरा'], ['#7a1f2b', 'मैरून'], ['#333333', 'ग्रे/काला'], ['#6a2c91', 'बैंगनी']] },
      { id: 'name', label: 'पूरा नाम *', type: 'text', full: true }, { id: 'title', label: 'पद / किस काम के लिए', type: 'text', placeholder: 'जैसे Computer Operator', full: true },
      { id: 'phone', label: 'मोबाइल', type: 'tel' }, { id: 'email', label: 'ईमेल', type: 'email' },
      { id: 'addr', label: 'पता', type: 'text', full: true },
      { id: 'father', label: 'पिता का नाम', type: 'text' }, { id: 'dob', label: 'जन्म तिथि', type: 'date', value: '' },
      { id: 'gender', label: 'लिंग', type: 'select', value: '', options: [['', '— नहीं दिखाना —'], ['पुरुष / Male', 'पुरुष'], ['महिला / Female', 'महिला'], ['अन्य / Other', 'अन्य']] },
      { id: 'marital', label: 'वैवाहिक स्थिति', type: 'select', value: '', options: [['', '— नहीं दिखाना —'], ['अविवाहित / Unmarried', 'अविवाहित'], ['विवाहित / Married', 'विवाहित']] },
      { id: 'nat', label: 'राष्ट्रीयता', type: 'text', value: 'भारतीय' },
      { id: 'more', label: 'और जानकारी (हर लाइन: नाम: मान)', type: 'textarea', rows: 2, full: true, placeholder: 'वर्ग: सामान्य\nधर्म: हिंदू' },
      { id: 'obj', label: 'करियर उद्देश्य', type: 'textarea', rows: 3, full: true, placeholder: 'जैसे: मैं अपनी योग्यता और मेहनत से संस्था के विकास में योगदान देना चाहता हूँ।' },
      { id: 'edu', label: 'शिक्षा — हर लाइन: योग्यता | बोर्ड/विश्वविद्यालय | वर्ष | प्रतिशत', type: 'textarea', rows: 5, full: true, value: '10वीं | MP Board | 2015 | 72%\n12वीं | MP Board | 2017 | 68%\nB.A. | विश्वविद्यालय का नाम | 2020 | 60%' },
      { id: 'exp', label: 'अनुभव — हर लाइन: पद | संस्था | अवधि | विवरण', type: 'textarea', rows: 3, full: true, placeholder: 'Computer Operator | ABC CSC Centre | 2021–2023 | फॉर्म भरना, प्रिंटिंग' },
      { id: 'skills', label: 'कौशल (कॉमा या नई लाइन से)', type: 'textarea', rows: 2, full: true, placeholder: 'MS Word, Excel, हिंदी टाइपिंग, इंटरनेट' },
      { id: 'langs', label: 'भाषाएँ', type: 'text', value: 'हिंदी, English' }, { id: 'hobby', label: 'रुचियाँ', type: 'text' },
      { id: 'decl', label: 'घोषणा + हस्ताक्षर की जगह जोड़ें', type: 'checkbox', value: true },
      { id: 'place', label: 'स्थान', type: 'text', show: function (v) { return v('decl'); } }, { id: 'dt', label: 'दिनांक', type: 'date', value: function () { return H.todayISO(); }, show: function (v) { return v('decl'); } }
    ],
    hint: 'खाली छोड़ी गई जानकारी Resume में अपने-आप छिप जाती है। डिज़ाइन/भाषा बदलकर दोबारा बटन दबा सकते हैं। नोट: PDF पूरे पन्ने की तस्वीर के रूप में बनती है (हिंदी सही दिखे इसलिए), इसलिए उसमें text select/copy नहीं होगा। जो जानकारी भरें वह सच्ची और सही हो।',
    action: '✅ Resume बनाएँ',
    run: async function (c) {
      var d = {}; ['tpl', 'lang', 'color', 'name', 'title', 'phone', 'email', 'addr', 'father', 'dob', 'gender', 'marital', 'nat', 'more', 'obj', 'edu', 'exp', 'skills', 'langs', 'hobby', 'place', 'dt'].forEach(function (k) { d[k] = String(c.v(k) == null ? '' : c.v(k)).trim(); });
      d.decl = c.v('decl'); if (!d.name) throw new Error('पूरा नाम लिखें।');
      var photo = null, pf = c.file('p'); if (pf) { var im = await H.loadImg(pf); photo = H.canvas(im.naturalWidth, im.naturalHeight, '#fff'); photo.getContext('2d').drawImage(im, 0, 0); }
      var pages = build(d, photo), PL = await H.pdfLib(), doc = await PL.PDFDocument.create();
      for (var i = 0; i < pages.length; i++) {
        var jpg = await H.toBlob(pages[i], 'image/jpeg', 0.93), emb = await doc.embedJpg(await H.bytes(jpg));
        doc.addPage([595.28, 841.89]).drawImage(emb, { x: 0, y: 0, width: 595.28, height: 841.89 });
        c.out(await H.toBlob(pages[i], 'image/png'), 'Resume-page-' + (i + 1) + '.png');
      }
      c.out(new Blob([await doc.save()], { type: 'application/pdf' }), 'Resume-' + d.name.replace(/[^\wऀ-ॿ]+/g, '_') + '.pdf');
      return pages.length + ' पेज का Resume तैयार।';
    }
  });
})();
