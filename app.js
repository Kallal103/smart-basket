/* ══════════════════════════════════════════════════════════════
   SMART BASKET v7 — App Logic (Premium, photo-first)
   ══════════════════════════════════════════════════════════════ */

// ── APP STATE ──
const state = {
  screen: 's-home',
  household: 4,
  budget: 3000,
  exclusions: ['no_beef'],
  plan: [],
  pantryOwned: [],
  shoppingList: null,
  servings: 4,
};

// ── DOM HELPERS ──
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

// ── LANGUAGE ──
let lang = 'en';
function setLang(l) {
  lang = l;
  $('phone').classList.remove('en', 'bn');
  $('phone').classList.add(l);
  document.documentElement.className = l;
  $$('.lang-btn').forEach(b => b.classList.remove('on'));
  event.target.classList.add('on');
  toast(l === 'bn' ? 'ভাষা: বাংলা' : 'Language: English');
}

// ── BACK NAVIGATION ──
let prevScreen = 's-home';
function goBack() { go(prevScreen); }

// ── FILTER CAT ──
let recipeCat = 'all';
function filterCat(cat) {
  recipeCat = cat === 'family' ? 'all' : cat === 'budget' ? 'all' : cat;
}

// ══════════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════════
function go(id) {
  prevScreen = state.screen;
  $$('.scr').forEach(s => s.classList.remove('on'));
  $(id).classList.add('on');
  state.screen = id;
  window.scrollTo(0, 0);

  if (id === 's-browse') renderRecipeGrid();
  if (id === 's-plan') {
    if (state.plan.length === 0) {
      $('plan-days').innerHTML = '<div style="text-align:center;padding:64px 24px;color:var(--t3)"><div style="width:56px;height:56px;border-radius:50%;background:var(--bg2);display:flex;align-items:center;justify-content:center;margin:0 auto"><svg viewBox="0 0 24 24" style="width:28px;height:28px;stroke:var(--t3);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div><div style="font-size:18px;font-weight:800;color:var(--t2);letter-spacing:-.02em;margin-top:20px">No plan yet</div><div style="font-size:14px;margin-top:6px">Create a personalized meal plan</div><button class="btn btn-brand mt-24" style="max-width:200px;margin:24px auto 0" onclick="go(\'s-setup\')">Plan my week</button></div>';
      $('bb-amt').innerHTML = '৳0';
      $('bb-badge').textContent = 'No plan';
      $('bb-fill').style.width = '0';
    } else {
      renderPlan();
    }
  }
  if (id === 's-basket') {
    if (state.plan.length === 0) {
      $('list-items').innerHTML = '<div style="text-align:center;padding:64px 24px;color:var(--t3)"><div style="width:56px;height:56px;border-radius:50%;background:var(--bg2);display:flex;align-items:center;justify-content:center;margin:0 auto"><svg viewBox="0 0 24 24" style="width:28px;height:28px;stroke:var(--t3);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg></div><div style="font-size:18px;font-weight:800;color:var(--t2);letter-spacing:-.02em;margin-top:20px">Your basket is empty</div><div style="font-size:14px;margin-top:6px">Create a meal plan first</div><button class="btn btn-brand mt-24" style="max-width:200px;margin:24px auto 0" onclick="go(\'s-setup\')">Plan my week</button></div>';
    } else {
      renderShoppingList();
    }
  }
}

