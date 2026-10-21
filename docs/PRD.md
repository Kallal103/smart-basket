# Smart Basket — Product Requirements Document (MVP)

**Version:** 1.0
**Date:** 2026-10-21
**Author:** Cookspace / Vannes & Team
**Status:** Draft

---

## 1. Problem Statement

Urban middle-class families in Dhaka spend significant time and money planning weekly meals, manually building grocery lists, and comparing prices across supermarkets. There is no local solution that combines meal planning with smart shopping list generation and real-time pricing from Bangladeshi retailers.

## 2. Target Users

- **Primary:** Urban middle-class families in Dhaka (dual-income households, 25–45 age range)
- **Secondary:** Young professionals and university students living independently
- **Persona:** Fatima, 32, works full-time, plans meals for a family of 4. She shops at Shwapno weekly and wants to reduce food waste and stay within budget.

## 3. Product Overview

Smart Basket is a mobile-first grocery planning app that lets users plan weekly meals (or choose AI-suggested plans), auto-generates categorized shopping lists, and integrates with local BD supermarkets for pricing and availability. AI suggests budget-friendly substitutions and catches missing ingredients.

## 4. MVP Scope — Core Features

### 4.1 User Authentication
- Email/password signup and login via Supabase Auth
- Google OAuth (optional, MVP stretch)
- User profile with household size and dietary preferences

### 4.2 Meal Planning
- Weekly calendar view (7-day planner: breakfast, lunch, dinner, snacks)
- Manual meal entry (name + ingredients)
- Browse and select from curated meal suggestions (Bangladeshi cuisine focus)
- AI-powered meal plan generation based on preferences, budget, and household size

### 4.3 Recipe & Ingredient Management
- Recipe database seeded with 50+ popular Bangladeshi dishes
- Each recipe includes: name, servings, prep time, ingredient list with quantities
- Users can add custom recipes
- Ingredient normalization (e.g., "alu" = "potato" = "আলু")

### 4.4 Smart Shopping List
- Auto-generated from the weekly meal plan
- Grouped by category (vegetables, protein, dairy, spices, pantry staples)
- Quantity aggregation across meals (e.g., 2 recipes needing onions → combined total)
- Check-off items while shopping
- AI detects missing staple ingredients (oil, salt, rice) and suggests additions

### 4.5 Store Pricing & Comparison (MVP: read-only)
- Display prices from Shwapno, Unimart, Meena Bazar
- Show cheapest option per item
- Total basket cost estimate per store
- Data sourced via scraping or partner APIs (manual seed for MVP)

### 4.6 AI Features (Claude Sonnet)
- Meal plan suggestions based on preferences and budget
- Smart substitutions (e.g., "hilsha is expensive this week, try rui fish")
- Missing ingredient detection
- Recipe parsing from free-text input

## 5. Out of Scope (Post-MVP)

- Online ordering / checkout integration
- Delivery tracking
- Social features (sharing meal plans)
- Multi-language UI (MVP is English-only; Bangla post-MVP)
- Nutritional tracking and calorie counting
- Pantry inventory management
- Push notifications and reminders
- Coupon/offer aggregation

## 6. User Stories (MVP)

| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| U1 | User | sign up and set my household size & preferences | the app personalizes my experience |
| U2 | User | view a weekly meal calendar | I can plan meals for each day |
| U3 | User | add a meal to a day slot | I can build my weekly plan |
| U4 | User | get AI-suggested meal plans | I save time planning |
| U5 | User | see a shopping list generated from my meal plan | I don't have to manually list ingredients |
| U6 | User | see items grouped by category | I can shop efficiently aisle by aisle |
| U7 | User | check off items while shopping | I can track what I've bought |
| U8 | User | see price comparisons across stores | I can pick the cheapest option |
| U9 | User | get AI substitution suggestions | I can save money or handle unavailable items |
| U10 | User | add a custom recipe | I can include my family's favorites |

## 7. Technical Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Expo (RN) App  │────▶│  Next.js API      │────▶│  Supabase   │
│  iOS / Android  │     │  (Vercel)         │     │  PostgreSQL │
└─────────────────┘     └──────┬───────────┘     └─────────────┘
                               │
                        ┌──────▼───────┐
                        │  Claude API  │
                        │  (Sonnet)    │
                        └──────────────┘
```

- **Frontend:** React Native (Expo) — cross-platform mobile
- **Backend:** Next.js API routes on Vercel
- **Database:** Supabase (PostgreSQL + Auth + Realtime)
- **AI:** Claude API (Sonnet) for meal suggestions, substitutions, recipe parsing
- **Deployment:** Vercel (API), EAS Build (mobile apps)

## 8. Success Metrics (MVP Launch — 3 months)

| Metric | Target |
|--------|--------|
| Registered users | 500 |
| Weekly active users | 150 |
| Meal plans created per week | 200 |
| Shopping lists generated per week | 300 |
| Average session duration | > 3 min |
| App store rating | > 4.0 |

## 9. Monetization (Freemium)

| Tier | Features |
|------|----------|
| **Free** | Manual meal planning, basic shopping list, 3 AI suggestions/week |
| **Pro** (৳199/mo) | Unlimited AI meal plans, price comparison, smart substitutions, family sharing |

## 10. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Store pricing data unavailable via API | Seed manually; build scraper; pursue partnerships |
| Low initial recipe database | Crowdsource from beta users; hire local food content creator |
| Claude API costs at scale | Cache common suggestions; rate-limit free tier; use Haiku for simpler tasks |
| User adoption in BD market | Partner with food bloggers; run campus promotions in Dhaka |

## 11. Timeline (MVP)

| Phase | Duration | Deliverables |
|-------|----------|-------------|
| Design & Schema | Week 1–2 | Wireframes, DB schema, API contract |
| Core Backend | Week 3–5 | Auth, meal CRUD, list generation, store data |
| AI Integration | Week 5–6 | Claude-powered suggestions, substitutions |
| Mobile Frontend | Week 3–7 | All screens, offline check-off |
| Testing & Polish | Week 8 | QA, performance, beta testing |
| Launch | Week 9 | App store submission, soft launch |
