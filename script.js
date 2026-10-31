/* ---- PDF.js loader: site ke saath bundled copy (lib/pdfjs). Sirf local file:// testing mein CDN fallback. ---- */
window.mahendraLoadPdfJs=(function(){
  let p=null;
  return function(){
    if(p) return p;
    p=(async()=>{
      const base=document.baseURI;
      try{
        const lib=await import(new URL('lib/pdfjs/pdf.mjs',base).href);
        lib.GlobalWorkerOptions.workerSrc=new URL('lib/pdfjs/pdf.worker.mjs',base).href;
        return lib;
      }catch(localErr){
        const cdn='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/';
        const lib=await import(cdn+'pdf.min.mjs');
        lib.GlobalWorkerOptions.workerSrc=cdn+'pdf.worker.min.mjs';
        return lib;
      }
    })();
    p.catch(()=>{p=null});
    return p;
  };
})();
const tools = [
["document","🪪","आधार कार्ड Crop & Print","HQ document crop और print layout","Aadhaar"],
["document","🪪","PAN Card Crop & Print","PAN card के लिए crop/print","PAN"],
["document","🗳️","Voter ID Crop & Print","Voter document crop/print","Voter"],
["document","🏥","आयुष्मान कार्ड","Card crop और print","Card"],
["document","🩺","ABHA Card","ABHA card crop/print","Card"],
["document","👷","ई-श्रम कार्ड","e-Shram document tool","Card"],
["document","🍚","राशन कार्ड","Ration card print layout","Card"],
["document","🚗","Driving Licence","DL crop/print","Card"],
["document","🚘","RC Print Center","RC PVC card size crop/print","RC"],
["document","🛂","Passport Document","Passport document layout","Document"],
["document","🎓","APAAR ID Card","APAAR / One Nation One Student ID — crop व print","APAAR"],
["document","🏫","ABC Card (Academic Bank)","Academic Bank of Credits ID — crop व print","ABC"],
["document","♿","e-UDID / दिव्यांग कार्ड","UDID कार्ड crop व print","UDID"],
["document","🌾","किसान कार्ड (Farmer ID)","Farmer Registry / किसान पहचान पत्र — crop व print","Farmer"],
["document","🪪","ID Card (कोई भी)","किसी भी ID card का front-back crop व print","ID"],
["document","🧾","संबल कार्ड","मुख्यमंत्री संबल योजना कार्ड — crop व print","Sambal"],
["document","📑","Custom Document Crop","किसी भी document का custom crop","Custom"],
["photo","📸","Passport Photo Maker","एक फोटो से multiple passport photos","Photo"],
["photo","✂️","Photo Crop","Custom crop","Photo"],
["resize","📐","Photo Resize","Pixel/CM/MM में resize","Resize"],
["resize","🗜️","Photo Compress","Target KB/MB compression","Compress"],
["photo","✍️","Signature Resize","Signature को निर्धारित size में करें","Signature"],
["photo","🗜️","Signature Compress","Signature size कम करें","Signature"],
["resize","🎯","DPI Change","Print DPI सेट करें","DPI"],
["photo","⬜","Canvas / Background Size","Photo का canvas बदलें","Canvas"],
["photo","👥","Multiple Passport Photos","एक sheet में कई photos","Sheet"],
["print","🖨️","A4 Photo Sheet","A4 पर HQ photo sheet","A4"],
["exam","📝","Exam Photo Resize","Exam form के लिए photo तैयार करें","Exam"],
["exam","✍️","Exam Signature Resize","Exam signature तैयार करें","Exam"],
["exam","🎯","Exam Photo + DPI","Photo + DPI + KB workflow","Exam"],
["exam","⚙️","Custom Exam Requirement","Width/Height/DPI/KB सेट करें","Exam"],
["pdf","📄","JPG → PDF","JPG को PDF में बदलें","PDF"],
["pdf","📄","PNG → PDF","PNG को PDF में बदलें","PDF"],
["pdf","🖼️","PDF → JPG","PDF pages को JPG में निकालें","PDF"],
["pdf","🖼️","PDF → PNG","PDF pages को PNG में निकालें","PDF"],
["pdf","📚","Images → PDF","कई images से PDF","PDF"],
["pdf","➕","Merge PDF","PDF files जोड़ें","PDF"],
["pdf","✂️","Split PDF","PDF pages अलग करें","PDF"],
["pdf","🗜️","Compress PDF","PDF size कम करें","PDF"],
["pdf","📝","Word → PDF","Word से सिर्फ़ text लेकर PDF (फोटो/डिज़ाइन नहीं आते)","PDF"],
["pdf","📊","Excel → PDF","Excel से सिर्फ़ text/डेटा लेकर PDF (डिज़ाइन नहीं आता)","PDF"],
["pdf","📽️","PowerPoint → PDF","PPT से सिर्फ़ text लेकर PDF (स्लाइड डिज़ाइन नहीं आता)","PDF"],
["resize","🔄","Image Format Converter","JPG/PNG आदि convert करें","Image"],
["resize","📏","Pixel ↔ CM/MM/Inch","Units conversion","Size"],
["resize","🎯","Target KB Compressor","निर्धारित KB तक compress","KB"],
["print","🖨️","Custom Print Layout","Custom page/print layout","Print"],
["print","📐","4×6 Photo Sheet","4×6 पर HQ photo layout","Print"]
];

let activeCategory="all";

function render(list=tools){
 const grid=document.getElementById("toolGrid");
 grid.innerHTML=list.map((t,i)=>`<article class="tool" role="listitem button" tabindex="0" aria-label="${t[2]}" onclick="openToolByIndex(${tools.indexOf(t)})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openToolByIndex(${tools.indexOf(t)})}">
   <div class="icon">${t[1]}</div><h3>${t[2]}</h3><p>${t[3]}</p><span class="tag">${t[4]}</span>
 </article>`).join("");
 document.getElementById("toolCount").textContent=`${list.length} टूल्स`;
}
function filterTools(cat,btn){
 activeCategory=cat;
 document.querySelectorAll(".nav button").forEach(b=>b.classList.remove("active"));
 btn.classList.add("active");
 searchTools();
}
function searchTools(){
 const q=document.getElementById("search").value.toLowerCase();
 let list=tools.filter(t=>(q||activeCategory==="all"||t[0]===activeCategory) && t.join(" ").toLowerCase().includes(q));
 render(list);
}
function openToolByIndex(i){openToolData(tools[i])}
function openTool(id){
 const t=tools.find(x=>x[2].toLowerCase().replaceAll(" ","-").includes(id));
 if(t) openToolData(t); else openToolData(["photo","📸","Photo Resize","HQ resize tool","Resize"]);
}

const examProfiles=[
 {name:"Custom / सामान्य",w:200,h:230,dpi:300,kb:100},
 {name:"उदाहरण — पासपोर्ट फोटो",w:413,h:531,dpi:300,kb:200},
 {name:"उदाहरण — Signature",w:300,h:100,dpi:300,kb:100}
];

function examPanel(){
 return `<div class="exam-panel">
 <label>Requirement चुनें
 <select id="examPreset" onchange="applyExamPreset()">
 ${examProfiles.map((p,i)=>`<option value="${i}">${p.name}</option>`).join("")}
 </select></label>
 <div class="controls">
  <label>Width (px)<input id="examW" type="number" value="${examProfiles[0].w}"></label>
  <label>Height (px)<input id="examH" type="number" value="${examProfiles[0].h}"></label>
  <label>DPI<input id="examDpi" type="number" value="${examProfiles[0].dpi}"></label>
  <label>Maximum KB<input id="examKB" type="number" value="${examProfiles[0].kb}"></label>
 </div>
 <button class="primary" onclick="processExam()">Prepare Exam Photo</button>
 </div>`;
}
function applyExamPreset(){
 const p=examProfiles[parseInt(document.getElementById("examPreset").value,10)];
 document.getElementById("examW").value=p.w;
 document.getElementById("examH").value=p.h;
 document.getElementById("examDpi").value=p.dpi;
 document.getElementById("examKB").value=p.kb;
}
async function processExam(){
 const f=document.getElementById("fileInput").files[0];
 const out=document.getElementById("result");
 if(!f){out.innerHTML='<p class="note">पहले फोटो चुनें।</p>';return}
 if(!f.type.startsWith("image/")){out.innerHTML='<p class="note">कृपया JPG/PNG फोटो चुनें।</p>';return}
 const w=parseInt(document.getElementById("examW").value,10);
 const h=parseInt(document.getElementById("examH").value,10);
 const targetKB=parseInt(document.getElementById("examKB").value,10)||0;
 const img=await loadImage(f);
 const canvas=document.createElement("canvas"); canvas.width=w; canvas.height=h;
 const ctx=canvas.getContext("2d",{alpha:false});
 ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality="high";
 const scale=Math.max(w/img.naturalWidth,h/img.naturalHeight);
 const sw=img.naturalWidth*scale, sh=img.naturalHeight*scale;
 ctx.drawImage(img,(w-sw)/2,(h-sh)/2,sw,sh);
 let blob=await canvasToBlob(canvas,"image/jpeg",0.95);
 if(targetKB){
  let low=.2,high=.98,best=blob;
  for(let i=0;i<9;i++){let q=(low+high)/2;let b=await canvasToBlob(canvas,"image/jpeg",q);
   if(b.size/1024<=targetKB){best=b;low=q}else high=q}
  blob=best;
 }
 const url=URL.createObjectURL(blob);
 out.innerHTML=`<img class="preview exam-preview" src="${url}" alt="Exam Photo Preview">
 <p class="note"><b>Output:</b> ${w} × ${h}px • ${(blob.size/1024).toFixed(1)} KB</p>
 <div class="result-actions">
 <a class="primary linkbtn" download="exam_photo_HQ.jpg" href="${url}">⬇️ Download HQ</a>
 <button class="primary" onclick="printImage('${url}',${w},${h})">🖨️ Print Preview</button>
 </div>`;
}

function passportPanel(){
 return `<div class="controls">
 <label>Photo Width (mm)<input id="pmWmm" type="number" value="35" step="0.1"></label>
 <label>Photo Height (mm)<input id="pmHmm" type="number" value="45" step="0.1"></label>
 <label>DPI<input id="pmDpi" type="number" value="300"></label>
 <label>Photos on A4<input id="pmCount" type="number" value="30" min="1" max="60"></label>
 </div>
 <button class="primary" onclick="makePassportSheet()">Create A4 Passport Sheet</button>`;
}
async function makePassportSheet(){
 const f=document.getElementById("fileInput").files[0],out=document.getElementById("result");
 if(!f||!f.type.startsWith("image/")){out.innerHTML='<p class="note">JPG/PNG फोटो चुनें।</p>';return}
 const mmToPx=mm=>Math.round(mm*300/25.4);
 const pw=mmToPx(parseFloat(document.getElementById("pmWmm").value)||35);
 const ph=mmToPx(parseFloat(document.getElementById("pmHmm").value)||45);
 const count=Math.min(60,Math.max(1,parseInt(document.getElementById("pmCount").value)||30));
 const img=await loadImage(f);
 const c=document.createElement("canvas"); c.width=2480;c.height=3508;
 const ctx=c.getContext("2d",{alpha:false});ctx.fillStyle="#fff";ctx.fillRect(0,0,c.width,c.height);
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
 const margin=70,gap=25; let x=margin,y=margin;
 for(let i=0;i<count;i++){
  if(x+pw>c.width-margin){x=margin;y+=ph+gap}
  if(y+ph>c.height-margin)break;
  const scale=Math.max(pw/img.naturalWidth,ph/img.naturalHeight),sw=img.naturalWidth*scale,sh=img.naturalHeight*scale;
  ctx.drawImage(img,x+(pw-sw)/2,y+(ph-sh)/2,sw,sh); x+=pw+gap;
 }
 const blob=await canvasToBlob(c,"image/jpeg",.97),url=URL.createObjectURL(blob);
 out.innerHTML=`<img class="preview sheet-preview" src="${url}" alt="A4 Sheet Preview">
 <p class="note">A4 HQ sheet • ${count} photos requested • 300 DPI pixel canvas</p>
 <div class="result-actions"><a class="primary linkbtn" download="passport_photo_A4_HQ.jpg" href="${url}">⬇️ Download A4 HQ</a>
 <button class="primary" onclick="printImage('${url}',2480,3508)">🖨️ Print A4</button></div>`;
}

function openToolData(t){
 if(t[0]==="document"){
   if(t[2]==="Driving Licence"){
     document.getElementById("modal").classList.add("hidden");
     document.getElementById("v27-dl-center")?.scrollIntoView({behavior:"smooth",block:"start"});
     return;
   }
   if(t[2]==="RC Print Center"){
     document.getElementById("modal").classList.add("hidden");
     document.getElementById("v28-rc-center")?.scrollIntoView({behavior:"smooth",block:"start"});
     return;
   }
   openCardPrintTool(t);
   return;
 }
 document.getElementById("toolContent").innerHTML=`
 <h2>${t[1]} ${t[2]}</h2>
 <p>${t[3]}</p>
 <div class="uploader">
   <strong>फाइल यहाँ चुनें</strong><br>
   <input type="file" id="fileInput" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx">
 </div>
 <div class="controls">
   <label>Width <input id="w" type="number" placeholder="जैसे 600"></label>
   <label>Height <input id="h" type="number" placeholder="जैसे 800"></label>
   <label>DPI <input id="dpi" type="number" value="300"></label>
   <label>Target KB <input id="kb" type="number" placeholder="वैकल्पिक"></label>
 </div>
 <p class="note">मूल फाइल को अनावश्यक रूप से छोटा नहीं किया जाता।</p>
 ${t[2].includes("Exam")||t[0]==="exam" ? examPanel()+examRequirementNotice() : ""}
 ${t[2].includes("Passport Photo") ? passportPanel() : ""}
 ${t[0]==="pdf" ? pdfToolsPanel()+pageOrganizerPanel() : ""}
 ${t[2].includes("Word → PDF")||t[2].includes("Excel → PDF")||t[2].includes("PowerPoint → PDF") ? pdfUtilityPanel() : ""}
 <button class="primary" onclick="processDemo()">Preview / Process</button>
 <div id="result"></div>`;
 document.getElementById("modal").classList.remove("hidden");
}
async function processDemo(){
 const f=document.getElementById("fileInput").files[0];
 const result=document.getElementById("result");
 if(!f){result.innerHTML='<p class="note">पहले कोई फाइल चुनें।</p>';return}
 if(!f.type.startsWith("image/")){
   result.innerHTML=`<p class="note">फाइल चुनी गई: <b>${escapeHtml(f.name)}</b><br>इस फ़ाइल के लिए कृपया ऊपर की सूची से सही PDF टूल चुनें।</p>`;
   return;
 }

 const wIn=parseInt(document.getElementById("w").value||"0",10);
 const hIn=parseInt(document.getElementById("h").value||"0",10);
 const dpi=parseInt(document.getElementById("dpi").value||"300",10);
 const targetKB=parseInt(document.getElementById("kb").value||"0",10);

 const img=await loadImage(f);
 const originalW=img.naturalWidth, originalH=img.naturalHeight;
 let w=wIn||originalW, h=hIn||Math.round(originalH*(w/originalW));
 if(!wIn && hIn) w=Math.round(originalW*(h/originalH));
 if(!wIn && !hIn){w=originalW;h=originalH;}

 const canvas=document.createElement("canvas");
 canvas.width=w; canvas.height=h;
 const ctx=canvas.getContext("2d",{alpha:true});
 ctx.imageSmoothingEnabled=true;
 ctx.imageSmoothingQuality="high";
 ctx.drawImage(img,0,0,w,h);

 let quality=0.95;
 let blob=await canvasToBlob(canvas, "image/jpeg", quality);
 if(targetKB>0){
   let low=0.25, high=0.98, best=blob;
   for(let i=0;i<8;i++){
     quality=(low+high)/2;
     const b=await canvasToBlob(canvas,"image/jpeg",quality);
     if(b.size/1024<=targetKB){best=b;low=quality;}
     else high=quality;
   }
   blob=best;
 }

 const url=URL.createObjectURL(blob);
 result.innerHTML=`
   <div class="result-grid">
     <div>
       <p><b>Original:</b> ${originalW} × ${originalH}px • ${(f.size/1024).toFixed(1)} KB</p>
       <p><b>Output:</b> ${w} × ${h}px • ${(blob.size/1024).toFixed(1)} KB • ${dpi} DPI metadata target</p>
       <img class="preview" src="${url}" alt="HQ Preview">
     </div>
   </div>
   <div class="result-actions">
     <a class="primary linkbtn" download="${safeName(f.name)}_HQ.jpg" href="${url}">⬇️ HQ Download</a>
     <button class="primary" onclick="printImage('${url}',${w},${h})">🖨️ A4 Print Preview</button>
   </div>
   <p class="note">Browser canvas processing सक्रिय है। ध्यान दें: वास्तविक भौतिक DPI केवल metadata/print workflow में अर्थपूर्ण है; pixel dimensions और printer settings भी print quality तय करते हैं।</p>`;
}


/* =========================
   Trial v30 — Universal PVC / ID Card Print Center
   Exact physical-size print workflow for local images and PDFs.
   ========================= */
/* =========================
   Trial v32 — Manual HQ PVC Crop Studio
   Each document gets its own saved crop template. No generic center-crop.
   ========================= */
