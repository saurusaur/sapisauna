# Sauna Pet Functionality

Date: 2026-05-18
Status: Backlog

## Goal

Plan and add a lightweight "Sauna Pet" companion feature that grows with a user's sauna logging activity.

The feature should make repeated logging feel warmer and more personal without turning the app into a heavy game. It should support the existing SA-PI identity, profile, XP, titles, and tribe system.

## Current Progress

- Added to `docs/po/BACKLOG.md` as a P3 long-term feature.
- This document captures the initial planning scope before implementation.
- No code or schema changes have been started.

## Product Questions To Resolve

1. What is the pet's role?
   - Companion on home/profile.
   - Progress feedback after logs.
   - Light reward object tied to consistent sauna habits.

2. How does a user get a pet?
   - Automatically after first log.
   - After onboarding completion.
   - After choosing a tribe.

3. What makes the pet grow?
   - Total logs.
   - Consecutive active weeks.
   - Tribe-specific activity.
   - Deep log completion.
   - Visiting new places.

4. What should not happen?
   - Do not punish inactivity harshly.
   - Do not make the pet feel like a chore.
   - Do not duplicate XP/title rewards unless it creates a clearly different loop.

## MVP Scope

Recommended first pass:

- One pet per user.
- Pet has a name, stage, mood, and last interaction timestamp.
- Growth is derived primarily from existing log data, not from a separate grind loop.
- Home/profile shows the pet as a compact companion element.
- Log completion can show a short pet reaction.

Suggested stages:

- `seed`
- `warm`
- `steam`
- `totonoi`

Suggested moods:

- `resting`
- `happy`
- `glowing`
- `sleepy`

## Data Model Draft

Potential table:

```sql
user_pets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text,
  species text not null default 'sauna_pet',
  stage text not null default 'seed',
  mood text not null default 'resting',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_interaction_at timestamptz
)
```

Keep computed progress out of the table where possible. Derive growth from logs, streaks, deep log count, and place diversity.

## UX Surfaces

- Home profile card: compact pet avatar and one-line status.
- Settings/profile: pet name and visual customization later.
- Log completion: short reaction after saving.
- History dashboard: optional small milestone callout.

## Implementation Plan

1. Finalize MVP behavior and copy.
2. Decide whether pet progress is fully derived or partially persisted.
3. Add DB migration if persisted pet identity is needed.
4. Add pet service/helper for derived stage and mood.
5. Add compact UI component for home/profile.
6. Add log completion reaction.
7. Add minimal tests for stage/mood derivation.

## Open Risks

- Feature could feel too playful for users who want a quiet utility.
- Pet visuals can add asset/design overhead.
- If growth rules are too complex, they will be hard to explain and maintain.

## Non-Goals For MVP

- Multiple pets.
- Pet marketplace.
- Daily care mechanics.
- Push notifications.
- Complex animations.
