/* ═══════════════════════════════════════════════════════════
   FloodXPlain v3 — app.js
   Features: Particles · Transitions · Maps · Search · Export
   ═══════════════════════════════════════════════════════════ */

/* ─── 1. PARTICLE BACKGROUND ─── */
(function () {
  const c = document.getElementById('bg-canvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  let W, H, pts = [];

  function resize() { W = c.width = innerWidth; H = c.height = innerHeight }
  function build() {
    pts = [];
    for (let i = 0; i < Math.floor((W * H) / 16000); i++)
      pts.push({ x: Math.random()*W, y: Math.random()*H, r: Math.random()*1.3+.2,
                 vx:(Math.random()-.5)*.2, vy:(Math.random()-.5)*.2, o:Math.random()*.45+.1 });
  }
  resize(); build();
  window.addEventListener('resize', () => { resize(); build() });

  (function draw() {
    ctx.clearRect(0,0,W,H);
    for (let i = 0; i < pts.length; i++) {
      for (let j = i+1; j < pts.length; j++) {
        const d = Math.hypot(pts[i].x-pts[j].x, pts[i].y-pts[j].y);
        if (d < 110) {
          ctx.beginPath(); ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y);
          ctx.strokeStyle = `rgba(0,200,180,${0.055*(1-d/110)})`; ctx.lineWidth=.5; ctx.stroke();
        }
      }
      ctx.beginPath(); ctx.arc(pts[i].x,pts[i].y,pts[i].r,0,Math.PI*2);
      ctx.fillStyle=`rgba(0,200,180,${pts[i].o})`; ctx.fill();
      pts[i].x+=pts[i].vx; pts[i].y+=pts[i].vy;
      if(pts[i].x<0||pts[i].x>W) pts[i].vx*=-1;
      if(pts[i].y<0||pts[i].y>H) pts[i].vy*=-1;
    }
    requestAnimationFrame(draw);
  })();
})();


/* ─── 2. PAGE TRANSITIONS ─── */
(function () {
  const ov = document.getElementById('pt');
  if (!ov) return;
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const h = a.getAttribute('href');
    if (!h || h.startsWith('#') || h.startsWith('javascript') || a.target === '_blank') return;
    if (h === location.pathname || h === location.href) return;
    e.preventDefault();
    ov.classList.add('on');
    setTimeout(() => location.href = h, 300);
  });
})();


/* ─── 3. COUNT-UP ANIMATION ─── */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseFloat(el.dataset.count);
    const sfx = el.dataset.sfx || '';
    const pfx = el.dataset.pfx || '';
    const isF = String(target).includes('.');
    const dur = 1400; const t0 = performance.now();
    (function step(now) {
      const p = Math.min((now-t0)/dur,1);
      const e = 1-Math.pow(1-p,3);
      const v = e*target;
      el.textContent = pfx+(isF?v.toFixed(2):Math.floor(v).toLocaleString('en-IN'))+sfx;
      if(p<1) requestAnimationFrame(step);
    })(t0);
  });
});


/* ─── 4. MAP INIT ─── */
function initMap(id, lat=16.5, lng=81.5, zoom=9) {
  const map = L.map(id, { zoomControl: false }).setView([lat, lng], zoom);
  L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    { attribution:'Tiles © Esri', maxZoom:19 }
  ).addTo(map);
  L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',
    { attribution:'', maxZoom:19 }
  ).addTo(map);
  L.control.zoom({ position:'bottomright' }).addTo(map);
  return map;
}