/* Trial v40 — Unified PDF opener: normal + password-protected PDFs.
   pdf.js password callback is attached to the LoadingTask AFTER getDocument()
   so callback functions are never sent to the worker via structured cloning.
*/
async function mahendraOpenPdf(lib, bytes, passwordGetter, statusSetter, label='PDF'){
  const initial=(passwordGetter?.()||'').trim();
  const task=lib.getDocument({data:bytes,password:initial});
  task.onPassword=(updatePassword,reason)=>{
    const wrong=(reason===(lib.PasswordResponses?.INCORRECT_PASSWORD??2));
    let supplied=(passwordGetter?.()||'').trim();
    if(!supplied||wrong){
      statusSetter?.(wrong?'❌ Password गलत है।':'🔐 यह PDF password-protected है।');
      supplied=(window.prompt(wrong?`${label} का password गलत है। सही original password दोबारा दर्ज करें:`:`${label} password protected है। सही original password दर्ज करें:`)||'').trim();
      if(supplied && typeof passwordGetter?.set==='function') passwordGetter.set(supplied);
    }
    if(supplied){
      statusSetter?.('🔐 PDF password verify हो रहा है…');
      updatePassword(supplied);
    }else{
      statusSetter?.('🔐 Password नहीं दिया गया। सही password डालकर फिर फ़ाइल खोलें।');
      task.destroy().catch(()=>{});
    }
  };
  return task.promise;
}

const V31_CARD_PROFILES={
 'आधार कार्ड Crop & Print':{key:'aadhaar',name:'आधार कार्ड',w:85.6,h:54},
 'PAN Card Crop & Print':{key:'pan',name:'PAN Card',w:85.6,h:54},
 'Voter ID Crop & Print':{key:'voter',name:'Voter ID',w:85.6,h:54},
 'आयुष्मान कार्ड':{key:'ayushman',name:'आयुष्मान कार्ड',w:85.6,h:54},
 'ABHA Card':{key:'abha',name:'ABHA Card',w:85.6,h:54},
 'ई-श्रम कार्ड':{key:'eshram',name:'ई-श्रम कार्ड',w:85.6,h:54},
 'राशन कार्ड':{key:'ration',name:'राशन कार्ड',w:85.6,h:54},
 'Driving Licence':{key:'dl',name:'Driving Licence',w:85.6,h:54},
 'RC Print Center':{key:'rc',name:'RC',w:85.6,h:54},
 'Passport Document':{key:'passport',name:'Passport',w:85.6,h:54},
 'Custom Document Crop':{key:'custom',name:'Custom Document',w:85.6,h:54}
};
function openCardPrintTool(t){
 const profiles={
  'आधार कार्ड Crop & Print':{name:'आधार कार्ड'},'PAN Card Crop & Print':{name:'PAN Card'},'Voter ID Crop & Print':{name:'Voter ID'},
  'आयुष्मान कार्ड':{name:'आयुष्मान कार्ड'},'ABHA Card':{name:'ABHA Card'},'ई-श्रम कार्ड':{name:'ई-श्रम कार्ड'},'राशन कार्ड':{name:'राशन कार्ड'},
  'Driving Licence':{name:'Driving Licence'},'RC Print Center':{name:'RC'},'Passport Document':{name:'Passport'},'Custom Document Crop':{name:'Custom Document'}
 };
 const profile=profiles[t[2]]||{name:t[2]};
 document.getElementById('toolContent').innerHTML=`
 <div class="v35-maker">
  <div class="v35-head"><div><span class="mini-badge">Card Maker</span><h2>🪪 ${escapeHtml(profile.name)} — Front + Back Card Maker</h2><p>Original PDF/फोटो से Front और Back को अलग-अलग HQ में crop करें। फिर दोनों को side-by-side preview और print-ready output में तैयार करें।</p></div><span class="v35-local">🔒 ब्राउज़र में स्थानीय प्रोसेसिंग</span></div>
  <div class="v35-stepbar"><span class="on">1. Original File</span><span>2. Front Crop</span><span>3. Back Crop</span><span>4. Final Card</span></div>
  <div class="v35-upload">
   <div><label>Original PDF / Image<input id="v35File" type="file" accept="application/pdf,image/jpeg,image/png,image/webp"></label><label>PDF Password (यदि आवश्यक)<input id="v35Password" type="password" placeholder="सही password"></label></div>
   <div><button class="primary-btn" id="v35Load">📂 Original खोलें</button><button class="secondary-btn" id="v35Clear">साफ़ करें</button><div id="v35Status" class="v31-status">PDF/फोटो चुनें।</div></div>
  </div>
  <div class="v35-page-controls">
   <div><b>Front Page</b><label>Page <input id="v35FrontPage" type="number" min="1" value="1"></label><button class="secondary-btn" id="v35RenderFront">Front खोलें</button></div>
   <div><b>Back Page</b><label>Page <input id="v35BackPage" type="number" min="1" value="2"></label><button class="secondary-btn" id="v35RenderBack">Back खोलें</button></div>
   <div><label>Output DPI<select id="v35Dpi"><option value="300">300 DPI HQ</option><option value="600">600 DPI Ultra HQ</option></select></label><input id="v35Mode" type="hidden" value="free"><label>Print चौड़ाई (mm) — ऊँचाई crop के अनुसार अपने-आप<input id="v35Wmm" type="number" value="85.6" step="0.1"></label><input id="v35Hmm" type="hidden" value="54"></div>
  </div>
  <div class="v35-crop-grid">
   <section class="v35-panel"><div class="v35-panel-title"><b>FRONT / सामने</b><span>Manual HQ Crop</span></div><div class="v35-stage"><canvas id="v35FrontCanvas"></canvas><div class="v35-stage-empty" id="v35FrontEmpty">Front Page खोलें</div></div><div class="v35-crop-meta" id="v35FrontMeta">कार्ड पर बॉक्स खींचें।</div><div class="v35-actions"><button class="secondary-btn" id="v35FrontReset">↺ Reset</button><button class="primary-btn" id="v35FrontSave">✓ Front सुरक्षित करें</button></div></section>
   <section class="v35-panel"><div class="v35-panel-title"><b>BACK / पीछे</b><span>Manual HQ Crop</span></div><div class="v35-stage"><canvas id="v35BackCanvas"></canvas><div class="v35-stage-empty" id="v35BackEmpty">Back Page खोलें</div></div><div class="v35-crop-meta" id="v35BackMeta">कार्ड पर बॉक्स खींचें।</div><div class="v35-actions"><button class="secondary-btn" id="v35BackReset">↺ Reset</button><button class="primary-btn" id="v35BackSave">✓ Back सुरक्षित करें</button></div></section>
  </div>
  <div class="v35-final"><div class="v35-final-head"><div><h3>Final Preview — जैसा Print में आएगा</h3><p>Front और Back अलग crop होने के बाद दोनों एक साथ दिखाई देंगे।</p></div><span>HQ • ${escapeHtml(profile.name)}</span></div><div class="v35-final-stage"><div><small>FRONT</small><canvas id="v35FrontFinal"></canvas></div><div><small>BACK</small><canvas id="v35BackFinal"></canvas></div></div><div id="v35FinalStatus" class="v31-status">दोनों side सुरक्षित करने के बाद output तैयार करें।</div></div>
  <div class="v35-output"><b>Output</b><div class="v35-border-control"><label><input id="v35AutoBorder" type="checkbox" checked> पूरे कार्ड पर स्वचालित काला बॉर्डर</label><label>बॉर्डर मोटाई <select id="v35BorderMm"><option value="0.25">0.25 mm</option><option value="0.35" selected>0.35 mm</option><option value="0.50">0.50 mm</option><option value="0.75">0.75 mm</option></select></label></div>
  <div class="v39-separate-download"><strong>⬇️ अलग-अलग डाउनलोड</strong><button class="primary-btn" id="v38FrontDownload">⬇️ FRONT JPG</button><button class="secondary-btn" id="v38FrontPng">⬇️ FRONT PNG</button><button class="primary-btn" id="v38BackDownload">⬇️ BACK JPG</button><button class="secondary-btn" id="v38BackPng">⬇️ BACK PNG</button></div>
  <div class="v35-actions"><button class="primary-btn" id="v35Jpg">⬇️ FRONT + BACK JPG</button><button class="secondary-btn" id="v35Png">⬇️ FRONT + BACK PNG</button><button class="secondary-btn" id="v35Pdf">📄 FRONT + BACK PDF</button><button class="secondary-btn" id="v35Print">🖨️ PVC Actual Size Print</button><button class="secondary-btn" id="v35Sheet">🖨️ A4 Sheet</button></div><p>ऊपर के <b>FRONT JPG/PNG</b> और <b>BACK JPG/PNG</b> बटन से दोनों कार्ड अलग-अलग डाउनलोड होंगे। बॉर्डर Front और Back दोनों कार्ड के बाहरी किनारे पर अपने-आप लगेगा। Print में <b>Scale = 100% / Actual Size</b> रखें।</p></div>
 </div>`;
 document.getElementById('modal').classList.remove('hidden');
 const q=id=>document.getElementById(id); let pdf=null, file=null;
 const sides={front:{src:null,sel:null,saved:null,dirty:true},back:{src:null,sel:null,saved:null,dirty:true}};
 const ratio=()=> (Number(q('v35Wmm').value)||85.6)/(Number(q('v35Hmm').value)||54);
 const outPx=(sel)=>(sel&&q('v35Mode')&&q('v35Mode').value==='free')?(()=>{const w=Math.max(1,Math.round((Number(q('v35Wmm').value)||85.6)*Number(q('v35Dpi').value||300)/25.4));return {w,h:Math.max(1,Math.round(w*sel.h/sel.w))}})():({w:Math.max(1,Math.round((Number(q('v35Wmm').value)||85.6)*Number(q('v35Dpi').value||300)/25.4)),h:Math.max(1,Math.round((Number(q('v35Hmm').value)||54)*Number(q('v35Dpi').value||300)/25.4))});
 const drawStage=(side)=>{const key=side==='front'?'v35FrontCanvas':'v35BackCanvas', empty=q(side==='front'?'v35FrontEmpty':'v35BackEmpty'), st=sides[side],cv=q(key); if(!st.src){cv.width=1;cv.height=1;empty.style.display='grid';return} empty.style.display='none'; const scale=Math.min(820/st.src.width,500/st.src.height,1);cv.width=Math.max(1,Math.round(st.src.width*scale));cv.height=Math.max(1,Math.round(st.src.height*scale));const ctx=cv.getContext('2d',{alpha:false});ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(st.src,0,0,cv.width,cv.height); if(st.sel){ctx.save();ctx.fillStyle='rgba(0,110,255,.12)';ctx.fillRect(st.sel.x*scale,st.sel.y*scale,st.sel.w*scale,st.sel.h*scale);ctx.strokeStyle='#006eff';ctx.lineWidth=3;ctx.setLineDash([8,6]);ctx.strokeRect(st.sel.x*scale,st.sel.y*scale,st.sel.w*scale,st.sel.h*scale);ctx.restore()} q(side==='front'?'v35FrontMeta':'v35BackMeta').textContent=st.sel?`Selection: X ${Math.round(st.sel.x)}, Y ${Math.round(st.sel.y)}, ${Math.round(st.sel.w)} × ${Math.round(st.sel.h)} px`:'कार्ड के चारों ओर बॉक्स खींचें (कोई भी size चलेगा)।';};
 const setSource=(side,canvas)=>{sides[side].src=canvas;sides[side].sel=null;sides[side].saved=null;sides[side].dirty=true;drawStage(side)};
 const renderPdf=async(side,pageNo)=>{if(!pdf)return;q('v35Status').textContent=`${side==='front'?'Front':'Back'} page render हो रहा है…`;const n=Math.max(1,Math.min(Number(pageNo)||1,pdf.numPages));const page=await pdf.getPage(n);const vp=page.getViewport({scale:3});const c=document.createElement('canvas');c.width=Math.ceil(vp.width);c.height=Math.ceil(vp.height);await page.render({canvasContext:c.getContext('2d',{alpha:false}),viewport:vp}).promise;setSource(side,c);q('v35Status').textContent=`PDF तैयार • ${pdf.numPages} pages • ${side==='front'?'Front':'Back'} = Page ${n}`;};
 const load=async()=>{file=q('v35File').files?.[0];if(!file)return;q('v35Status').textContent='Original file खोली जा रही है…';try{if(file.type==='application/pdf'||/\.pdf$/i.test(file.name)){const lib=await window.mahendraLoadPdfJs();const typed=new Uint8Array(await file.arrayBuffer());const supplied=(q('v35Password').value||'').trim();q('v35Status').textContent=supplied?'🔐 Password-protected PDF खोल रहे हैं…':'PDF खोल रहे हैं…';const getter=()=>q('v35Password').value||''; getter.set=v=>{q('v35Password').value=v}; pdf=await mahendraOpenPdf(lib,typed,getter,m=>q('v35Status').textContent=m,profile.name);q('v35FrontPage').max=pdf.numPages;q('v35BackPage').max=pdf.numPages;q('v35BackPage').value=pdf.numPages>=2?2:1;q('v35Status').textContent=`✅ PDF खुल गई • ${pdf.numPages} page${pdf.numPages===1?'':'s'} • Password verification सफल`;await renderPdf('front',1);if(pdf.numPages>=2)await renderPdf('back',2);else q('v35Status').textContent='PDF में 1 page है। Back के लिए दूसरा source/image चाहिए होगा।';}else{const bmp=await createImageBitmap(file),c=document.createElement('canvas');c.width=bmp.width;c.height=bmp.height;c.getContext('2d',{alpha:false}).drawImage(bmp,0,0);setSource('front',c);q('v35Status').textContent=`Image खुली • ${c.width} × ${c.height}px • Back के लिए अलग PDF/page चाहिए तो वही source चुनें या दूसरा image workflow इस्तेमाल करें।`;}}catch(e){const msg=String(e?.message||e||'अज्ञात त्रुटि');q('v35Status').textContent=msg.toLowerCase().includes('password')||msg.toLowerCase().includes('encrypted')?'❌ PDF password सही नहीं है या PDF encrypted है। सही original password डालकर फिर कोशिश करें।':'File खोलने में समस्या: '+msg}};
 const pointerCrop=(side)=>{let drag=false,start=null;const cv=q(side==='front'?'v35FrontCanvas':'v35BackCanvas');const get=e=>{const r=cv.getBoundingClientRect(),s=sides[side].src;if(!s)return null;return{x:Math.max(0,Math.min(s.width,(e.clientX-r.left)*s.width/r.width)),y:Math.max(0,Math.min(s.height,(e.clientY-r.top)*s.height/r.height))}};cv.addEventListener('pointerdown',e=>{const p=get(e);if(!p)return;e.preventDefault();cv.setPointerCapture?.(e.pointerId);drag=true;start=p;sides[side].sel={x:p.x,y:p.y,w:1,h:1};drawStage(side)});cv.addEventListener('pointermove',e=>{if(!drag)return;const p=get(e),s=sides[side].src;if(!p||!s)return;let x=Math.min(start.x,p.x),y=Math.min(start.y,p.y),w=Math.abs(p.x-start.x),h=Math.abs(p.y-start.y),r=ratio();if(w<2||h<2)return;if(q('v35Mode')&&q('v35Mode').value==='fixed'){if(w/h>r)h=w/r;else w=h*r;if(p.x<start.x)x=start.x-w;if(p.y<start.y)y=start.y-h;}x=Math.max(0,Math.min(x,s.width-w));y=Math.max(0,Math.min(y,s.height-h));sides[side].sel={x,y,w,h};drawStage(side)});cv.addEventListener('pointerup',()=>{if(drag){drag=false;sides[side].dirty=true}});};
 const reset=side=>{sides[side].sel=null;sides[side].saved=null;drawStage(side);updateFinal()};
 const cropCanvas=side=>{const st=sides[side];if(!st.src||!st.sel)return null;const p=outPx(st.sel),c=document.createElement('canvas');c.width=p.w;c.height=p.h;const ctx=c.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(st.src,st.sel.x,st.sel.y,st.sel.w,st.sel.h,0,0,p.w,p.h);const borderOn=q('v35AutoBorder')?.checked!==false;if(borderOn){const dpi=Number(q('v35Dpi').value)||300;const mm=Number(q('v35BorderMm').value)||0.35;const px=Math.max(1,Math.round(mm*dpi/25.4));ctx.save();ctx.strokeStyle='#000';ctx.lineWidth=px;ctx.strokeRect(px/2,px/2,c.width-px,c.height-px);ctx.restore();}return c};
 const saveSide=side=>{const c=cropCanvas(side);if(!c){q('v35FinalStatus').textContent=`${side==='front'?'Front':'Back'} में पहले card area select करें।`;return} sides[side].saved=c; sides[side].dirty=false; updateFinal();};
 const updateFinal=()=>{for(const side of ['front','back']){const target=q(side==='front'?'v35FrontFinal':'v35BackFinal'),src=sides[side].saved;if(!src){target.width=1;target.height=1;continue}const sc=Math.min(500/src.width,300/src.height,1);target.width=Math.max(1,Math.round(src.width*sc));target.height=Math.max(1,Math.round(src.height*sc));const ctx=target.getContext('2d',{alpha:false});ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(src,0,0,target.width,target.height)}const both=sides.front.saved&&sides.back.saved;q('v35FinalStatus').textContent=both?'✅ Front + Back तैयार हैं। अब JPG/PNG/PDF/Print करें.':'Front और Back दोनों को crop करके सुरक्षित करें।';};
 const combined=()=>{const f=sides.front.saved,b=sides.back.saved;if(!f&&!b)return null;const gap=Math.round(5*Number(q('v35Dpi').value||300)/25.4),pad=Math.round(4*Number(q('v35Dpi').value||300)/25.4),count=(f?1:0)+(b?1:0),w=(f?f.width:0)+(b?b.width:0),h=Math.max(f?f.height:0,b?b.height:0),c=document.createElement('canvas');c.width=w+(count-1)*gap+2*pad;c.height=h+2*pad;const ctx=c.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);let x=pad;if(f){ctx.drawImage(f,x,pad);x+=f.width+gap}if(b)ctx.drawImage(b,x,pad);return c};
 const download=type=>{const c=combined();if(!c){q('v35FinalStatus').textContent='पहले Front/Back crop सुरक्षित करें।';return}const mime=type==='png'?'image/png':'image/jpeg',ext=type==='png'?'png':'jpg';c.toBlob(blob=>{const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=`mahendra-${safeName(profile.name)}-front-back.${ext}`;a.click();setTimeout(()=>URL.revokeObjectURL(u),1200)},mime,type==='jpg'?.98:undefined)};
 const makePdf=()=>{const c=combined();if(!c)return;q('v35FinalStatus').textContent='PDF तैयार किया जा रहा है…';const jpeg=c.toDataURL('image/jpeg',.98).split(',')[1],bin=atob(jpeg),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);const mm=25.4,pt=72/mm,dpi=Number(q('v35Dpi').value)||300,wmm=c.width*25.4/dpi,hmm=c.height*25.4/dpi,W=wmm*pt,H=hmm*pt,enc=new TextEncoder(),parts=[],offs=[],add=x=>{const b=typeof x==='string'?enc.encode(x):x;parts.push(b);return b.length};let pos=0;const put=x=>{const n=add(x);pos+=n};put('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');offs[1]=pos;put('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');offs[2]=pos;put('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');offs[3]=pos;put(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W.toFixed(2)} ${H.toFixed(2)}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`);offs[4]=pos;put(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${c.width} /Height ${c.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`);put(bytes);put('\nendstream\nendobj\n');const st=`q\n${W.toFixed(2)} 0 0 ${H.toFixed(2)} 0 0 cm\n/Im0 Do\nQ\n`;offs[5]=pos;put(`5 0 obj\n<< /Length ${st.length} >>\nstream\n${st}endstream\nendobj\n`);const xref=pos;put('xref\n0 6\n0000000000 65535 f \n');for(let i=1;i<=5;i++)put(String(offs[i]).padStart(10,'0')+' 00000 n \n');put(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);const blob=new Blob(parts,{type:'application/pdf'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=`mahendra-${safeName(profile.name)}-front-back.pdf`;a.click();setTimeout(()=>URL.revokeObjectURL(u),1500);q('v35FinalStatus').textContent='✅ PDF तैयार है।';};
 const print=()=>{const c=combined();if(!c)return;const u=c.toDataURL('image/jpeg',.98),w=window.open('','_blank');if(!w){alert('Print Preview के लिए pop-up अनुमति दें।');return}w.document.write(`<!doctype html><html><head><title>Mahendra MP Online - ${escapeHtml(profile.name)}</title><style>@page{size:A4;margin:0}html,body{margin:0;background:#fff}body{padding:15mm;display:flex;justify-content:center;align-items:flex-start}img{display:block;width:auto;height:auto;max-width:180mm}</style></head><body><img src="${u}" onload="setTimeout(()=>window.print(),300)"></body></html>`);w.document.close()};
 const sheet=()=>{const c=combined();if(!c)return;const A4W=2480,A4H=3508,gap=30,out=document.createElement('canvas');out.width=A4W;out.height=A4H;const ctx=out.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,A4W,A4H);let x=gap,y=gap;for(let i=0;i<10;i++){if(x+c.width+gap>A4W){x=gap;y+=c.height+gap}if(y+c.height+gap>A4H)break;ctx.drawImage(c,x,y);x+=c.width+gap}const u=out.toDataURL('image/jpeg',.98),w=window.open('','_blank');if(!w)return;w.document.write(`<html><head><title>A4 PVC Sheet</title><style>@page{size:A4;margin:0}html,body{margin:0}img{width:210mm;height:297mm;display:block}</style></head><body><img src="${u}" onload="setTimeout(()=>window.print(),300)"></body></html>`);w.document.close()};
 pointerCrop('front');pointerCrop('back');
 q('v35Load').onclick=load;q('v35RenderFront').onclick=()=>renderPdf('front',q('v35FrontPage').value);q('v35RenderBack').onclick=()=>renderPdf('back',q('v35BackPage').value);q('v35FrontReset').onclick=()=>reset('front');q('v35BackReset').onclick=()=>reset('back');q('v35FrontSave').onclick=()=>saveSide('front');q('v35BackSave').onclick=()=>saveSide('back');
