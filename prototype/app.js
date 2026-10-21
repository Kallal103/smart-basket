/* ══════════════════════════════════════════════════════════════
   SMART BASKET v2 — Application Logic
   ══════════════════════════════════════════════════════════════ */

// ── RECIPE DATA ──
const RECIPES = [
  {id:1,n:'Chicken Curry & Rice',bn:'মুরগির তরকারি',ico:'🍲',cat:['lunch','dinner','chicken'],d:'Easy',t:30,c:180,s:2,g:'g1'},
  {id:2,n:'Hilsha Fish Curry',bn:'ইলিশ মাছ',ico:'🐟',cat:['lunch','fish'],d:'Medium',t:40,c:320,s:2,g:'g2'},
  {id:3,n:'Prawn Malai Curry',bn:'চিংড়ি মালাইকারি',ico:'🦐',cat:['lunch','dinner','fish'],d:'Medium',t:35,c:240,s:1,g:'g3'},
  {id:4,n:'Khichuri & Egg',bn:'খিচুড়ি ও ডিম',ico:'🥘',cat:['dinner','veg','quick'],d:'Easy',t:25,c:90,s:1,g:'g4'},
  {id:5,n:'Paratha & Egg Bhaji',bn:'পরোটা ও ডিম ভাজি',ico:'🍳',cat:['breakfast','quick'],d:'Easy',t:15,c:85,s:1,g:'g1'},
  {id:6,n:'Luchi & Alur Dom',bn:'লুচি ও আলুর দম',ico:'🫓',cat:['breakfast','veg'],d:'Medium',t:30,c:70,s:1,g:'g5'},
  {id:7,n:'Dal & Mixed Veg',bn:'ডাল ও সবজি',ico:'🥗',cat:['dinner','veg','quick'],d:'Easy',t:20,c:95,s:1,g:'g4'},
  {id:8,n:'Chicken Biryani',bn:'চিকেন বিরিয়ানি',ico:'🍛',cat:['lunch','chicken'],d:'Hard',t:60,c:210,s:3,g:'g6'},
  {id:9,n:'Begun Bharta',bn:'বেগুন ভর্তা',ico:'🍆',cat:['dinner','veg','quick'],d:'Easy',t:20,c:80,s:2,g:'g4'},
  {id:10,n:'Egg Curry & Rice',bn:'ডিমের তরকারি',ico:'🥚',cat:['lunch','dinner','quick'],d:'Easy',t:20,c:110,s:2,g:'g1'},
  {id:11,n:'Pitha',bn:'পিঠা',ico:'🍡',cat:['breakfast','veg'],d:'Medium',t:45,c:60,s:0,g:'g5'},
  {id:12,n:'Aloo Bhaji & Roti',bn:'আলু ভাজি ও রুটি',ico:'🥔',cat:['dinner','veg','quick'],d:'Easy',t:15,c:65,s:1,g:'g4'},
  {id:13,n:'Mutton Rezala',bn:'মাটন রেজালা',ico:'🍖',cat:['lunch','dinner'],d:'Hard',t:90,c:290,s:2,g:'g6'},
  {id:14,n:'Rui Fish Jhol',bn:'রুই মাছের ঝোল',ico:'🐟',cat:['lunch','fish'],d:'Easy',t:25,c:160,s:1,g:'g2'},
  {id:15,n:'Haleem',bn:'হালিম',ico:'🥣',cat:['breakfast'],d:'Hard',t:120,c:120,s:2,g:'g6'},
  {id:16,n:'Shutki Bhorta',bn:'শুটকি ভর্তা',ico:'🐠',cat:['dinner','fish'],d:'Easy',t:20,c:90,s:3,g:'g3'},
  {id:17,n:'Chhola & Paratha',bn:'ছোলা ও পরোটা',ico:'🫘',cat:['breakfast','veg'],d:'Easy',t:25,c:75,s:1,g:'g5'},
  {id:18,n:'Moong Dal & Rice',bn:'মুগ ডাল',ico:'🍚',cat:['dinner','veg','quick'],d:'Easy',t:20,c:70,s:1,g:'g4'},
  {id:19,n:'Toast & Jam',bn:'টোস্ট ও জ্যাম',ico:'🍞',cat:['breakfast','quick','veg'],d:'Easy',t:5,c:45,s:0,g:'g1'},
  {id:20,n:'Fuchka',bn:'ফুচকা',ico:'🥟',cat:['breakfast','veg','quick'],d:'Medium',t:30,c:50,s:2,g:'g5'},
  {id:21,n:'Veg Khichuri',bn:'সবজি খিচুড়ি',ico:'🥘',cat:['dinner','veg'],d:'Easy',t:25,c:85,s:1,g:'g4'},
  {id:22,n:'Fish Kalia',bn:'মাছের কালিয়া',ico:'🐟',cat:['lunch','fish'],d:'Medium',t:40,c:200,s:2,g:'g2'},
  {id:23,n:'Shorshe Ilish',bn:'সর্ষে ইলিশ',ico:'🐟',cat:['lunch','fish'],d:'Medium',t:30,c:350,s:2,g:'g3'},
  {id:24,n:'Fried Rice',bn:'ফ্রাইড রাইস',ico:'🍚',cat:['lunch','chicken','quick'],d:'Easy',t:20,c:150,s:1,g:'g1'},
  {id:25,n:'Noodles & Veg',bn:'নুডলস ও সবজি',ico:'🍜',cat:['dinner','veg','quick'],d:'Easy',t:15,c:80,s:1,g:'g5'},
  {id:26,n:'Chicken Tikka',bn:'চিকেন টিক্কা',ico:'🍗',cat:['dinner','chicken'],d:'Medium',t:35,c:170,s:2,g:'g6'},
  {id:27,n:'Dim Bhuna',bn:'ডিম ভুনা',ico:'🥚',cat:['lunch','quick'],d:'Easy',t:15,c:75,s:2,g:'g1'},
  {id:28,n:'Korola Bhaji',bn:'করলা ভাজি',ico:'🥒',cat:['dinner','veg','quick'],d:'Easy',t:15,c:50,s:1,g:'g4'},
  {id:29,n:'Bhuna Khichuri',bn:'ভুনা খিচুড়ি',ico:'🍛',cat:['lunch','dinner'],d:'Medium',t:35,c:100,s:2,g:'g6'},
  {id:30,n:'Macher Kofta',bn:'মাছের কোফতা',ico:'🐟',cat:['lunch','fish'],d:'Hard',t:45,c:180,s:1,g:'g2'},
];