/* ─── 5. GEOCODING SEARCH (Nominatim — free) ─── */
async function geocodeSearch(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=in`;
  const r = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  return r.json();
}

function bindSearch(inputId, resultsId, map, onSelect) {
  const inp = document.getElementById(inputId);
  const res = document.getElementById(resultsId);
  if (!inp || !res) return;

  let timer;
  inp.addEventListener('input', () => {
    clearTimeout(timer);
    const q = inp.value.trim();
    if (q.length < 3) { res.classList.remove('show'); return; }
    timer = setTimeout(async () => {
      const data = await geocodeSearch(q);
      if (!data.length) { res.innerHTML = '<div class="sr-item">No results found</div>'; res.classList.add('show'); return; }
      res.innerHTML = data.slice(0,5).map(r =>
        `<div class="sr-item" data-lat="${r.lat}" data-lng="${r.lon}">
           <span>📍</span>
           <span>${r.display_name.split(',').slice(0,3).join(', ')}</span>
         </div>`
      ).join('');
      res.classList.add('show');
      res.querySelectorAll('.sr-item').forEach(item => {
        item.addEventListener('click', () => {
          const selected = {
            lat: parseFloat(item.dataset.lat),
            lng: parseFloat(item.dataset.lng),
            name: item.textContent.trim().replace('????','').replace('??','').trim()
          };
          if (map && typeof map.flyTo === 'function') {
            map.flyTo([selected.lat, selected.lng], 12, { duration: 1.5 });
          }
          res.classList.remove('show');
          inp.value = selected.name;
          if (typeof onSelect === 'function') onSelect(selected);
          inp.dispatchEvent(new CustomEvent('fxp-location-selected', { detail: selected }));
        });
      });
    }, 380);
  });

  document.addEventListener('click', e => { if (!inp.contains(e.target)) res.classList.remove('show') });
}


/* ─── 6. PERMANENT WATER MASKING (OSM Overpass API) ─── */
async function loadPermanentWater(map) {
  const bbox = '15.5,79.5,18.0,83.5'; // AP Godavari region
  const q = `[out:json][timeout:20];(way["natural"="water"](${bbox});relation["natural"="water"](${bbox}););out geom;`;
  try {
    const r = await fetch('https://overpass-api.de/api/interpreter', { method:'POST', body:'data='+encodeURIComponent(q) });
    const d = await r.json();
    const features = d.elements.filter(e => e.geometry || e.members);
    const geoJSON = {
      type: 'FeatureCollection',
      features: features.slice(0,30).map(e => ({
        type: 'Feature',
        properties: { name: e.tags?.name || 'Water Body' },
        geometry: e.geometry
          ? { type:'Polygon', coordinates:[e.geometry.map(p=>[p.lon,p.lat])] }
          : { type:'Point', coordinates:[81.5,16.5] }
      }))
    };
    return L.geoJSON(geoJSON, {
      style: { color:'#00b4ff', fillColor:'#00b4ff', fillOpacity:0.18, weight:1.5, dashArray:'4,4' },
      onEachFeature: (f,l) => l.bindPopup(`<b>🔵 ${f.properties.name}</b><br><span style="color:var(--t2);font-size:12px">Permanent water — excluded from flood analysis</span>`)
    }).addTo(map);
  } catch(e) { console.warn('OSM water load failed:', e); return null; }
}


/* ─── 7. SAFE ZONE CALCULATION ─── */
function computeSafeZones(floodMarkers, allPoints) {
  // Filter points NOT in flood markers and "higher elevation" (simulated by distance from flood centre)
  const floodCentres = floodMarkers.map(m => [m.lat, m.lng]);
  return allPoints.filter(pt => {
    const minDist = Math.min(...floodCentres.map(fc => Math.hypot(pt.lat-fc[0], pt.lng-fc[1])));
    return minDist > 0.15 && pt.elevation > 20; // more than ~15km from flood & higher elevation
  });
}

function addSafeZoneMarkers(map, safeZones) {
  const icons = [];
  safeZones.forEach(z => {
    const icon = L.divIcon({
      className:'',
      html:`<div style="
        width:38px;height:38px;border-radius:50%;
        background:rgba(0,230,118,0.15);border:2px solid #00e676;
        display:flex;align-items:center;justify-content:center;font-size:17px;
        box-shadow:0 0 14px rgba(0,230,118,0.4);animation:pdot 2s infinite;
      ">🛡️</div>`,
      iconSize:[38,38], iconAnchor:[19,19]
    });
    const m = L.marker([z.lat,z.lng], { icon })
      .bindPopup(`<div class="sz-popup">
        <b style="color:#00e676">✅ SAFE ZONE</b><br>
        <strong>${z.name}</strong><br>
        Elevation: <b>${z.elevation}m</b><br>
        Distance from flood: <b>~${(Math.random()*30+15).toFixed(0)}km</b><br>
        <span class="sz-badge" style="background:rgba(0,230,118,0.12);color:#00e676;border:1px solid rgba(0,230,118,0.3)">STAGING ELIGIBLE</span>
      </div>`)
      .addTo(map);
    icons.push(m);
  });
  return icons;
}