// ══════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════
function toast(msg) {
  const c = $('toasts');
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ══════════════════════════════════════════════
// MARK MEAL DONE
// ══════════════════════════════════════════════
function markDone(btn) {
  const card = btn.closest('.today-card');
  if (card) {
    card.style.opacity = '0.25';
    card.style.transition = 'opacity .4s ease';
    const nm = card.querySelector('.today-card-name');
    if (nm) nm.style.textDecoration = 'line-through';
  }
  btn.textContent = 'Done';
  btn.disabled = true;
  btn.style.background = 'var(--ok-lt)';
  btn.style.color = 'var(--ok)';
  btn.style.borderColor = 'var(--ok)';
  toast('Meal done!');
}

// ══════════════════════════════════════════════
// SETUP
// ══════════════════════════════════════════════
function adjHH(d) {
  state.household = Math.max(1, Math.min(10, state.household + d));
  state.servings = state.household;
  $('hh-v').textContent = state.household;
}
function updBudget(v) {
  state.budget = Number(v);
  $('bv').innerHTML = Engine.fmt(v);
}
function togChip(el) {
  el.classList.toggle('on');
  state.exclusions = [];
  $$('#diet-chips .chip.on').forEach(c => state.exclusions.push(c.dataset.id));
}

// ══════════════════════════════════════════════
// PLAN GENERATION
// ══════════════════════════════════════════════
function generatePlan() {
  showLoad('Planning your week...', 'Finding dishes within budget');
  const steps = [
    { t: 'Matching recipes...', s: 'Scaling for ' + state.household + ' people' },
    { t: 'Checking prices...', s: 'Calculating pack costs' },
    { t: 'Optimizing budget...', s: 'Ensuring under ' + Engine.fmt(state.budget) },
  ];
  let i = 0;
  const iv = setInterval(() => {
    i++;
    if (i < steps.length) { $('ld-t').textContent = steps[i].t; $('ld-s').textContent = steps[i].s; }
  }, 700);
  setTimeout(() => {
    clearInterval(iv);
    state.plan = Engine.generatePlan(state.budget, state.servings, state.exclusions);
    state.shoppingList = null;
    hideLoad();
    go('s-plan');
    toast('Plan generated — ' + state.plan.length + ' meals');
  }, 2500);
}

// ══════════════════════════════════════════════
// RENDER: MEAL PLAN
// ══════════════════════════════════════════════
function renderPlan() {
  const container = $('plan-days');
  const dayCosts = Engine.dayCosts(state.plan, state.servings);
  const list = Engine.generateShoppingList(state.plan, state.servings, state.pantryOwned);
  const totalCost = list.payable;
  const underBudget = state.budget - totalCost;

  $('bb-amt').innerHTML = Engine.fmt(totalCost);
  $('bb-sub').textContent = 'of ' + Engine.fmt(state.budget);
  const pct = Math.min((totalCost / state.budget) * 100, 100);
  $('bb-fill').style.width = pct + '%';
  $('bb-fill').className = 'bbar-fill ' + (totalCost <= state.budget ? 'ok' : 'over');
  $('bb-badge').textContent = totalCost <= state.budget
    ? 'Under by ' + Engine.fmt(underBudget)
    : 'Over by ' + Engine.fmt(-underBudget);
  $('bb-badge').className = 'badge ' + (totalCost <= state.budget ? 'b-ok' : 'b-brand');

  let html = '';
  for (let d = 0; d < 7; d++) {
    const dayEntries = state.plan.filter(e => e.day === d);
    html += `<div class="plan-day"><div class="plan-day-h"><span class="day-name">${DAY_NAMES[d]} &middot; ${DAY_DATES[d]}</span><span class="day-cost">${Engine.fmt(dayCosts[d])}</span></div>`;
    for (const slot of ['breakfast', 'lunch', 'dinner']) {
      const entry = dayEntries.find(e => e.slot === slot);
      const recipe = entry ? RECIPES.find(r => r.id === entry.recipe) : null;
      if (recipe) {
        const cost = Engine.recipeCost(recipe, state.servings);
        const mealPhoto = (typeof PHOTOS!=='undefined'?PHOTOS:{})[recipe.id]||'';
        html += `<div class="plan-meal" onclick="showRecipeDetail('${recipe.id}')">
          <div class="plan-meal-img" style="${mealPhoto?'background:url('+mealPhoto+') center/cover;':''}">${mealPhoto?'':recipe.ico}</div>
          <div class="plan-meal-body">
            <div class="plan-meal-slot">${SLOT_NAMES[slot]}</div>
            <div class="plan-meal-name">${recipe.name}</div>
            <div class="plan-meal-bn">${recipe.bn}</div>
          </div>
          <div class="plan-meal-price">${Engine.fmt(cost)}</div>
          <span class="plan-meal-swap" onclick="event.stopPropagation();openSwapModal(${d},'${slot}')">Swap</span>
        </div>`;
      } else {
        html += `<div class="plan-meal" onclick="openPickerModal(${d},'${slot}')">
          <div class="plan-meal-img" style="background:var(--border-lt);display:flex;align-items:center;justify-content:center"><svg viewBox="0 0 24 24" style="width:20px;height:20px;stroke:var(--t3);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div>
          <div class="plan-meal-body"><div class="plan-meal-slot">${SLOT_NAMES[slot]}</div><div style="font-size:14px;color:var(--t3)">Tap to add a dish</div></div>
        </div>`;
      }
    }
    html += '</div>';
  }
  container.innerHTML = html;
}

// ══════════════════════════════════════════════
// RENDER: SHOPPING LIST
// ══════════════════════════════════════════════
function renderShoppingList() {
  const list = Engine.generateShoppingList(state.plan, state.servings, state.pantryOwned);
  state.shoppingList = list;

  $('ls-items').textContent = list.items.length;
  $('ls-total').innerHTML = Engine.fmt(list.payable);
  $('ls-under').innerHTML = Engine.fmt(state.budget - list.payable);

  const groups = {};
  for (const item of list.items) {
    if (!groups[item.category]) groups[item.category] = [];
    groups[item.category].push(item);
  }

  const icos = {chicken:'🍗',hilsha:'🐟',rui:'🐟',prawn:'🦐',mutton:'🥩',egg:'🥚',tilapia:'🐟',rice:'🍚',flour:'🌾',moong_dal:'🫘',masoor_dal:'🫘',bread:'🍞',potato:'🥔',onion:'🧅',tomato:'🍅',eggplant:'🍆',green_chilli:'🌶️',garlic:'🧄',ginger:'🫚',mixed_veg:'🥬',oil:'🫗',salt:'🧂',sugar:'🍬',turmeric:'✨',yogurt:'🥛',butter:'🧈',ghee:'🧈',chickpea:'🫘',dried_fish:'🐠',basmati_rice:'🍚',coconut_milk:'🥥',mustard_oil:'🫗',mustard_paste:'🟡',haleem_mix:'🥣',noodles:'🍜',korola:'🥒',cauliflower:'🥦',jaggery:'🍯',rice_flour:'🌾',soy_sauce:'🫙',cumin:'✨',chilli_powder:'🌶️',coriander_pwd:'🌿',jam:'🍓'};

  let html = '';
  for (const [cat, items] of Object.entries(groups)) {
    const meta = CATEGORY_META[cat] || { label: cat, icon: '📦' };
    html += `<div class="basket-cat"><div class="basket-cat-h">${meta.label}`;
    if (cat === 'pantry') html += ' <span class="badge b-warn" style="margin-left:8px">May have</span>';
    html += '</div>';

    for (const item of items) {
      const ico = icos[item.ingredientId] || '📦';
      const checkClass = item.owned ? ' on' : '';

      html += `<div class="basket-item${item.owned?' owned':''}${item.isStaple?' staple':''}" onclick="toggleListItem(this,'${item.ingredientId}')">
        <div class="bi-chk${checkClass}">${item.owned ? '✓' : ''}</div>
        <div class="basket-img">${ico}</div>
        <div class="bi-info">
          <div class="bi-name">${item.name}</div>
          <div class="bi-detail"><b>${item.brand}</b> &middot; ${Engine.fmtQty(item.packSize * item.packs, item.packUnit)}</div>
          <div class="bi-src">For: ${item.usedIn.slice(0, 2).join(', ')}${item.usedIn.length > 2 ? ' +' + (item.usedIn.length - 2) : ''}</div>
          ${item.fresh ? '<div style="font-size:11px;color:var(--warn);margin-top:2px;font-weight:600">Buy fresh</div>' : ''}
          ${item.isStaple ? '<div style="font-size:11px;color:var(--warn);margin-top:2px;font-weight:500">Tap to toggle &ldquo;already have&rdquo;</div>' : ''}
        </div>
        <div class="bi-rt">
          <div class="bi-qty">${Engine.fmtQty(item.needed, item.unit)}</div>
          <div class="bi-price">${Engine.fmt(item.totalPrice)}</div>
        </div>
      </div>`;
    }
    html += '</div>';
  }

  $('list-items').innerHTML = html;
  $('tot-sub').innerHTML = Engine.fmt(list.totalPackCost);
  $('tot-pantry').innerHTML = '−' + Engine.fmt(list.pantryDeduction);
  $('tot-total').innerHTML = Engine.fmt(list.payable);
  $('tot-remain').innerHTML = Engine.fmt(state.budget - list.payable);
  $('tot-items').textContent = list.items.length;
  $('cart-btn-price').innerHTML = Engine.fmt(list.payable);
}

function toggleListItem(el, ingId) {
  const idx = state.pantryOwned.indexOf(ingId);
  if (idx >= 0) state.pantryOwned.splice(idx, 1);
  else state.pantryOwned.push(ingId);
  renderShoppingList();
  toast(idx >= 0 ? 'Added to basket' : 'Marked as owned');
}

function filterShoppingList() {
  const q = $('list-search').value.toLowerCase();
  $$('#list-items .basket-item').forEach(li => {
    const name = li.querySelector('.bi-name').textContent.toLowerCase();
    li.style.display = name.includes(q) ? '' : 'none';
  });
}

// ══════════════════════════════════════════════
// RENDER: RECIPE GRID (mixed layout)
// ══════════════════════════════════════════════
function renderRecipeGrid(query) {
  const q = (query || '').toLowerCase();
  const items = RECIPES.filter(r =>
    (recipeCat === 'all' || r.cat.includes(recipeCat)) &&
    (!q || r.name.toLowerCase().includes(q) || r.bn.includes(q))
  );

  // Update result count
  const countEl = $('r-count');
  if (countEl) {
    const catLabel = recipeCat === 'all' ? 'All dishes' : recipeCat.charAt(0).toUpperCase() + recipeCat.slice(1);
    countEl.textContent = items.length + ' ' + catLabel.toLowerCase() + (items.length !== 1 ? ' recipes' : ' recipe');
  }

  const ph = typeof PHOTOS !== 'undefined' ? PHOTOS : {};
  let html = '';

  items.forEach((r, idx) => {
    const cost = Engine.recipeCost(r, state.servings);
    const diffBadge = r.diff === 'Easy' ? 'b-ok' : r.diff === 'Medium' ? 'b-warn' : 'b-brand';
    const photo = ph[r.id] || ph._fallback || '';

    // First item: full-width promo banner
    if (idx === 0 && photo) {
      html += `<div class="food-promo" onclick="showRecipeDetail('${r.id}')">
        <div class="food-promo-img" style="background-image:url(${photo})"></div>
        <div class="food-promo-info"><h3>${r.name}</h3><p>${Engine.fmt(cost)} &middot; ${r.time} min &middot; ${r.diff}</p></div>
      </div>`;
      return;
    }

    // Every 5th item: horizontal list card
    if (idx > 0 && idx % 5 === 0 && photo) {
      html += `<div class="food-list" onclick="showRecipeDetail('${r.id}')">
        <div class="food-list-img" style="background-image:url(${photo})"></div>
        <div class="food-list-body">
          <div class="food-name">${r.name}</div>
          <div class="food-bn">${r.bn}</div>
          <div class="food-meta">
            <span class="food-price">${Engine.fmt(cost)}</span>
            <span style="color:var(--t3)">&middot;</span>
            <span style="font-size:var(--t-xs);color:var(--t2)">${r.time} min</span>
            <span class="badge ${diffBadge}" style="margin-left:auto">${r.diff}</span>
          </div>
        </div>
      </div>`;
      return;
    }

    // Standard 2-col card
    html += `<div class="food-card" onclick="showRecipeDetail('${r.id}')">
      <div class="food-img" style="${photo ? 'background:url('+photo+') center/cover;' : ''}">
        ${photo ? '' : '<span style="font-size:48px">' + r.ico + '</span>'}
        <span class="badge ${diffBadge} food-badge">${r.diff}</span>
        <span class="food-time">${r.time}m</span>
      </div>
      <div class="food-info">
        <div class="food-name">${r.name}</div>
        <div class="food-bn">${r.bn}</div>
        <div class="food-meta">
          <span class="food-price">${Engine.fmt(cost)}</span>
          ${r.spice ? `<span class="food-rating">${'🌶'.repeat(r.spice)}</span>` : ''}
        </div>
      </div>
    </div>`;
  });

  $('r-grid').innerHTML = html;
}

function filterRecipeCat(el, cat) {
  $$('#r-pills .pill').forEach(p => p.classList.remove('on'));
  el.classList.add('on');
  recipeCat = cat;
  renderRecipeGrid($('r-q')?.value);
}

// ══════════════════════════════════════════════
// RECIPE DETAIL (immersive photo hero)
// ══════════════════════════════════════════════
let detailRecipeId = null;
let detailServings = 4;

function showRecipeDetail(recipeId) {
  detailRecipeId = recipeId;
  detailServings = state.servings;
  renderRecipeDetail();
  go('s-detail');
}

function renderRecipeDetail() {
  const r = RECIPES.find(x => x.id === detailRecipeId);
  if (!r) return;

  $('rd-h').textContent = r.name;
  const ph = typeof PHOTOS !== 'undefined' ? PHOTOS : {};
  const photo = ph[r.id] || ph._fallback || '';

  // Set hero image
  const heroImg = $('rd-hero-img');
  heroImg.style.backgroundImage = photo ? 'url(' + photo + ')' : '';
  heroImg.style.backgroundColor = photo ? '' : 'var(--bg2)';

  $('rd-title').textContent = r.name;
  $('rd-bn').textContent = r.bn;
  $('rd-time').textContent = r.time;
  $('rd-diff').textContent = r.diff;
  $('rd-cost').innerHTML = Engine.fmt(Engine.recipeCost(r, detailServings));
  $('srv-v').textContent = detailServings;

  $('rd-ings').innerHTML = r.ingredients.map(ing => {
    const ingredient = INGREDIENTS[ing.id];
    const qty = ing.qty * detailServings;
    return `<div class="rd-ing-row">
      <span class="rd-ing-name">${ingredient?.name || ing.id}</span>
      <span class="rd-ing-qty">${Engine.fmtQty(qty, ing.unit)}</span>
    </div>`;
  }).join('');

  // Steps — numbered circles instead of gradient images
  $('rd-steps').innerHTML = r.steps.map((step, i) =>
    `<div class="cook-step" onclick="this.classList.toggle('done')">
      <div class="cook-step-body">
        <div class="cook-step-num">${i + 1}</div>
        <div class="cook-step-txt">${step}</div>
      </div>
    </div>`
  ).join('');
}

function adjSrv(d) {
  detailServings = Math.max(1, Math.min(12, detailServings + d));
  renderRecipeDetail();
  toast('Scaled to ' + detailServings + ' servings');
}

function addToPlan() {
  if (state.plan.length === 0) {
    generatePlan();
  } else {
    toast('Added to plan');
    go('s-plan');
  }
}

// ══════════════════════════════════════════════
// SWAP MODAL
// ══════════════════════════════════════════════
let swapDay = 0, swapSlot = '';

function openSwapModal(day, slot) {
  swapDay = day;
  swapSlot = slot;
  const current = state.plan.find(e => e.day === day && e.slot === slot);
  const currentRecipe = current ? RECIPES.find(r => r.id === current.recipe) : null;

  const alternatives = RECIPES.filter(r =>
    r.meal.includes(slot) && (!currentRecipe || r.id !== currentRecipe.id)
  ).slice(0, 5);

  let html = `<div class="mdl-bar"></div>
    <h3>Swap ${DAY_NAMES[day]} ${SLOT_NAMES[slot]}</h3>
    <div class="sub">${currentRecipe ? 'Current: ' + currentRecipe.name + ' (' + Engine.fmt(Engine.recipeCost(currentRecipe, state.servings)) + ')' : 'Empty slot'}</div>`;

  for (const r of alternatives) {
    const cost = Engine.recipeCost(r, state.servings);
    const saving = currentRecipe ? Engine.recipeCost(currentRecipe, state.servings) - cost : 0;
    const swPhoto = (typeof PHOTOS!=='undefined'?PHOTOS:{})[r.id]||'';
    html += `<div class="sw-opt" onclick="doSwap('${r.id}')">
      <div class="sw-img" style="${swPhoto?'background:url('+swPhoto+') center/cover;':''}">${swPhoto?'':r.ico}</div>
      <div class="sw-info"><div class="sw-nm">${r.name}</div><div class="sw-bn">${r.bn}</div></div>
      <div class="sw-rt"><div class="sw-pr">${Engine.fmt(cost)}</div>
      ${saving > 0 ? `<div class="sw-tg">Save ${Engine.fmt(saving)}</div>` : ''}</div>
    </div>`;
  }
  html += '<button class="btn btn-ghost mt-12" onclick="closeModal(\'m-swap\')">Cancel</button>';

  $('swap-content').innerHTML = html;
  $('m-swap').classList.add('on');
}

function doSwap(recipeId) {
  const idx = state.plan.findIndex(e => e.day === swapDay && e.slot === swapSlot);
  if (idx >= 0) {
    state.plan[idx].recipe = recipeId;
    state.shoppingList = null;
    closeModal('m-swap');
    renderPlan();
    const newR = RECIPES.find(r => r.id === recipeId);
    toast('Swapped to ' + (newR?.name || recipeId));
  }
}

function openPickerModal(day, slot) {
  swapDay = day;
  swapSlot = slot;
  const options = RECIPES.filter(r => r.meal.includes(slot)).slice(0, 6);

  let html = `<div class="mdl-bar"></div><h3>Add ${SLOT_NAMES[slot]}</h3><div class="sub">${DAY_NAMES[day]} &middot; Pick a dish</div>`;

  for (const r of options) {
    const cost = Engine.recipeCost(r, state.servings);
    const pkPhoto = (typeof PHOTOS!=='undefined'?PHOTOS:{})[r.id]||'';
    html += `<div class="sw-opt" onclick="pickDish('${r.id}')">
      <div class="sw-img" style="${pkPhoto?'background:url('+pkPhoto+') center/cover;':''}">${pkPhoto?'':r.ico}</div>
      <div class="sw-info"><div class="sw-nm">${r.name}</div><div class="sw-bn">${r.bn}</div></div>
      <div class="sw-rt"><div class="sw-pr">${Engine.fmt(cost)}</div><div class="sw-tg">${r.time}m &middot; ${r.diff}</div></div>
    </div>`;
  }
  html += '<button class="btn btn-ghost mt-8" onclick="closeModal(\'m-swap\')">Cancel</button>';

  $('swap-content').innerHTML = html;
  $('m-swap').classList.add('on');
}

function pickDish(recipeId) {
  const idx = state.plan.findIndex(e => e.day === swapDay && e.slot === swapSlot);
  if (idx >= 0) {
    state.plan[idx].recipe = recipeId;
  } else {
    state.plan.push({ day: swapDay, slot: swapSlot, recipe: recipeId });
  }
  state.shoppingList = null;
  closeModal('m-swap');
  renderPlan();
  const r = RECIPES.find(x => x.id === recipeId);
  toast('Added ' + (r?.name || ''));
}

// ══════════════════════════════════════════════
// MODALS & LOADING
// ══════════════════════════════════════════════
function closeModal(id) { $(id).classList.remove('on'); }
function showLoad(t, s) { $('ld-t').textContent = t; $('ld-s').textContent = s; $('ld').classList.add('on'); }
function hideLoad() { $('ld').classList.remove('on'); }

// ══════════════════════════════════════════════
// STORE SELECTION & HANDOFF
// ══════════════════════════════════════════════
let selectedStore = 'foodpanda';
const STORES = {
  foodpanda: { name: 'Foodpanda' },
  unimart:   { name: 'Unimart' },
  shwapno:   { name: 'Shwapno' },
  meena:     { name: 'Meena Bazar' },
};

function selectStore(el, storeId) {
  selectedStore = storeId;
  $$('.store-card').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  $('send-btn').innerHTML = 'Send to ' + STORES[storeId].name + ' &rarr;';
  toast(STORES[storeId].name + ' selected');
}

function sendToStore() {
  $('handoff-store').textContent = STORES[selectedStore].name;
  go('s-handoff');
}

function completeHandoff() {
  showLoad('Sending basket to ' + STORES[selectedStore].name + '...', 'Adding items to their cart');
  setTimeout(() => {
    hideLoad();
    $('sent-store').textContent = STORES[selectedStore].name;
    $('sent-store2').textContent = STORES[selectedStore].name;
    go('s-sent');
    toast('Basket sent to ' + STORES[selectedStore].name + '!');
  }, 2000);
}

// ══════════════════════════════════════════════
// COOKING MODE
// ══════════════════════════════════════════════
let cookRecipe = null, cookStep = 0;

function startCooking(recipeId) {
  cookRecipe = RECIPES.find(r => r.id === (recipeId || detailRecipeId));
  if (!cookRecipe) { toast('Recipe not found'); return; }
  cookStep = 0;
  renderCookStep();
  go('s-cook');
}

function renderCookStep() {
  if (!cookRecipe) return;
  const step = cookRecipe.steps[cookStep];
  $('ck-name').textContent = cookRecipe.name;
  $('ck-cur').textContent = 'Step ' + (cookStep + 1) + ' of ' + cookRecipe.steps.length;
  $('ck-txt').textContent = step;
  $('ck-sn').textContent = 'Step ' + (cookStep + 1);

  // Show recipe photo in visual area
  const ph = typeof PHOTOS !== 'undefined' ? PHOTOS : {};
  const photo = ph[cookRecipe.id] || '';
  if (photo) {
    $('ck-vis').style.backgroundImage = 'url(' + photo + ')';
    $('ck-vis').style.backgroundSize = 'cover';
    $('ck-vis').style.backgroundPosition = 'center';
    $('ck-vis').textContent = '';
  } else {
    $('ck-vis').style.backgroundImage = '';
    $('ck-vis').textContent = cookRecipe.ico;
  }

  $('ck-prog').innerHTML = cookRecipe.steps.map((_, i) =>
    `<div class="cook-dot ${i < cookStep ? 'done' : i === cookStep ? 'cur' : ''}"></div>`
  ).join('');

  $('ck-prev').style.visibility = cookStep === 0 ? 'hidden' : 'visible';
  $('ck-next').textContent = cookStep === cookRecipe.steps.length - 1 ? 'Finish Cooking' : 'Next Step';

  const timeMatch = step.match(/(\d+)\s*min/i);
  $('ck-timer').innerHTML = timeMatch
    ? `<b>${timeMatch[1]}:00</b> for this step`
    : '';
}

function ckNav(d) {
  if (cookStep === cookRecipe.steps.length - 1 && d > 0) {
    go('s-detail');
    toast('Cooking complete! Enjoy your meal');
    return;
  }
  cookStep = Math.max(0, Math.min(cookRecipe.steps.length - 1, cookStep + d));
  renderCookStep();
}

// ══════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════
function initPantry() {
  state.pantryOwned = Object.entries(INGREDIENTS)
    .filter(([_, v]) => v.staple)
    .map(([k]) => k);
}

initPantry();
