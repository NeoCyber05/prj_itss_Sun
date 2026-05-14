# Backend Entity/Model Layer

This folder contains the backend domain layer for RakuSlide.

## Entities

- `UserProfile`: application profile mapped from Supabase Auth users.
- `SlideTemplate`: slide template metadata shown on the template library screen.
- `TemplateSlide`: individual slide content inside a template.

Each entity handles validation plus conversion between app-friendly camelCase fields and database snake_case rows.

## Models

Models are Supabase table adapters. They do not create a Supabase client themselves; pass a server-side Supabase client into each method.

```js
import { slideTemplateModel } from './backend/index.js';

const templates = await slideTemplateModel.list(supabaseAdmin, {
  where: { status: 'published', visibility: 'public' },
  limit: 20,
});
```

## Database

`database/schema.sql` defines the expected Supabase tables for the model layer.