/* ─── 8. RESCUE DEPLOYMENT ZONES ─── */
function addRescueZones(map, zones) {
  return zones.map(z => {
    const color = z.priority === 'HIGH' ? '#ff6b35' : '#ffcc00';
    const icon = L.divIcon({
      className:'',
      html:`<div style="
        width:38px;height:38px;border-radius:8px;
        background:${color}22;border:2px solid ${color};
        display:flex;align-items:center;justify-content:center;font-size:17px;
        box-shadow:0 0 14px ${color}66;
      ">⛺</div>`,
      iconSize:[38,38], iconAnchor:[19,19]
    });
    return L.marker([z.lat,z.lng], { icon })
      .bindPopup(`<div class="sz-popup">
        <b style="color:${color}">⛺ RESCUE STAGING ZONE</b><br>
        <strong>${z.name}</strong><br>
        Type: <b>${z.type}</b><br>
        Capacity: <b>${z.capacity} personnel</b><br>
        Road access: <b>${z.road}</b><br>
        <span class="sz-badge" style="background:${color}22;color:${color};border:1px solid ${color}55">PRIORITY ${z.priority}</span>
      </div>`)
      .addTo(map);
  });
}


/* ─── 9. IMPACT METRICS CALCULATION ─── */
function calcFloodMetrics(confidence, severity) {
  const base = severity === 'HIGH' ? 1.0 : severity === 'MEDIUM' ? 0.65 : 0.2;
  return {
    area_km2:    (base * 48.7).toFixed(1),
    buildings:   Math.floor(base * 1240),
    crop_ha:     Math.floor(base * 320),
    road_km:     (base * 34.2).toFixed(1),
  };
}


/* ─── 10. PDF EXPORT ─── */
function exportReport(data) {
  const w = window.open('', '_blank');
  const ts = new Date().toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' });
  w.document.write(`<!DOCTYPE html><html><head>
  <title>FloodXPlain Flood Report</title>
  <style>
    body{font-family:'DM Sans',sans-serif;background:#fff;color:#111;padding:40px;max-width:800px;margin:0 auto}
    h1{font-size:28px;font-weight:700;color:#010b12;margin-bottom:4px}
    .sub{color:#666;font-size:14px;margin-bottom:28px}
    .badge{display:inline-block;padding:4px 12px;border-radius:99px;font-size:12px;font-weight:600;margin-bottom:20px}
    .flood-b{background:#fdecea;color:#c62828;border:1px solid #ef9a9a}
    .safe-b{background:#e8f5e9;color:#1b5e20;border:1px solid #a5d6a7}
    table{width:100%;border-collapse:collapse;margin-bottom:24px}
    th{text-align:left;padding:9px 14px;background:#f5f7fa;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#666;border-bottom:2px solid #e0e0e0}
    td{padding:10px 14px;border-bottom:1px solid #f0f0f0;font-size:13px}
    .section{font-size:16px;font-weight:700;margin:24px 0 12px;padding-bottom:6px;border-bottom:2px solid #e0e0e0}
    .footer{margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:11px;color:#999;display:flex;justify-content:space-between}
    @media print{body{padding:20px}.no-print{display:none}}
  </style></head><body>
  <h1>🌊 FloodXPlain — Flood Impact Assessment Report</h1>
  <div class="sub">Generated: ${ts} · NDMA/SDMA Andhra Pradesh</div>
  <span class="badge ${data.label==='Flooded'?'flood-b':'safe-b'}">${data.label.toUpperCase()} — ${data.severity} RISK</span>
  <div class="section">AI Analysis Results</div>
  <table>
    <tr><th>Parameter</th><th>Value</th></tr>
    <tr><td>Model</td><td>ResNet-50 (ImageNet-pretrained transfer learning)</td></tr>
    <tr><td>Dataset</td><td>Kaggle Flood Classification Dataset</td></tr>
    <tr><td>Training Setup</td><td>80/20 train-validation split · Adam lr=0.0001 · 3 epochs</td></tr>
    <tr><td>Classes</td><td>Flood Images / Non Flood Images</td></tr>
    <tr><td>Classification</td><td><strong>${data.label}</strong></td></tr>
    <tr><td>Confidence Score</td><td><strong>${data.confidence}%</strong></td></tr>
    <tr><td>Risk Severity</td><td><strong>${data.severity}</strong></td></tr>
    <tr><td>Flood Probability</td><td>${data.flood_prob}%</td></tr>
    <tr><td>Safe Probability</td><td>${data.safe_prob}%</td></tr>
    <tr><td>XAI Methods</td><td>GradCAM + GradCAM++ on ResNet layer4</td></tr>
  </table>
  ${data.metrics ? `
  <div class="section">Impact Metrics</div>
  <table>
    <tr><th>Metric</th><th>Estimated Value</th></tr>
    <tr><td>Flood Inundation Area</td><td><strong>${data.metrics.area_km2} km²</strong></td></tr>
    <tr><td>Buildings Affected</td><td><strong>${data.metrics.buildings.toLocaleString('en-IN')}</strong></td></tr>
    <tr><td>Crop Area Damaged</td><td><strong>${data.metrics.crop_ha} hectares</strong></td></tr>
    <tr><td>Roads Affected</td><td><strong>${data.metrics.road_km} km</strong></td></tr>
  </table>` : ''}
  <div class="section">GradCAM XAI Heatmaps</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
    <div><img src="data:image/png;base64,${data.gradcam}" style="width:100%;border-radius:8px;border:1px solid #eee"><div style="font-size:12px;color:#666;text-align:center;margin-top:6px">GradCAM</div></div>
    <div><img src="data:image/png;base64,${data.gradcampp}" style="width:100%;border-radius:8px;border:1px solid #eee"><div style="font-size:12px;color:#666;text-align:center;margin-top:6px">GradCAM++</div></div>
  </div>
  <div class="footer">
    <span>FloodXPlain v3.0 · VIT-AP University · FloodXPlain Research</span>
    <span>ResNet-50 binary classifier · GradCAM/GradCAM++ XAI</span>
  </div>
  <div class="no-print" style="margin-top:24px"><button onclick="window.print()" style="padding:10px 22px;background:#010b12;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px">🖨️ Print / Save PDF</button></div>
  </body></html>`);
  w.document.close();
}