const COOK_STEPS = [
  {n:'Step 1',txt:'Marinate chicken with turmeric, chilli, salt and yogurt for 15 min.',tm:'15:00',lbl:'Marination',ig:[['Chicken','500g'],['Turmeric','1 tsp'],['Chilli','1 tsp']]},
  {n:'Step 2',txt:'Heat oil. Fry sliced onions until golden, about 5 min.',tm:'5:00',lbl:'Frying',ig:[['Oil','3 tbsp'],['Onion','200g']]},
  {n:'Step 3',txt:'Add garlic-ginger paste. Cook 1 min until fragrant.',tm:'1:00',lbl:'Cooking',ig:[['Garlic','4 cloves'],['Ginger','1 inch']]},
  {n:'Step 4',txt:'Add tomatoes. Cook until soft and oil separates.',tm:'3:00',lbl:'Cooking',ig:[['Tomato','150g']]},
  {n:'Step 5',txt:'Add chicken. Sear on high for 5 min, stirring often.',tm:'5:00',lbl:'Searing',ig:[['Chicken','500g']]},
  {n:'Step 6',txt:'Add water. Cover and simmer on low 20 min until tender.',tm:'20:00',lbl:'Simmering',ig:[['Water','1 cup']]},
  {n:'Step 7',txt:'Serve hot with steamed rice and a wedge of lime.',tm:'—',lbl:'Plating',ig:[['Rice','400g'],['Lime','1 wedge']]},
];

// ── STATE ──
let hh = 4, activeCat = 'all', onbIdx = 0, ckIdx = 0, isFirst = true, srvCount = 4;