['v35AutoBorder','v35BorderMm','v35Dpi','v35Wmm','v35Hmm'].forEach(id=>{const el=q(id);if(el)el.addEventListener('change',()=>{if(sides.front.sel)sides.front.saved=cropCanvas('front');if(sides.back.sel)sides.back.saved=cropCanvas('back');updateFinal();});});
q('v35Jpg').onclick=()=>download('jpg');
const saveStandaloneCard=(side,ext)=>{const c=cropCanvas(side);if(!c){alert(side==='front'?'पहले Front Crop करें।':'पहले Back Crop करें।');return;}const a=document.createElement('a');a.href=c.toDataURL(ext==='png'?'image/png':'image/jpeg',ext==='png'?1:.98);a.download=`Mahendra_MP_${side.toUpperCase()}_PVC.${ext}`;a.click();};
q('v38FrontDownload')?.addEventListener('click',()=>saveStandaloneCard('front','jpg'));
q('v38FrontPng')?.addEventListener('click',()=>saveStandaloneCard('front','png'));
q('v38BackDownload')?.addEventListener('click',()=>saveStandaloneCard('back','jpg'));
q('v38BackPng')?.addEventListener('click',()=>saveStandaloneCard('back','png'));q('v35Png').onclick=()=>download('png');q('v35Pdf').onclick=makePdf;q('v35Print').onclick=print;q('v35Sheet').onclick=sheet;q('v35Dpi').onchange=()=>{sides.front.saved=null;sides.back.saved=null;updateFinal()};q('v35Clear').onclick=()=>{location.reload()};
}
function loadImage(file){
 return new Promise((resolve,reject)=>{
   const url=URL.createObjectURL(file);
   const img=new Image();
   img.onload=()=>{URL.revokeObjectURL(url);resolve(img)};
   img.onerror=reject;
   img.src=url;
 });
}
function canvasToBlob(canvas,type,quality){
 return new Promise(resolve=>canvas.toBlob(resolve,type,quality));
}
function safeName(name){return name.replace(/\.[^.]+$/,"").replace(/[^\w\-]+/g,"_")}
function escapeHtml(s){return s.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function printImage(url,w,h){
 const win=window.open("","_blank");
 if(!win){alert("Print Preview खोलने के लिए browser में pop-up अनुमति दें।");return}
 win.document.write(`<!doctype html><html><head><title>Mahendra MP Online - A4 Print</title>
 <style>@page{size:A4;margin:10mm}body{margin:0;text-align:center;font-family:Arial}
 img{max-width:190mm;max-height:277mm;object-fit:contain}h3{font-weight:600}</style></head>
 <body><h3>Mahendra MP Online — Print Preview</h3><img src="${url}" onload="setTimeout(()=>window.print(),300)"></body></html>`);
 win.document.close();
}

function pdfToolsPanel(){
 return `<div class="pdf-panel">
 <p class="note">PDF निर्माण आपके ब्राउज़र में होगा। JPG/PNG की मूल pixel quality को यथासंभव बनाए रखा जाएगा।</p>
 <label class="file-wide">एक या अधिक Images चुनें
 <input id="pdfFiles" type="file" accept="image/jpeg,image/png" multiple></label>
 <div class="controls">
  <label>Page Size
   <select id="pdfPage"><option value="A4">A4</option><option value="LETTER">Letter</option><option value="ORIGINAL">Image Size</option></select>
  </label>
  <label>Orientation
   <select id="pdfOrientation"><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select>
  </label>
 </div>
 <button class="primary" onclick="imagesToPdf()">📄 Create HQ PDF</button>
 <div id="pdfResult"></div>
 </div>`;
}

function pdfPageSize(page,orientation){
 let w=595.28,h=841.89; // points
 if(page==="LETTER"){w=612;h=792}
 if(page==="ORIGINAL"){w=595.28;h=841.89}
 if(orientation==="landscape"){[w,h]=[h,w]}
 return [w,h];
}
function dataUrlBytes(dataUrl){
 const b64=dataUrl.split(",")[1], bin=atob(b64), out=new Uint8Array(bin.length);
 for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);
 return out;
}
function pdfEscape(s){return s.replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)")}
async function jpegBytesFromImage(file){
 if(file.type==="image/jpeg") return {bytes:new Uint8Array(await file.arrayBuffer()), mime:"image/jpeg"};
 const img=await loadImage(file);
 const c=document.createElement("canvas");c.width=img.naturalWidth;c.height=img.naturalHeight;
 const ctx=c.getContext("2d",{alpha:false});ctx.fillStyle="#fff";ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(img,0,0);
 const blob=await canvasToBlob(c,"image/jpeg",0.98);
 return {bytes:new Uint8Array(await blob.arrayBuffer()),mime:"image/jpeg",width:c.width,height:c.height};
}
function buildPdf(images,pageW,pageH){
 let objects=[];
 const add=s=>{objects.push(s);return objects.length};
 const catalog=add(""); const pages=add("");
 const pageRefs=[], contentRefs=[];
 for(const im of images){
  const imgObj=add(`<< /Type /XObject /Subtype /Image /Width ${im.width} /Height ${im.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.bytes.length} >>\nstream\n`);
  objects[imgObj-1]={head:objects[imgObj-1],bytes:im.bytes};
  const maxW=pageW-36,maxH=pageH-36,scale=Math.min(maxW/im.width,maxH/im.height);
  const w=im.width*scale,h=im.height*scale,x=(pageW-w)/2,y=(pageH-h)/2;
  const content=`q\n${w.toFixed(3)} 0 0 ${h.toFixed(3)} ${x.toFixed(3)} ${y.toFixed(3)} cm\n/Im1 Do\nQ`;
  const cObj=add(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  contentRefs.push(cObj);
  const pObj=add(`<< /Type /Page /Parent ${pages} 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im1 ${imgObj} 0 R >> >> /Contents ${cObj} 0 R >>`);
  pageRefs.push(pObj);
 }
 objects[pages-1]=`<< /Type /Pages /Kids [${pageRefs.map(x=>x+" 0 R").join(" ")}] /Count ${pageRefs.length} >>`;
 objects[catalog-1]=`<< /Type /Catalog /Pages ${pages} 0 R >>`;

 let pdf="%PDF-1.4\n%\xFF\xFF\xFF\xFF\n", offsets=[0];
 for(let i=0;i<objects.length;i++){
  offsets.push(pdf.length);
  const o=objects[i];
  if(typeof o==="object"){
   pdf+=`${i+1} 0 obj\n${o.head}`;
   pdf+=String.fromCharCode(...o.bytes);
   pdf+=`\nendstream\nendobj\n`;
  }else pdf+=`${i+1} 0 obj\n${o}\nendobj\n`;
 }
 const xref=pdf.length;
 pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;
 for(let i=1;i<offsets.length;i++)pdf+=String(offsets[i]).padStart(10,"0")+" 00000 n \n";
 pdf+=`trailer\n<< /Size ${objects.length+1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`;
 const bytes=new Uint8Array([...pdf].map(c=>c.charCodeAt(0)));
 return bytes;
}
async function imagesToPdf(){
 const files=[...document.getElementById("pdfFiles").files];
 const out=document.getElementById("pdfResult");
 if(!files.length){out.innerHTML='<p class="note">कम-से-कम एक JPG/PNG चुनें।</p>';return}
 const page=document.getElementById("pdfPage").value, orientation=document.getElementById("pdfOrientation").value;
 const [pw,ph]=pdfPageSize(page,orientation);
 const imgs=[];
 for(const f of files){
  if(!f.type.startsWith("image/")) continue;
  const img=await loadImage(f);
  const c=document.createElement("canvas");c.width=img.naturalWidth;c.height=img.naturalHeight;
  const ctx=c.getContext("2d",{alpha:false});ctx.fillStyle="#fff";ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(img,0,0);
  const blob=await canvasToBlob(c,"image/jpeg",.98);
  imgs.push({bytes:new Uint8Array(await blob.arrayBuffer()),width:c.width,height:c.height});
 }
 if(!imgs.length){out.innerHTML='<p class="note">मान्य image file नहीं मिली।</p>';return}
 const pdfBytes=buildPdf(imgs,pw,ph);
 const blob=new Blob([pdfBytes],{type:"application/pdf"}),url=URL.createObjectURL(blob);
 out.innerHTML=`<p class="note"><b>${imgs.length}</b> page(s) का PDF तैयार है।</p>
 <div class="result-actions"><a class="primary linkbtn" href="${url}" download="Mahendra_MP_Online_HQ.pdf">⬇️ HQ PDF Download</a>
 <button class="primary" onclick="window.open('${url}','_blank')">👁️ PDF Preview</button></div>`;
}


function documentPdfPanel(){
 return `<div class="docpdf-panel">
 <label>दस्तावेज़ शीर्षक
 <input id="docTitle" type="text" value="Mahendra MP Online Document"></label>
 <label>अपना Text / Content
 <textarea id="docText" rows="10" placeholder="यहाँ अपना Word/Document का text paste करें..."></textarea>
 <div class="controls">
  <label>Page Size<select id="docPage"><option>A4</option><option>LETTER</option></select></label>
  <label>Font Size<input id="docFont" type="number" value="14" min="8" max="32"></label>
 </div>
 <button class="primary" onclick="makeDocumentPdfPreview()">📄 PDF Print Preview</button>
 <p class="note">यह local print-ready workflow है। Browser में Print → Save as PDF करके PDF सुरक्षित रूप से बना सकते हैं।</p>
 </div>`;
}
function makeDocumentPdfPreview(){
 const title=document.getElementById("docTitle").value||"Document";
 const text=document.getElementById("docText").value||"";
 const font=document.getElementById("docFont").value||14;
 const page=document.getElementById("docPage").value;
 const w=page==="A4"?"210mm":"216mm";
 const win=window.open("","_blank");
 if(!win){alert("Pop-up अनुमति दें।");return}
 const safe=text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
 win.document.write(`<!doctype html><html><head><title>${title.replace(/[<>]/g,"")}</title>
 <style>@page{size:${page};margin:14mm}body{font-family:Arial,sans-serif;font-size:${font}px;line-height:1.55;width:${w};margin:auto;white-space:pre-wrap}
 h1{font-size:${Number(font)+8}px;margin:0 0 16px} </style></head><body>
 <h1>${title.replace(/[<>]/g,"")}</h1><div>${safe}</div>
 <script>setTimeout(()=>window.print(),400)<\/script></body></html>`);
 win.document.close();
}
function pdfUtilityPanel(){
 return `<div class="pdf-panel">
 <h3>PDF Utility</h3>
 <p class="note">इस चरण में PDF creation और print-ready document workflow local है। Existing PDF merge/split/render के लिए अगली build में dedicated PDF engine जोड़ा जाएगा।</p>
 <button class="primary" onclick="document.getElementById('docUtility').innerHTML=documentPdfPanel()">📝 Text/Document → PDF</button>
 <div id="docUtility"></div>
 </div>`;
}


function pageOrganizerPanel(){
 return `<div class="organizer">
 <label class="file-wide">Images चुनें (क्रम बदलकर PDF pages बनाएं)
 <input id="orgFiles" type="file" accept="image/jpeg,image/png" multiple onchange="showOrgFiles()"></label>
 <div id="orgList" class="org-list"></div>
 <button class="primary" onclick="createOrganizedPdf()">📄 Ordered HQ PDF बनाएं</button>
 <div id="orgResult"></div>
 </div>`;
}
let orgFiles=[];
function showOrgFiles(){
 const input=document.getElementById("orgFiles");
 orgFiles=[...input.files];
 renderOrgFiles();
}
function renderOrgFiles(){
 const el=document.getElementById("orgList");
 if(!el)return;
 el.innerHTML=orgFiles.map((f,i)=>`<div class="org-item"><span>${i+1}. ${escapeHtml(f.name)}</span>
 <div><button onclick="moveOrg(${i},-1)">↑</button><button onclick="moveOrg(${i},1)">↓</button><button onclick="removeOrg(${i})">×</button></div></div>`).join("");
}
function moveOrg(i,d){const j=i+d;if(j<0||j>=orgFiles.length)return;[orgFiles[i],orgFiles[j]]=[orgFiles[j],orgFiles[i]];renderOrgFiles()}
function removeOrg(i){orgFiles.splice(i,1);renderOrgFiles()}
async function createOrganizedPdf(){
 const out=document.getElementById("orgResult");
 if(!orgFiles.length){out.innerHTML='<p class="note">पहले images चुनें।</p>';return}
 const imgs=[];
 for(const f of orgFiles){
  const img=await loadImage(f),c=document.createElement("canvas");
  c.width=img.naturalWidth;c.height=img.naturalHeight;
  const ctx=c.getContext("2d",{alpha:false});ctx.fillStyle="#fff";ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(img,0,0);
  const b=await canvasToBlob(c,"image/jpeg",.98);
  imgs.push({bytes:new Uint8Array(await b.arrayBuffer()),width:c.width,height:c.height});
 }
 const [pw,ph]=pdfPageSize("A4","portrait"), bytes=buildPdf(imgs,pw,ph);
 const url=URL.createObjectURL(new Blob([bytes],{type:"application/pdf"}));
 out.innerHTML=`<p class="note">${imgs.length} pages क्रम के अनुसार तैयार हैं।</p><a class="primary linkbtn" href="${url}" download="Mahendra_Ordered_HQ.pdf">⬇️ Download HQ PDF</a>`;
}

function examRequirementNotice(){
 return `<p class="note"><b>महत्वपूर्ण:</b> परीक्षा/भर्ती की Photo, Signature, DPI और KB requirements संस्था के official notification से सत्यापित करके ही preset में जोड़ें। ये preset केवल उदाहरण हैं।</p>`;
}

function closeTool(){document.getElementById("modal").classList.add("hidden")}
function toggleMenu(){document.getElementById("nav").classList.toggle("open")}
render();


/* ===== Trial v7 JavaScript ===== */
(function(){
  const $ = id => document.getElementById(id);
  const mmToPx = (mm, dpi=300) => Math.max(1, Math.round(mm/25.4*dpi));

  function loadImg(file){
    return new Promise((resolve,reject)=>{
      const img=new Image();
      img.onload=()=>resolve(img);
      img.onerror=reject;
      img.src=URL.createObjectURL(file);
    });
  }

  function canvasBlob(canvas, type, quality){
    return new Promise(resolve=>canvas.toBlob(resolve,type,quality));
  }

  async function targetBlob(canvas, type, maxKb){
    if(!maxKb) return canvasBlob(canvas,type,0.94);
    let lo=0.35, hi=0.98, best=null;
    for(let i=0;i<8;i++){
      const q=(lo+hi)/2;
      const b=await canvasBlob(canvas,type,q);
      if(b.size/1024 <= maxKb){best=b;lo=q}else{hi=q}
    }
    return best || await canvasBlob(canvas,type,0.55);
  }

  function downloadBlob(blob,name){
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),1500);
  }

  function canvasFromImage(img,w,h){
    const c=document.createElement('canvas');
    c.width=w;c.height=h;
    const ctx=c.getContext('2d');
    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality='high';
    ctx.drawImage(img,0,0,w,h);
    return c;
  }

  // Batch image resize/compress
  $('v7BatchRun')?.addEventListener('click', async ()=>{
    const files=[...($('v7BatchImages').files||[])];
    const out=$('v7BatchResults');
    if(!files.length){out.textContent='कृपया फोटो चुनें।';return}
    out.textContent='Processing…';
    const w=Number($('v7BatchW').value), h=Number($('v7BatchH').value);
    const dpi=Number($('v7BatchDpi').value)||300, kb=Number($('v7BatchKb').value)||0;
    let html='';
    for(let i=0;i<files.length;i++){
      const img=await loadImg(files[i]);
      const cw=w>0?w:img.naturalWidth, ch=h>0?h:img.naturalHeight;
      const c=canvasFromImage(img,cw,ch);
      const blob=await targetBlob(c,'image/jpeg',kb);
      const name=files[i].name.replace(/\.[^.]+$/,'')+'_HQ.jpg';
      downloadBlob(blob,name);
      html += `<div>${i+1}. ${name} — ${Math.round(blob.size/1024)} KB, ${cw}×${ch}px, ${dpi} DPI metadata target</div>`;
    }
    out.innerHTML=html+'<small>नोट: ब्राउज़र canvas में DPI field अकेले pixels नहीं बढ़ाती; print software में DPI सेटिंग भी आवश्यक हो सकती है।</small>';
  });

  // Format converter
  $('v7FormatRun')?.addEventListener('click', async ()=>{
    const f=$('v7FormatImage').files?.[0], type=$('v7Format').value, out=$('v7FormatResult');
    if(!f){out.textContent='कृपया फोटो चुनें।';return}
    const img=await loadImg(f), c=canvasFromImage(img,img.naturalWidth,img.naturalHeight);
    const blob=await canvasBlob(c,type,type==='image/png'?undefined:0.96);
    const ext=type==='image/png'?'png':type==='image/webp'?'webp':'jpg';
    downloadBlob(blob,f.name.replace(/\.[^.]+$/,'')+'.'+ext);
    out.textContent=`तैयार: ${Math.round(blob.size/1024)} KB — ${img.naturalWidth}×${img.naturalHeight}px`;
  });

  // Custom print sheet (image-based PDF using the existing PDF generator when available)
  $('v7PrintRun')?.addEventListener('click', async ()=>{
    const files=[...($('v7PrintImages').files||[])], out=$('v7PrintResult');
    if(!files.length){out.textContent='कृपया फोटो चुनें।';return}
    const paper=$('v7Paper').value, dpi=300;
    const pageW=paper==='A4'?mmToPx(210,dpi):mmToPx(152.4,dpi);
    const pageH=paper==='A4'?mmToPx(297,dpi):mmToPx(101.6,dpi);
    const fw=mmToPx(Number($('v7PhotoWmm').value)||35,dpi);
    const fh=mmToPx(Number($('v7PhotoHmm').value)||45,dpi);
    const gap=mmToPx(Number($('v7Gapmm').value)||3,dpi);
    const cols=Math.max(1,Math.floor((pageW+gap)/(fw+gap)));
    const rows=Math.max(1,Math.floor((pageH+gap)/(fh+gap)));
    const perPage=cols*rows;
    const pages=[];
    for(let start=0;start<files.length;start+=perPage){
      const c=document.createElement('canvas'); c.width=pageW;c.height=pageH;
      const ctx=c.getContext('2d'); ctx.fillStyle='#fff';ctx.fillRect(0,0,pageW,pageH);
      const batch=files.slice(start,start+perPage);
      for(let j=0;j<batch.length;j++){
        const img=await loadImg(batch[j]);
        const col=j%cols,row=Math.floor(j/cols);
        const x=gap+col*(fw+gap), y=gap+row*(fh+gap);
        ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
        ctx.drawImage(img,x,y,fw,fh);
      }
      pages.push(c.toDataURL('image/jpeg',0.96));
    }
    if(typeof window.makeImagePdf==='function'){
      const blob=window.makeImagePdf(pages,paper==='A4'?'A4':'4x6');
      if(blob instanceof Blob) downloadBlob(blob,'Mahendra_MP_Online_Print_Sheet.pdf');
      else out.textContent='शीट तैयार है, लेकिन PDF engine को मौजूदा प्रोजेक्ट में उपलब्ध नहीं पाया गया।';
    }else{
      // Fallback: printable browser window.
      const w=window.open('','_blank');
      if(!w){out.textContent='Popup blocked. Browser में pop-up अनुमति दें।';return}
      w.document.write('<html><head><title>Print Sheet</title><style>@page{size:'+paper+';margin:0}body{margin:0}img{width:100%;display:block;page-break-after:always}</style></head><body>');
      pages.forEach(p=>w.document.write(`<img src="${p}">`)); w.document.write('</body></html>');w.document.close();w.focus();
      setTimeout(()=>w.print(),500);
    }
    out.textContent=`${pages.length} शीट तैयार — ${cols}×${rows} फोटो प्रति पेज (अनुमानित)।`;
  });

  // Document crop templates: centered crop to selected aspect ratio.
  $('v7DocRun')?.addEventListener('click', async ()=>{
    const f=$('v7DocImage').files?.[0], template=$('v7DocTemplate').value, out=$('v7DocResult');
    if(!f){out.textContent='कृपया दस्तावेज़ फोटो चुनें।';return}
    const img=await loadImg(f);
    let ratio=img.naturalWidth/img.naturalHeight;
    if(template==='idcard') ratio=85.6/54;
    if(template==='a4') ratio=210/297;
    if(template==='photo35x45') ratio=35/45;
    let sw=img.naturalWidth, sh=img.naturalHeight;
    if(template!=='custom'){
      if(sw/sh>ratio) sw=Math.round(sh*ratio); else sh=Math.round(sw/ratio);
    }
    const sx=Math.round((img.naturalWidth-sw)/2), sy=Math.round((img.naturalHeight-sh)/2);
    const c=document.createElement('canvas'); c.width=sw;c.height=sh;
    c.getContext('2d').drawImage(img,sx,sy,sw,sh,0,0,sw,sh);
    const blob=await canvasBlob(c,'image/jpeg',0.96);
    downloadBlob(blob,'Mahendra_MP_Online_Cropped.jpg');
    out.textContent=`Crop तैयार: ${sw}×${sh}px`;
  });
})();


