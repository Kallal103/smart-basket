import { NextRequest, NextResponse } from "next/server";
import { claude, CLAUDE_MODEL } from "@/lib/claude";
import { z } from "zod";

const requestSchema = z.object({
  householdSize: z.number().min(1).max(20),
  dietaryPreferences: z.array(z.string()).default([]),
  budgetRange: z.enum(["low", "medium", "high"]).default("medium"),
  daysCount: z.number().min(1).max(7).default(7),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = requestSchema.parse(body);

    const message = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      system: `You are a Bangladeshi meal planning assistant. Suggest meals using popular Bangladeshi cuisine.
Return JSON only — an array of day objects with breakfast, lunch, dinner, and snack fields.
Each meal has: name, ingredients (array of {name, quantity, unit}), prepTimeMin, servings.
Adjust servings for household size. Respect dietary preferences. Keep budget in mind.`,
      messages: [
        {
          role: "user",
          content: `Plan ${input.daysCount} days of meals for a household of ${input.householdSize}.
Dietary preferences: ${input.dietaryPreferences.join(", ") || "none"}.
Budget: ${input.budgetRange}.
Return valid JSON only.`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ error: "Unexpected response" }, { status: 500 });
    }

    const mealPlan = JSON.parse(content.text);
    return NextResponse.json({ mealPlan });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Meal suggestion error:", error);
    return NextResponse.json({ error: "Failed to generate meal suggestions" }, { status: 500 });
  }
}