// ══════════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════════
function go(id) {
  document.querySelectorAll('.scr').forEach(s => s.classList.remove('on'));
  document.getElementById(id).classList.add('on');
  window.scrollTo(0, 0);
  if (id === 's-recipes') renderR();
}

function closeM(el, e) {
  if (e && e.target !== e.currentTarget) return;
  el.classList.remove('on');
}

// ══════════════════════════════════════════════
// TOAST NOTIFICATIONS
// ══════════════════════════════════════════════
function toast(msg) {
  const c = document.getElementById('toasts');
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

// ══════════════════════════════════════════════
// THEME SWITCHER
// ══════════════════════════════════════════════
function setTheme(t) {
  const p = document.getElementById('phone');
  p.className = 'phone';
  if (t) p.classList.add(t);
  document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('on'));
  event.target.classList.add('on');
  toast('Theme: ' + event.target.textContent);
}

// ══════════════════════════════════════════════
// ONBOARDING CAROUSEL
// ══════════════════════════════════════════════
function onbN(d) {
  const sl = document.querySelectorAll('.onb-slide');
  const dt = document.querySelectorAll('.onb-d');
  sl[onbIdx].classList.remove('on');
  sl[onbIdx].classList.add(d > 0 ? 'left' : '');
  onbIdx = Math.max(0, Math.min(2, onbIdx + d));
  sl.forEach(s => s.classList.remove('on', 'left'));
  sl[onbIdx].classList.add('on');
  dt.forEach(d => d.classList.remove('on'));
  dt[onbIdx].classList.add('on');
  document.getElementById('onb-bk').style.visibility = onbIdx === 0 ? 'hidden' : 'visible';
  const nx = document.getElementById('onb-nx');
  if (onbIdx === 2) { nx.textContent = 'Create Account'; nx.onclick = () => go('s-auth'); }
  else { nx.textContent = 'Next'; nx.onclick = () => onbN(1); }
}

// ══════════════════════════════════════════════
// SETUP
// ══════════════════════════════════════════════
function adjHH(d) {
  hh = Math.max(1, Math.min(10, hh + d));
  document.getElementById('hh-v').textContent = hh;
  srvCount = hh;
}
function updB(v) { document.getElementById('bv').innerHTML = '&#2547;' + Number(v).toLocaleString(); }
function tog(el) { el.classList.toggle('on'); }

// ══════════════════════════════════════════════
// FIRST TIME PLAN
// ══════════════════════════════════════════════
function firstPlan() {
  showLd('Setting up your profile...', 'Saving preferences');
  const steps = [
    { t: 'Planning your week...', s: 'Finding dishes within budget' },
    { t: 'Matching recipes...', s: 'Scaling for family of ' + hh },
    { t: 'Checking prices...', s: 'Looking up product catalogue' },
    { t: 'Almost done!', s: 'Building shopping list' },
  ];
  let i = 0;
  const iv = setInterval(() => { i++; if (i < steps.length) { $('lt').textContent = steps[i].t; $('ls').textContent = steps[i].s; } }, 700);
  setTimeout(() => { clearInterval(iv); hideLd(); go('s-win'); }, 3500);
}

function goFilled() {
  go('s-filled');
  if (isFirst) {
    isFirst = false;
    setTimeout(() => $('tt-ol').classList.add('on'), 500);
  }
}
function dismissTT() { $('tt-ol').classList.remove('on'); toast('Tip: Try swapping Wednesday lunch!'); }

// ══════════════════════════════════════════════
// PLAN MY WEEK
// ══════════════════════════════════════════════
function planWeek() {
  showLd('Planning your week...', 'Finding dishes within budget');
  const steps = [{ t: 'Matching recipes...', s: 'Scaling for ' + hh }, { t: 'Checking prices...', s: 'Product catalogue' }, { t: 'Done!', s: 'Building list' }];
  let i = 0;
  const iv = setInterval(() => { i++; if (i < steps.length) { $('lt').textContent = steps[i].t; $('ls').textContent = steps[i].s; } }, 600);
  setTimeout(() => { clearInterval(iv); hideLd(); go('s-filled'); toast('✨ 7 days planned — under budget!'); }, 2400);
}