/* ===== Trial v9 JavaScript ===== */
(function(){
  const $=id=>document.getElementById(id);
  let cropImg=null, cropObjectUrl=null;

  function load(file){
    return new Promise((res,rej)=>{
      const img=new Image(); img.onload=()=>res(img); img.onerror=rej;
      img.src=URL.createObjectURL(file);
    });
  }
  function blob(canvas,type='image/jpeg',q=.96){return new Promise(r=>canvas.toBlob(r,type,q))}
  function download(b,n){
    const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=n;
    document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1200);
  }
  function px(mm,dpi){return Math.max(1,Math.round(mm/25.4*dpi))}
  async function target(canvas,kb){
    if(!kb)return blob(canvas,'image/jpeg',.96);
    let lo=.35,hi=.98,best=null;
    for(let i=0;i<9;i++){
      const q=(lo+hi)/2,b=await blob(canvas,'image/jpeg',q);
      if(b.size/1024<=kb){best=b;lo=q}else hi=q;
    }
    return best||await blob(canvas,'image/jpeg',.45);
  }

  $('v9CropImage')?.addEventListener('change',async e=>{
    const f=e.target.files?.[0]; if(!f)return;
    if(cropObjectUrl)URL.revokeObjectURL(cropObjectUrl);
    cropObjectUrl=URL.createObjectURL(f); cropImg=await load(f);
    const c=$('v9CropCanvas'),ctx=c.getContext('2d');
    const scale=Math.min(c.width/cropImg.naturalWidth,c.height/cropImg.naturalHeight);
    const w=Math.round(cropImg.naturalWidth*scale),h=Math.round(cropImg.naturalHeight*scale);
    ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);
    ctx.drawImage(cropImg,0,0,w,h);
    $('v9CW').value=cropImg.naturalWidth;$('v9CH').value=cropImg.naturalHeight;
    $('v9X').value=0;$('v9Y').value=0;
  });

  $('v9CropTemplate')?.addEventListener('change',()=>{
    const t=$('v9CropTemplate').value;
    const w=Number($('v9CW').value)||900,h=Number($('v9CH').value)||520;
    const ratio=t==='id'?85.6/54:t==='a4'?210/297:t==='photo'?35/45:null;
    if(ratio){ if(w/h>ratio)$('v9CW').value=Math.round(h*ratio);else $('v9CH').value=Math.round(w/ratio); }
  });

  $('v9CropRun')?.addEventListener('click',async()=>{
    const out=$('v9CropResult');
    if(!cropImg){out.textContent='कृपया image चुनें।';return}
    let x=Math.max(0,Number($('v9X').value)||0),y=Math.max(0,Number($('v9Y').value)||0);
    let w=Math.max(1,Number($('v9CW').value)||cropImg.naturalWidth),h=Math.max(1,Number($('v9CH').value)||cropImg.naturalHeight);
    if(x+w>cropImg.naturalWidth)w=cropImg.naturalWidth-x;
    if(y+h>cropImg.naturalHeight)h=cropImg.naturalHeight-y;
    const c=document.createElement('canvas');c.width=w;c.height=h;
    const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    ctx.drawImage(cropImg,x,y,w,h,0,0,w,h);
    const b=await blob(c,'image/jpeg',.97);download(b,'Mahendra_MP_Online_Document_Crop.jpg');
    out.textContent=`HQ crop तैयार: ${w}×${h}px`;
  });

  $('v9PassRun')?.addEventListener('click',async()=>{
    const f=$('v9PassImage').files?.[0],out=$('v9PassResult');
    if(!f){out.textContent='कृपया photo चुनें।';return}
    const img=await load(f),dpi=Number($('v9PassDpi').value)||300;
    const fw=px(Number($('v9PassW').value)||35,dpi),fh=px(Number($('v9PassH').value)||45),gap=px(Number($('v9PassGap').value)||3,dpi);
    const W=px(210,dpi),H=px(297,dpi),cols=Math.max(1,Math.floor((W+gap)/(fw+gap))),rows=Math.max(1,Math.floor((H+gap)/(fh+gap)));
    const per=cols*rows,copies=Math.max(1,Math.min(100,Number($('v9PassCopies').value)||20));
    const pages=[];
    for(let start=0;start<copies;start+=per){
      const c=document.createElement('canvas');c.width=W;c.height=H;const ctx=c.getContext('2d');
      ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
      const count=Math.min(per,copies-start);
      for(let j=0;j<count;j++){const col=j%cols,row=Math.floor(j/cols);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(img,gap+col*(fw+gap),gap+row*(fh+gap),fw,fh)}
      pages.push(c.toDataURL('image/jpeg',.97));
    }
    if(typeof window.makeImagePdf==='function'){
      const b=window.makeImagePdf(pages,'A4');
      if(b instanceof Blob){download(b,'Mahendra_MP_Online_Passport_Photo_Sheet.pdf');out.textContent=`${copies} photos — ${cols}×${rows} layout में sheet तैयार।`}
      else out.textContent='PDF engine उपलब्ध नहीं हुआ।';
    }else out.textContent='PDF engine इस build में उपलब्ध नहीं है।';
  });

  $('v9SigRun')?.addEventListener('click',async()=>{
    const f=$('v9SigImage').files?.[0],out=$('v9SigResult');
    if(!f){out.textContent='कृपया signature चुनें।';return}
    const img=await load(f),w=Number($('v9SigW').value)||300,h=Number($('v9SigH').value)||100;
    const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);
    const b=await target(c,Number($('v9SigKb').value)||100);download(b,'Mahendra_MP_Online_Signature.jpg');
    out.textContent=`Signature तैयार: ${w}×${h}px, ${Math.round(b.size/1024)} KB`;
  });

  $('v9BatchRun')?.addEventListener('click',async()=>{
    const files=[...($('v9BatchImage').files||[])],out=$('v9BatchResult');
    if(!files.length){out.textContent='कृपया photos चुनें।';return}
    const preset=$('v9BatchPreset').value;
    let w=413,h=531;
    if(preset==='300x100'){w=300;h=100}else if(preset==='600x800'){w=600;h=800}else if(preset==='custom'){w=Number($('v9BatchCustomW').value)||413;h=Number($('v9BatchCustomH').value)||531}
    const kb=Number($('v9BatchMaxKb').value)||200;let done=0;
    for(const f of files){const img=await load(f),c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);const b=await target(c,kb);download(b,f.name.replace(/\.[^.]+$/,'')+'_processed.jpg');done++}
    out.textContent=`${done} photos process किए गए।`;
  });

  $('v9CheckRun')?.addEventListener('click',()=>{
    const w=Number($('v9CheckW').value)||35,h=Number($('v9CheckH').value)||45,d=Number($('v9CheckDpi').value)||300;
    $('v9CheckResult').textContent=`${w}×${h} mm @ ${d} DPI ≈ ${px(w,d)}×${px(h,d)} pixels`;
  });
})();


