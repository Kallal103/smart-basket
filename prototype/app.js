/* ══════════════════════════════════════════════════════════════
   SMART BASKET v3 — App Logic (state-driven, all interactions)
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

// ── FILTER CAT (from home picture cards) ──
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

  // Screen-specific rendering
  if (id === 's-browse') renderRecipeGrid();
  if (id === 's-plan') {
    if (state.plan.length === 0) {
      $('plan-days').innerHTML = '<div style="text-align:center;padding:40px 20px;color:var(--t3)"><div style="font-size:48px;margin-bottom:12px">📅</div><div style="font-size:16px;font-weight:600;color:var(--t2)">No plan yet</div><div style="font-size:14px;margin-top:4px">Tap "Plan for me" from Home to generate one</div><button class="btn btn-brand mt-16" onclick="go(\'s-setup\')">✨ Plan for me</button></div>';
      $('bb-amt').innerHTML = '৳0';
      $('bb-badge').textContent = 'No plan';
      $('bb-fill').style.width = '0';
    } else {
      renderPlan();
    }
  }
  if (id === 's-basket') {
    if (state.plan.length === 0) {
      $('list-items').innerHTML = '<div style="text-align:center;padding:40px 20px;color:var(--t3)"><div style="font-size:48px;margin-bottom:12px">🛒</div><div style="font-size:16px;font-weight:600;color:var(--t2)">Your basket is empty</div><div style="font-size:14px;margin-top:4px">Create a meal plan first</div><button class="btn btn-brand mt-16" onclick="go(\'s-setup\')">✨ Plan for me</button></div>';
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
  t.innerHTML = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ══════════════════════════════════════════════
// MARK MEAL DONE (Today's Meals)
// ══════════════════════════════════════════════
function markDone(btn) {
  const card = btn.closest('.today-card');
  if (card) {
    card.style.opacity = '0.35';
    const nm = card.querySelector('.today-card-name');
    if (nm) nm.style.textDecoration = 'line-through';
  }
  btn.textContent = '✓ Done';
  btn.disabled = true;
  btn.style.background = 'var(--ok-lt)';
  btn.style.color = 'var(--ok)';
  btn.style.borderColor = 'var(--ok)';
  toast('Meal done! 🎉');
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
    toast('✨ Plan generated — ' + state.plan.length + ' meals');
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

  // Budget bar
  $('bb-amt').innerHTML = Engine.fmt(totalCost);
  $('bb-sub').textContent = 'of ' + Engine.fmt(state.budget);
  const pct = Math.min((totalCost / state.budget) * 100, 100);
  $('bb-fill').style.width = pct + '%';
  $('bb-fill').className = 'bbar-fill ' + (totalCost <= state.budget ? 'ok' : 'over');
  $('bb-badge').textContent = totalCost <= state.budget
    ? 'Under by ' + Engine.fmt(underBudget)
    : 'Over by ' + Engine.fmt(-underBudget);
  $('bb-badge').className = 'badge ' + (totalCost <= state.budget ? 'b-ok' : 'b-brand');

  // Days
  let html = '';
  for (let d = 0; d < 7; d++) {
    const dayEntries = state.plan.filter(e => e.day === d);
    html += `<div class="plan-day"><div class="plan-day-h"><span class="day-name">${DAY_NAMES[d]} · ${DAY_DATES[d]}</span><span class="day-cost">${Engine.fmt(dayCosts[d])}</span></div>`;
    for (const slot of ['breakfast', 'lunch', 'dinner']) {
      const entry = dayEntries.find(e => e.slot === slot);
      const recipe = entry ? RECIPES.find(r => r.id === entry.recipe) : null;
      if (recipe) {
        const cost = Engine.recipeCost(recipe, state.servings);
        const mealPhoto = (typeof PHOTOS!=='undefined'?PHOTOS:{})[recipe.id]||'';
        html += `<div class="plan-meal" onclick="showRecipeDetail('${recipe.id}')">
          <div class="plan-meal-img ${recipe.img || 'g1'}" style="${mealPhoto?'background:url('+mealPhoto+') center/cover;':''}font-size:${mealPhoto?'0':'28px'}">${mealPhoto?'':recipe.ico}</div>
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
          <div class="plan-meal-img" style="background:var(--border-lt)">${SLOT_ICONS[slot]}</div>
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
    html += `<div class="basket-cat"><div class="basket-cat-h"><span style="font-size:16px">${meta.icon}</span> ${meta.label}`;
    if (cat === 'pantry') html += ' <span class="badge b-warn" style="margin-left:4px">Already have?</span>';
    html += '</div>';

    for (const item of items) {
      const ico = icos[item.ingredientId] || '📦';
      const checkClass = item.owned ? ' on' : '';
      const strikeStyle = item.owned ? ' style="text-decoration:line-through"' : '';

      html += `<div class="basket-item${item.owned?' owned':''}${item.isStaple?' staple':''}" onclick="toggleListItem(this,'${item.ingredientId}')">
        <div class="bi-chk${checkClass}">${item.owned ? '✓' : ''}</div>
        <div class="basket-img">${ico}</div>
        <div class="bi-info">
          <div class="bi-name"${strikeStyle}>${item.name}</div>
          <div class="bi-detail"><b>${item.brand}</b> · ${Engine.fmtQty(item.packSize * item.packs, item.packUnit)}</div>
          <div class="bi-src">For: ${item.usedIn.slice(0, 2).join(', ')}${item.usedIn.length > 2 ? ' +' + (item.usedIn.length - 2) : ''}</div>
          ${item.fresh ? '<div style="font-size:11px;color:var(--warn);margin-top:1px">🟠 Buy fresh</div>' : ''}
          ${item.isStaple ? '<div style="font-size:11px;color:var(--warn);margin-top:1px">Tap to toggle "already have"</div>' : ''}
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
  toast(idx >= 0 ? 'Added to basket' : 'Marked as "already have"');
}

function filterShoppingList() {
  const q = $('list-search').value.toLowerCase();
  $$('#list-items .basket-item').forEach(li => {
    const name = li.querySelector('.bi-name').textContent.toLowerCase();
    li.style.display = name.includes(q) ? '' : 'none';
  });
}

// ══════════════════════════════════════════════
// RENDER: RECIPE GRID
// ══════════════════════════════════════════════
function renderRecipeGrid(query) {
  const q = (query || '').toLowerCase();
  const items = RECIPES.filter(r =>
    (recipeCat === 'all' || r.cat.includes(recipeCat)) &&
    (!q || r.name.toLowerCase().includes(q) || r.bn.includes(q))
  );

  const ph = typeof PHOTOS !== 'undefined' ? PHOTOS : {};
  $('r-grid').innerHTML = items.map(r => {
    const cost = Engine.recipeCost(r, state.servings);
    const diffBadge = r.diff === 'Easy' ? 'b-ok' : r.diff === 'Medium' ? 'b-warn' : 'b-brand';
    const photo = ph[r.id] || ph._fallback || '';
    return `<div class="food-card" onclick="showRecipeDetail('${r.id}')">
      <div class="food-img ${r.img}" style="${photo ? 'background:url('+photo+') center/cover;' : ''}">
        ${photo ? '' : r.ico}
        <span class="badge ${diffBadge} food-badge">${r.diff}</span>
        <span class="food-time">⏱ ${r.time}m</span>
      </div>
      <div class="food-info">
        <div class="food-name">${r.name}</div>
        <div class="food-bn">${r.bn}</div>
        <div class="food-meta">
          <span class="food-price">${Engine.fmt(cost)}</span>
          ${r.spice ? `<span class="food-rating">${'🌶️'.repeat(r.spice)}</span>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');
}

function filterRecipeCat(el, cat) {
  $$('#r-pills .pill').forEach(p => p.classList.remove('on'));
  el.classList.add('on');
  recipeCat = cat;
  renderRecipeGrid($('r-q')?.value);
}

// ══════════════════════════════════════════════
// RECIPE DETAIL
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
  $('rd-hero').className = 'rd-hero ' + (r.img || 'g1');
  $('rd-hero').style.backgroundImage = photo ? 'url(' + photo + ')' : '';
  $('rd-hero').style.backgroundSize = 'cover';
  $('rd-hero').style.backgroundPosition = 'center';
  $('rd-hero').innerHTML = (photo ? '' : r.ico) + `<div class="rd-hero-overlay"><h2>${r.name}</h2><div style="font-family:var(--bn);font-size:16px;opacity:.85">${r.bn}</div></div>`;
  $('rd-time').textContent = r.time;
  $('rd-diff').textContent = r.diff;
  $('rd-cost').innerHTML = Engine.fmt(Engine.recipeCost(r, detailServings));
  $('srv-v').textContent = detailServings;

  // Ingredients (scaled)
  $('rd-ings').innerHTML = r.ingredients.map(ing => {
    const ingredient = INGREDIENTS[ing.id];
    const qty = ing.qty * detailServings;
    return `<div class="rd-ing-row">
      <span class="rd-ing-name">${ingredient?.name || ing.id}</span>
      <span class="rd-ing-qty">${Engine.fmtQty(qty, ing.unit)}</span>
    </div>`;
  }).join('');

  // Steps (visual cards)
  const stepGrads = ['g1','g6','g3','g4','g2','g5','g1'];
  $('rd-steps').innerHTML = r.steps.map((step, i) =>
    `<div class="cook-step" onclick="this.classList.toggle('done')">
      <div class="cook-step-img ${stepGrads[i % stepGrads.length]}" style="font-size:32px">${i === r.steps.length - 1 ? '🍽️' : '🔥'}</div>
      <div class="cook-step-body">
        <div class="cook-step-n">Step ${i + 1}</div>
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
    // Auto-generate plan first, then user can swap
    generatePlan();
  } else {
    toast('Added to plan!');
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
      <div class="sw-img ${r.img || 'g1'}" style="${swPhoto?'background:url('+swPhoto+') center/cover;font-size:0':''}">${swPhoto?'':r.ico}</div>
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
    toast('Swapped to ' + (newR?.name || recipeId) + ' ✓');
  }
}

// ── Picker modal (for empty slots & "Choose my meals") ──
function openPickerModal(day, slot) {
  swapDay = day;
  swapSlot = slot;
  const options = RECIPES.filter(r => r.meal.includes(slot)).slice(0, 6);

  let html = `<div class="mdl-bar"></div><h3>Add ${SLOT_NAMES[slot]}</h3><div class="sub">${DAY_NAMES[day]} · Pick a dish</div>`;

  for (const r of options) {
    const cost = Engine.recipeCost(r, state.servings);
    const pkPhoto = (typeof PHOTOS!=='undefined'?PHOTOS:{})[r.id]||'';
    html += `<div class="sw-opt" onclick="pickDish('${r.id}')">
      <div class="sw-img ${r.img || 'g1'}" style="${pkPhoto?'background:url('+pkPhoto+') center/cover;font-size:0':''}">${pkPhoto?'':r.ico}</div>
      <div class="sw-info"><div class="sw-nm">${r.name}</div><div class="sw-bn">${r.bn}</div></div>
      <div class="sw-rt"><div class="sw-pr">${Engine.fmt(cost)}</div><div class="sw-tg">${r.time}m · ${r.diff}</div></div>
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
  toast('Added ' + (r?.name || '') + ' ✓');
}

// ══════════════════════════════════════════════
// MODALS
// ══════════════════════════════════════════════
function closeModal(id) { $(id).classList.remove('on'); }

// ══════════════════════════════════════════════
// LOADING
// ══════════════════════════════════════════════
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
  $('send-btn').textContent = 'Send to ' + STORES[storeId].name + ' →';
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
    toast('✅ Basket sent to ' + STORES[selectedStore].name + '!');
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
  $('ck-vis').textContent = cookStep === cookRecipe.steps.length - 1 ? '🍽️' : cookRecipe.ico;

  // Progress dots
  $('ck-prog').innerHTML = cookRecipe.steps.map((_, i) =>
    `<div class="cook-dot ${i < cookStep ? 'done' : i === cookStep ? 'cur' : ''}"></div>`
  ).join('');

  $('ck-prev').style.visibility = cookStep === 0 ? 'hidden' : 'visible';
  $('ck-next').textContent = cookStep === cookRecipe.steps.length - 1 ? 'Finish Cooking' : 'Next Step';

  // Timer hint
  const timeMatch = step.match(/(\d+)\s*min/i);
  $('ck-timer').innerHTML = timeMatch
    ? `⏱ <b>${timeMatch[1]}:00</b> for this step`
    : '';
}

function ckNav(d) {
  if (cookStep === cookRecipe.steps.length - 1 && d > 0) {
    go('s-detail');
    toast('Cooking complete! Enjoy your meal 🍽️');
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