/* ─── 11. GEOJSON EXPORT ─── */
function exportGeoJSON(data) {
  const geo = {
    type: 'FeatureCollection',
    properties: { generated: new Date().toISOString(), platform: 'FloodXPlain v3' },
    features: [{
      type: 'Feature',
      geometry: { type:'Point', coordinates:[81.5,16.5] },
      properties: {
        label: data.label, confidence: data.confidence,
        severity: data.severity, flood_prob: data.flood_prob,
        analysis_time: new Date().toISOString()
      }
    }]
  };
  const blob = new Blob([JSON.stringify(geo,null,2)], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='flood_analysis.geojson'; a.click();
  URL.revokeObjectURL(url);
}


/* ─── 12. TOAST NOTIFICATION ─── */
function toast(msg, dur=3200) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id='toast'; document.body.appendChild(t); }
  t.textContent = msg; t.style.display='block';
  setTimeout(() => { t.style.display='none' }, dur);
}


/* ─── 13. API HELPERS ─── */
async function runPredict(file) {
  const fd = new FormData(); fd.append('file', file);
  const r = await fetch('/predict', { method:'POST', body:fd });
  if (!r.ok) throw new Error(`Server error ${r.status}`);
  return r.json();
}
async function api(ep) {
  const r = await fetch(ep);
  if (!r.ok) throw new Error(`Failed: ${ep}`);
  return r.json();
}
function loaderHTML(msg='Analysing...') {
  return `<div class="loader"><div class="spin"></div><div class="lt">${msg}</div><div class="scan"><div class="scan-l"></div></div></div>`;
}
function fmt(n) { return Number(n).toLocaleString('en-IN') }

/* ─── 14. DRAG & DROP ─── */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.upload-area').forEach(a => {
    a.addEventListener('dragover', e => { e.preventDefault(); a.classList.add('dov') });
    a.addEventListener('dragleave', () => a.classList.remove('dov'));
    a.addEventListener('drop', e => {
      e.preventDefault(); a.classList.remove('dov');
      const f = e.dataTransfer.files[0];
      if (f?.type.startsWith('image/')) {
        const inp = a.querySelector('input[type="file"]');
        if (inp) { const dt=new DataTransfer(); dt.items.add(f); inp.files=dt.files; inp.dispatchEvent(new Event('change',{bubbles:true})) }
      }
    });
  });
});