// ══════════════════════════════════════════════
// LOADING
// ══════════════════════════════════════════════
function showLd(t, s) { $('lt').textContent = t; $('ls').textContent = s; $('ld').classList.add('on'); }
function hideLd() { $('ld').classList.remove('on'); }

// ══════════════════════════════════════════════
// SWAP
// ══════════════════════════════════════════════
function openSwap() { $('m-swap').classList.add('on'); }
function doSwap(n, bn, p) {
  $('wn').textContent = n; $('wb').textContent = bn;
  $('wp').innerHTML = '&#2547;' + p;
  const t = 2840 - (210 - p);
  $('bb-a').innerHTML = '&#2547;' + t.toLocaleString();
  $('bb-f').style.width = (t / 3000 * 100) + '%';
  const ws = $('ws');
  ws.textContent = '✓ Done'; ws.style.background = 'var(--ok-lt)'; ws.style.color = 'var(--ok)';
  setTimeout(() => { ws.textContent = 'Swap'; ws.style.background = ''; ws.style.color = ''; }, 2500);
  $('m-swap').classList.remove('on');
  toast('Swapped! Saved &#2547;' + (210 - p));
}

// ══════════════════════════════════════════════
// LOCK
// ══════════════════════════════════════════════
function togLk(el) {
  el.classList.toggle('locked');
  el.textContent = el.classList.contains('locked') ? '🔒' : '🔓';
  toast(el.classList.contains('locked') ? 'Dish locked — AI won\'t change it' : 'Dish unlocked');
}

// ══════════════════════════════════════════════
// AI REQUEST
// ══════════════════════════════════════════════
function aiReq() {
  const t = $('ai-txt').value;
  if (!t.trim()) return;
  showLd('AI updating plan...', '"' + t + '"');
  $('ai-txt').value = '';
  setTimeout(() => { hideLd(); $('m-ai').classList.add('on'); }, 1800);
}

// ══════════════════════════════════════════════
// OVER BUDGET (triggered from budget bar tap)
// ══════════════════════════════════════════════
function showOverBudget() { $('m-over').classList.add('on'); }
function applyBudgetFix() {
  $('m-over').classList.remove('on');
  toast('Applied 2 swaps — now under budget!');
}

// ══════════════════════════════════════════════
// SLOT PICKER / PRODUCT SWITCHER
// ══════════════════════════════════════════════
function openPicker() { $('m-pick').classList.add('on'); }
function pickDish() { $('m-pick').classList.remove('on'); toast('Dish added to plan!'); }
function openProd() { $('m-prod').classList.add('on'); }
function switchProd() { $('m-prod').classList.remove('on'); toast('Product switched!'); }

// ══════════════════════════════════════════════
// SHOPPING LIST
// ══════════════════════════════════════════════
function togLi(el) {
  el.classList.toggle('done');
  const c = el.querySelector('.li-chk'), n = el.querySelector('.li-n');
  if (el.classList.contains('done')) { c.classList.add('on'); c.textContent = '✓'; n.style.textDecoration = 'line-through'; }
  else { c.classList.remove('on'); c.textContent = ''; n.style.textDecoration = 'none'; }
}

function filterList() {
  const q = $('list-search').value.toLowerCase();
  document.querySelectorAll('#s-list .li').forEach(li => {
    const name = li.querySelector('.li-n').textContent.toLowerCase();
    li.style.display = name.includes(q) ? '' : 'none';
  });
}

// ══════════════════════════════════════════════
// CART
// ══════════════════════════════════════════════
function addCart() {
  showLd('Adding to cart...', 'Sending 42 items');
  setTimeout(() => { hideLd(); go('s-cart'); toast('🛒 42 items added to cart!'); }, 1500);
}

