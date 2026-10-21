/* ══════════════════════════════════════════════════════════════
   SMART BASKET — Calculation Engine
   Scaling, aggregation, pack matching, budgeting
   ══════════════════════════════════════════════════════════════ */

const Engine = {
  // ── Calculate cost of a single recipe for given servings ──
  recipeCost(recipe, servings) {
    let total = 0;
    for (const ing of recipe.ingredients) {
      const qty = ing.qty * servings;
      const products = PRODUCTS[ing.id];
      if (!products || products.length === 0) continue;
      const pack = this.bestPack(products, qty, ing.unit);
      total += pack.totalPrice;
    }
    return Math.round(total);
  },

  // ── Find cheapest pack combination to cover a quantity ──
  bestPack(products, needed, unit) {
    // Pick smallest pack that covers the need (least waste)
    const sorted = [...products].sort((a, b) => a.size - b.size);
    for (const p of sorted) {
      if (p.size >= needed) {
        return { ...p, packs: 1, totalPrice: p.price, waste: p.size - needed };
      }
    }
    // Need multiple of largest pack
    const largest = sorted[sorted.length - 1];
    const packs = Math.ceil(needed / largest.size);
    return { ...largest, packs, totalPrice: largest.price * packs, waste: (largest.size * packs) - needed };
  },

  // ── Generate shopping list from meal plan ──
  // Returns { items: [...], totalIngredientCost, totalPackCost, pantryDeduction }
  generateShoppingList(plan, servings, pantryOwned) {
    // 1. Aggregate all ingredients across all meals
    const agg = {}; // ingredientId -> { totalQty, unit, usedIn: [recipe names] }

    for (const entry of plan) {
      if (!entry.recipe) continue;
      const recipe = RECIPES.find(r => r.id === entry.recipe);
      if (!recipe) continue;

      for (const ing of recipe.ingredients) {
        const qty = ing.qty * servings;
        if (!agg[ing.id]) {
          agg[ing.id] = { totalQty: 0, unit: ing.unit, usedIn: [] };
        }
        agg[ing.id].totalQty += qty;
        if (!agg[ing.id].usedIn.includes(recipe.name)) {
          agg[ing.id].usedIn.push(recipe.name);
        }
      }
    }

    // 2. Match to store products (packs)
    const items = [];
    let totalPackCost = 0;
    let pantryDeduction = 0;

    for (const [ingId, data] of Object.entries(agg)) {
      const ingredient = INGREDIENTS[ingId];
      if (!ingredient) continue;

      const products = PRODUCTS[ingId];
      if (!products || products.length === 0) continue;

      const pack = this.bestPack(products, data.totalQty, data.unit);
      const isStaple = ingredient.staple;
      const owned = pantryOwned.includes(ingId);

      const item = {
        ingredientId: ingId,
        name: ingredient.name,
        bn: ingredient.bn,
        category: ingredient.cat,
        needed: Math.round(data.totalQty),
        unit: data.unit,
        brand: pack.brand,
        packSize: pack.size,
        packUnit: pack.unit,
        packs: pack.packs,
        packPrice: pack.price,
        totalPrice: pack.totalPrice,
        waste: Math.round(pack.waste),
        isStaple,
        owned,
        usedIn: data.usedIn,
        fresh: ['chicken', 'hilsha', 'rui', 'prawn', 'mutton', 'tilapia'].includes(ingId),
        allProducts: products,
      };

      if (owned) {
        pantryDeduction += item.totalPrice;
      }
      totalPackCost += item.totalPrice;
      items.push(item);
    }

    // Sort: protein first, then veg, grain, dairy, pantry
    const catOrder = { protein: 0, veg: 1, grain: 2, dairy: 3, pantry: 4 };
    items.sort((a, b) => (catOrder[a.category] ?? 5) - (catOrder[b.category] ?? 5));

    return {
      items,
      totalPackCost,
      pantryDeduction,
      payable: totalPackCost - pantryDeduction,
    };
  },

  // ── Calculate total plan cost (sum of all recipe costs) ──
  planCost(plan, servings) {
    let total = 0;
    for (const entry of plan) {
      if (!entry.recipe) continue;
      const recipe = RECIPES.find(r => r.id === entry.recipe);
      if (recipe) total += this.recipeCost(recipe, servings);
    }
    return total;
  },

  // ── Calculate per-day costs ──
  dayCosts(plan, servings) {
    const costs = {};
    for (let d = 0; d < 7; d++) costs[d] = 0;
    for (const entry of plan) {
      if (!entry.recipe) continue;
      const recipe = RECIPES.find(r => r.id === entry.recipe);
      if (recipe) costs[entry.day] += this.recipeCost(recipe, servings);
    }
    return costs;
  },

  // ── Generate a budget-aware plan ──
  // Simple: use DEFAULT_PLAN but swap expensive items if over budget
  generatePlan(budget, servings, exclusions) {
    let plan = DEFAULT_PLAN.map(e => ({ ...e }));

    // Filter out excluded recipes
    // (simplified: just use default plan for prototype)

    // Check if over budget, swap most expensive meals with cheaper alternatives
    let cost = this.planCost(plan, servings);
    const cheapAlternatives = {
      hilsha_curry: 'rui_jhol',
      chicken_biryani: 'egg_curry',
      mutton_rezala: 'chicken_curry',
      prawn_malai: 'tilapia_fry',
    };

    let attempts = 0;
    while (cost > budget && attempts < 10) {
      // Find most expensive entry
      let maxCost = 0, maxIdx = -1;
      for (let i = 0; i < plan.length; i++) {
        const r = RECIPES.find(x => x.id === plan[i].recipe);
        if (!r) continue;
        const c = this.recipeCost(r, servings);
        if (c > maxCost && cheapAlternatives[plan[i].recipe]) {
          maxCost = c;
          maxIdx = i;
        }
      }
      if (maxIdx === -1) break;
      plan[maxIdx].recipe = cheapAlternatives[plan[maxIdx].recipe];
      cost = this.planCost(plan, servings);
      attempts++;
    }

    return plan;
  },

  // ── Format currency ──
  fmt(n) {
    return '৳' + Math.round(n).toLocaleString();
  },

  // ── Format quantity with unit ──
  fmtQty(qty, unit) {
    if (unit === 'pc') return qty + ' pc';
    if (unit === 'ml' && qty >= 1000) return (qty / 1000).toFixed(1) + ' L';
    if (unit === 'g' && qty >= 1000) return (qty / 1000).toFixed(1) + ' kg';
    return Math.round(qty) + unit;
  },
};
