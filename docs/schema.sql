-- Smart Basket — Supabase PostgreSQL Schema (MVP)
-- Run this in the Supabase SQL Editor

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS & PROFILES
-- ============================================================

-- Supabase Auth handles the auth.users table.
-- This is the public profile extension.
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  household_size INT NOT NULL DEFAULT 2,
  dietary_preferences TEXT[] DEFAULT '{}',  -- e.g., {'halal', 'vegetarian', 'no-beef'}
  budget_range TEXT DEFAULT 'medium',        -- 'low', 'medium', 'high'
  subscription_tier TEXT NOT NULL DEFAULT 'free', -- 'free', 'pro'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- INGREDIENTS
-- ============================================================

CREATE TABLE public.ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en TEXT NOT NULL,
  name_bn TEXT,                              -- Bangla name
  aliases TEXT[] DEFAULT '{}',               -- e.g., {'alu', 'potato', 'আলু'}
  category TEXT NOT NULL,                    -- 'vegetable', 'protein', 'dairy', 'spice', 'pantry', 'oil', 'grain'
  default_unit TEXT NOT NULL DEFAULT 'g',    -- 'g', 'kg', 'ml', 'l', 'piece', 'tbsp', 'tsp', 'cup'
  is_staple BOOLEAN NOT NULL DEFAULT FALSE,  -- rice, oil, salt, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ingredients_category ON public.ingredients(category);
CREATE INDEX idx_ingredients_name ON public.ingredients(name_en);

-- ============================================================
-- RECIPES
-- ============================================================

CREATE TABLE public.recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = system recipe
  title TEXT NOT NULL,
  description TEXT,
  servings INT NOT NULL DEFAULT 4,
  prep_time_min INT,
  cook_time_min INT,
  cuisine TEXT DEFAULT 'bangladeshi',
  meal_type TEXT[] DEFAULT '{}',             -- {'breakfast', 'lunch', 'dinner', 'snack'}
  tags TEXT[] DEFAULT '{}',                  -- {'quick', 'budget', 'festive', 'kid-friendly'}
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recipes_user ON public.recipes(user_id);
CREATE INDEX idx_recipes_meal_type ON public.recipes USING GIN(meal_type);

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public recipes"
  ON public.recipes FOR SELECT
  USING (is_public = TRUE OR auth.uid() = user_id);

CREATE POLICY "Users can manage own recipes"
  ON public.recipes FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- RECIPE INGREDIENTS (join table)
-- ============================================================

CREATE TABLE public.recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL NOT NULL,
  unit TEXT NOT NULL DEFAULT 'g',
  notes TEXT,                                -- e.g., 'finely chopped', 'optional'
  is_optional BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_recipe_ingredients_recipe ON public.recipe_ingredients(recipe_id);

-- ============================================================
-- MEAL PLANS
-- ============================================================

CREATE TABLE public.meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Weekly Plan',
  week_start DATE NOT NULL,                  -- Monday of the plan week
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_meal_plans_user ON public.meal_plans(user_id);
CREATE INDEX idx_meal_plans_week ON public.meal_plans(week_start);

ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own meal plans"
  ON public.meal_plans FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- MEAL PLAN ENTRIES (individual meals in a plan)
-- ============================================================

CREATE TABLE public.meal_plan_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_plan_id UUID NOT NULL REFERENCES public.meal_plans(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Mon, 6=Sun
  meal_slot TEXT NOT NULL CHECK (meal_slot IN ('breakfast', 'lunch', 'dinner', 'snack')),
  custom_meal_name TEXT,                     -- if no recipe, just a name
  servings INT NOT NULL DEFAULT 4,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_meal_plan_entries_plan ON public.meal_plan_entries(meal_plan_id);

-- ============================================================
-- SHOPPING LISTS
-- ============================================================

CREATE TABLE public.shopping_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_plan_id UUID REFERENCES public.meal_plans(id) ON DELETE SET NULL,
  name TEXT NOT NULL DEFAULT 'Shopping List',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shopping_lists_user ON public.shopping_lists(user_id);

ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own shopping lists"
  ON public.shopping_lists FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- SHOPPING LIST ITEMS
-- ============================================================

CREATE TABLE public.shopping_list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shopping_list_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE SET NULL,
  name TEXT NOT NULL,                        -- denormalized for display
  category TEXT NOT NULL,
  quantity DECIMAL NOT NULL,
  unit TEXT NOT NULL DEFAULT 'g',
  is_checked BOOLEAN NOT NULL DEFAULT FALSE,
  is_ai_suggested BOOLEAN NOT NULL DEFAULT FALSE, -- flagged if AI added it
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shopping_list_items_list ON public.shopping_list_items(shopping_list_id);
CREATE INDEX idx_shopping_list_items_category ON public.shopping_list_items(category);

-- ============================================================
-- STORES
-- ============================================================

CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,                 -- 'Shwapno', 'Unimart', 'Meena Bazar'
  logo_url TEXT,
  website_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- STORE PRICES
-- ============================================================

CREATE TABLE public.store_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  price DECIMAL NOT NULL,                    -- in BDT (৳)
  unit TEXT NOT NULL DEFAULT 'kg',           -- price per unit
  in_stock BOOLEAN NOT NULL DEFAULT TRUE,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(store_id, ingredient_id)
);

CREATE INDEX idx_store_prices_ingredient ON public.store_prices(ingredient_id);
CREATE INDEX idx_store_prices_store ON public.store_prices(store_id);

-- ============================================================
-- AI INTERACTION LOG (for analytics & caching)
-- ============================================================

CREATE TABLE public.ai_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,                     -- 'meal_suggestion', 'substitution', 'missing_ingredient', 'recipe_parse'
  prompt_summary TEXT,
  response_summary TEXT,
  tokens_used INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_logs_user ON public.ai_logs(user_id);
CREATE INDEX idx_ai_logs_feature ON public.ai_logs(feature);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER meal_plans_updated_at
  BEFORE UPDATE ON public.meal_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER shopping_lists_updated_at
  BEFORE UPDATE ON public.shopping_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