// ══════════════════════════════════════════════
// RECIPE LIBRARY
// ══════════════════════════════════════════════
function renderR(q = '') {
  const g = $('r-grid');
  const f = q.toLowerCase();
  const items = RECIPES.filter(r =>
    (activeCat === 'all' || r.cat.includes(activeCat)) &&
    (!f || r.n.toLowerCase().includes(f) || r.bn.includes(f))
  );
  // Show skeleton briefly
  if (!q && !g.innerHTML) {
    g.innerHTML = Array(6).fill('<div style="height:170px" class="skel"></div>').join('');
    setTimeout(() => renderCards(items, g), 400);
  } else {
    renderCards(items, g);
  }
}

function renderCards(items, g) {
  g.innerHTML = items.map(r => `<div class="r-card" onclick="showR(${r.id})">
    <div class="r-img ${r.g}">${r.ico}<span class="badge ${r.d === 'Easy' ? 'b-ok' : r.d === 'Medium' ? 'b-warn' : 'b-brand'} r-diff">${r.d}</span></div>
    <div class="r-info"><div class="r-name">${r.n}</div><div class="r-bn">${r.bn}</div>
    <div class="r-meta"><span class="r-tag">⏱${r.t}m</span><span class="r-tag">&#2547;${r.c}</span>${r.s ? `<span class="r-tag">${'🌶️'.repeat(r.s)}</span>` : ''}</div></div>
  </div>`).join('');
}

function filtR() { renderR($('r-q').value); }
function filtC(el, c) {
  document.querySelectorAll('#r-pills .pill').forEach(p => p.classList.remove('on'));
  el.classList.add('on'); activeCat = c; filtR();
}

function showR(id) {
  const r = RECIPES.find(x => x.id === id);
  if (!r) return;
  $('rd-h').textContent = r.n;
  $('rd-hero').textContent = r.ico;
  $('rd-hero').className = 'rd-hero ' + r.g;
  $('rd-t').textContent = r.n;
  $('rd-bn').textContent = r.bn;
  $('rd-time').textContent = r.t;
  $('rd-diff').textContent = r.d;
  $('rd-cost').innerHTML = '&#2547;' + r.c;
  $('srv-v').textContent = srvCount;
  go('s-rd');
}

// ══════════════════════════════════════════════
// SERVING TOGGLE (recipe detail)
// ══════════════════════════════════════════════
function adjSrv(d) {
  srvCount = Math.max(1, Math.min(12, srvCount + d));
  $('srv-v').textContent = srvCount;
  toast('Scaled to ' + srvCount + ' servings');
}

// ══════════════════════════════════════════════
// COOKING MODE
// ══════════════════════════════════════════════
function renderCk() {
  const s = COOK_STEPS[ckIdx];
  $('ck-c').textContent = ckIdx + 1;
  $('ck-t').textContent = s.tm;
  $('ck-tl').textContent = s.lbl;
  $('ck-sn').textContent = s.n;
  $('ck-st').textContent = s.txt;
  $('ck-ig').innerHTML = '<div class="cook-ings-t">Ingredients</div>' +
    s.ig.map(i => `<div class="cook-ig"><span>${i[0]}</span><span>${i[1]}</span></div>`).join('');
  $('ck-p').innerHTML = COOK_STEPS.map((_, i) =>
    `<div class="cook-dot ${i < ckIdx ? 'done' : i === ckIdx ? 'cur' : ''}"></div>`
  ).join('');
  $('ck-prev').style.visibility = ckIdx === 0 ? 'hidden' : 'visible';
  $('ck-next').textContent = ckIdx === COOK_STEPS.length - 1 ? 'Finish' : 'Next Step';
}

function ckStep(d) {
  if (ckIdx === COOK_STEPS.length - 1 && d > 0) {
    go('s-rd'); ckIdx = 0; renderCk(); toast('Cooking complete! Enjoy your meal 🍽️'); return;
  }
  ckIdx = Math.max(0, Math.min(COOK_STEPS.length - 1, ckIdx + d));
  renderCk();
}

// ══════════════════════════════════════════════
// MEAL SLOT → RECIPE DETAIL
// ══════════════════════════════════════════════
function slotToRecipe(name) {
  const r = RECIPES.find(x => x.n.includes(name));
  if (r) showR(r.id);
  else go('s-rd');
}

// ── UTIL ──
function $(id) { return document.getElementById(id); }

// ── INIT ──
renderCk();
