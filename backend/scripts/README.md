# Backend Utility Scripts

These scripts are **NOT** part of the production application.
They are utility/maintenance scripts for development and data management.

## Scripts

### `seed_data.py`
Populates the database with initial sample books, categories, and pages.

```bash
cd backend
python scripts/seed_data.py
```

### `generate_audio.py`
Generates TTS audio files for book pages using ElevenLabs API.

```bash
cd backend
python scripts/generate_audio.py
```

### `add_annemin_elleri.py`
One-time migration script to add a specific book. 
Can be used as a template for adding new books programmatically.

```bash
cd backend
python scripts/add_annemin_elleri.py
```

## Notes

- These scripts require the backend `.env` file to be configured
- Run from the `backend/` directory
- These are excluded from production deployments
