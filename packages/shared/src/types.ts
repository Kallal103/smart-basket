export interface Profile {
  id: string;
  full_name: string;
  household_size: number;
  dietary_preferences: string[];
  budget_range: "low" | "medium" | "high";
  subscription_tier: "free" | "pro";
  created_at: string;
  updated_at: string;
}

export interface Ingredient {
  id: string;
  name_en: string;
  name_bn: string | null;
  aliases: string[];
  category: string;
  default_unit: string;
  is_staple: boolean;
}

export interface Recipe {
  id: string;
  user_id: string | null;
  title: string;
  description: string | null;
  servings: number;
  prep_time_min: number | null;
  cook_time_min: number | null;
  cuisine: string;
  meal_type: string[];
  tags: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface MealPlan {
  id: string;
  user_id: string;
  name: string;
  week_start: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MealPlanEntry {
  id: string;
  meal_plan_id: string;
  recipe_id: string | null;
  day_of_week: number;
  meal_slot: "breakfast" | "lunch" | "dinner" | "snack";
  custom_meal_name: string | null;
  servings: number;
}

export interface ShoppingList {
  id: string;
  user_id: string;
  meal_plan_id: string | null;
  name: string;
  status: "active" | "completed" | "archived";
  created_at: string;
  updated_at: string;
}

export interface ShoppingListItem {
  id: string;
  shopping_list_id: string;
  ingredient_id: string | null;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  is_checked: boolean;
  is_ai_suggested: boolean;
  notes: string | null;
}

export interface Store {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  is_active: boolean;
}

export interface StorePrice {
  id: string;
  store_id: string;
  ingredient_id: string;
  price: number;
  unit: string;
  in_stock: boolean;
  last_updated: string;
}
