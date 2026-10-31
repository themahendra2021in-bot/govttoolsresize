/*
  ===== दुकान की जानकारी — सिर्फ़ यहीं बदलें =====
  नीचे खाली "" में अपनी जानकारी भरें, फ़ाइल save करें और site दोबारा deploy करें।
  जो खाली रहेगा वह वेबसाइट पर दिखेगा ही नहीं (कोई अधूरी जानकारी नहीं दिखेगी)।

  phone    : 10 अंक का मोबाइल नंबर, जैसे "9876543210"
  whatsapp : WhatsApp नंबर (वही हो तो वही लिखें), जैसे "9876543210"
  address  : दुकान का पूरा पता
  hours    : समय, जैसे "सुबह 9 से रात 8 बजे, सोमवार–शनिवार"
*/
window.SHOP = {
  shopName: "",   // बिल/रसीद में दिखेगा (वैकल्पिक)
  phone: "",
  whatsapp: "",
  address: "",
  hours: ""
};

(function () {
  function digits(v) { return String(v || "").replace(/\D/g, "").slice(-10); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]; }); }
  function init() {
    var S = window.SHOP || {}, card = document.getElementById("contactCard");
    if (!card) return;
    var lines = [], acts = [];
    var ph = digits(S.phone), wa = digits(S.whatsapp);
    if (S.address) lines.push("<p>📍 " + esc(S.address) + "</p>");
    if (S.hours) lines.push("<p>🕘 " + esc(S.hours) + "</p>");
    if (ph.length === 10) { lines.push("<p>📞 " + ph + "</p>"); acts.push('<a href="tel:+91' + ph + '">📞 कॉल करें</a>'); }
    if (wa.length === 10) acts.push('<a class="wa" href="https://wa.me/91' + wa + '" rel="noopener">💬 WhatsApp</a>');
    if (!lines.length && !acts.length) return;
    document.getElementById("contactLines").innerHTML = lines.join("");
    document.getElementById("contactActions").innerHTML = acts.join("");
    card.hidden = false;
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
