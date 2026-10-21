/* ══════════════════════════════════════════════════════════════
   SMART BASKET — App Logic (state-driven rendering)
   ══════════════════════════════════════════════════════════════ */

// ── APP STATE ──
const state = {
  screen: 's-welcome',
  household: 4,
  budget: 3000,
  exclusions: ['no_beef'],
  maxCookTime: 0, // 0 = no limit
  plan: [],
  pantryOwned: [], // ingredient IDs user already has
  shoppingList: null,
  servings: 4,
};

// ── DOM HELPERS ──
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

// ══════════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════════
function go(id) {
  $$('.scr').forEach(s => s.classList.remove('on'));
  $(id).classList.add('on');
  state.screen = id;
  window.scrollTo(0, 0);

  // Screen-specific init
  if (id === 's-recipes') renderRecipeGrid();
  if (id === 's-plan') renderPlan();
  if (id === 's-list') renderShoppingList();
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
  // Sync exclusions
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
    state.shoppingList = null; // reset
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
    html += `<div class="day"><div class="day-h">${DAY_NAMES[d]} <span class="day-dt">${DAY_DATES[d]}</span><span class="day-cost">${Engine.fmt(dayCosts[d])}</span></div>`;
    for (const slot of ['breakfast', 'lunch', 'dinner']) {
      const entry = dayEntries.find(e => e.slot === slot);
      const recipe = entry ? RECIPES.find(r => r.id === entry.recipe) : null;
      if (recipe) {
        const cost = Engine.recipeCost(recipe, state.servings);
        html += `<div class="sl" onclick="showRecipeDetail('${recipe.id}')">
          <span class="sl-ico">${SLOT_ICONS[slot]}</span>
          <div class="sl-body">
            <div class="sl-lbl">${SLOT_NAMES[slot]}</div>
            <div class="sl-name">${recipe.name}</div>
            <div class="sl-bn">${recipe.bn}</div>
          </div>
          <div class="sl-pr">${Engine.fmt(cost)}</div>
          <span class="sl-swap" onclick="event.stopPropagation();openSwapModal(${d},'${slot}')">Swap</span>
        </div>`;
      } else {
        html += `<div class="sl" onclick="openPickerModal(${d},'${slot}')">
          <span class="sl-ico">${SLOT_ICONS[slot]}</span>
          <div class="sl-body"><div class="sl-lbl">${SLOT_NAMES[slot]}</div><div class="sl-empty">Tap to add</div></div>
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

  // Summary
  $('ls-items').textContent = list.items.length;
  $('ls-total').innerHTML = Engine.fmt(list.payable);
  $('ls-under').innerHTML = Engine.fmt(state.budget - list.payable);

  // Group by category
  const groups = {};
  for (const item of list.items) {
    if (!groups[item.category]) groups[item.category] = [];
    groups[item.category].push(item);
  }

  let html = '';
  for (const [cat, items] of Object.entries(groups)) {
    const meta = CATEGORY_META[cat] || { label: cat, icon: '📦' };
    const isStapleGroup = cat === 'pantry';

    html += `<div class="cat"><div class="cat-h"><span style="font-size:16px">${meta.icon}</span> ${meta.label}`;
    if (isStapleGroup) html += ' <span class="badge b-warn" style="margin-left:4px">Already have?</span>';
    html += '</div>';

    for (const item of items) {
      const doneClass = item.owned ? ' done' : '';
      const stapleClass = item.isStaple ? ' staple' : '';
      const checkClass = item.owned ? ' on' : '';
      const strikeStyle = item.owned ? ' style="text-decoration:line-through"' : '';

      html += `<div class="li${doneClass}${stapleClass}" onclick="toggleListItem(this,'${item.ingredientId}')">
        <div class="li-chk${checkClass}">${item.owned ? '✓' : ''}</div>
        <div class="li-info">
          <div class="li-n"${strikeStyle}>${item.name}</div>
          <div class="li-prod"><b>${item.brand}</b> · ${Engine.fmtQty(item.packSize * item.packs, item.packUnit)}</div>
          <div class="li-src">For: ${item.usedIn.slice(0, 3).join(', ')}${item.usedIn.length > 3 ? ' +' + (item.usedIn.length - 3) : ''}</div>
          <div class="li-need">Need ${Engine.fmtQty(item.needed, item.unit)} · buying ${Engine.fmtQty(item.packSize * item.packs, item.packUnit)}${item.waste > 0 ? ' · ' + Engine.fmtQty(item.waste, item.unit) + ' extra' : ''}</div>
          ${item.fresh ? '<div class="li-fresh now">🟠 Buy day-of (fresh)</div>' : ''}
          ${item.isStaple ? '<div class="li-tag warn">Pantry staple — tap if you need to buy</div>' : ''}
        </div>
        <div class="li-rt">
          <div class="li-qty">${item.packs > 1 ? item.packs + '×' : ''}${Engine.fmtQty(item.packSize, item.packUnit)}</div>
          <div class="li-pr">${Engine.fmt(item.totalPrice)}</div>
        </div>
      </div>`;
    }
    html += '</div>';
  }

  $('list-items').innerHTML = html;

  // Totals
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
}

function filterShoppingList() {
  const q = $('list-search').value.toLowerCase();
  $$('#list-items .li').forEach(li => {
    const name = li.querySelector('.li-n').textContent.toLowerCase();
    li.style.display = name.includes(q) ? '' : 'none';
  });
}

// ══════════════════════════════════════════════
// RENDER: RECIPE GRID
// ══════════════════════════════════════════════
let recipeCat = 'all';

function renderRecipeGrid(query) {
  const q = (query || '').toLowerCase();
  const items = RECIPES.filter(r =>
    (recipeCat === 'all' || r.cat.includes(recipeCat)) &&
    (!q || r.name.toLowerCase().includes(q) || r.bn.includes(q))
  );

  $('r-grid').innerHTML = items.map(r => {
    const cost = Engine.recipeCost(r, state.servings);
    const diffBadge = r.diff === 'Easy' ? 'b-ok' : r.diff === 'Medium' ? 'b-warn' : 'b-brand';
    return `<div class="r-card" onclick="showRecipeDetail('${r.id}')">
      <div class="r-img ${r.img}">${r.ico}<span class="badge ${diffBadge} r-diff">${r.diff}</span></div>
      <div class="r-info">
        <div class="r-name">${r.name}</div>
        <div class="r-bn">${r.bn}</div>
        <div class="r-meta">
          <span class="r-tag">⏱${r.time}m</span>
          <span class="r-tag">${Engine.fmt(cost)}</span>
          ${r.spice ? `<span class="r-tag">${'🌶️'.repeat(r.spice)}</span>` : ''}
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
  $('rd-hero').textContent = r.ico;
  $('rd-hero').className = 'rd-hero ' + r.img;
  $('rd-title').textContent = r.name;
  $('rd-bn').textContent = r.bn;
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

  // Steps
  $('rd-steps').innerHTML = r.steps.map((step, i) =>
    `<div class="rd-step" onclick="this.classList.toggle('done')">
      <div class="rd-step-n">${i + 1}</div>
      <div class="rd-step-txt">${step}</div>
    </div>`
  ).join('');
}

function adjSrv(d) {
  detailServings = Math.max(1, Math.min(12, detailServings + d));
  renderRecipeDetail();
}

function addToPlan() {
  toast('Added to plan! Choose a slot from the planner.');
  go('s-plan');
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

  // Find alternatives for same meal slot
  const alternatives = RECIPES.filter(r =>
    r.meal.includes(slot) && (!currentRecipe || r.id !== currentRecipe.id)
  ).slice(0, 5);

  let html = `<div class="mdl-bar"></div>
    <h3>Swap ${DAY_NAMES[day]} ${SLOT_NAMES[slot]}</h3>
    <div class="sub">${currentRecipe ? 'Current: ' + currentRecipe.name + ' (' + Engine.fmt(Engine.recipeCost(currentRecipe, state.servings)) + ')' : 'Empty slot'}</div>`;

  for (const r of alternatives) {
    const cost = Engine.recipeCost(r, state.servings);
    const saving = currentRecipe ? Engine.recipeCost(currentRecipe, state.servings) - cost : 0;
    html += `<div class="sw-opt" onclick="doSwap('${r.id}')">
      <div><div class="sw-nm">${r.ico} ${r.name}</div><div class="sw-bn">${r.bn}</div></div>
      <div style="text-align:right"><div class="sw-pr">${Engine.fmt(cost)}</div>
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
    const oldRecipe = state.plan[idx].recipe;
    state.plan[idx].recipe = recipeId;
    state.shoppingList = null; // force recalc
    closeModal('m-swap');
    renderPlan();
    const newR = RECIPES.find(r => r.id === recipeId);
    toast('Swapped to ' + (newR?.name || recipeId));
  }
}

// ── Picker modal (for empty slots) ──
function openPickerModal(day, slot) {
  swapDay = day;
  swapSlot = slot;
  const options = RECIPES.filter(r => r.meal.includes(slot)).slice(0, 6);

  let html = `<div class="mdl-bar"></div><h3>Add ${SLOT_NAMES[slot]}</h3><div class="sub">${DAY_NAMES[day]} · Pick a dish</div>
    <div class="search" style="margin:0 0 10px"><span class="search-ico">🔍</span><input placeholder="Search..."></div>`;

  for (const r of options) {
    const cost = Engine.recipeCost(r, state.servings);
    html += `<div class="pick-r" onclick="pickDish('${r.id}')">
      <span class="pick-ico">${r.ico}</span>
      <div><div class="pick-nm">${r.name}</div><div class="pick-mt">${r.time}m · ${r.diff}</div></div>
      <div class="pick-pr">${Engine.fmt(cost)}</div>
    </div>`;
  }
  html += '<button class="btn btn-ghost mt-8" onclick="closeModal(\'m-pick\')">Cancel</button>';

  $('pick-content').innerHTML = html;
  $('m-pick').classList.add('on');
}

function pickDish(recipeId) {
  // Add or replace
  const idx = state.plan.findIndex(e => e.day === swapDay && e.slot === swapSlot);
  if (idx >= 0) {
    state.plan[idx].recipe = recipeId;
  } else {
    state.plan.push({ day: swapDay, slot: swapSlot, recipe: recipeId });
  }
  state.shoppingList = null;
  closeModal('m-pick');
  renderPlan();
  const r = RECIPES.find(x => x.id === recipeId);
  toast('Added ' + (r?.name || ''));
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
// CART / CHECKOUT
// ══════════════════════════════════════════════
function addToCart() {
  showLoad('Adding to cart...', 'Sending items');
  setTimeout(() => {
    hideLoad();
    go('s-checkout');
    toast('🛒 Items added to cart!');
  }, 1500);
}

// ══════════════════════════════════════════════
// THEME
// ══════════════════════════════════════════════
function setTheme(t) {
  const p = $('phone');
  p.className = 'phone';
  if (t) p.classList.add(t);
  $$('.theme-btn').forEach(b => b.classList.remove('on'));
  event.target.classList.add('on');
}

// ══════════════════════════════════════════════
// COOKING MODE
// ══════════════════════════════════════════════
let cookRecipe = null, cookStep = 0;

function startCooking(recipeId) {
  cookRecipe = RECIPES.find(r => r.id === (recipeId || detailRecipeId));
  cookStep = 0;
  renderCookStep();
  go('s-cook');
}

function renderCookStep() {
  if (!cookRecipe) return;
  const step = cookRecipe.steps[cookStep];
  $('ck-name').textContent = cookRecipe.name;
  $('ck-cur').textContent = (cookStep + 1) + ' of ' + cookRecipe.steps.length;
  $('ck-txt').textContent = step;
  $('ck-step-n').textContent = 'Step ' + (cookStep + 1);

  // Progress dots
  $('ck-prog').innerHTML = cookRecipe.steps.map((_, i) =>
    `<div class="cook-dot ${i < cookStep ? 'done' : i === cookStep ? 'cur' : ''}"></div>`
  ).join('');

  $('ck-prev').style.visibility = cookStep === 0 ? 'hidden' : 'visible';
  $('ck-next').textContent = cookStep === cookRecipe.steps.length - 1 ? 'Finish' : 'Next Step';

  // Show ingredients relevant to this step
  const ings = cookRecipe.ingredients.slice(0, 3); // simplified
  $('ck-ings').innerHTML = '<div class="cook-ings-t">Ingredients</div>' +
    ings.map(i => {
      const ing = INGREDIENTS[i.id];
      return `<div class="cook-ig"><span>${ing?.name || i.id}</span><span>${Engine.fmtQty(i.qty * state.servings, i.unit)}</span></div>`;
    }).join('');
}

function ckNav(d) {
  if (cookStep === cookRecipe.steps.length - 1 && d > 0) {
    go('s-detail');
    toast('Cooking complete! 🍽️');
    return;
  }
  cookStep = Math.max(0, Math.min(cookRecipe.steps.length - 1, cookStep + d));
  renderCookStep();
}

// ══════════════════════════════════════════════
// AI REQUEST (simulated)
// ══════════════════════════════════════════════
function aiRequest() {
  const txt = $('ai-txt').value;
  if (!txt.trim()) return;
  showLoad('AI updating...', '"' + txt + '"');
  $('ai-txt').value = '';
  setTimeout(() => {
    hideLoad();
    // Simulate: swap Friday lunch to something special
    const fri = state.plan.findIndex(e => e.day === 6 && e.slot === 'lunch');
    if (fri >= 0) state.plan[fri].recipe = 'chicken_biryani';
    renderPlan();
    toast('✨ AI updated your plan');
  }, 1800);
}

// ══════════════════════════════════════════════
// INIT: Auto-populate pantry staples as owned
// ══════════════════════════════════════════════
function initPantry() {
  state.pantryOwned = Object.entries(INGREDIENTS)
    .filter(([_, v]) => v.staple)
    .map(([k]) => k);
}

// ══════════════════════════════════════════════
// POST-CHECKOUT: Mark meal done
// ══════════════════════════════════════════════
function markMealDone(btn) {
  const card = btn.closest('[style*="background"]').parentElement;
  card.style.opacity = '0.4';
  btn.textContent = '✓ Done';
  btn.disabled = true;
  btn.style.background = 'var(--ok-lt)';
  btn.style.color = 'var(--ok)';
  btn.style.borderColor = 'var(--ok)';
  toast('Meal marked as done!');
}

// ══════════════════════════════════════════════
// POST-CHECKOUT: Update confirmed screen totals
// ══════════════════════════════════════════════
function updateConfirmation() {
  if (state.shoppingList) {
    const el = document.getElementById('conf-items');
    if (el) el.textContent = state.shoppingList.items.length + ' items';
    const tot = document.getElementById('conf-total');
    if (tot) tot.innerHTML = Engine.fmt(state.shoppingList.payable);
  }
}

initPantry();