/* ===== Trial v13 JavaScript ===== */
(function(){
  const $=id=>document.getElementById(id);
  let files=[];
  let first=null;
  const fmtBytes=n=>n<1024?`${n} B`:`${(n/1024).toFixed(1)} KB`;
  const updateQuality=()=>{
    if(!first)return;
    const w=first.width,h=first.height;
    $('v13Original').textContent=`${w} × ${h} px`;
    $('v13Ratio').textContent=(w/h).toFixed(4);
    $('v13Output').textContent=`${$('v13W').value||w} × ${$('v13H').value||h} px`;
    $('v13ResCheck').textContent=`Resolution: ${w} × ${h} px`;
    $('v13PrintCheck').textContent=`300 DPI पर अनुमानित print size: ${(w/300).toFixed(2)} × ${(h/300).toFixed(2)} inch`;
    $('v13FileCheck').textContent=`File size: ${fmtBytes(first.file.size)}`;
    $('v13Quality').textContent=(w>=600&&h>=800)?'✓ Source resolution अच्छा है।':'⚠️ Source resolution कम हो सकती है; बड़े print में quality घट सकती है।';
  };
  const loadFirst=()=>{
    if(!files.length)return;
    const f=files[0];
    const img=new Image();
    img.onload=()=>{first={file:f,width:img.naturalWidth,height:img.naturalHeight};if(!$('v13W').value)$('v13W').value=img.naturalWidth;if(!$('v13H').value)$('v13H').value=img.naturalHeight;updateQuality();};
    img.src=URL.createObjectURL(f);
  };
  $('v13Files')?.addEventListener('change',e=>{
    files=[...e.target.files];
    $('v13BatchInfo').textContent=`${files.length} file(s) selected`;
    loadFirst();
  });
  $('v13Q')?.addEventListener('input',e=>$('v13Qv').textContent=e.target.value+'%');
  $('v13W')?.addEventListener('input',()=>{if(first && $('v13Lock').checked){const w=+$('v13W').value;if(w>0)$('v13H').value=Math.round(w*first.height/first.width)}updateQuality()});
  $('v13H')?.addEventListener('input',()=>{if(first && $('v13Lock').checked){const h=+$('v13H').value;if(h>0)$('v13W').value=Math.round(h*first.width/first.height)}updateQuality()});
  $('v13Preset')?.addEventListener('change',e=>{
    const o=e.target.selectedOptions[0]; if(!o.dataset.w)return;
    $('v13W').value=o.dataset.w;$('v13H').value=o.dataset.h;$('v13Dpi').value=o.dataset.dpi;$('v13Kb').value=o.dataset.kb;updateQuality();
  });
  $('v13Reset')?.addEventListener('click',()=>{
    $('v13W').value='';$('v13H').value='';$('v13Dpi').value=300;$('v13Kb').value='';$('v13Fmt').value='image/jpeg';$('v13Q').value=92;$('v13Qv').textContent='92%';
    if(first){$('v13W').value=first.width;$('v13H').value=first.height;updateQuality();}
  });
  function processFile(file,i){
    return new Promise(resolve=>{
      const img=new Image();
      img.onload=()=>{
        let w=+$('v13W').value||img.naturalWidth,h=+$('v13H').value||img.naturalHeight;
        const c=document.createElement('canvas');c.width=w;c.height=h;
        const x=c.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(img,0,0,w,h);
        const mime=$('v13Fmt').value,q=(+$('v13Q').value||92)/100;
        const done=data=>{
          const a=document.createElement('a');a.href=data;a.download=`${$('v13Prefix').value||'Mahendra_MP_Online'}_${String(i+1).padStart(2,'0')}.${mime==='image/png'?'png':mime==='image/webp'?'webp':'jpg'}`;a.click();resolve(data.size);
        };
        c.toBlob(blob=>{if(blob)done(blob)},mime,q);
      };
      img.src=URL.createObjectURL(file);
    });
  }
  $('v13Process')?.addEventListener('click',async()=>{
    if(!files.length){$('v13Status').textContent='पहले image चुनें।';return}
    $('v13Status').textContent='Processing शुरू...';
    let total=0;
    for(let i=0;i<files.length;i++) total+=await processFile(files[i],i);
    $('v13Status').textContent=`✓ ${files.length} file(s) process हुईं। कुल output लगभग ${fmtBytes(total)}.`;
  });
  updateQuality();
})();


/* ===== Trial v16 JavaScript ===== */
(function(){
  const $=id=>document.getElementById(id);
  let files=[],firstImg=null,srcUrl=null;
  const mmPx=(mm,dpi)=>Math.max(1,Math.round(mm*dpi/25.4));
  const kb=n=>(n/1024).toFixed(1)+' KB';
  const blobOf=(c,m,q)=>new Promise(r=>c.toBlob(r,m,q));

  function loadFirst(){
    if(!files.length)return;
    if(srcUrl)URL.revokeObjectURL(srcUrl);
    srcUrl=URL.createObjectURL(files[0]);
    const img=new Image();
    img.onload=()=>{
      firstImg=img;
      $('v16W').value=img.naturalWidth;
      $('v16H').value=img.naturalHeight;
      updatePreview();
    };
    img.src=srcUrl;
  }
  function ratio(){
    const v=$('v16Ratio').value;
    if(v==='35:45')return 35/45;
    if(v==='1:1')return 1;
    if(v==='2:3')return 2/3;
    return null;
  }
  function sourceCrop(img){
    let sw=img.naturalWidth,sh=img.naturalHeight,r=ratio();
    if(!r)return {sx:0,sy:0,sw,sh};
    let cw=sw,ch=Math.round(cw/r);
    if(ch>sh){ch=sh;cw=Math.round(ch*r)}
    return {sx:Math.round((sw-cw)/2),sy:Math.round((sh-ch)/2),sw:cw,sh:ch};
  }
  function render(img,w,h){
    const c=document.createElement('canvas');c.width=w;c.height=h;
    const x=c.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';
    const s=sourceCrop(img);x.drawImage(img,s.sx,s.sy,s.sw,s.sh,0,0,w,h);return c;
  }
  async function compress(c,mime,targetKB){
    if(mime==='image/png'){
      const b=await blobOf(c,mime,1);return {blob:b,quality:1,met:b && b.size<=targetKB*1024};
    }
    const target=targetKB*1024;let lo=.20,hi=1,best=null;
    for(let i=0;i<11;i++){
      const q=(lo+hi)/2,b=await blobOf(c,mime,q);if(!b)break;
      if(b.size<=target){best={blob:b,quality:q,met:true};lo=q}
      else hi=q;
    }
    if(!best){const b=await blobOf(c,mime,lo);best={blob:b,quality:lo,met:b?b.size<=target:false}}
    return best;
  }
  $('v16Files')?.addEventListener('change',e=>{
    files=[...e.target.files];$('v16Queue').textContent=`${files.length} files`;
    loadFirst();
  });
  $('v16Profile')?.addEventListener('change',e=>{
    const v=e.target.value;
    const p={photo:[413,531],signature:[300,100],smallphoto:[600,800],custom:null}[v];
    if(p){$('v16W').value=p[0];$('v16H').value=p[1]}
  });
  $('v16KB')?.addEventListener('input',e=>$('v16TargetStat').textContent=(e.target.value||0)+' KB');
  $('v16Ratio')?.addEventListener('change',updatePreview);
  function updatePreview(){
    if(!firstImg)return;
    const c=render(firstImg,260,Math.max(1,Math.round(260/(ratio()||firstImg.naturalWidth/firstImg.naturalHeight))));
    const p=$('v16Canvas');p.width=c.width;p.height=c.height;p.getContext('2d').drawImage(c,0,0);
  }
  $('v16Process')?.addEventListener('click',async()=>{
    if(!files.length){$('v16Status').textContent='पहले images चुनें।';return}
    const w=+$('v16W').value,h=+$('v16H').value,target=+$('v16KB').value||100,mime=$('v16Fmt').value,prefix=$('v16Prefix').value||'Mahendra_MP_Online';
    let total=0;
    $('v16Progress').firstElementChild.style.width='0%';
    for(let i=0;i<files.length;i++){
      $('v16Status').textContent=`Processing ${i+1}/${files.length}…`;
      const f=files[i],u=URL.createObjectURL(f),img=new Image();
      await new Promise(r=>{img.onload=r;img.onerror=r;img.src=u});
      if(!img.naturalWidth){URL.revokeObjectURL(u);continue}
      const c=render(img,w,h),res=await compress(c,mime,target);
      if(res.blob){
        total+=res.blob.size;
        const ext=mime==='image/png'?'png':mime==='image/webp'?'webp':'jpg';
        const out=URL.createObjectURL(res.blob),a=document.createElement('a');
        a.href=out;a.download=`${prefix}_${String(i+1).padStart(2,'0')}.${ext}`;a.click();
        setTimeout(()=>URL.revokeObjectURL(out),1200);
        $('v16OutputStat').textContent=kb(res.blob.size);
      }
      URL.revokeObjectURL(u);
      $('v16Progress').firstElementChild.style.width=Math.round(((i+1)/files.length)*100)+'%';
    }
    $('v16Status').textContent=`✓ ${files.length} files process हुईं। कुल output ${kb(total)}.`;
  });
  $('v16Reset')?.addEventListener('click',()=>{
    $('v16W').value=413;$('v16H').value=531;$('v16KB').value=100;$('v16Fmt').value='image/jpeg';$('v16Prefix').value='Mahendra_MP_Online';$('v16Status').textContent='';$('v16Progress').firstElementChild.style.width='0%';
  });
  $('v16SheetMake')?.addEventListener('click',async()=>{
    if(!firstImg){$('v16SheetStatus').textContent='पहले image चुनें।';return}
    const dpi=+$('v16SheetDpi').value||300,wmm=+$('v16SheetW').value||35,hmm=+$('v16SheetH').value||45,gmm=+$('v16SheetGap').value||0,copies=Math.max(1,Math.min(100,+$('v16SheetCopies').value||1));
    const is4=$('v16Sheet').value==='4x6',swmm=is4?152.4:210,shmm=is4?101.6:297;
    const sw=mmPx(swmm,dpi),sh=mmPx(shmm,dpi),pw=mmPx(wmm,dpi),ph=mmPx(hmm,dpi),gap=mmPx(gmm,dpi);
    const cols=Math.max(1,Math.floor((sw+gap)/(pw+gap))),rows=Math.max(1,Math.floor((sh+gap)/(ph+gap))),cap=cols*rows;
    const c=document.createElement('canvas');c.width=sw;c.height=sh;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,sw,sh);
    const photo=render(firstImg,pw,ph);
    for(let i=0;i<Math.min(copies,cap);i++){const col=i%cols,row=Math.floor(i/cols);x.drawImage(photo,col*(pw+gap),row*(ph+gap),pw,ph)}
    const b=await blobOf(c,'image/jpeg',.95),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=`Mahendra_MP_Online_${is4?'4x6':'A4'}_Photo_Sheet.jpg`;a.click();setTimeout(()=>URL.revokeObjectURL(u),1500);
    $('v16SheetStatus').textContent=`✓ Sheet तैयार। Capacity ${cap} (${cols} × ${rows}), बनाई गई copies ${Math.min(copies,cap)}.`;
  });
})();

/* Trial v25 — password-protected PDF crop */
(()=>{let doc=null,current=null,pdfjs=null;const $=id=>document.getElementById(id);const st=m=>{const e=$("v25PdfStatus");if(e)e.textContent=m};async function load(){if(pdfjs)return pdfjs;pdfjs=await window.mahendraLoadPdfJs();return pdfjs}async function openPdf(){const f=$("v25PdfFile").files?.[0];if(!f)return st("पहले PDF फ़ाइल चुनें।");st("PDF engine लोड हो रहा है…");try{const lib=await load();const getter=()=>$("v25PdfPassword").value||""; getter.set=v=>$("v25PdfPassword").value=v; doc=await mahendraOpenPdf(lib,new Uint8Array(await f.arrayBuffer()),getter,st,"PDF");$("v25PageNumber").max=doc.numPages;$("v25PageInfo").textContent=`PDF खुल गई। कुल पेज: ${doc.numPages}`;st("PDF सफलतापूर्वक खुल गई।");await render(1)}catch(e){console.error(e);st(e?.name==="PasswordException"?"पासवर्ड गलत है या PDF को पासवर्ड चाहिए। सही पासवर्ड डालें।":"PDF खोलने में समस्या: "+(e?.message||"अज्ञात त्रुटि"))}}async function render(n){if(!doc)return; n=Math.max(1,Math.min(Number(n)||1,doc.numPages));const p=await doc.getPage(n),scale=Number($("v25Scale").value)||2,v=p.getViewport({scale}),c=$("v25PdfCanvas"),ctx=c.getContext("2d",{alpha:false});c.width=Math.ceil(v.width);c.height=Math.ceil(v.height);await p.render({canvasContext:ctx,viewport:v}).promise;current=p;$("v25Empty").style.display="none";$("v25PageInfo").textContent=`पेज ${n} तैयार। आकार: ${c.width} × ${c.height} px`;$("v25X").value=0;$("v25Y").value=0;$("v25W").value=c.width;$("v25H").value=c.height}function crop(type){const c=$("v25PdfCanvas");if(!c.width)return;let x=Math.max(0,Number($("v25X").value)||0),y=Math.max(0,Number($("v25Y").value)||0),w=Math.min(Number($("v25W").value)||c.width,c.width-x),h=Math.min(Number($("v25H").value)||c.height,c.height-y),o=document.createElement("canvas");o.width=w;o.height=h;o.getContext("2d").drawImage(c,x,y,w,h,0,0,w,h);o.toBlob(b=>{const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=`mahendra-${current?.pageNumber||1}-crop.${type==="image/png"?"png":"jpg"}`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1200)},type,type==="image/jpeg" ? 0.95 : undefined)}document.addEventListener("DOMContentLoaded",()=>{$("v25OpenPdf")?.addEventListener("click",openPdf);$("v25RenderPage")?.addEventListener("click",()=>render($("v25PageNumber").value));$("v25CropDownload")?.addEventListener("click",()=>crop("image/jpeg"));$("v25CropPng")?.addEventListener("click",()=>crop("image/png"));$("v25UseFull")?.addEventListener("click",()=>{const c=$("v25PdfCanvas");$("v25X").value=0;$("v25Y").value=0;$("v25W").value=c.width;$("v25H").value=c.height});$("v25ClearPdf")?.addEventListener("click",()=>location.reload())})})();


/* =========================
   Trial v26 — Card Crop Presets
   Works with the rendered v25 PDF canvas.
   ========================= */
(() => {
  const q = id => document.getElementById(id);
  let sourceCanvas = null;

  function getV25Canvas() {
    return document.getElementById('v25PdfCanvas');
  }

  function readSource() {
    const src = getV25Canvas();
    if (!src || !src.width || !src.height || src.width <= 1 || src.height <= 1) return null;
    sourceCanvas = src;
    return src;
  }

  function setValues(x,y,w,h) {
    q('v26X').value = Math.round(x);
    q('v26Y').value = Math.round(y);
    q('v26W').value = Math.round(w);
    q('v26H').value = Math.round(h);
  }

  function clamp() {
    const src = readSource();
    if (!src) return null;
    const W = src.width, H = src.height;
    let x = Math.max(0, Math.min(Number(q('v26X').value)||0, W-1));
    let y = Math.max(0, Math.min(Number(q('v26Y').value)||0, H-1));
    let w = Math.max(1, Math.min(Number(q('v26W').value)||W, W-x));
    let h = Math.max(1, Math.min(Number(q('v26H').value)||H, H-y));
    setValues(x,y,w,h);
    return {x,y,w,h,W,H};
  }

  function drawSourcePreview() {
    const src = readSource();
    if (!src) {
      q('v26PresetStatus').textContent = 'v25 में पहले PDF खोलकर पेज render करें।';
      return false;
    }
    const out = q('v26SourceCanvas');
    const max = 650;
    const scale = Math.min(1, max / src.width);
    out.width = Math.max(1, Math.round(src.width * scale));
    out.height = Math.max(1, Math.round(src.height * scale));
    const ctx = out.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(src, 0, 0, out.width, out.height);
    return true;
  }

  function updateCropPreview() {
    const data = clamp();
    if (!data) return;
    const src = sourceCanvas;
    const out = q('v26CropPreview');
    const max = 650;
    const scale = Math.min(1, max / data.w);
    out.width = Math.max(1, Math.round(data.w * scale));
    out.height = Math.max(1, Math.round(data.h * scale));
    const ctx = out.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(src, data.x, data.y, data.w, data.h, 0, 0, out.width, out.height);
    q('v26ValueStatus').textContent =
      `Crop: X ${data.x}, Y ${data.y}, ${data.w} × ${data.h} px`;
  }

  function applyPreset() {
    if (!drawSourcePreview()) return;
    const src = sourceCanvas;
    const W = src.width, H = src.height;
    const preset = q('v26Preset').value;
    const mode = q('v26Mode').value;

    if (preset === 'a4' || mode === 'fit') {
      setValues(0,0,W,H);
    } else {
      let ratio = 85.6 / 54;
      if (preset === 'photo') ratio = 35 / 45;

      let w = W, h = Math.round(W / ratio);
      if (h > H) {
        h = H;
        w = Math.round(H * ratio);
      }
      const x = Math.round((W-w)/2);
      const y = Math.round((H-h)/2);
      setValues(x,y,w,h);
    }
    updateCropPreview();
    q('v26PresetStatus').textContent = 'Preset लागू हो गया। जरूरत हो तो X/Y/Width/Height बदलें।';
  }

  function fullPage() {
    const src = readSource();
    if (!src) return;
    setValues(0,0,src.width,src.height);
    drawSourcePreview();
    updateCropPreview();
  }

  function download(type) {
    const data = clamp();
    if (!data) return;
    const out = document.createElement('canvas');
    out.width = data.w;
    out.height = data.h;
    const ctx = out.getContext('2d', {alpha:false});
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sourceCanvas, data.x, data.y, data.w, data.h, 0, 0, data.w, data.h);

    const mime = type === 'png' ? 'image/png' : 'image/jpeg';
    const ext = type === 'png' ? 'png' : 'jpg';
    out.toBlob(blob => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `mahendra-card-crop.${ext}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1500);
      q('v26DownloadStatus').textContent =
        `डाउनलोड तैयार: ${data.w} × ${data.h} px (${ext.toUpperCase()})`;
    }, mime, type === 'jpg' ? 0.95 : undefined);
  }

  function printCrop() {
    const data = clamp();
    if (!data) return;
    const out = document.createElement('canvas');
    out.width = data.w; out.height = data.h;
    const ctx = out.getContext('2d', {alpha:false});
    ctx.drawImage(sourceCanvas, data.x,data.y,data.w,data.h,0,0,data.w,data.h);
    const dataUrl = out.toDataURL('image/jpeg',0.95);
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<html><head><title>Mahendra MP Online - Card Print</title>
      <style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh}
      img{max-width:95vw;max-height:95vh}</style></head><body>
      <img src="${dataUrl}" onload="window.print()"></body></html>`);
    win.document.close();
  }

  async function copyValues() {
    const data = clamp();
    if (!data) return;
    const txt = `X=${data.x}, Y=${data.y}, Width=${data.w}, Height=${data.h}`;
    try {
      await navigator.clipboard.writeText(txt);
      q('v26ValueStatus').textContent = 'Crop values कॉपी हो गए।';
    } catch {
      q('v26ValueStatus').textContent = txt;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    q('v26ApplyPreset')?.addEventListener('click', applyPreset);
    q('v26FullPage')?.addEventListener('click', fullPage);
    q('v26ApplyXY')?.addEventListener('click', () => {
      if (drawSourcePreview()) updateCropPreview();
    });
    q('v26CopyValues')?.addEventListener('click', copyValues);
    q('v26DownloadJpg')?.addEventListener('click', () => download('jpg'));
    q('v26DownloadPng')?.addEventListener('click', () => download('png'));
    q('v26PrintCrop')?.addEventListener('click', printCrop);

    ['v26X','v26Y','v26W','v26H'].forEach(id => {
      q(id)?.addEventListener('input', () => {
        if (sourceCanvas || readSource()) updateCropPreview();
      });
    });

    // Keep v26 synchronized after v25 renders a page.
    q('v25RenderPage')?.addEventListener('click', () => {
      setTimeout(() => {
        if (drawSourcePreview()) {
          const src = sourceCanvas;
          setValues(0,0,src.width,src.height);
          updateCropPreview();
        }
      }, 700);
    });
    q('v25OpenPdf')?.addEventListener('click', () => {
      setTimeout(() => {
        if (drawSourcePreview()) {
          const src = sourceCanvas;
          setValues(0,0,src.width,src.height);
          updateCropPreview();
        }
      }, 1000);
    });
  });
})();


