/* qr.js — apna QR encoder (byte mode, version 1-10, EC L/M/Q/H). Koi bahari library nahi. */
(function () {
  'use strict';
  var H = window.PLUS.H;
  var EXP = new Array(512), LOG = new Array(256), i, x = 1;
  for (i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; }
  for (i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  function mul(a, b) { return a && b ? EXP[LOG[a] + LOG[b]] : 0; }
  function rsGen(n) { var g = [1]; for (var i = 0; i < n; i++) { var ng = new Array(g.length + 1).fill(0); for (var j = 0; j < g.length; j++) { ng[j] ^= g[j]; ng[j + 1] ^= mul(g[j], EXP[i]); } g = ng; } return g; }
  function rsEnc(data, n) { var g = rsGen(n), r = new Array(n).fill(0); data.forEach(function (d) { var f = d ^ r[0]; r.shift(); r.push(0); for (var i = 0; i < n; i++) r[i] ^= mul(g[i + 1], f); }); return r; }

  // [ecPerBlock, [blocks, dataCw], optional [blocks, dataCw]]  (L, M, Q, H)
  var T = {
    1: [[7, [1, 19]], [10, [1, 16]], [13, [1, 13]], [17, [1, 9]]],
    2: [[10, [1, 34]], [16, [1, 28]], [22, [1, 22]], [28, [1, 16]]],
    3: [[15, [1, 55]], [26, [1, 44]], [18, [2, 17]], [22, [2, 13]]],
    4: [[20, [1, 80]], [18, [2, 32]], [26, [2, 24]], [16, [4, 9]]],
    5: [[26, [1, 108]], [24, [2, 43]], [18, [2, 15], [2, 16]], [22, [2, 11], [2, 12]]],
    6: [[18, [2, 68]], [16, [4, 27]], [24, [4, 19]], [28, [4, 15]]],
    7: [[20, [2, 78]], [18, [4, 31]], [18, [2, 14], [4, 15]], [26, [4, 13], [1, 14]]],
    8: [[24, [2, 97]], [22, [2, 38], [2, 39]], [22, [4, 18], [2, 19]], [26, [4, 14], [2, 15]]],
    9: [[30, [2, 116]], [22, [3, 36], [2, 37]], [20, [4, 16], [4, 17]], [24, [4, 12], [4, 13]]],
    10: [[18, [2, 68], [2, 69]], [26, [4, 43], [1, 44]], [24, [6, 19], [2, 20]], [28, [6, 15], [2, 16]]]
  };
  var ALIGN = { 1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50] };
  var ECI = { L: 0, M: 1, Q: 2, H: 3 }, ECBITS = { L: 1, M: 0, Q: 3, H: 2 };

  function blocksOf(v, e) { var r = T[v][e], out = []; for (var k = 1; k < r.length; k++) for (var n = 0; n < r[k][0]; n++) out.push(r[k][1]); return { ec: r[0], data: out }; }
  function capacity(v, e) { return blocksOf(v, e).data.reduce(function (a, b) { return a + b; }, 0); }

  function make(text, ecl) {
    ecl = ecl || 'M';
    var bytes = Array.prototype.slice.call(new TextEncoder().encode(String(text))), e = ECI[ecl], v;
    for (v = 1; v <= 10; v++) { var cc = v < 10 ? 8 : 16; if (4 + cc + bytes.length * 8 <= capacity(v, e) * 8) break; }
    if (v > 10) throw new Error('Text बहुत लंबा है (इस QR में लगभग ' + Math.floor((capacity(10, e) * 8 - 20) / 8) + ' अक्षर तक आ सकते हैं)। छोटा करें या Error correction घटाएँ।');
    var bits = []; function put(val, n) { for (var k = n - 1; k >= 0; k--) bits.push((val >>> k) & 1); }
    put(4, 4); put(bytes.length, v < 10 ? 8 : 16); bytes.forEach(function (b) { put(b, 8); });
    var total = capacity(v, e) * 8; for (var t = 0; t < 4 && bits.length < total; t++) bits.push(0);
    while (bits.length % 8) bits.push(0);
    var cw = []; for (i = 0; i < bits.length; i += 8) { var b = 0; for (var k = 0; k < 8; k++) b = (b << 1) | bits[i + k]; cw.push(b); }
    for (var pad = 0xec; cw.length < total / 8; pad ^= 0xec ^ 0x11) cw.push(pad);
    // blocks + RS
    var bl = blocksOf(v, e), pos = 0, dBlocks = [], eBlocks = [];
    bl.data.forEach(function (n) { var d = cw.slice(pos, pos + n); pos += n; dBlocks.push(d); eBlocks.push(rsEnc(d, bl.ec)); });
    var fin = [], maxD = Math.max.apply(null, bl.data);
    for (i = 0; i < maxD; i++) dBlocks.forEach(function (d) { if (i < d.length) fin.push(d[i]); });
    for (i = 0; i < bl.ec; i++) eBlocks.forEach(function (d) { fin.push(d[i]); });
    var dbits = []; fin.forEach(function (b) { for (var k = 7; k >= 0; k--) dbits.push((b >> k) & 1); });

    var size = 17 + 4 * v, best = null;
    function build(mask) {
      var m = [], fn = [], r, c; for (r = 0; r < size; r++) { m.push(new Array(size).fill(0)); fn.push(new Array(size).fill(false)); }
      function set(x, y, val) { if (x < 0 || y < 0 || x >= size || y >= size) return; m[y][x] = val ? 1 : 0; fn[y][x] = true; }
      function finder(cx, cy) { for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) { var d = Math.max(Math.abs(dx), Math.abs(dy)); set(cx + dx, cy + dy, d !== 4 && d !== 2); } }
      finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
      for (r = 0; r < size; r++) { if (!fn[6][r]) set(r, 6, r % 2 === 0); if (!fn[r][6]) set(6, r, r % 2 === 0); }
      var al = ALIGN[v];
      al.forEach(function (ay, a) { al.forEach(function (ax, b) {
        if ((a === 0 && b === 0) || (a === 0 && b === al.length - 1) || (a === al.length - 1 && b === 0)) return;
        for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) set(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }); });
      // reserve format + version areas
      var fdata = (ECBITS[ecl] << 3) | mask, rem = fdata << 10; for (r = 14; r >= 10; r--) if ((rem >> r) & 1) rem ^= 0x537 << (r - 10);
      var fbits = ((fdata << 10) | rem) ^ 0x5412;
      function fb(k) { return (fbits >> k) & 1; }
      for (r = 0; r <= 5; r++) set(8, r, fb(r)); set(8, 7, fb(6)); set(8, 8, fb(7)); set(7, 8, fb(8)); for (r = 9; r < 15; r++) set(14 - r, 8, fb(r));
      for (r = 0; r < 8; r++) set(size - 1 - r, 8, fb(r)); for (r = 8; r < 15; r++) set(8, size - 15 + r, fb(r));
      set(8, size - 8, 1);
      if (v >= 7) { var vr = v; for (r = 0; r < 12; r++) vr = (vr << 1) ^ ((vr >>> 11) * 0x1f25); var vb = (v << 12) | vr; for (r = 0; r < 18; r++) { var bit = (vb >> r) & 1, a = size - 11 + r % 3, b2 = Math.floor(r / 3); set(a, b2, bit); set(b2, a, bit); } }
      // data
      var k = 0;
      for (var right = size - 1; right >= 1; right -= 2) {
        if (right === 6) right = 5;
        for (var vert = 0; vert < size; vert++) for (var j = 0; j < 2; j++) {
          var xx = right - j, up = ((right + 1) & 2) === 0, yy = up ? size - 1 - vert : vert;
          if (!fn[yy][xx] && k < dbits.length) { m[yy][xx] = dbits[k++]; }
        }
      }
      for (r = 0; r < size; r++) for (c = 0; c < size; c++) if (!fn[r][c]) {
        var inv; switch (mask) {
          case 0: inv = (c + r) % 2 === 0; break; case 1: inv = r % 2 === 0; break; case 2: inv = c % 3 === 0; break; case 3: inv = (c + r) % 3 === 0; break;
          case 4: inv = (Math.floor(c / 3) + Math.floor(r / 2)) % 2 === 0; break; case 5: inv = c * r % 2 + c * r % 3 === 0; break;
          case 6: inv = (c * r % 2 + c * r % 3) % 2 === 0; break; default: inv = ((c + r) % 2 + c * r % 3) % 2 === 0;
        }
        if (inv) m[r][c] ^= 1;
      }
      return m;
    }
    function penalty(m) {
      var p = 0, r, c, k, run, dark = 0;
      function line(get) {
        var runC = get(0), n = 1, s = 0;
        for (var q = 1; q < size; q++) { if (get(q) === runC) n++; else { if (n >= 5) s += 3 + n - 5; runC = get(q); n = 1; } }
        if (n >= 5) s += 3 + n - 5;
        var str = ''; for (q = 0; q < size; q++) str += get(q);
        var re = /(?=(00001011101|10111010000))/g, mm; while ((mm = re.exec(str))) { s += 40; re.lastIndex = mm.index + 1; }
        return s;
      }
      for (r = 0; r < size; r++) { p += line(function (q) { return m[r][q]; }); p += line(function (q) { return m[q][r]; }); }
      for (r = 0; r < size - 1; r++) for (c = 0; c < size - 1; c++) { var s = m[r][c]; if (s === m[r][c + 1] && s === m[r + 1][c] && s === m[r + 1][c + 1]) p += 3; }
      for (r = 0; r < size; r++) for (c = 0; c < size; c++) dark += m[r][c];
      var tot = size * size; p += (Math.ceil(Math.abs(dark * 20 - tot * 10) / tot) - 1) * 10; return p;
    }
    var bestP = 1e9;
    for (var mk = 0; mk < 8; mk++) { var mm2 = build(mk), pp = penalty(mm2); if (pp < bestP) { bestP = pp; best = mm2; } }
    return { size: size, version: v, get: function (x, y) { return best[y][x] === 1; } };
  }

  function canvas(qr, px, quiet, fg, bg) {
    var n = qr.size + quiet * 2, cv = H.canvas(n * px, n * px, bg || '#fff'), x = cv.getContext('2d'); x.fillStyle = fg || '#000';
    for (var y = 0; y < qr.size; y++) for (var c = 0; c < qr.size; c++) if (qr.get(c, y)) x.fillRect((c + quiet) * px, (y + quiet) * px, px, px);
    return cv;
  }
  function svg(qr, quiet, fg, bg) {
    var n = qr.size + quiet * 2, d = '';
    for (var y = 0; y < qr.size; y++) for (var c = 0; c < qr.size; c++) if (qr.get(c, y)) d += 'M' + (c + quiet) + ',' + (y + quiet) + 'h1v1h-1z';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + n + ' ' + n + '" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="' + (bg || '#fff') + '"/><path d="' + d + '" fill="' + (fg || '#000') + '"/></svg>';
  }
  H.qr = { make: make, canvas: canvas, svg: svg };
})();
