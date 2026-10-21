import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { z } from "zod";

const requestSchema = z.object({
  mealPlanId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = createSupabaseClient(token);

    const body = await req.json();
    const { mealPlanId } = requestSchema.parse(body);

    // Fetch meal plan entries with their recipes and ingredients
    const { data: entries, error: entriesError } = await supabase
      .from("meal_plan_entries")
      .select(`
        servings,
        recipe:recipes (
          servings,
          recipe_ingredients (
            quantity,
            unit,
            ingredient:ingredients (
              id,
              name_en,
              category,
              default_unit
            )
          )
        )
      `)
      .eq("meal_plan_id", mealPlanId);

    if (entriesError) {
      return NextResponse.json({ error: entriesError.message }, { status: 500 });
    }

    // Aggregate ingredients across all meals
    const aggregated = new Map<string, {
      ingredientId: string;
      name: string;
      category: string;
      quantity: number;
      unit: string;
    }>();

    for (const entry of entries ?? []) {
      const recipe = entry.recipe as any;
      if (!recipe?.recipe_ingredients) continue;

      const scaleFactor = entry.servings / (recipe.servings || 4);

      for (const ri of recipe.recipe_ingredients) {
        const ing = ri.ingredient;
        if (!ing) continue;

        const key = ing.id;
        const existing = aggregated.get(key);
        const scaledQty = ri.quantity * scaleFactor;

        if (existing) {
          existing.quantity += scaledQty;
        } else {
          aggregated.set(key, {
            ingredientId: ing.id,
            name: ing.name_en,
            category: ing.category,
            quantity: scaledQty,
            unit: ri.unit || ing.default_unit,
          });
        }
      }
    }

    // Create the shopping list
    const { data: list, error: listError } = await supabase
      .from("shopping_lists")
      .insert({ meal_plan_id: mealPlanId, name: "Shopping List" })
      .select()
      .single();

    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 500 });
    }

    // Insert aggregated items
    const items = Array.from(aggregated.values()).map((item) => ({
      shopping_list_id: list.id,
      ingredient_id: item.ingredientId,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
    }));

    if (items.length > 0) {
      const { error: itemsError } = await supabase
        .from("shopping_list_items")
        .insert(items);

      if (itemsError) {
        return NextResponse.json({ error: itemsError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ shoppingList: list, itemCount: items.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Shopping list generation error:", error);
    return NextResponse.json({ error: "Failed to generate shopping list" }, { status: 500 });
  }
}
