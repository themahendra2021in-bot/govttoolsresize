/* plus-convert.js — PDF → Word / Excel / PowerPoint (browser mein) */
(function () {
  'use strict';
  var P = window.PLUS, H = P.H, A = P.add, esc = H.esc, X = H.pdfx, enc = new TextEncoder();
  var PDFACC = 'application/pdf,.pdf';
  function xesc(s) { return String(s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ''); }
  function u8(s) { return enc.encode(s); }
  var XMLH = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

  // page ke text items -> lines [{y, h, cells:[{x, w, s}]}]
  async function pageLines(js, n) {
    var pg = await js.getPage(n), tc = await pg.getTextContent(), items = tc.items.filter(function (it) { return it.str && it.str.trim() !== ''; }).map(function (it) { return { s: it.str, x: it.transform[4], y: it.transform[5], w: it.width, h: Math.abs(it.transform[3]) || it.height || 10 }; });
    items.sort(function (a, b) { return b.y - a.y || a.x - b.x; });
    var lines = [];
    items.forEach(function (it) { var L = lines[lines.length - 1]; if (L && Math.abs(L.y - it.y) <= Math.max(2, it.h * 0.45)) L.items.push(it); else lines.push({ y: it.y, h: it.h, items: [it] }); });
    lines.forEach(function (L) { L.items.sort(function (a, b) { return a.x - b.x; }); });
    return lines;
  }
  function lineText(L) { var s = '', prev = null; L.items.forEach(function (it) { if (prev && it.x - (prev.x + prev.w) > it.h * 0.15 && !/\s$/.test(s)) s += ' '; s += it.s; prev = it; }); return s; }
  function lineCells(L) {
    var cells = [], prev = null;
    L.items.forEach(function (it) { if (prev && it.x - (prev.x + prev.w) <= it.h * 0.9) { var last = cells[cells.length - 1]; last.s += (it.x - (prev.x + prev.w) > it.h * 0.15 ? ' ' : '') + it.s; } else cells.push({ s: it.s }); prev = it; });
    return cells;
  }

  /* ---------- PDF -> Word ---------- */
  A({
    cat: 'pdf', icon: '📝', title: 'PDF → Word', desc: 'PDF का text निकालकर Word (.docx) फ़ाइल बनाएँ — सिर्फ़ text, डिज़ाइन/फोटो नहीं', tag: 'PDF', top: true,
    inputs: [{ id: 'f', label: 'PDF चुनें', accept: PDFACC }],
    fields: [X.pwField(), { id: 'pages', label: 'कौन से pages (खाली = सभी)', type: 'text', placeholder: '1-3,5', full: true }],
    hint: 'सिर्फ़ वही PDF जिसमें असली text हो। Scan/फोटो वाली PDF में text नहीं मिलता। Table, फोटो और डिज़ाइन नहीं आते; हिंदी के अक्षर PDF बनाने वाले software पर निर्भर करते हैं, इसलिए Word में खोलकर जाँच लें।',
    run: async function (c) {
      var f = c.file(), js = await X.openJs(f, c.v('pw')), n = js.numPages, sel = String(c.v('pages')).trim() ? H.pages(c.v('pages'), n) : Array.from({ length: n }, function (_, i) { return i; });
      var body = '', total = 0;
      for (var k = 0; k < sel.length; k++) {
        c.status('⏳ Page ' + (k + 1) + '/' + sel.length); var lines = await pageLines(js, sel[k] + 1), prevY = null;
        lines.forEach(function (L) {
          if (prevY !== null && prevY - L.y > L.h * 2.2) body += '<w:p/>';
          var t = lineText(L); total += t.length; body += '<w:p><w:r><w:t xml:space="preserve">' + xesc(t) + '</w:t></w:r></w:p>'; prevY = L.y;
        });
        if (k < sel.length - 1) body += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
      }
      if (!total) throw new Error('इस PDF में text नहीं मिला (शायद scan/फोटो वाली PDF है)।');
      var NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
      var files = [
        { name: '[Content_Types].xml', bytes: u8(XMLH + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>') },
        { name: '_rels/.rels', bytes: u8(XMLH + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>') },
        { name: 'word/document.xml', bytes: u8(XMLH + '<w:document ' + NS + '><w:body>' + body + '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>') }
      ];
      c.out(H.zip(files), H.base(f.name) + '.docx'); return sel.length + ' pages का text Word में डाला गया।';
    }
  });

  /* ---------- PDF -> Excel ---------- */
  function colName(i) { var s = ''; i++; while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }
  A({
    cat: 'pdf', icon: '📊', title: 'PDF → Excel', desc: 'PDF की table/सूची को Excel (.xlsx) में निकालें — हर page अलग sheet', tag: 'PDF', top: true,
    inputs: [{ id: 'f', label: 'PDF चुनें', accept: PDFACC }],
    fields: [X.pwField(), { id: 'pages', label: 'कौन से pages (खाली = सभी)', type: 'text', placeholder: '1-3,5', full: true }],
    hint: 'असली text वाली PDF में, शब्दों के बीच की दूरी से कॉलम अंदाज़े से बनते हैं — table साफ़ हो तो सही आता है; जटिल बनावट में Excel में थोड़ा ठीक करना पड़ेगा। Scan/फोटो वाली PDF में text नहीं होता।',
    run: async function (c) {
      var f = c.file(), js = await X.openJs(f, c.v('pw')), n = js.numPages, sel = String(c.v('pages')).trim() ? H.pages(c.v('pages'), n) : Array.from({ length: n }, function (_, i) { return i; });
      if (sel.length > 60) throw new Error('अधिकतम 60 pages चुनें।');
      var sheets = [], total = 0;
      for (var k = 0; k < sel.length; k++) {
        c.status('⏳ Page ' + (k + 1) + '/' + sel.length); var lines = await pageLines(js, sel[k] + 1), xml = '';
        lines.forEach(function (L, r) {
          var cells = lineCells(L); if (!cells.length) return; total += cells.length;
          xml += '<row r="' + (r + 1) + '">' + cells.map(function (cl, ci) { var ref = colName(ci) + (r + 1), t = cl.s.trim(); return /^-?\d{1,15}(\.\d+)?$/.test(t) ? '<c r="' + ref + '"><v>' + t + '</v></c>' : '<c r="' + ref + '" t="inlineStr"><is><t xml:space="preserve">' + xesc(cl.s) + '</t></is></c>'; }).join('') + '</row>';
        });
        sheets.push({ name: 'Page ' + (sel[k] + 1), xml: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' + xml + '</sheetData></worksheet>' });
      }
      if (!total) throw new Error('इस PDF में text नहीं मिला (शायद scan/फोटो वाली PDF है)।');
      var files = [
        { name: '[Content_Types].xml', bytes: u8(XMLH + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' + sheets.map(function (s, i) { return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join('') + '</Types>') },
        { name: '_rels/.rels', bytes: u8(XMLH + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>') },
        { name: 'xl/workbook.xml', bytes: u8(XMLH + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + sheets.map(function (s, i) { return '<sheet name="' + xesc(s.name) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'; }).join('') + '</sheets></workbook>') },
        { name: 'xl/_rels/workbook.xml.rels', bytes: u8(XMLH + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + sheets.map(function (s, i) { return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'; }).join('') + '</Relationships>') }
      ];
      sheets.forEach(function (s, i) { files.push({ name: 'xl/worksheets/sheet' + (i + 1) + '.xml', bytes: u8(s.xml) }); });
      c.out(H.zip(files), H.base(f.name) + '.xlsx'); return sheets.length + ' sheet में ' + total + ' खाने निकले।';
    }
  });

  /* ---------- PDF -> PowerPoint ---------- */
  A({
    cat: 'pdf', icon: '📽️', title: 'PDF → PowerPoint', desc: 'PDF के हर page को PowerPoint (.pptx) की एक slide बनाएँ (page फोटो के रूप में)', tag: 'PDF', top: true,
    inputs: [{ id: 'f', label: 'PDF चुनें', accept: PDFACC }],
    fields: [X.pwField(), { id: 'dpi', label: 'Quality', type: 'select', value: '150', options: [['100', 'हल्की (छोटी फ़ाइल)'], ['150', 'सामान्य'], ['200', 'अच्छी']] }],
    hint: 'हर slide में page की फोटो होती है, इसलिए PowerPoint में text बदला नहीं जा सकता — दिखाने/presentation के लिए है।',
    run: async function (c) {
      var T = H.pptx, f = c.file(), js = await X.openJs(f, c.v('pw')), n = js.numPages, sc = c.v('dpi') / 72;
      if (n > 80) throw new Error('अधिकतम 80 pages।');
      var NSA = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';
      var files = [], slideIds = '', presRels = '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>', ct = '', W = 0, Hh = 0;
      for (var i = 1; i <= n; i++) {
        c.status('⏳ Page ' + i + '/' + n); var cv = await X.renderPage(js, i, sc), blob = await H.toBlob(cv, 'image/jpeg', 0.88);
        var pgv = await js.getPage(i), vp = pgv.getViewport({ scale: 1 }), cx = Math.round(vp.width * 12700), cy = Math.round(vp.height * 12700);
        if (i === 1) { W = cx; Hh = cy; }
        var f2 = H.fitInto(cx, cy, W, Hh), ox = Math.round((W - f2.w) / 2), oy = Math.round((Hh - f2.h) / 2);
        files.push({ name: 'ppt/media/image' + i + '.jpg', bytes: await H.bytes(blob) });
        files.push({ name: 'ppt/slides/slide' + i + '.xml', bytes: u8(XMLH + '<p:sld ' + NSA + '><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr><p:pic><p:nvPicPr><p:cNvPr id="2" name="Page ' + i + '"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="rId2"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="' + ox + '" y="' + oy + '"/><a:ext cx="' + Math.round(f2.w) + '" cy="' + Math.round(f2.h) + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>') });
        files.push({ name: 'ppt/slides/_rels/slide' + i + '.xml.rels', bytes: u8(XMLH + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image' + i + '.jpg"/></Relationships>') });
        slideIds += '<p:sldId id="' + (255 + i) + '" r:id="rId' + (i + 1) + '"/>'; presRels += '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide' + i + '.xml"/>';
        ct += '<Override PartName="/ppt/slides/slide' + i + '.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>';
      }
      presRels += '<Relationship Id="rId' + (n + 2) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>';
      files.push({ name: '[Content_Types].xml', bytes: u8(XMLH + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpg" ContentType="image/jpeg"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>' + ct + '</Types>') });
      files.push({ name: '_rels/.rels', bytes: u8(XMLH + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/></Relationships>') });
      files.push({ name: 'ppt/presentation.xml', bytes: u8(XMLH + '<p:presentation ' + NSA + '><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>' + slideIds + '</p:sldIdLst><p:sldSz cx="' + W + '" cy="' + Hh + '"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>') });
      files.push({ name: 'ppt/_rels/presentation.xml.rels', bytes: u8(XMLH + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + presRels + '</Relationships>') });
      files.push({ name: 'ppt/slideMasters/slideMaster1.xml', bytes: u8(T.master) });
      files.push({ name: 'ppt/slideMasters/_rels/slideMaster1.xml.rels', bytes: u8(XMLH + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>') });
      files.push({ name: 'ppt/slideLayouts/slideLayout1.xml', bytes: u8(T.layout) });
      files.push({ name: 'ppt/slideLayouts/_rels/slideLayout1.xml.rels', bytes: u8(XMLH + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>') });
      files.push({ name: 'ppt/theme/theme1.xml', bytes: u8(T.theme) });
      files.sort(function (a, b) { return (a.name === '[Content_Types].xml' ? 0 : 1) - (b.name === '[Content_Types].xml' ? 0 : 1); });
      c.out(H.zip(files), H.base(f.name) + '.pptx'); return n + ' slides की PowerPoint बनी।';
    }
  });
})();
