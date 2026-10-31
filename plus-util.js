/* plus-util.js — रोज़ के काम के उपयोगी tools (सब browser में, कोई upload नहीं) */
(function () {
  'use strict';
  var P = window.PLUS, H = P.H, A = P.add, esc = H.esc, $ = H.$;
  var U = 'utility';
  function pad2(n) { return String(n).padStart(2, '0'); }
  function fd(d) { return pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + '/' + d.getFullYear(); }
  function pd(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); if (!m) return null; var d = new Date(+m[1], +m[2] - 1, +m[3]); return d.getMonth() === +m[2] - 1 ? d : null; }
  var DAYS = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
  function table(rows) { return '<table class="plus-table"><tbody>' + rows.map(function (r) { return '<tr><th scope="row">' + esc(r[0]) + '</th><td>' + (r[2] ? r[1] : esc(r[1])) + '</td></tr>'; }).join('') + '</tbody></table>'; }
  function inr(n, dec) { return '₹ ' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: dec == null ? 2 : dec, maximumFractionDigits: dec == null ? 2 : dec }); }
  function daysBetween(a, b) { return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 864e5); }
  function ymd(a, b) { // a <= b
    var y = b.getFullYear() - a.getFullYear(), m = b.getMonth() - a.getMonth(), d = b.getDate() - a.getDate();
    if (d < 0) { m--; d += new Date(b.getFullYear(), b.getMonth(), 0).getDate(); }
    if (m < 0) { y--; m += 12; }
    return { y: y, m: m, d: d };
  }

  /* ---------- Amount in words ---------- */
  var HI = 'शून्य,एक,दो,तीन,चार,पाँच,छह,सात,आठ,नौ,दस,ग्यारह,बारह,तेरह,चौदह,पंद्रह,सोलह,सत्रह,अठारह,उन्नीस,बीस,इक्कीस,बाईस,तेईस,चौबीस,पच्चीस,छब्बीस,सत्ताईस,अट्ठाईस,उनतीस,तीस,इकतीस,बत्तीस,तैंतीस,चौंतीस,पैंतीस,छत्तीस,सैंतीस,अड़तीस,उनतालीस,चालीस,इकतालीस,बयालीस,तैंतालीस,चवालीस,पैंतालीस,छियालीस,सैंतालीस,अड़तालीस,उनचास,पचास,इक्यावन,बावन,तिरपन,चौवन,पचपन,छप्पन,सत्तावन,अट्ठावन,उनसठ,साठ,इकसठ,बासठ,तिरसठ,चौंसठ,पैंसठ,छियासठ,सरसठ,अड़सठ,उनहत्तर,सत्तर,इकहत्तर,बहत्तर,तिहत्तर,चौहत्तर,पचहत्तर,छिहत्तर,सतहत्तर,अठहत्तर,उन्यासी,अस्सी,इक्यासी,बयासी,तिरासी,चौरासी,पचासी,छियासी,सत्तासी,अट्ठासी,नवासी,नब्बे,इक्यानवे,बानवे,तिरानवे,चौरानवे,पंचानवे,छियानवे,सत्तानवे,अट्ठानवे,निन्यानवे'.split(',');
  var EN1 = 'Zero,One,Two,Three,Four,Five,Six,Seven,Eight,Nine,Ten,Eleven,Twelve,Thirteen,Fourteen,Fifteen,Sixteen,Seventeen,Eighteen,Nineteen'.split(','), EN10 = ',,Twenty,Thirty,Forty,Fifty,Sixty,Seventy,Eighty,Ninety'.split(',');
  function en99(n) { return n < 20 ? EN1[n] : EN10[Math.floor(n / 10)] + (n % 10 ? '-' + EN1[n % 10] : ''); }
  function en999(n) { var h = Math.floor(n / 100), r = n % 100; return (h ? EN1[h] + ' Hundred' + (r ? ' ' : '') : '') + (r ? en99(r) : ''); }
  function enWords(n) { // n integer >= 0 , < 1e14
    if (n === 0) return 'Zero';
    var parts = [], cr = Math.floor(n / 1e7), r = n % 1e7, lk = Math.floor(r / 1e5); r %= 1e5; var th = Math.floor(r / 1e3); r %= 1e3;
    if (cr) parts.push(enWords(cr) + ' Crore'); if (lk) parts.push(en99(lk) + ' Lakh'); if (th) parts.push(en99(th) + ' Thousand'); if (r) parts.push(en999(r));
    return parts.join(' ');
  }
  function hi999(n) { var h = Math.floor(n / 100), r = n % 100; return (h ? HI[h] + ' सौ' + (r ? ' ' : '') : '') + (r ? HI[r] : ''); }
  function hiWords(n) {
    if (n === 0) return 'शून्य';
    var parts = [], cr = Math.floor(n / 1e7), r = n % 1e7, lk = Math.floor(r / 1e5); r %= 1e5; var th = Math.floor(r / 1e3); r %= 1e3;
    if (cr) parts.push(hiWords(cr) + ' करोड़'); if (lk) parts.push(HI[lk] + ' लाख'); if (th) parts.push(HI[th] + ' हज़ार'); if (r) parts.push(hi999(r));
    return parts.join(' ');
  }
  H.words = { en: enWords, hi: hiWords, HI: HI };
  function parseAmt(s) {
    s = String(s).replace(/[,\s₹]/g, ''); if (!/^\d+(\.\d{1,2})?$/.test(s)) throw new Error('सही रकम लिखें, जैसे 12500 या 12500.50');
    var parts = s.split('.'), r = parts[0], p = parts[1] ? +(parts[1] + '0').slice(0, 2) : 0;
    if (r.length > 13) throw new Error('रकम बहुत बड़ी है (अधिकतम 13 अंक)।');
    return { r: +r, p: p };
  }

  A({
    cat: U, icon: '🔤', title: 'Amount in Words (रकम शब्दों में)', desc: 'रकम को हिंदी और English शब्दों में लिखें — चेक/बिल/रसीद के लिए', tag: 'Utility', live: true,
    fields: [{ id: 'amt', label: 'रकम (₹)', type: 'text', value: '125750.50', full: true, placeholder: '12500' }],
    action: 'शब्दों में बदलें', ready: 'रकम लिखते ही नीचे शब्द दिखेंगे।',
    run: function (c) {
      var a = parseAmt(c.v('amt')), en = 'Rupees ' + enWords(a.r) + (a.p ? ' and ' + enWords(a.p) + ' Paise' : '') + ' Only', hi = hiWords(a.r) + ' रुपये' + (a.p ? ' और ' + hiWords(a.p) + ' पैसे' : '') + ' मात्र';
      c.html('<div class="plus-text"><strong>English</strong><p id="wEn">' + esc(en) + '</p><strong>हिंदी</strong><p id="wHi">' + esc(hi) + '</p></div>');
      return inr(a.r + a.p / 100);
    }
  });

  /* ---------- Age ---------- */
  A({
    cat: U, icon: '🎂', title: 'Age Calculator (उम्र)', desc: 'जन्मतिथि से आज (या किसी भी तारीख पर) उम्र — साल, महीने, दिन में', tag: 'Utility', live: true,
    fields: [
      { id: 'dob', label: 'जन्मतिथि', type: 'date', value: '' },
      { id: 'on', label: 'इस तारीख पर उम्र', type: 'date', value: function () { return H.todayISO(); }, help: 'फॉर्म की cut-off तारीख (जैसे 01/01/2026) भी डाल सकते हैं' }
    ],
    action: 'उम्र निकालें', ready: 'जन्मतिथि चुनें।',
    run: function (c) {
      var b = pd(c.v('dob')), o = pd(c.v('on')); if (!b) { c.html(''); return 'जन्मतिथि चुनें।'; } if (!o) throw new Error('तारीख चुनें।');
      if (b > o) throw new Error('जन्मतिथि उस तारीख के बाद की है।');
      var r = ymd(b, o), tot = daysBetween(b, o), nb = new Date(o.getFullYear(), b.getMonth(), b.getDate()); if (nb < o) nb = new Date(o.getFullYear() + 1, b.getMonth(), b.getDate());
      if (b.getMonth() === 1 && b.getDate() === 29 && nb.getDate() !== 29) nb = new Date(nb.getFullYear(), 1, 29);
      c.html(table([['उम्र', r.y + ' साल, ' + r.m + ' महीने, ' + r.d + ' दिन'], ['कुल महीने', String(r.y * 12 + r.m)], ['कुल दिन', tot.toLocaleString('en-IN')], ['जन्म का दिन', DAYS[b.getDay()]], ['अगला जन्मदिन', fd(nb) + ' (' + DAYS[nb.getDay()] + '), ' + daysBetween(o, nb) + ' दिन बाद']]));
      return r.y + ' साल ' + r.m + ' महीने ' + r.d + ' दिन';
    }
  });

  /* ---------- Date diff / add ---------- */
  A({
    cat: U, icon: '📅', title: 'Date Difference / Add Days', desc: 'दो तारीखों के बीच के दिन, या किसी तारीख में दिन/महीने जोड़ें-घटाएँ', tag: 'Utility', live: true,
    fields: [
      { id: 'mode', label: 'क्या करना है', type: 'select', value: 'diff', options: [['diff', 'दो तारीखों का अंतर'], ['add', 'तारीख में दिन/महीने जोड़ें']] },
      { id: 'd1', label: 'तारीख 1', type: 'date', value: function () { return H.todayISO(); } },
      { id: 'd2', label: 'तारीख 2', type: 'date', value: '', show: function (v) { return v('mode') === 'diff'; } },
      { id: 'n', label: 'संख्या', type: 'number', value: 30, show: function (v) { return v('mode') === 'add'; } },
      { id: 'u', label: 'इकाई', type: 'select', value: 'd', options: [['d', 'दिन'], ['w', 'हफ़्ते'], ['m', 'महीने'], ['y', 'साल']], show: function (v) { return v('mode') === 'add'; } },
      { id: 'dir', label: 'दिशा', type: 'select', value: '1', options: [['1', 'जोड़ें (आगे)'], ['-1', 'घटाएँ (पीछे)']], show: function (v) { return v('mode') === 'add'; } }
    ],
    action: 'गणना करें',
    run: function (c) {
      var a = pd(c.v('d1')); if (!a) { c.html(''); return 'तारीख 1 चुनें।'; }
      if (c.v('mode') === 'diff') {
        var b = pd(c.v('d2')); if (!b) { c.html(''); return 'तारीख 2 चुनें।'; }
        var lo = a <= b ? a : b, hi = a <= b ? b : a, r = ymd(lo, hi), n = daysBetween(lo, hi);
        c.html(table([['अंतर', r.y + ' साल, ' + r.m + ' महीने, ' + r.d + ' दिन'], ['कुल दिन', n.toLocaleString('en-IN')], ['कुल हफ़्ते', Math.floor(n / 7) + ' हफ़्ते ' + (n % 7) + ' दिन'], ['तारीख 1', fd(a) + ' (' + DAYS[a.getDay()] + ')'], ['तारीख 2', fd(b) + ' (' + DAYS[b.getDay()] + ')']]));
        return n + ' दिन का अंतर';
      }
      var k = Math.trunc(c.v('n')) * +c.v('dir'), u = c.v('u'), res = new Date(a.getFullYear(), a.getMonth(), a.getDate());
      if (u === 'd') res.setDate(res.getDate() + k); else if (u === 'w') res.setDate(res.getDate() + 7 * k);
      else { var tm = res.getMonth() + (u === 'y' ? 12 * k : k), day = res.getDate(); res = new Date(res.getFullYear(), tm, 1); res.setDate(Math.min(day, new Date(res.getFullYear(), res.getMonth() + 1, 0).getDate())); }
      c.html(table([['नई तारीख', fd(res) + ' (' + DAYS[res.getDay()] + ')'], ['शुरुआती तारीख', fd(a)]]));
      return fd(res);
    }
  });

  /* ---------- GST ---------- */
  A({
    cat: U, icon: '🧾', title: 'GST Calculator', desc: 'GST जोड़ें या निकालें — CGST/SGST/IGST अलग-अलग', tag: 'Utility', live: true,
    fields: [
      { id: 'amt', label: 'रकम (₹)', type: 'number', value: 1000, min: 0, step: 'any' },
      { id: 'rate', label: 'GST दर', type: 'select', value: '18', options: [['0.25', '0.25%'], ['3', '3%'], ['5', '5%'], ['12', '12%'], ['18', '18%'], ['28', '28%'], ['x', 'अपनी दर']] },
      { id: 'cust', label: 'अपनी दर (%)', type: 'number', value: 18, min: 0, step: 'any', show: function (v) { return v('rate') === 'x'; } },
      { id: 'mode', label: 'रकम में GST', type: 'select', value: 'add', options: [['add', 'अभी जुड़ा नहीं है — जोड़ें'], ['inc', 'पहले से जुड़ा है — निकालें']] }
    ],
    hint: 'दरें सरकारी बदलाव के साथ बदल सकती हैं; अपने सामान की सही दर GST पोर्टल/CA से पुष्टि करें।',
    action: 'गणना करें',
    run: function (c) {
      var amt = +c.v('amt'), rate = c.v('rate') === 'x' ? +c.v('cust') : +c.v('rate');
      if (!(amt >= 0) || !(rate >= 0)) throw new Error('सही रकम और दर लिखें।');
      var base, gst, tot; if (c.v('mode') === 'add') { base = amt; gst = amt * rate / 100; tot = base + gst; } else { tot = amt; base = amt / (1 + rate / 100); gst = tot - base; }
      c.html(table([['GST से पहले की रकम', inr(base)], ['GST (' + rate + '%)', inr(gst)], ['कुल रकम', inr(tot)], ['CGST (राज्य के अंदर) ' + rate / 2 + '%', inr(gst / 2)], ['SGST (राज्य के अंदर) ' + rate / 2 + '%', inr(gst / 2)], ['IGST (दूसरे राज्य) ' + rate + '%', inr(gst)]]));
      return 'कुल ' + inr(tot);
    }
  });

  /* ---------- EMI ---------- */
  A({
    cat: U, icon: '🏦', title: 'EMI Calculator', desc: 'लोन की मासिक किस्त, कुल ब्याज और साल-दर-साल बचा कर्ज़ देखें', tag: 'Utility', live: true,
    fields: [
      { id: 'p', label: 'लोन रकम (₹)', type: 'number', value: 500000, min: 1, step: 'any' },
      { id: 'r', label: 'सालाना ब्याज दर (%)', type: 'number', value: 10, min: 0, step: 'any' },
      { id: 't', label: 'अवधि', type: 'number', value: 5, min: 1, step: 'any' },
      { id: 'u', label: 'अवधि की इकाई', type: 'select', value: 'y', options: [['y', 'साल'], ['m', 'महीने']] }
    ],
    hint: 'यह अनुमान है (घटती बाकी रकम पर मासिक ब्याज)। बैंक की processing fee/ब्याज की गणना-विधि से असली किस्त थोड़ी अलग हो सकती है।',
    action: 'EMI निकालें',
    run: function (c) {
      var P0 = +c.v('p'), R = +c.v('r'), n = Math.round(+c.v('t') * (c.v('u') === 'y' ? 12 : 1));
      if (!(P0 > 0) || !(R >= 0) || !(n >= 1) || n > 600) throw new Error('लोन रकम, दर और अवधि (अधिकतम 50 साल) सही लिखें।');
      var i = R / 1200, emi = i === 0 ? P0 / n : P0 * i * Math.pow(1 + i, n) / (Math.pow(1 + i, n) - 1), bal = P0, rows = '', yi = 0, yp = 0;
      for (var m = 1; m <= n; m++) { var it = bal * i, pr = emi - it; bal = Math.max(0, bal - pr); yi += it; yp += pr; if (m % 12 === 0 || m === n) { rows += '<tr><td>' + Math.ceil(m / 12) + '</td><td>' + inr(yp, 0) + '</td><td>' + inr(yi, 0) + '</td><td>' + inr(bal, 0) + '</td></tr>'; yi = yp = 0; } }
      c.html(table([['मासिक किस्त (EMI)', inr(emi)], ['कुल ब्याज', inr(emi * n - P0)], ['कुल भुगतान', inr(emi * n)], ['किस्तों की संख्या', String(n)]]) + '<div class="plus-scroll"><table class="plus-table"><thead><tr><th>साल</th><th>मूलधन</th><th>ब्याज</th><th>बकाया</th></tr></thead><tbody>' + rows + '</tbody></table></div>');
      return 'EMI ' + inr(emi);
    }
  });

  /* ---------- Percentage ---------- */
  A({
    cat: U, icon: '％', title: 'Percentage Calculator', desc: 'प्रतिशत, छूट, बढ़ोतरी/घटोतरी — नंबर लिखते ही जवाब', tag: 'Utility', live: true,
    fields: [
      { id: 'mode', label: 'क्या निकालना है', type: 'select', value: 'of', options: [['of', 'X का Y% कितना होगा'], ['is', 'X, Y का कितने % है'], ['chg', 'X से Y तक कितने % बदला'], ['add', 'X में Y% जोड़ें'], ['sub', 'X में से Y% घटाएँ (छूट)']] },
      { id: 'x', label: 'X', type: 'number', value: 2000, step: 'any' },
      { id: 'y', label: 'Y', type: 'number', value: 15, step: 'any' }
    ],
    action: 'निकालें',
    run: function (c) {
      var x = +c.v('x'), y = +c.v('y'), m = c.v('mode'), r, t; if (c.blank('x') || c.blank('y')) { c.html(''); return 'X और Y भरें।'; }
      var f = function (n) { return String(+n.toFixed(4)); };
      if (m === 'of') { r = x * y / 100; t = x + ' का ' + y + '% = ' + f(r); }
      else if (m === 'is') { if (y === 0) throw new Error('Y शून्य नहीं हो सकता।'); r = x / y * 100; t = x + ' ' + y + ' का ' + f(r) + '% है'; }
      else if (m === 'chg') { if (x === 0) throw new Error('X शून्य नहीं हो सकता।'); r = (y - x) / Math.abs(x) * 100; t = x + ' से ' + y + ' तक ' + f(Math.abs(r)) + '% ' + (r >= 0 ? 'बढ़ोतरी' : 'घटोतरी'); }
      else if (m === 'add') { r = x * (1 + y / 100); t = x + ' + ' + y + '% = ' + f(r) + ' (जुड़े ' + f(x * y / 100) + ')'; }
      else { r = x * (1 - y / 100); t = x + ' − ' + y + '% = ' + f(r) + ' (छूट ' + f(x * y / 100) + ')'; }
      c.html('<div class="plus-text"><p class="plus-big">' + esc(t) + '</p></div>'); return t;
    }
  });

  /* ---------- QR ---------- */
  function qrOutputs(c, text, base, extra) {
    var q = H.qr.make(text, c.v('ec')), size = Math.max(100, +c.v('px') || 600), mod = Math.max(2, Math.floor(size / (q.size + 8))), fg = c.v('fg'), bg = c.v('bg');
    return { q: q, mod: mod, fg: fg, bg: bg };
  }
  A({
    cat: U, icon: '🔳', title: 'QR Code Generator', desc: 'text, link, WiFi या फ़ोन नंबर का QR बनाएँ — PNG और SVG दोनों', tag: 'Utility',
    fields: [
      { id: 'kind', label: 'किस चीज़ का QR', type: 'select', value: 'text', options: [['text', 'Text / Link'], ['wifi', 'WiFi (नाम-पासवर्ड)'], ['tel', 'फ़ोन नंबर'], ['wa', 'WhatsApp नंबर']] },
      { id: 'text', label: 'Text / Link', type: 'textarea', rows: 3, value: 'https://', full: true, show: function (v) { return v('kind') === 'text'; } },
      { id: 'ssid', label: 'WiFi का नाम', type: 'text', show: function (v) { return v('kind') === 'wifi'; } },
      { id: 'wpw', label: 'WiFi Password', type: 'text', show: function (v) { return v('kind') === 'wifi'; } },
      { id: 'sec', label: 'Security', type: 'select', value: 'WPA', options: [['WPA', 'WPA/WPA2'], ['nopass', 'बिना password']], show: function (v) { return v('kind') === 'wifi'; } },
      { id: 'num', label: 'मोबाइल नंबर (10 अंक)', type: 'tel', show: function (v) { return v('kind') === 'tel' || v('kind') === 'wa'; } },
      { id: 'ec', label: 'गलती सुधार (Error correction)', type: 'select', value: 'M', options: [['L', 'L (कम, ज़्यादा text)'], ['M', 'M (सामान्य)'], ['Q', 'Q (ज़्यादा)'], ['H', 'H (सबसे ज़्यादा)']] },
      { id: 'px', label: 'PNG की चौड़ाई (px)', type: 'number', value: 600, min: 100, max: 4000 },
      { id: 'fg', label: 'QR का रंग', type: 'color', value: '#000000' }, { id: 'bg', label: 'पीछे का रंग', type: 'color', value: '#ffffff' }
    ],
    hint: 'गहरा रंग हल्के रंग पर रखें, वरना scan नहीं होगा।', action: '✅ QR बनाएँ',
    run: async function (c) {
      var k = c.v('kind'), t;
      if (k === 'text') t = String(c.v('text')).trim();
      else if (k === 'wifi') { var e = function (s) { return String(s).replace(/([\\;,:"])/g, '\\$1'); }; if (!String(c.v('ssid')).trim()) throw new Error('WiFi का नाम लिखें।'); t = 'WIFI:T:' + c.v('sec') + ';S:' + e(c.v('ssid')) + ';' + (c.v('sec') === 'nopass' ? '' : 'P:' + e(c.v('wpw')) + ';') + ';'; }
      else { var d = String(c.v('num')).replace(/\D/g, '').slice(-10); if (d.length !== 10) throw new Error('10 अंक का मोबाइल नंबर लिखें।'); t = k === 'tel' ? 'tel:+91' + d : 'https://wa.me/91' + d; }
      if (!t || t === 'https://') throw new Error('पहले Text/Link लिखें।');
      var o = qrOutputs(c, t), cv = H.qr.canvas(o.q, o.mod, 4, o.fg, o.bg);
      c.out(await H.toBlob(cv, 'image/png'), 'qr-code.png');
      c.out(new Blob([H.qr.svg(o.q, 4, o.fg, o.bg)], { type: 'image/svg+xml' }), 'qr-code.svg');
      return 'QR तैयार (' + cv.width + '×' + cv.height + ' px)। फ़ोन के camera से scan करके जाँच लें।';
    }
  });

  /* ---------- UPI QR ---------- */
  A({
    cat: U, icon: '💳', title: 'UPI Payment QR Poster', desc: 'अपनी UPI ID का “Scan & Pay” QR पोस्टर बनाएँ — दुकान पर लगाने के लिए', tag: 'Utility',
    fields: [
      { id: 'upi', label: 'UPI ID', type: 'text', placeholder: 'name@bank', full: true },
      { id: 'name', label: 'दुकान / नाम', type: 'text', placeholder: 'Mahendra MP Online', full: true },
      { id: 'amt', label: 'रकम ₹ (खाली = ग्राहक खुद डालेगा)', type: 'number', value: '', min: 0, step: 'any' },
      { id: 'note', label: 'Note (वैकल्पिक)', type: 'text' },
      { id: 'title', label: 'पोस्टर का शीर्षक', type: 'text', value: 'Scan & Pay' }
    ],
    hint: 'यह सिर्फ़ आपकी दी हुई UPI ID का QR बनाता है; भुगतान की जाँच/रिकॉर्ड नहीं करता। पोस्टर लगाने से पहले अपने फ़ोन के UPI app से एक बार scan करके नाम जाँच लें।',
    action: '✅ पोस्टर बनाएँ',
    run: async function (c) {
      var upi = String(c.v('upi')).trim(), name = String(c.v('name')).trim();
      if (!/^[\w.\-]{2,}@[A-Za-z][A-Za-z0-9.\-]{1,}$/.test(upi)) throw new Error('UPI ID सही नहीं लगती (जैसे name@bank)।');
      if (!name) throw new Error('दुकान/नाम लिखें।');
      var amt = c.blank('amt') ? null : +c.v('amt'); if (amt != null && !(amt > 0)) throw new Error('रकम 0 से ज़्यादा रखें या खाली छोड़ें।');
      var url = 'upi://pay?pa=' + encodeURIComponent(upi) + '&pn=' + encodeURIComponent(name) + (amt ? '&am=' + amt.toFixed(2) : '') + '&cu=INR' + (String(c.v('note')).trim() ? '&tn=' + encodeURIComponent(String(c.v('note')).trim()) : '');
      var q = H.qr.make(url, 'M'), W = 1000, Hh = 1400, cv = H.canvas(W, Hh, '#ffffff'), x = cv.getContext('2d');
      x.fillStyle = '#0a4da8'; x.fillRect(0, 0, W, 190); x.fillStyle = '#ffffff';
      var t = H.textCanvas(String(c.v('title')) || 'Scan & Pay', { px: 96, color: '#ffffff', bold: true }), s = Math.min(1, (W - 80) / t.width); x.drawImage(t, (W - t.width * s) / 2, (190 - t.height * s) / 2, t.width * s, t.height * s);
      var mod = Math.floor(680 / (q.size + 4)), qc = H.qr.canvas(q, mod, 2, '#000', '#fff'), qx = (W - qc.width) / 2; x.drawImage(qc, qx, 260);
      x.strokeStyle = '#0a4da8'; x.lineWidth = 8; x.strokeRect(qx - 20, 240, qc.width + 40, qc.height + 40);
      var y = 260 + qc.height + 80;
      function line(txt, px, col, bold) { var tc = H.textCanvas(txt, { px: px, color: col, bold: bold }), sc = Math.min(1, (W - 80) / tc.width); x.drawImage(tc, (W - tc.width * sc) / 2, y, tc.width * sc, tc.height * sc); y += tc.height * sc + 10; }
      line(name, 64, '#111', true); line(upi, 48, '#333', false); if (amt) line('₹ ' + amt.toFixed(2), 64, '#0a7a2f', true);
      line('किसी भी UPI app से scan करें', 40, '#555', false);
      c.out(await H.toBlob(cv, 'image/png'), 'UPI-QR-poster.png');
      var PL = await H.pdfLib(), doc = await PL.PDFDocument.create(), img = await doc.embedPng(await H.bytes(await H.toBlob(cv, 'image/png'))), pg = doc.addPage([595.28, 841.89]), f = H.fitInto(cv.width, cv.height, 515, 780);
      pg.drawImage(img, { x: (595.28 - f.w) / 2, y: (841.89 - f.h) / 2, width: f.w, height: f.h });
      c.out(new Blob([await doc.save()], { type: 'application/pdf' }), 'UPI-QR-poster-A4.pdf');
      return 'पोस्टर तैयार। PNG और A4 PDF दोनों मिलेंगे।';
    }
  });

  /* ---------- Bill maker ---------- */
  A({
    cat: U, icon: '🧮', title: 'Bill / Receipt Maker', desc: 'सामान, मात्रा, दर भरकर साफ़ बिल/रसीद बनाएँ — PNG और PDF', tag: 'Utility',
    fields: [
      { id: 'shop', label: 'दुकान का नाम', type: 'text', value: function () { return (window.SHOP && window.SHOP.shopName) || ''; }, full: true },
      { id: 'addr', label: 'पता / फ़ोन (वैकल्पिक)', type: 'text', value: function () { return (window.SHOP && (window.SHOP.address || '')) || ''; }, full: true },
      { id: 'gstin', label: 'GSTIN (वैकल्पिक)', type: 'text' },
      { id: 'cust', label: 'ग्राहक का नाम', type: 'text' },
      { id: 'no', label: 'बिल नंबर', type: 'text', value: '1' },
      { id: 'date', label: 'तारीख', type: 'text', value: function () { return H.today(); } },
      { id: 'items', label: 'सामान — हर लाइन में: नाम | मात्रा | दर', type: 'textarea', rows: 6, full: true, value: 'Photo Print 4x6 | 4 | 10\nPassport Photo | 1 | 50\nLamination | 2 | 15', help: 'जैसे:  फॉर्म भरना | 1 | 100' },
      { id: 'disc', label: 'छूट (₹)', type: 'number', value: 0, min: 0, step: 'any' },
      { id: 'gst', label: 'GST % (0 = नहीं)', type: 'number', value: 0, min: 0, step: 'any' },
      { id: 'foot', label: 'नीचे की लाइन', type: 'text', value: 'धन्यवाद! फिर पधारें।', full: true }
    ],
    action: '✅ बिल बनाएँ',
    run: async function (c) {
      var shop = String(c.v('shop')).trim(); if (!shop) throw new Error('दुकान का नाम लिखें।');
      var items = String(c.v('items')).split('\n').map(function (l) { return l.trim(); }).filter(Boolean).map(function (l, i) {
        var p = l.split('|').map(function (s) { return s.trim(); }), q = parseFloat(p[1]), r = parseFloat(p[2]);
        if (p.length < 3 || !p[0] || !(q > 0) || !(r >= 0)) throw new Error('लाइन ' + (i + 1) + ' सही नहीं: "' + l + '" — ऐसे लिखें: नाम | मात्रा | दर');
        return { n: p[0], q: q, r: r, a: q * r };
      });
      if (!items.length) throw new Error('कम से कम एक सामान लिखें।'); if (items.length > 40) throw new Error('अधिकतम 40 लाइन।');
      var sub = items.reduce(function (a, b) { return a + b.a; }, 0), disc = Math.min(+c.v('disc') || 0, sub), taxable = sub - disc, gr = +c.v('gst') || 0, gst = taxable * gr / 100, tot = Math.round((taxable + gst) * 100) / 100;
      var W = 900, rowH = 56, Ht = 480 + items.length * rowH + 330, cv = H.canvas(W, Ht, '#fff'), x = cv.getContext('2d'), y = 40;
      function T(txt, px, opt) { opt = opt || {}; var tc = H.textCanvas(txt, { px: px, color: opt.color || '#111', bold: opt.bold }), maxw = opt.w || (W - 80), sc = Math.min(1, maxw / tc.width), w = tc.width * sc; var xx = opt.align === 'right' ? opt.x - w : opt.align === 'center' ? (W - w) / 2 : (opt.x == null ? 40 : opt.x); x.drawImage(tc, xx, opt.y == null ? y : opt.y, w, tc.height * sc); return tc.height * sc; }
      y += T(shop, 56, { bold: true, align: 'center' }); var a = String(c.v('addr')).trim(); if (a) y += T(a, 30, { align: 'center', color: '#444' }); if (String(c.v('gstin')).trim()) y += T('GSTIN: ' + String(c.v('gstin')).trim().toUpperCase(), 30, { align: 'center', color: '#444' });
      y += 10; x.fillStyle = '#111'; x.fillRect(40, y, W - 80, 3); y += 20;
      T('बिल नं: ' + c.v('no'), 32, { bold: true }); y += T('तारीख: ' + c.v('date'), 32, { x: W - 40, align: 'right' }) + 4; if (String(c.v('cust')).trim()) y += T('ग्राहक: ' + String(c.v('cust')).trim(), 32) + 4; y += 14;
      x.fillStyle = '#eef3fb'; x.fillRect(40, y, W - 80, rowH); var ty = y + 8; T('सामान', 30, { bold: true, y: ty, w: 360, x: 52 }); T('मात्रा', 30, { bold: true, y: ty, x: 560, align: 'right', w: 100 }); T('दर', 30, { bold: true, y: ty, x: 710, align: 'right', w: 120 }); T('रकम', 30, { bold: true, y: ty, x: W - 52, align: 'right', w: 150 }); y += rowH;
      var fmt = function (n) { return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
      items.forEach(function (it) { ty = y + 8; T(it.n, 30, { y: ty, w: 360, x: 52 }); T(String(+it.q.toFixed(3)), 30, { y: ty, x: 560, align: 'right', w: 100 }); T(fmt(it.r), 30, { y: ty, x: 710, align: 'right', w: 120 }); T(fmt(it.a), 30, { y: ty, x: W - 52, align: 'right', w: 150 }); y += rowH; x.fillStyle = '#ddd'; x.fillRect(40, y - 1, W - 80, 1); });
      y += 14; function kv(k, v, big) { var px = big ? 40 : 32; T(k, px, { bold: big, x: 420, w: 260, y: y }); y += T(v, px, { bold: big, x: W - 52, align: 'right', w: 200, y: y }) + 8; }
      kv('उप-योग', fmt(sub)); if (disc) kv('छूट', '- ' + fmt(disc)); if (gr) kv('GST ' + gr + '%', fmt(gst)); x.fillStyle = '#111'; x.fillRect(420, y, W - 460, 3); y += 12; kv('कुल', '₹ ' + fmt(tot), true);
      if (tot < 1e13) y += T('Rupees ' + enWords(Math.floor(tot)) + (Math.round((tot % 1) * 100) ? ' and ' + enWords(Math.round((tot % 1) * 100)) + ' Paise' : '') + ' Only', 28, { color: '#444', w: W - 80 }) + 10;
      y += 20; if (String(c.v('foot')).trim()) y += T(String(c.v('foot')).trim(), 34, { align: 'center', bold: true });
      var out = H.canvas(W, Math.ceil(y + 40), '#fff'); out.getContext('2d').drawImage(cv, 0, 0);
      var png = await H.toBlob(out, 'image/png'); c.out(png, 'Bill-' + String(c.v('no')).replace(/[^\w\-]/g, '') + '.png');
      var PL = await H.pdfLib(), doc = await PL.PDFDocument.create(), img = await doc.embedPng(await H.bytes(png)), f = H.fitInto(out.width, out.height, 515, 760), pg = doc.addPage([595.28, 841.89]);
      pg.drawImage(img, { x: (595.28 - f.w) / 2, y: 841.89 - 40 - f.h, width: f.w, height: f.h });
      c.out(new Blob([await doc.save()], { type: 'application/pdf' }), 'Bill-' + String(c.v('no')).replace(/[^\w\-]/g, '') + '.pdf');
      return 'बिल तैयार — कुल ₹ ' + fmt(tot);
    }
  });

  /* ---------- Counter ---------- */
  A({
    cat: U, icon: '🔢', title: 'Character / Word Counter', desc: 'अक्षर, शब्द, लाइन, वाक्य गिनें — हिंदी भी, लिखते ही', tag: 'Utility', live: true,
    fields: [{ id: 'text', label: 'यहाँ text लिखें या paste करें', type: 'textarea', rows: 8, full: true, value: '' }],
    ready: 'Text लिखें।', action: 'गिनें',
    run: function (c) {
      var t = String(c.v('text')), segs = Array.from(t).length;
      var words = (t.trim().match(/\S+/g) || []).length, lines = t ? t.split(/\r?\n/).length : 0, sent = (t.match(/[^.!?।]+[.!?।]+|[^.!?।\s][^.!?।]*$/g) || []).filter(function (s) { return s.trim(); }).length, paras = t.split(/\n\s*\n/).filter(function (s) { return s.trim(); }).length;
      c.html(table([['कुल अक्षर (spaces सहित)', String(segs)], ['अक्षर (spaces के बिना)', String(Array.from(t.replace(/\s/g, '')).length)], ['शब्द', String(words)], ['लाइन', String(lines)], ['वाक्य', String(sent)], ['अनुच्छेद', String(paras)], ['पढ़ने का समय', words ? Math.max(1, Math.round(words / 200)) + ' मिनट (लगभग)' : '0'], ['Bytes (UTF-8)', String(new TextEncoder().encode(t).length)]]));
      return words + ' शब्द, ' + segs + ' अक्षर';
    }
  });

  /* ---------- Image info ---------- */
  function imageMeta(u8, type) {
    var dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength), r = { dpi: null, src: '' };
    if (u8[0] === 0x89 && u8[1] === 0x50) { // PNG
      var p = 8; while (p + 12 <= u8.length) { var len = dv.getUint32(p), nm = String.fromCharCode(u8[p + 4], u8[p + 5], u8[p + 6], u8[p + 7]); if (nm === 'pHYs') { var ux = dv.getUint32(p + 8), un = u8[p + 16]; if (un === 1) { r.dpi = Math.round(ux * 0.0254); r.src = 'PNG pHYs'; } break; } if (nm === 'IDAT') break; p += 12 + len; }
    } else if (u8[0] === 0xff && u8[1] === 0xd8) { // JPEG
      var q = 2; while (q + 4 < u8.length) {
        if (u8[q] !== 0xff) break; var mk = u8[q + 1], L = dv.getUint16(q + 2);
        if (mk === 0xe0 && String.fromCharCode(u8[q + 4], u8[q + 5], u8[q + 6], u8[q + 7]) === 'JFIF') { var un2 = u8[q + 11], xd = dv.getUint16(q + 12); if (un2 === 1 && xd) { r.dpi = xd; r.src = 'JFIF'; } else if (un2 === 2 && xd) { r.dpi = Math.round(xd * 2.54); r.src = 'JFIF'; } }
        if (mk === 0xe1 && String.fromCharCode(u8[q + 4], u8[q + 5], u8[q + 6], u8[q + 7]) === 'Exif') {
          var t0 = q + 10, le = u8[t0] === 0x49, g16 = function (o) { return dv.getUint16(t0 + o, le); }, g32 = function (o) { return dv.getUint32(t0 + o, le); }; try {
            var ifd = g32(4), n = g16(ifd), xr = null, unit = 2; for (var k = 0; k < n; k++) { var e = ifd + 2 + k * 12, tag = g16(e); if (tag === 0x011a) { var off = g32(e + 8); xr = g32(off) / (g32(off + 4) || 1); } if (tag === 0x0128) unit = g16(e + 8); }
            if (xr && !r.dpi) { r.dpi = Math.round(unit === 3 ? xr * 2.54 : xr); r.src = 'EXIF'; } r.exif = true; } catch (er) {}
        }
        if (mk === 0xda) break; q += 2 + L;
      }
    }
    return r;
  }
  A({
    cat: U, icon: '🔍', title: 'Image Info & Requirement Checker', desc: 'फोटो का size, KB, DPI जाँचें और देखें कि फॉर्म की शर्त पूरी होती है या नहीं', tag: 'Utility',
    inputs: [{ id: 'f', label: 'फोटो/Signature चुनें (कई चुन सकते हैं)', accept: 'image/*', multiple: true }],
    fields: [
      { id: 'minkb', label: 'कम से कम KB', type: 'number', value: '', min: 0 }, { id: 'maxkb', label: 'ज़्यादा से ज़्यादा KB', type: 'number', value: '', min: 0 },
      { id: 'w', label: 'ज़रूरी चौड़ाई px', type: 'number', value: '', min: 0 }, { id: 'h', label: 'ज़रूरी ऊँचाई px', type: 'number', value: '', min: 0 },
      { id: 'fmt', label: 'ज़रूरी format', type: 'select', value: '', options: [['', 'कोई भी'], ['jpeg', 'JPG/JPEG'], ['png', 'PNG']] }
    ],
    hint: 'फॉर्म की शर्तें (KB/पिक्सल/format) भरें तो हर शर्त के आगे ✅ या ❌ दिखेगा। खाली छोड़ी शर्तें जाँची नहीं जातीं। DPI file में लिखी हो तभी दिखती है।',
    action: '🔍 जाँचें',
    run: async function (c) {
      var files = c.files('f'), html = '';
      for (var i = 0; i < files.length; i++) {
        var f = files[i], img = await H.loadImg(f), u8 = new Uint8Array(await f.arrayBuffer()), m = imageMeta(u8), kb = f.size / 1024, sig = u8[0] === 0xff ? 'jpeg' : u8[0] === 0x89 ? 'png' : (f.type.split('/')[1] || 'other');
        var rows = [['फ़ाइल', f.name], ['Format', sig.toUpperCase()], ['Size', img.naturalWidth + ' × ' + img.naturalHeight + ' px'], ['File size', kb.toFixed(1) + ' KB'], ['DPI', m.dpi ? m.dpi + ' (' + m.src + ')' : 'file में लिखी नहीं'], ['EXIF/कैमरा जानकारी', m.exif ? 'है (Remove Photo Location से हटाएँ)' : 'नहीं मिली']];
        var chk = function (label, ok, got) { rows.push([label, (ok ? '✅ ठीक — ' : '❌ मेल नहीं — ') + got]); };
        if (!c.blank('minkb')) chk('कम से कम ' + c.v('minkb') + ' KB', kb >= +c.v('minkb'), kb.toFixed(1) + ' KB');
        if (!c.blank('maxkb')) chk('अधिकतम ' + c.v('maxkb') + ' KB', kb <= +c.v('maxkb'), kb.toFixed(1) + ' KB');
        if (!c.blank('w')) chk('चौड़ाई ' + c.v('w') + ' px', img.naturalWidth === +c.v('w'), img.naturalWidth + ' px');
        if (!c.blank('h')) chk('ऊँचाई ' + c.v('h') + ' px', img.naturalHeight === +c.v('h'), img.naturalHeight + ' px');
        if (c.v('fmt')) chk('Format ' + c.v('fmt').toUpperCase(), sig === c.v('fmt'), sig.toUpperCase());
        html += table(rows);
      }
      c.html(html); return files.length + ' फोटो जाँची गईं।';
    }
  });

  /* ---------- Password ---------- */
  function rnd(n) { var a = new Uint32Array(1), lim = Math.floor(4294967296 / n) * n; do { crypto.getRandomValues(a); } while (a[0] >= lim); return a[0] % n; }
  A({
    cat: U, icon: '🔐', title: 'Strong Password Generator', desc: 'मज़बूत random password बनाएँ — सिर्फ़ आपके browser में, कहीं नहीं जाता', tag: 'Utility',
    fields: [
      { id: 'len', label: 'लंबाई', type: 'number', value: 14, min: 8, max: 64 }, { id: 'n', label: 'कितने password', type: 'number', value: 5, min: 1, max: 20 },
      { id: 'up', label: 'बड़े अक्षर (A-Z)', type: 'checkbox', value: true }, { id: 'lo', label: 'छोटे अक्षर (a-z)', type: 'checkbox', value: true },
      { id: 'di', label: 'अंक (0-9)', type: 'checkbox', value: true }, { id: 'sy', label: 'चिह्न (!@#$)', type: 'checkbox', value: true },
      { id: 'am', label: 'मिलते-जुलते अक्षर हटाएँ (O 0 l 1 I)', type: 'checkbox', value: true }
    ],
    action: '🔐 बनाएँ',
    run: function (c) {
      var sets = []; if (c.v('up')) sets.push('ABCDEFGHJKLMNPQRSTUVWXYZ'); if (c.v('lo')) sets.push('abcdefghijkmnopqrstuvwxyz'); if (c.v('di')) sets.push('23456789'); if (c.v('sy')) sets.push('!@#$%&*?-_+=');
      if (!sets.length) throw new Error('कम से कम एक तरह के अक्षर चुनें।');
      if (!c.v('am')) sets = sets.map(function (s, i) { return s + (i === 0 && c.v('up') ? 'IO' : i === 1 && c.v('lo') ? 'l' : s[0] === '2' ? '01' : ''); });
      var L = Math.max(8, Math.min(64, Math.floor(c.v('len')))), N = Math.max(1, Math.min(20, Math.floor(c.v('n')))), all = sets.join(''), out = [];
      if (L < sets.length) throw new Error('लंबाई बढ़ाएँ।');
      for (var k = 0; k < N; k++) { var ch = sets.map(function (s) { return s[rnd(s.length)]; }); while (ch.length < L) ch.push(all[rnd(all.length)]); for (var i = ch.length - 1; i > 0; i--) { var j = rnd(i + 1), t = ch[i]; ch[i] = ch[j]; ch[j] = t; } out.push(ch.join('')); }
      c.html('<div class="plus-pw">' + out.map(function (p) { return '<div class="plus-pwrow"><input readonly value="' + esc(p) + '" aria-label="Password"><button type="button" class="secondary-btn plus-copy" data-pw="' + esc(p) + '">कॉपी</button></div>'; }).join('') + '</div>');
      var box = $('#plusResult'); if (box && !box._pw) { box._pw = 1; box.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('.plus-copy'); if (!b) return; var done = function () { b.textContent = '✅ कॉपी हुआ'; setTimeout(function () { b.textContent = 'कॉपी'; }, 1500); }; if (navigator.clipboard) navigator.clipboard.writeText(b.dataset.pw).then(done, function () { b.previousElementSibling.select(); }); else b.previousElementSibling.select(); }); }
      var bits = Math.round(L * Math.log2(all.length));
      return N + ' password बने (लगभग ' + bits + ' bit की मज़बूती)। इन्हें कहीं सुरक्षित लिख लें।';
    }
  });

  /* ---------- Files to ZIP ---------- */
  A({
    cat: U, icon: '🗜️', title: 'Files → ZIP', desc: 'कई फ़ाइलें एक ZIP में डालें — ईमेल/पोर्टल पर एक साथ भेजने के लिए', tag: 'Utility',
    inputs: [{ id: 'f', label: 'फ़ाइलें चुनें (कोई भी प्रकार)', accept: '', multiple: true }],
    fields: [{ id: 'name', label: 'ZIP का नाम', type: 'text', value: 'documents' }],
    hint: 'ZIP बिना compression (store) के बनता है, इसलिए फ़ाइलों का आकार लगभग उतना ही रहता है; यह सिर्फ़ एक साथ पैक करने के लिए है।',
    run: async function (c) {
      var files = c.files('f'), used = Object.create(null), entries = [], total = 0;
      for (var i = 0; i < files.length; i++) { var nm = files[i].name || 'file' + i, k = nm.toLowerCase(), n = 1; while (used[k]) { var dot = nm.lastIndexOf('.'), b = dot > 0 ? nm.slice(0, dot) : nm, e = dot > 0 ? nm.slice(dot) : ''; k = (b + '_' + (++n) + e).toLowerCase(); nm = b + '_' + n + e; } used[k] = 1; total += files[i].size; if (total > 900 * 1048576) throw new Error('कुल आकार बहुत बड़ा है (900 MB तक)।'); entries.push({ name: nm, bytes: await H.bytes(files[i]) }); }
      var base = String(c.v('name')).replace(/[\\\/:*?"<>|]/g, '').trim() || 'documents';
      c.out(H.zip(entries), base + '.zip'); return files.length + ' फ़ाइलें ZIP में डाली गईं।';
    }
  });
})();