/* =========================
   Trial v27 — Driving Licence Center
   Official-source handoff + local crop/convert.
   ========================= */
(() => {
  const q = id => document.getElementById(id);
  let v27SourceCanvas = null;
  let v27PdfDoc = null;
  let v27PdfJs = null;
  let v27SourceType = '';

  async function loadPdfJs() {
    if (v27PdfJs) return v27PdfJs;
    v27PdfJs = await window.mahendraLoadPdfJs();
    
    return v27PdfJs;
  }

  function clampData() {
    const src = v27SourceCanvas;
    if (!src) return null;
    const W=src.width,H=src.height;
    let x=Math.max(0,Math.min(Number(q('v27X').value)||0,W-1));
    let y=Math.max(0,Math.min(Number(q('v27Y').value)||0,H-1));
    let w=Math.max(1,Math.min(Number(q('v27W').value)||W,W-x));
    let h=Math.max(1,Math.min(Number(q('v27H').value)||H,H-y));
    q('v27X').value=Math.round(x); q('v27Y').value=Math.round(y);
    q('v27W').value=Math.round(w); q('v27H').value=Math.round(h);
    return {x,y,w,h};
  }

  function drawCanvasFit(src, dst) {
    const max=650, scale=Math.min(1,max/src.width);
    dst.width=Math.max(1,Math.round(src.width*scale));
    dst.height=Math.max(1,Math.round(src.height*scale));
    const ctx=dst.getContext('2d',{alpha:false});
    ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
    ctx.drawImage(src,0,0,src.width,src.height,0,0,dst.width,dst.height);
  }

  function updateCrop() {
    const d=clampData();
    if(!d || !v27SourceCanvas) return;
    const out=q('v27Crop');
    const scale=Math.min(1,650/d.w);
    out.width=Math.max(1,Math.round(d.w*scale));
    out.height=Math.max(1,Math.round(d.h*scale));
    const ctx=out.getContext('2d',{alpha:false});
    ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
    ctx.drawImage(v27SourceCanvas,d.x,d.y,d.w,d.h,0,0,out.width,out.height);
    q('v27CropStatus').textContent=`Crop: ${d.w} × ${d.h} px`;
  }

  function setFull() {
    if(!v27SourceCanvas) return;
    q('v27X').value=0; q('v27Y').value=0;
    q('v27W').value=v27SourceCanvas.width; q('v27H').value=v27SourceCanvas.height;
    updateCrop();
  }

  function applyPreset() {
    if(!v27SourceCanvas) {
      q('v27CropStatus').textContent='पहले DL PDF/इमेज फ़ाइल खोलें।';
      return;
    }
    const W=v27SourceCanvas.width,H=v27SourceCanvas.height;
    const preset=q('v27Preset').value;
    if(preset==='page') return setFull();
    if(preset==='custom') return updateCrop();
    const ratio=85.6/54;
    let w=W,h=Math.round(W/ratio);
    if(h>H){h=H;w=Math.round(H*ratio);}
    q('v27X').value=Math.round((W-w)/2);
    q('v27Y').value=Math.round((H-h)/2);
    q('v27W').value=w;q('v27H').value=h;
    updateCrop();
  }

  async function loadFile() {
    const f=q('v27DlFile').files?.[0];
    if(!f) return;
    q('v27FileStatus').textContent=`लोड हो रहा है: ${f.name}`;
    try {
      if(f.type==='application/pdf' || /\.pdf$/i.test(f.name)){
        const pdfjs=await loadPdfJs();
        const bytes=new Uint8Array(await f.arrayBuffer());
        const getter=()=>q('v27PdfPassword')?.value||''; getter.set=v=>{if(q('v27PdfPassword'))q('v27PdfPassword').value=v}; v27PdfDoc=await mahendraOpenPdf(pdfjs,bytes,getter,m=>q('v27FileStatus').textContent=m,'DL PDF');
        q('v27Page').max=v27PdfDoc.numPages;
        await renderPdfPage(Number(q('v27Page').value)||1);
        q('v27FileStatus').textContent=`PDF खुल गई — कुल ${v27PdfDoc.numPages} पेज।`;
      } else {
        const bmp=await createImageBitmap(f);
        const c=document.createElement('canvas');
        c.width=bmp.width;c.height=bmp.height;
        c.getContext('2d',{alpha:false}).drawImage(bmp,0,0);
        v27SourceCanvas=c; v27SourceType='image';
        drawCanvasFit(c,q('v27Source')); setFull();
        q('v27FileStatus').textContent=`Image खुल गई — ${c.width} × ${c.height} px`;
      }
    } catch(e) {
      q('v27FileStatus').textContent='फ़ाइल खोलने में समस्या: '+(e?.message||'अज्ञात त्रुटि');
    }
  }

  async function renderPdfPage(pageNo) {
    if(!v27PdfDoc) return;
    pageNo=Math.max(1,Math.min(Number(pageNo)||1,v27PdfDoc.numPages));
    q('v27Page').value=pageNo;
    const page=await v27PdfDoc.getPage(pageNo);
    const scale=Number(q('v27Scale').value)||2;
    const vp=page.getViewport({scale});
    const c=document.createElement('canvas');
    c.width=Math.ceil(vp.width);c.height=Math.ceil(vp.height);
    await page.render({canvasContext:c.getContext('2d',{alpha:false}),viewport:vp}).promise;
    v27SourceCanvas=c; v27SourceType='pdf';
    drawCanvasFit(c,q('v27Source')); setFull();
    q('v27FileStatus').textContent=`PDF पेज ${pageNo} render हो गया — ${c.width} × ${c.height} px`;
  }

  function makeCropCanvas() {
    const d=clampData();
    if(!d) return null;
    const out=document.createElement('canvas');
    out.width=d.w;out.height=d.h;
    const ctx=out.getContext('2d',{alpha:false});
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    ctx.drawImage(v27SourceCanvas,d.x,d.y,d.w,d.h,0,0,d.w,d.h);
    return out;
  }

  function downloadImage(type) {
    const out=makeCropCanvas();
    if(!out) return;
    const mime=type==='png'?'image/png':'image/jpeg';
    const ext=type==='png'?'png':'jpg';
    out.toBlob(blob=>{
      const a=document.createElement('a');a.href=URL.createObjectURL(blob);
      a.download=`mahendra-driving-licence-crop.${ext}`;a.click();
      setTimeout(()=>URL.revokeObjectURL(a.href),1500);
      q('v27CropStatus').textContent=`${ext.toUpperCase()} डाउनलोड तैयार है।`;
    },mime,type==='jpg'?0.95:undefined);
  }

  function downloadPdf() {
    const out=makeCropCanvas();
    if(!out) return;
    // Lightweight single-image PDF generator, compatible with the project's existing image-PDF approach.
    const jpeg=out.toDataURL('image/jpeg',0.95).split(',')[1];
    const bin=atob(jpeg), bytes=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
    const W=out.width,H=out.height;
    const enc=new TextEncoder();
    const chunks=[], offsets=[];
    let pos=0;
    const add=s=>{const b=typeof s==='string'?enc.encode(s):s;chunks.push(b);pos+=b.length;};
    add('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');
    offsets[1]=pos;add('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    offsets[2]=pos;add('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
    offsets[3]=pos;add(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`);
    offsets[4]=pos;add(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${W} /Height ${H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`);add(bytes);add('\nendstream\nendobj\n');
    const stream=`q\n${W} 0 0 ${H} 0 0 cm\n/Im0 Do\nQ\n`;
    offsets[5]=pos;add(`5 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}endstream\nendobj\n`);
    const xref=pos;add('xref\n0 6\n0000000000 65535 f \n');
    for(let i=1;i<=5;i++) add(String(offsets[i]).padStart(10,'0')+' 00000 n \n');
    add(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
    const blob=new Blob(chunks,{type:'application/pdf'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);
    a.download='mahendra-driving-licence-crop.pdf';a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1500);
    q('v27CropStatus').textContent='Crop PDF डाउनलोड तैयार है।';
  }

  function printCrop() {
    const out=makeCropCanvas(); if(!out)return;
    const url=out.toDataURL('image/jpeg',0.95);
    const w=window.open('','_blank'); if(!w)return;
    w.document.write(`<html><head><title>Driving Licence Crop</title><style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh}img{max-width:95vw;max-height:95vh}</style></head><body><img src="${url}" onload="window.print()"></body></html>`);
    w.document.close();
  }

  function openOfficial(url) {
    const dl=(q('v27DlNo').value||'').trim();
    const dob=q('v27Dob').value||'';
    // Keep the identifiers in the local UI only. Official pages decide the actual authentication flow.
    q('v27FileStatus').textContent =
      (dl||dob) ? 'DL विवरण इस browser session में रखा गया है। आधिकारिक पेज पर authentication पूरा करें।' :
      'आधिकारिक साइट खोलें और वहाँ मांगी गई जानकारी भरें।';
    window.open(url,'_blank','noopener,noreferrer');
  }

  function clearAll() {
    q('v27DlNo').value='';q('v27Dob').value='';q('v27DlFile').value='';
    q('v27FileStatus').textContent='अभी कोई DL फ़ाइल नहीं चुनी गई।';
    q('v27CropStatus').textContent='';
    v27SourceCanvas=null;v27PdfDoc=null;
    ['v27Source','v27Crop'].forEach(id=>{const c=q(id);c.width=1;c.height=1;});
  }

  document.addEventListener('DOMContentLoaded',()=>{
    q('v27OfficialBtn')?.addEventListener('click',()=>openOfficial('https://sarathi.parivahan.gov.in/'));
    q('v27DigiBtn')?.addEventListener('click',()=>openOfficial('https://www.digilocker.gov.in/'));
    q('v27LoadFile')?.addEventListener('click',loadFile);
    q('v27Page')?.addEventListener('change',()=>renderPdfPage(q('v27Page').value));
    q('v27ApplyPreset')?.addEventListener('click',applyPreset);
    q('v27FullPage')?.addEventListener('click',setFull);
    ['v27X','v27Y','v27W','v27H'].forEach(id=>q(id)?.addEventListener('input',updateCrop));
    q('v27Jpg')?.addEventListener('click',()=>downloadImage('jpg'));
    q('v27Png')?.addEventListener('click',()=>downloadImage('png'));
    q('v27Pdf')?.addEventListener('click',downloadPdf);
    q('v27Print')?.addEventListener('click',printCrop);
    q('v27Clear')?.addEventListener('click',clearAll);
  });
})();


/* =========================
   Trial v28 — RC Print Center
   Official-source handoff + local RC crop/convert.
   ========================= */
(() => {
  const q = id => document.getElementById(id);
  let sourceCanvas = null;
  let pdfDoc = null;
  let pdfJs = null;

  async function loadPdfJs() {
    if (pdfJs) return pdfJs;
    pdfJs = await window.mahendraLoadPdfJs();
    
    return pdfJs;
  }

  function clampData() {
    if (!sourceCanvas) return null;
    const W=sourceCanvas.width, H=sourceCanvas.height;
    let x=Math.max(0,Math.min(Number(q('v28X').value)||0,W-1));
    let y=Math.max(0,Math.min(Number(q('v28Y').value)||0,H-1));
    let w=Math.max(1,Math.min(Number(q('v28W').value)||W,W-x));
    let h=Math.max(1,Math.min(Number(q('v28H').value)||H,H-y));
    q('v28X').value=Math.round(x); q('v28Y').value=Math.round(y);
    q('v28W').value=Math.round(w); q('v28H').value=Math.round(h);
    return {x,y,w,h};
  }

  function fit(src,dst) {
    const max=650, scale=Math.min(1,max/src.width);
    dst.width=Math.max(1,Math.round(src.width*scale));
    dst.height=Math.max(1,Math.round(src.height*scale));
    const ctx=dst.getContext('2d',{alpha:false});
    ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
    ctx.drawImage(src,0,0,src.width,src.height,0,0,dst.width,dst.height);
  }

  function updateCrop() {
    const d=clampData(); if(!d || !sourceCanvas) return;
    const out=q('v28Crop'); const scale=Math.min(1,650/d.w);
    out.width=Math.max(1,Math.round(d.w*scale));
    out.height=Math.max(1,Math.round(d.h*scale));
    const ctx=out.getContext('2d',{alpha:false});
    ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
    ctx.drawImage(sourceCanvas,d.x,d.y,d.w,d.h,0,0,out.width,out.height);
    q('v28CropStatus').textContent=`Crop: ${d.w} × ${d.h} px`;
  }

  function fullPage() {
    if(!sourceCanvas) return;
    q('v28X').value=0; q('v28Y').value=0;
    q('v28W').value=sourceCanvas.width; q('v28H').value=sourceCanvas.height;
    updateCrop();
  }

  function applyPreset() {
    if(!sourceCanvas){ q('v28CropStatus').textContent='पहले RC फोटो/PDF खोलें।'; return; }
    const W=sourceCanvas.width,H=sourceCanvas.height,p=q('v28Preset').value;
    if(p==='page') return fullPage();
    if(p==='custom') return updateCrop();
    const ratio=85.6/54;
    let w=W,h=Math.round(W/ratio);
    if(h>H){h=H;w=Math.round(H*ratio);}
    q('v28X').value=Math.round((W-w)/2);
    q('v28Y').value=Math.round((H-h)/2);
    q('v28W').value=w; q('v28H').value=h;
    updateCrop();
  }

  async function renderPage(pageNo) {
    if(!pdfDoc) return;
    pageNo=Math.max(1,Math.min(Number(pageNo)||1,pdfDoc.numPages));
    q('v28Page').value=pageNo;
    const page=await pdfDoc.getPage(pageNo);
    const scale=Number(q('v28Scale').value)||2;
    const vp=page.getViewport({scale});
    const c=document.createElement('canvas');
    c.width=Math.ceil(vp.width); c.height=Math.ceil(vp.height);
    await page.render({canvasContext:c.getContext('2d',{alpha:false}),viewport:vp}).promise;
    sourceCanvas=c; fit(c,q('v28Source')); fullPage();
    q('v28FileStatus').textContent=`PDF पेज ${pageNo} render हो गया — ${c.width} × ${c.height} px`;
  }

  async function loadFile() {
    const f=q('v28RcFile').files?.[0]; if(!f) return;
    q('v28FileStatus').textContent=`लोड हो रहा है: ${f.name}`;
    try {
      if(f.type==='application/pdf' || /\.pdf$/i.test(f.name)) {
        const lib=await loadPdfJs();
        const getter=()=>q('v28PdfPassword')?.value||''; getter.set=v=>{if(q('v28PdfPassword'))q('v28PdfPassword').value=v}; pdfDoc=await mahendraOpenPdf(lib,new Uint8Array(await f.arrayBuffer()),getter,m=>q('v28FileStatus').textContent=m,'RC PDF');
        q('v28Page').max=pdfDoc.numPages;
        await renderPage(Number(q('v28Page').value)||1);
        q('v28FileStatus').textContent=`PDF खुल गई — कुल ${pdfDoc.numPages} पेज।`;
      } else {
        const bmp=await createImageBitmap(f);
        const c=document.createElement('canvas'); c.width=bmp.width; c.height=bmp.height;
        c.getContext('2d',{alpha:false}).drawImage(bmp,0,0);
        sourceCanvas=c; pdfDoc=null; fit(c,q('v28Source')); fullPage();
        q('v28FileStatus').textContent=`Image खुल गई — ${c.width} × ${c.height} px`;
      }
    } catch(e) {
      q('v28FileStatus').textContent='RC फ़ाइल खोलने में समस्या: '+(e?.message||'अज्ञात त्रुटि');
    }
  }

  function makeCropCanvas() {
    const d=clampData(); if(!d) return null;
    const out=document.createElement('canvas'); out.width=d.w; out.height=d.h;
    const ctx=out.getContext('2d',{alpha:false});
    ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
    ctx.drawImage(sourceCanvas,d.x,d.y,d.w,d.h,0,0,d.w,d.h);
    return out;
  }

  function downloadImage(type) {
    const out=makeCropCanvas(); if(!out)return;
    const mime=type==='png'?'image/png':'image/jpeg', ext=type==='png'?'png':'jpg';
    out.toBlob(blob=>{
      const url=URL.createObjectURL(blob),a=document.createElement('a'); a.href=url;
      a.download=`mahendra-rc-crop.${ext}`; a.click();
      setTimeout(()=>URL.revokeObjectURL(url),1500);
      q('v28CropStatus').textContent=`${ext.toUpperCase()} डाउनलोड तैयार है।`;
    },mime,type==='jpg'?0.95:undefined);
  }

  function downloadPdf() {
    const out=makeCropCanvas(); if(!out)return;
    const jpeg=out.toDataURL('image/jpeg',0.95).split(',')[1];
    const bin=atob(jpeg), bytes=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
    const W=out.width,H=out.height,enc=new TextEncoder(),chunks=[],offsets=[]; let pos=0;
    const add=s=>{const b=typeof s==='string'?enc.encode(s):s;chunks.push(b);pos+=b.length;};
    add('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');
    offsets[1]=pos;add('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    offsets[2]=pos;add('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
    offsets[3]=pos;add(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`);
    offsets[4]=pos;add(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${W} /Height ${H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`);add(bytes);add('\nendstream\nendobj\n');
    const stream=`q\n${W} 0 0 ${H} 0 0 cm\n/Im0 Do\nQ\n`;
    offsets[5]=pos;add(`5 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}endstream\nendobj\n`);
    const xref=pos;add('xref\n0 6\n0000000000 65535 f \n');
    for(let i=1;i<=5;i++)add(String(offsets[i]).padStart(10,'0')+' 00000 n \n');
    add(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
    const blob=new Blob(chunks,{type:'application/pdf'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='mahendra-rc-crop.pdf';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
    q('v28CropStatus').textContent='PDF डाउनलोड तैयार है।';
  }

  function printCrop() {
    const out=makeCropCanvas(); if(!out)return;
    const url=out.toDataURL('image/jpeg',0.95),w=window.open('','_blank'); if(!w)return;
    w.document.write(`<html><head><title>RC Print</title><style>@page{margin:8mm}body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh}img{max-width:92vw;max-height:92vh}</style></head><body><img src="${url}" onload="window.print()"></body></html>`);
    w.document.close();
    q('v28CropStatus').textContent='Print window तैयार है।';
  }

  function openVahan() {
    const rc=(q('v28RcNo').value||'').trim(),ch=(q('v28Chassis').value||'').trim();
    q('v28FileStatus').textContent=(rc||ch)?'RC विवरण इस browser session में रखा गया है। आधिकारिक VAHAN प्रक्रिया पूरी करें।':'आधिकारिक VAHAN पेज खोलें और वहाँ मांगी गई जानकारी भरें।';
    window.open('https://vahan.parivahan.gov.in/','_blank','noopener,noreferrer');
  }

  function clearAll() {
    ['v28RcNo','v28Chassis','v28RcFile'].forEach(id=>q(id).value='');
    q('v28FileStatus').textContent='अभी कोई RC फ़ाइल नहीं चुनी गई।'; q('v28CropStatus').textContent='';
    sourceCanvas=null;pdfDoc=null;
    ['v28Source','v28Crop'].forEach(id=>{const c=q(id);c.width=1;c.height=1;});
  }

  document.addEventListener('DOMContentLoaded',()=>{
    q('v28VahanBtn')?.addEventListener('click',openVahan);
    q('v28LoadFile')?.addEventListener('click',loadFile);
    q('v28Page')?.addEventListener('change',()=>renderPage(q('v28Page').value));
    q('v28Scale')?.addEventListener('change',()=>pdfDoc&&renderPage(q('v28Page').value));
    q('v28ApplyPreset')?.addEventListener('click',applyPreset);
    q('v28FullPage')?.addEventListener('click',fullPage);
    ['v28X','v28Y','v28W','v28H'].forEach(id=>q(id)?.addEventListener('input',updateCrop));
    q('v28Jpg')?.addEventListener('click',()=>downloadImage('jpg'));
    q('v28Png')?.addEventListener('click',()=>downloadImage('png'));
    q('v28Pdf')?.addEventListener('click',downloadPdf);
    q('v28Print')?.addEventListener('click',printCrop);
    q('v28Clear')?.addEventListener('click',clearAll);
  });
})();
/* Trial v41 — Working Tools Consolidation
   Turns all 40 dashboard tools into functional browser-side workflows.
   PDF operations rasterize pages when manipulating existing PDFs; Office files
   are converted through basic OOXML text extraction + browser print layout.
*/
(function(){
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const mmPx=(mm,dpi)=>Math.max(1,Math.round(Number(mm||0)*Number(dpi||300)/25.4));
  const loadImg=file=>new Promise((res,rej)=>{const u=URL.createObjectURL(file),i=new Image();i.onload=()=>{URL.revokeObjectURL(u);res(i)};i.onerror=e=>{URL.revokeObjectURL(u);rej(e)};i.src=u});
  const blob= (c,type,q)=>new Promise(r=>c.toBlob(r,type,q));
  const dl=(b,name)=>{const u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1500)};
  const imageCanvas=async(file,w,h,mode='cover',bg='#fff')=>{const i=await loadImg(file);const c=document.createElement('canvas');c.width=w||i.naturalWidth;c.height=h||i.naturalHeight;const x=c.getContext('2d',{alpha:false});x.fillStyle=bg;x.fillRect(0,0,c.width,c.height);x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';if(mode==='stretch')x.drawImage(i,0,0,c.width,c.height);else{const s=mode==='contain'?Math.min(c.width/i.naturalWidth,c.height/i.naturalHeight):Math.max(c.width/i.naturalWidth,c.height/i.naturalHeight);const sw=i.naturalWidth*s,sh=i.naturalHeight*s;x.drawImage(i,(c.width-sw)/2,(c.height-sh)/2,sw,sh)}return c};
  const compress=async(c,type,targetKB,q=.94)=>{if(!targetKB)return blob(c,type,type==='image/png'?undefined:q);let lo=.15,hi=.99,best=await blob(c,type,type==='image/png'?undefined:q);if(type==='image/png'){// PNG has no quality control; try JPEG only if user selected a target.
      return best;
    }for(let n=0;n<12;n++){const mid=(lo+hi)/2,b=await blob(c,type,mid);if(b.size/1024<=targetKB){best=b;lo=mid}else hi=mid}return best};
  function mimeExt(m){return m==='image/png'?['png','image/png']:m==='image/webp'?['webp','image/webp']:['jpg','image/jpeg']}
  function cropCanvas(src,x,y,w,h,outW,outH,bg='#fff'){const c=document.createElement('canvas');c.width=Math.max(1,Math.round(outW||w));c.height=Math.max(1,Math.round(outH||h));const x2=c.getContext('2d',{alpha:false});x2.fillStyle=bg;x2.fillRect(0,0,c.width,c.height);x2.imageSmoothingEnabled=true;x2.imageSmoothingQuality='high';x2.drawImage(src,x,y,w,h,0,0,c.width,c.height);return c}
  function openPrintCanvas(c,title='Mahendra MP Online',physicalWmm=null,physicalHmm=null){const u=c.toDataURL('image/jpeg',.98),w=window.open('','_blank');if(!w){alert('Print Preview के लिए pop-up अनुमति दें।');return}const size=physicalWmm&&physicalHmm?`width:${physicalWmm}mm;height:${physicalHmm}mm;`:'max-width:190mm;max-height:277mm;';w.document.write(`<!doctype html><html><head><title>${esc(title)}</title><style>@page{size:A4;margin:0}html,body{margin:0;background:#fff}body{display:flex;justify-content:center;align-items:flex-start;padding:10mm}img{display:block;${size}object-fit:contain}</style></head><body><img src="${u}" onload="setTimeout(()=>window.print(),300)"></body></html>`);w.document.close()}
  function buildPdfFromCanvases(canvases,pageW=595.28,pageH=841.89){
    const enc=new TextEncoder(),objs=[];const catalog=1,pages=2;let pageRefs=[],idx=3;
    const addObj=o=>{objs.push(o);return objs.length};
    for(const c of canvases){const jpg=c.toDataURL('image/jpeg',.97).split(',')[1],bin=atob(jpg),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);const io=addObj({img:bytes,w:c.width,h:c.height});const scale=Math.min((pageW-24)/c.width,(pageH-24)/c.height),w=c.width*scale,h=c.height*scale,x=(pageW-w)/2,y=(pageH-h)/2;const co=addObj({content:`q\n${w.toFixed(3)} 0 0 ${h.toFixed(3)} ${x.toFixed(3)} ${y.toFixed(3)} cm\n/Im1 Do\nQ`});const po=addObj({page:pageW===612?'LETTER':'A4',w:pageW,h:pageH,imgRef:io,contentRef:co});pageRefs.push(po)}
    let out='%PDF-1.4\n%\xFF\xFF\xFF\xFF\n',offs=[0];const put=s=>{out+=s};
    const render=(n,o)=>{offs[n]=out.length;if(o.img){put(`${n} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${o.w} /Height ${o.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${o.img.length} >>\nstream\n`);out+=String.fromCharCode(...o.img);put('\nendstream\nendobj\n')}else if(o.content){put(`${n} 0 obj\n<< /Length ${o.content.length} >>\nstream\n${o.content}\nendstream\nendobj\n`)}else{put(`${n} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${o.w} ${o.h}] /Resources << /XObject << /Im1 ${o.imgRef} 0 R >> >> /Contents ${o.contentRef} 0 R >>\nendobj\n`)}};
    for(let n=1;n<=objs.length;n++)render(n,objs[n-1]);
    const pageKids=pageRefs.map(n=>`${n} 0 R`).join(' ');offs[pages]=out.length;put(`2 0 obj\n<< /Type /Pages /Kids [${pageKids}] /Count ${pageRefs.length} >>\nendobj\n`);offs[catalog]=out.length;put(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);
    // Reorder objects is not required for PDF readers if xref points to actual offsets.
    const xref=out.length;put(`xref\n0 ${objs.length+1}\n0000000000 65535 f \n`);for(let n=1;n<=objs.length;n++)put(String(offs[n]||0).padStart(10,'0')+' 00000 n \n');put(`trailer\n<< /Size ${objs.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
    return new Uint8Array([...out].map(ch=>ch.charCodeAt(0)&255));
  }
  // Correct object ordering builder (catalog/pages must be before page refs, but xref can point forward).
  function makeImagePdf(canvases,pageW=595.28,pageH=841.89){
    let pdf='%PDF-1.4\n%\xFF\xFF\xFF\xFF\n',offsets=[0],objects=[];
    const add=s=>{objects.push(s);return objects.length};
    const cat=add(''),pages=add(''),kids=[];
    for(const c of canvases){const data=c.toDataURL('image/jpeg',.97).split(',')[1],bin=atob(data),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);const im=add({bytes,w:c.width,h:c.height});const scale=Math.min((pageW-24)/c.width,(pageH-24)/c.height),w=c.width*scale,h=c.height*scale,x=(pageW-w)/2,y=(pageH-h)/2;const stream=`q\n${w.toFixed(3)} 0 0 ${h.toFixed(3)} ${x.toFixed(3)} ${y.toFixed(3)} cm\n/Im1 Do\nQ`;const co=add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);kids.push(add(`<< /Type /Page /Parent ${pages} 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im1 ${im} 0 R >> >> /Contents ${co} 0 R >>`))}
    objects[cat-1]=`<< /Type /Catalog /Pages ${pages} 0 R >>`;objects[pages-1]=`<< /Type /Pages /Kids [${kids.map(n=>n+' 0 R').join(' ')}] /Count ${kids.length} >>`;
    for(let n=1;n<=objects.length;n++){offsets[n]=pdf.length;const o=objects[n-1];if(o&&o.bytes){pdf+=`${n} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${o.w} /Height ${o.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${o.bytes.length} >>\nstream\n`;for(let k=0;k<o.bytes.length;k+=0x8000) pdf+=String.fromCharCode(...o.bytes.subarray(k,k+0x8000));pdf+='\nendstream\nendobj\n'}else pdf+=`${n} 0 obj\n${o}\nendobj\n`}
    const xref=pdf.length;pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;for(let n=1;n<=objects.length;n++)pdf+=String(offsets[n]).padStart(10,'0')+' 00000 n \n';pdf+=`trailer\n<< /Size ${objects.length+1} /Root ${cat} 0 R >>\nstartxref\n${xref}\n%%EOF`;const outBytes=new Uint8Array(pdf.length);for(let i=0;i<pdf.length;i++)outBytes[i]=pdf.charCodeAt(i)&255;return outBytes;
  }
  let pdfjsPromise=null;
  async function getPdfJs(){if(pdfjsPromise)return pdfjsPromise;pdfjsPromise=window.mahendraLoadPdfJs().then(lib=>{return lib});return pdfjsPromise}
  async function openPdfFile(file,password,onStatus){const lib=await getPdfJs(),task=lib.getDocument({data:new Uint8Array(await file.arrayBuffer()),password:password||undefined});task.onPassword=(update,reason)=>{const wrong=(reason===2);const p=(prompt(wrong?'Password गलत है। सही original password दोबारा दर्ज करें:':'यह PDF password protected है। सही original password दर्ज करें:')||'').trim();if(p)update(p);else{onStatus&&onStatus('🔐 Password नहीं दिया गया।');task.destroy().catch(()=>{})}};const doc=await task.promise;onStatus&&onStatus(`PDF खुल गई • ${doc.numPages} pages`);return doc}
  async function renderPdfPage(doc,n,scale=2){const p=await doc.getPage(n),v=p.getViewport({scale}),c=document.createElement('canvas');c.width=Math.ceil(v.width);c.height=Math.ceil(v.height);await p.render({canvasContext:c.getContext('2d',{alpha:false}),viewport:v}).promise;return c}

  function commonPanel(t){
    const n=t[2], isExam=t[0]==='exam', isPhoto=['Passport Photo Maker','Photo Crop','Photo Resize','Photo Compress','Signature Resize','Signature Compress','DPI Change','Canvas / Background Size','Multiple Passport Photos','A4 Photo Sheet','4×6 Photo Sheet','Image Format Converter','Pixel ↔ CM/MM/Inch','Target KB Compressor','Custom Print Layout'].includes(n);
    const pdf=n.includes('PDF')||t[0]==='pdf';
    return `<div class="v41-wrap"><div class="v41-head"><div><h2>${t[1]} ${esc(n)}</h2><p>${esc(t[3])}</p></div><span class="v35-local">🔒 स्थानीय प्रोसेसिंग</span></div>
      <div class="v41-box"><label>फ़ाइल / फोटो <input id="v41Files" type="file" ${pdf?'accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"':'accept="image/*"'} ${n.includes('Multiple')||n.includes('Sheet')||n.includes('Merge')||n.includes('Images')?'multiple':''}></label>
      ${pdf&&['PDF → JPG','PDF → PNG','Merge PDF','Split PDF','Compress PDF'].includes(n)?'<label>PDF Password (यदि आवश्यक) <input id="v41Password" type="password" placeholder="सही original password"></label>':''}
      <div class="v41-controls">
        <label>Width (px)<input id="v41W" type="number" value="${isExam?'413':'0'}" min="1"></label>
        <label>Height (px)<input id="v41H" type="number" value="${isExam?'531':'0'}" min="1"></label>
        <label>DPI<input id="v41Dpi" type="number" value="300" min="72"></label>
        <label>Target KB<input id="v41KB" type="number" placeholder="वैकल्पिक" min="1"></label>
        <label>Format<select id="v41Fmt"><option value="image/jpeg">JPG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option></select></label>
      </div>
      ${isExam?'<div class="v41-controls"><label>Preset<select id="v41Preset"><option value="413,531,200">Passport Example — 413×531 / 200KB</option><option value="300,100,100">Signature Example — 300×100 / 100KB</option><option value="200,230,100">General Example — 200×230 / 100KB</option></select></label></div>':''}
      ${['Photo Crop','Custom Print Layout'].includes(n)?'<div class="v41-controls"><label>X<input id="v41X" type="number" value="0"></label><label>Y<input id="v41Y" type="number" value="0"></label><label>Crop Width<input id="v41CW" type="number" value="0"></label><label>Crop Height<input id="v41CH" type="number" value="0"></label></div>':''}
      ${['Passport Photo Maker','Multiple Passport Photos','A4 Photo Sheet','4×6 Photo Sheet','Custom Print Layout'].includes(n)?'<div class="v41-controls"><label>Photo Width (mm)<input id="v41Wmm" type="number" value="35" step="0.1"></label><label>Photo Height (mm)<input id="v41Hmm" type="number" value="45" step="0.1"></label><label>Copies<input id="v41Copies" type="number" value="8" min="1" max="100"></label><label>Gap (mm)<input id="v41Gap" type="number" value="3" min="0"></label><label>Sheet<select id="v41Sheet"><option>A4</option><option>4x6</option></select></label><label>काला Border<select id="v41Border"><option value="1">हाँ — काला border</option><option value="0">नहीं</option></select></label><label>Border मोटाई (mm)<input id="v41BorderMm" type="number" value="0.4" step="0.1" min="0.1"></label></div>':''}
      ${n==='Canvas / Background Size'?'<div class="v41-controls"><label>Background<select id="v41Bg"><option value="#ffffff">White</option><option value="#f5f5f5">Light Gray</option><option value="#000000">Black</option></select></label><label>Canvas Width<input id="v41CW2" type="number" placeholder="same as image"></label><label>Canvas Height<input id="v41CH2" type="number" placeholder="same as image"></label></div>':''}
      ${n==='Pixel ↔ CM/MM/Inch'?'<div class="v41-controls"><label>Value<input id="v41UnitVal" type="number" value="35"></label><label>Unit<select id="v41Unit"><option>mm</option><option>cm</option><option>inch</option><option>px</option></select></label></div>':''}
      ${n==='Word → PDF'||n==='Excel → PDF'||n==='PowerPoint → PDF'?'<p class="note">Office file को ब्राउज़र में पढ़कर print-ready PDF layout बनाया जाएगा। मूल complex formatting 100% preserve नहीं होगी।</p>':''}
      <div class="v41-actions"><button class="primary-btn" id="v41Run">▶ Process</button><button class="secondary-btn" id="v41Reset">साफ़ करें</button></div><div id="v41Status" class="v41-status">फ़ाइल चुनें और Process दबाएँ।</div><div id="v41Result" class="v41-result"></div></div></div>`;
  }

  async function runImageTool(name,files){
    const f=files[0],dpi=Number($('v41Dpi').value)||300,fmt=$('v41Fmt').value,kb=Number($('v41KB').value)||0;
    if(!f||!f.type.startsWith('image/'))throw Error('कृपया image file चुनें।');
    const img=await loadImg(f),ow=img.naturalWidth,oh=img.naturalHeight;
    if(name==='Photo Resize'||name==='Signature Resize'||name==='Exam Photo Resize'||name==='Exam Signature Resize'||name==='Exam Photo + DPI'||name==='Custom Exam Requirement'){
      const w=Number($('v41W').value)||ow,h=Number($('v41H').value)||Math.round(oh*w/ow);const c=await imageCanvas(f,w,h,'cover');const b=await compress(c,fmt,kb,.94);return {c,b,name:`${safeName(f.name)}_HQ.${mimeExt(fmt)[0]}`,note:`${w}×${h}px • ${Math.round(b.size/1024)} KB • ${dpi} DPI target`};
    }
    if(name==='Photo Crop'){
      const x=Math.max(0,Number($('v41X').value)||0),y=Math.max(0,Number($('v41Y').value)||0),cw=Number($('v41CW').value)||ow-x,ch=Number($('v41CH').value)||oh-y;const c=cropCanvas(img,x,y,Math.min(cw,ow-x),Math.min(ch,oh-y),Math.min(cw,ow-x),Math.min(ch,oh-y));const b=await compress(c,fmt,kb,.96);return {c,b,name:`${safeName(f.name)}_crop.${mimeExt(fmt)[0]}`,note:`Crop ${c.width}×${c.height}px`};
    }
    if(name==='Photo Compress'||name==='Signature Compress'||name==='Target KB Compressor'){const c=await imageCanvas(f,ow,oh,'stretch');const b=await compress(c,'image/jpeg',kb||100,.94);return {c,b,name:`${safeName(f.name)}_compressed.jpg`,note:`${ow}×${oh}px • ${Math.round(b.size/1024)} KB`};}
    if(name==='Image Format Converter'){const c=await imageCanvas(f,ow,oh,'stretch');const b=await blob(c,fmt,fmt==='image/png'?undefined:.96);return {c,b,name:`${safeName(f.name)}.${mimeExt(fmt)[0]}`,note:`Converted to ${mimeExt(fmt)[0].toUpperCase()}`};}
    if(name==='DPI Change'){const c=await imageCanvas(f,ow,oh,'stretch');const b=await blob(c,fmt,.96);return {c,b,name:`${safeName(f.name)}_${dpi}dpi.${mimeExt(fmt)[0]}`,note:`Output pixels remain ${ow}×${oh}; DPI field is a print target, not a quality enhancer.`};}
    if(name==='Canvas / Background Size'){const w=Number($('v41CW2').value)||ow,h=Number($('v41CH2').value)||oh,c=await imageCanvas(f,w,h,'contain',$('v41Bg').value);const b=await blob(c,fmt,.96);return {c,b,name:`${safeName(f.name)}_canvas.${mimeExt(fmt)[0]}`,note:`Canvas ${w}×${h}px`};}
    if(name==='Pixel ↔ CM/MM/Inch'){const v=Number($('v41UnitVal').value)||0,u=$('v41Unit').value,px=u==='px'?v:u==='mm'?mmPx(v,dpi):u==='cm'?mmPx(v*10,dpi):mmPx(v*25.4,dpi);const el=$('v41Result');el.innerHTML=`<div class="v41-card"><b>${v} ${esc(u)}</b><br>${Math.round(px)} px @ ${dpi} DPI<br>${(px/dpi*25.4).toFixed(2)} mm • ${(px/dpi).toFixed(2)} inch</div>`;return null;}
    if(name==='Passport Photo Maker'||name==='Multiple Passport Photos'||name==='A4 Photo Sheet'||name==='4×6 Photo Sheet'||name==='Custom Print Layout'){
      const pw=mmPx(Number($('v41Wmm').value)||35,dpi),ph=mmPx(Number($('v41Hmm').value)||45,dpi),copies=Math.min(100,Math.max(1,Number($('v41Copies').value)||8)),gap=mmPx(Number($('v41Gap').value)||3,dpi),sheet=$('v41Sheet')?.value||'A4',sw=sheet==='4x6'?mmPx(152.4,dpi):mmPx(210,dpi),sh=sheet==='4x6'?mmPx(101.6,dpi):mmPx(297,dpi);const c=document.createElement('canvas');c.width=sw;c.height=sh;const x=c.getContext('2d',{alpha:false});x.fillStyle='#fff';x.fillRect(0,0,sw,sh);let px=gap,py=gap,count=0;const bord=$('v41Border')?.value!=='0',bpx=Math.max(1,Math.round(mmPx(Number($('v41BorderMm')?.value)||0.4,dpi)));const im=await loadImg(f),s=Math.max(pw/im.naturalWidth,ph/im.naturalHeight),iw=im.naturalWidth*s,ih=im.naturalHeight*s;while(count<copies&&py+ph<=sh-gap){if(px+pw>sw-gap){px=gap;py+=ph+gap}if(py+ph>sh-gap)break;x.save();x.beginPath();x.rect(px,py,pw,ph);x.clip();x.drawImage(im,px+(pw-iw)/2,py+(ph-ih)/2,iw,ih);x.restore();if(bord){x.save();x.strokeStyle='#000';x.lineWidth=bpx;x.strokeRect(px+bpx/2,py+bpx/2,pw-bpx,ph-bpx);x.restore()}px+=pw+gap;count++}const b=await blob(c,'image/jpeg',.98);return {c,b,name:`${safeName(f.name)}_${sheet}_Photo_Sheet.jpg`,note:`${count} photos • ${sheet} • ${pw}×${ph}px per photo at ${dpi} DPI`};
    }
    return {c:await imageCanvas(f,Number($('v41W').value)||ow,Number($('v41H').value)||oh,'cover'),b:null,name:`${safeName(f.name)}_HQ.jpg`,note:'Processed'};
  }

  async function officeText(file){
    const ab=await file.arrayBuffer(),u8=new Uint8Array(ab);if(!file.name.match(/\.(docx|xlsx|pptx)$/i))return await file.text();
    // Minimal ZIP reader: EOCD + central directory + stored/deflate entries using DecompressionStream.
    const dv=new DataView(ab);let eocd=-1;for(let i=u8.length-22;i>=Math.max(0,u8.length-66000);i--){if(dv.getUint32(i,true)===0x06054b50){eocd=i;break}}if(eocd<0)throw Error('Office ZIP container नहीं पढ़ा जा सका।');const cdSize=dv.getUint32(eocd+12,true),cdOff=dv.getUint32(eocd+16,true);let p=cdOff;const entries={};while(p<cdOff+cdSize){if(dv.getUint32(p,true)!==0x02014b50)break;const method=dv.getUint16(p+10,true),cs=dv.getUint32(p+20,true),nameLen=dv.getUint16(p+28,true),extraLen=dv.getUint16(p+30,true),commentLen=dv.getUint16(p+32,true),lho=dv.getUint32(p+42,true),name=new TextDecoder().decode(u8.slice(p+46,p+46+nameLen));const l=new DataView(ab);const ln=l.getUint16(lho+26,true),le=l.getUint16(lho+28,true),data=u8.slice(lho+30+ln+le,lho+30+ln+le+cs);entries[name]={method,data};p+=46+nameLen+extraLen+commentLen}
    async function read(name){const e=entries[name];if(!e)return '';if(e.method===0)return new TextDecoder().decode(e.data);if(e.method===8){const ds=new DecompressionStream('deflate-raw'),out=await new Response(new Blob([e.data]).stream().pipeThrough(ds)).arrayBuffer();return new TextDecoder().decode(out)}throw Error('Unsupported ZIP compression');}
    let xml='';if(/\.docx$/i.test(file.name))xml=await read('word/document.xml');else if(/\.pptx$/i.test(file.name)){const names=Object.keys(entries).filter(k=>/^ppt\/slides\/slide\d+\.xml$/i.test(k)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));xml=names.map(async n=>await read(n));xml=(await Promise.all(xml)).join('\n')}else{const ss=await read('xl/sharedStrings.xml');const strings=[...ss.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(m=>m[1]);const names=Object.keys(entries).filter(k=>/^xl\/worksheets\/sheet\d+\.xml$/i.test(k)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));let arr=[];for(const n of names){const sx=await read(n);arr.push(sx.replace(/<c[^>]*t="s"[^>]*>\s*<v>(\d+)<\/v>[\s\S]*?<\/c>/g,(_,i)=>`<v>${esc(strings[Number(i)]||'')}</v>`));}xml=arr.join('\n')}
    return xml.replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim();
  }

  async function runPdfTool(name,files){
    if(name==='JPG → PDF'||name==='PNG → PDF'||name==='Images → PDF'){const cs=[];for(const f of files){if(f.type.startsWith('image/'))cs.push(await imageCanvas(f,0,0,'stretch'))}if(!cs.length)throw Error('JPG/PNG images चुनें।');const bytes=makeImagePdf(cs);return {blob:new Blob([bytes],{type:'application/pdf'}),name:'Mahendra_MP_Online_HQ.pdf',note:`${cs.length} image page(s) से PDF तैयार`};}
    if(name==='Word → PDF'||name==='Excel → PDF'||name==='PowerPoint → PDF'){const f=files[0];if(!f)throw Error('Office file चुनें।');const text=await officeText(f);const w=window.open('','_blank');if(!w)throw Error('Pop-up अनुमति दें।');const title=esc(f.name);w.document.write(`<!doctype html><html><head><title>${title}</title><style>@page{size:A4;margin:14mm}body{font-family:Arial,sans-serif;font-size:12pt;line-height:1.5;white-space:pre-wrap}h1{font-size:18pt}</style></head><body><h1>${title}</h1><div>${esc(text)}</div><script>setTimeout(()=>window.print(),500)<\/script></body></html>`);w.document.close();return {note:'Print dialog खुला है। “Save as PDF” चुनकर PDF बनाएं।',noBlob:true};}
    const f=files[0];if(!f||f.type!=='application/pdf')throw Error('PDF file चुनें।');const doc=await openPdfFile(f,$('v41Password')?.value||'',m=>{$('v41Status').textContent=m});const count=doc.numPages;let nums=[];if(name==='PDF → JPG'||name==='PDF → PNG'||name==='Compress PDF')nums=[...Array(count)].map((_,i)=>i+1);else if(name==='Split PDF'){const s=prompt(`कौन से pages निकालने हैं? उदाहरण: 1,3,5 या 1-4`, '1');if(!s)throw Error('Page selection रद्द किया गया।');const set=new Set();s.split(',').forEach(part=>{const z=part.trim().split('-').map(Number);if(z.length===1&&z[0])set.add(z[0]);else if(z.length===2)for(let i=Math.min(z[0],z[1]);i<=Math.max(z[0],z[1]);i++)set.add(i)});nums=[...set].filter(n=>n>=1&&n<=count)}else if(name==='Merge PDF'){for(const f2 of files){const d=await openPdfFile(f2,$('v41Password')?.value||'',m=>{$('v41Status').textContent=m});for(let i=1;i<=d.numPages;i++){const c=await renderPdfPage(d,i,1.5);nums.push({c})}}const cs=nums.map(x=>x.c),bytes=makeImagePdf(cs);return {blob:new Blob([bytes],{type:'application/pdf'}),name:'Mahendra_MP_Merged_Rasterized.pdf',note:`${cs.length} pages merge किए गए। Existing PDFs को image-based PDF में rebuild किया गया है।`};}
    const cs=[];for(const n of nums){const c=await renderPdfPage(doc,n,name==='Compress PDF'?1.2:2);if(name==='PDF → JPG'||name==='PDF → PNG'){const mime=name==='PDF → PNG'?'image/png':'image/jpeg';const b=await blob(c,mime,mime==='image/jpeg'?.95:undefined);dl(b,`Mahendra_Page_${n}.${mime==='image/png'?'png':'jpg'}`)}else cs.push(c)}
    if(name==='PDF → JPG'||name==='PDF → PNG')return {note:`${nums.length} PDF page(s) image में download किए गए।`,noBlob:true};
    if(name==='Compress PDF'){const bytes=makeImagePdf(cs);return {blob:new Blob([bytes],{type:'application/pdf'}),name:'Mahendra_MP_Compressed_Rasterized.pdf',note:`${count} pages को lower-scale image PDF में rebuild किया गया।`};}
    if(name==='Split PDF'){for(let i=0;i<cs.length;i++){const bytes=makeImagePdf([cs[i]]);dl(new Blob([bytes],{type:'application/pdf'}),`Mahendra_Page_${nums[i]}.pdf`)}return {note:`${cs.length} selected page PDF files download किए गए।`,noBlob:true};}
    return {note:'Done',noBlob:true};
  }

  async function runV41(t){
    const n=t[2],files=[...($('v41Files')?.files||[])];$('v41Status').textContent='Processing…';$('v41Result').innerHTML='';
    try{
      if(n==='Pixel ↔ CM/MM/Inch'){await runImageTool(n,files);$('v41Status').textContent='✅ Conversion तैयार है।';return}
      if(t[0]==='pdf'){const r=await runPdfTool(n,files);if(r.blob)dl(r.blob,r.name);$('v41Status').textContent='✅ '+r.note; if(r.blob)$('v41Result').innerHTML=`<div class="v41-card">${esc(r.note)}<br><b>${esc(r.name)}</b></div>`;return}
      if(!files.length)throw Error('पहले file चुनें।');
      if(n==='Photo Resize'||n==='Signature Resize'||n==='Exam Photo Resize'||n==='Exam Signature Resize'||n==='Exam Photo + DPI'||n==='Custom Exam Requirement'){const p=$('v41Preset');if(p&&p.value){const [w,h,k]=p.value.split(',').map(Number);$('v41W').value=w;$('v41H').value=h;$('v41KB').value=k}}
      const r=await runImageTool(n,files);if(!r)return;if(r.b)dl(r.b,r.name);$('v41Status').textContent='✅ '+r.note;$('v41Result').innerHTML=`<div class="v41-preview"><img src="${URL.createObjectURL(r.b||r.c.toDataURL?await blob(r.c,'image/jpeg',.96):new Blob())}" alt="preview"></div><div class="v41-card">${esc(r.note)}<br><a class="primary linkbtn" href="${URL.createObjectURL(r.b)}" download="${esc(r.name)}">⬇️ फिर से Download</a><button class="secondary-btn" id="v41Print">🖨️ Print Preview</button></div>`;$('v41Print')?.addEventListener('click',()=>openPrintCanvas(r.c,n));
    }catch(e){console.error(e);$('v41Status').textContent='❌ '+(e?.message||'Processing में समस्या हुई।')}
  }

  function openV41(t){
    if(t[0]==='document'){
      
      
      openCardPrintTool(t);return;
    }
    $('toolContent').innerHTML=commonPanel(t);$('modal').classList.remove('hidden');
    $('v41Run').onclick=()=>runV41(t);$('v41Reset').onclick=()=>{$('v41Files').value='';$('v41Result').innerHTML='';$('v41Status').textContent='साफ़ कर दिया गया।'};
    $('v41Preset')?.addEventListener('change',()=>{const [w,h,k]=$('v41Preset').value.split(',');$('v41W').value=w;$('v41H').value=h;$('v41KB').value=k});
  }
  openToolData=openV41;
})();


/* ---- Esc se modal band ---- */
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){var m=document.getElementById('modal');if(m&&!m.classList.contains('hidden'))m.classList.add('hidden');}
});
(function(){var b=document.getElementById('toTop');if(!b)return;
  window.addEventListener('scroll',function(){b.hidden=window.scrollY<900},{passive:true});
  b.addEventListener('click',function(){window.scrollTo({top:0,behavior:'smooth'})});})();
var _yr=document.getElementById('yr'); if(_yr) _yr.textContent=new Date().getFullYear();
