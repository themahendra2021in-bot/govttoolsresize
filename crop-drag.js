/* crop-drag.js — Aadhaar/PAN, DL, RC wale purane crop centers mein bhi khud khinch kar (custom) crop */
(function () {
  'use strict';
  var CFG = [
    { cv: 'v26SourceCanvas', p: 'v26', apply: 'v26ApplyXY', preset: 'v26Preset' },
    { cv: 'v27Source', p: 'v27', apply: 'v27Crop', preset: 'v27Preset' },
    { cv: 'v28Source', p: 'v28', apply: 'v28Crop', preset: 'v28Preset' }
  ];
  function init() {
    CFG.forEach(function (c) {
      var cv = document.getElementById(c.cv); if (!cv || cv._drag) return; cv._drag = 1;
      var par = cv.parentElement; if (getComputedStyle(par).position === 'static') par.style.position = 'relative';
      var box = document.createElement('div'); box.className = 'crop-sel'; box.hidden = true; par.appendChild(box);
      var note = document.createElement('p'); note.className = 'plus-hint'; note.textContent = '✋ तस्वीर पर उँगली/माउस से खींचकर कोई भी हिस्सा चुनें — कोई fixed size ज़रूरी नहीं। नीचे X/Y/Width/Height से बारीक बदलाव भी कर सकते हैं।';
      par.insertBefore(note, cv);
      var sel = document.getElementById(c.preset); if (sel) { sel.value = 'custom'; }
      cv.style.touchAction = 'none'; cv.style.cursor = 'crosshair';
      var st = null;
      function pt(e) { var r = cv.getBoundingClientRect(); return { x: Math.max(0, Math.min(r.width, e.clientX - r.left)), y: Math.max(0, Math.min(r.height, e.clientY - r.top)), r: r }; }
      cv.addEventListener('pointerdown', function (e) { if (cv.width < 10) return; cv.setPointerCapture(e.pointerId); var p = pt(e); st = { x: p.x, y: p.y }; e.preventDefault(); });
      cv.addEventListener('pointermove', function (e) {
        if (!st) return; var p = pt(e), x0 = Math.min(st.x, p.x), y0 = Math.min(st.y, p.y), cr = cv.getBoundingClientRect(), pr = par.getBoundingClientRect();
        box.hidden = false; box.style.left = (cr.left - pr.left + x0) + 'px'; box.style.top = (cr.top - pr.top + y0) + 'px'; box.style.width = Math.abs(p.x - st.x) + 'px'; box.style.height = Math.abs(p.y - st.y) + 'px';
      });
      function end(e) {
        if (!st) return; var p = pt(e), r = p.r, k = cv.width / r.width, x0 = Math.min(st.x, p.x) * k, y0 = Math.min(st.y, p.y) * k, w = Math.abs(p.x - st.x) * k, h = Math.abs(p.y - st.y) * k; st = null;
        if (w < 8 || h < 8) { box.hidden = true; return; }
        var set = function (n, v) { var el = document.getElementById(c.p + n); if (el) { el.value = Math.round(v); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); } };
        set('X', x0); set('Y', y0); set('W', w); set('H', h);
        var sp = document.getElementById(c.preset); if (sp) sp.value = 'custom';
        var b = document.getElementById(c.apply); if (b) b.click();
      }
      cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', function () { st = null; });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
