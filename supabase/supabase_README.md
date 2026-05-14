# /supabase

This folder contains all database schema definitions, migrations, and seed data for the AI Golf Coach app, powered by Supabase (PostgreSQL).

## Structure

```
supabase/
├── /migrations     # SQL migration files, numbered in order (e.g. 001_create_users.sql)
├── /seed           # Seed data scripts for local development and testing
└── schema.sql      # Master schema reference (the current state of all tables)
```

## Core Tables

| Table | Description |
|---|---|
| `users` | User profiles — id, name, email, handicap, home course, created_at |
| `rounds` | Golf rounds — id, user_id, date, course_name, holes (9/18), total_score |
| `holes` | Hole-by-hole data — id, round_id, hole_number, score, putts, fairway_hit, gir, penalties |

## Migration Convention

Name migration files with a sequential number and a short description:

```
001_create_users.sql
002_create_rounds.sql
003_create_holes.sql
```

Always write migrations as **non-destructive** — never drop a column or table without a corresponding rollback script.

## Local Development

1. Install the Supabase CLI: `npm install -g supabase`
2. Link to the project: `supabase link --project-ref <your-project-ref>`
3. Pull the latest schema: `supabase db pull`
4. Run migrations locally: `supabase db push`

## Environment Variables

Never commit API keys or secrets. The app requires the following in a `.env` file (added to `.gitignore`):

```
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
```
