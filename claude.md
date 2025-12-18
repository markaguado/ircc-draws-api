# IRCC Express Entry Draws API

## Project Overview

A lightweight RESTful API that automatically fetches Canadian IRCC (Immigration, Refugees and Citizenship Canada) Express Entry draw data from the official IRCC API and serves it in JSON format. This API is designed to be consumed by other applications without requiring a database.

## Purpose

This API serves as a data aggregation service that:
- Automatically fetches Express Entry draw data from IRCC's official JSON API
- Stores the data in local JSON files (no database required)
- Provides RESTful endpoints for querying draw data
- Can be consumed by other applications (e.g., dashboards, mobile apps, analytics tools)

## Project Architecture

### Data Flow
1. **Data Source**: IRCC Official API (`https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json`)
2. **Data Storage**: Local JSON files in `/database` directory
3. **API Layer**: Serverless functions in `/api` directory
4. **Consumption**: Other applications can call the REST endpoints

### Technology Stack
- **Runtime**: Node.js 18+
- **API Framework**: Vercel Serverless Functions (or similar)
- **Data Storage**: JSON files (no database)
- **Package Manager**: npm

## Current Implementation

### API Endpoints

#### 1. Get All Draws
```
GET /api/draws
```
Query Parameters:
- `year` - Filter by year (e.g., 2025)
- `category` - Filter by category (e.g., French, Healthcare, CEC, PNP)
- `limit` - Limit number of results

Example: `/api/draws?year=2025&category=French&limit=10`

#### 2. Get Latest Draw
```
GET /api/draws/latest
```
Returns the most recent Express Entry draw.

#### 3. Get Specific Draw
```
GET /api/draws/:id
```
Get a specific draw by round number.
Example: `/api/draws/388`

#### 4. Get Statistics
```
GET /api/draws/stats
```
Query Parameters:
- `year` - Filter stats by year (optional)

Returns statistical summary of draws (avg CRS, total invitations, etc.)

#### 5. Scrape/Fetch Data
```
POST /api/scrape-draws
```
Fetches latest data from IRCC API and updates local JSON storage.
Requires: `Authorization: Bearer <CRON_SECRET>` header

#### 6. API Documentation
```
GET /api/docs
```
Interactive API documentation

### Data Structure

Each draw contains:
```json
{
  "drawNumber": 388,
  "date": "2025-01-15",
  "invitationsIssued": 4500,
  "minimumCRS": 535,
  "category": "French-language",
  "roundType": "Category-based",
  "year": "2025",
  "notes": "French-language proficiency"
}
```

### Categories Supported
- **General**: All-program draws
- **PNP**: Provincial Nominee Program
- **CEC**: Canadian Experience Class
- **FSW**: Federal Skilled Worker
- **French-language**: French proficiency draws
- **Healthcare**: Healthcare occupations
- **STEM**: Science, Technology, Engineering, Math
- **Trade**: Skilled trades
- **Transport**: Transport occupations
- **Agriculture**: Agriculture and agri-food

## Setup & Configuration

### Prerequisites
- Node.js 18 or higher
- npm

### Installation
```bash
npm install
```

### Environment Variables
Create a `.env` file in the root directory:

```bash
# API Security
CRON_SECRET=your_secret_key_here  # For authenticated scraping

# Optional: Supabase (if migrating from database version)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### Development
```bash
npm run dev
```

## Migration from Database to JSON Files

### Current State
The project currently uses Supabase as a database. The following changes are needed to use JSON files instead:

1. **Modify `/api/scrape-draws.js`**:
   - Remove Supabase imports and initialization
   - Save fetched data to `/database/draws.json`
   - Implement JSON file read/write operations

2. **Modify `/api/draws.js`**:
   - Read from `/database/draws.json` instead of Supabase
   - Implement in-memory filtering and sorting

3. **Update Other Endpoints**:
   - `/api/draws/latest.js` - Read from JSON file
   - `/api/draws/[id].js` - Read from JSON file
   - `/api/draws/stats.js` - Calculate stats from JSON file

### JSON File Structure

#### `/database/draws.json`
```json
{
  "lastUpdated": "2025-01-15T10:30:00Z",
  "source": "https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json",
  "draws": [
    {
      "round_number": 388,
      "draw_date": "2025-01-15",
      "round_type": "Category-based",
      "invitations_issued": 4500,
      "crs_score": 535,
      "program_category": "French-language",
      "notes": "French-language proficiency",
      "data_source": "ircc_api"
    }
  ]
}
```

## Automation

### Scheduled Data Fetching

For automatic updates, set up a cron job or scheduled task:

#### Option 1: Vercel Cron (if deployed on Vercel)
Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/scrape-draws",
    "schedule": "0 10 * * *"
  }]
}
```

#### Option 2: GitHub Actions
Create `.github/workflows/fetch-draws.yml`:
```yaml
name: Fetch IRCC Draws
on:
  schedule:
    - cron: '0 10 * * *'  # Daily at 10 AM UTC
  workflow_dispatch:

jobs:
  fetch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: node api/scrape-draws.js
      - name: Commit changes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add database/draws.json
          git commit -m "Update draws data" || exit 0
          git push
```

#### Option 3: Local Cron Job
```bash
# Add to crontab (crontab -e)
0 10 * * * cd /path/to/ircc-draws-api && node api/scrape-draws.js
```

## Usage from Other Projects

### Example: Fetch All Draws
```javascript
const response = await fetch('https://your-api-domain.com/api/draws')
const data = await response.json()
console.log(data.draws)
```

### Example: Get Latest Draw
```javascript
const response = await fetch('https://your-api-domain.com/api/draws/latest')
const latestDraw = await response.json()
console.log(`Latest CRS: ${latestDraw.minimumCRS}`)
```

### Example: Filter by Year and Category
```javascript
const response = await fetch('https://your-api-domain.com/api/draws?year=2025&category=French')
const data = await response.json()
console.log(`Found ${data.count} French draws in 2025`)
```

## Development Guidelines

### Adding New Endpoints
1. Create a new file in `/api` directory
2. Export a default async function handler with `(req, res)` parameters
3. Read from `/database/draws.json`
4. Implement filtering/processing logic
5. Return JSON response

### Error Handling
All endpoints should return consistent error responses:
```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Response Format
All successful responses should follow this structure:
```json
{
  "draws": [...],
  "count": 100,
  "filters": {...},
  "timestamp": "2025-01-15T10:30:00Z"
}
```

## Deployment

### Recommended Platforms
1. **Vercel**: Zero-config deployment with serverless functions
2. **Netlify**: Similar to Vercel with automatic builds
3. **Railway**: Simple deployment with environment variables
4. **Render**: Free tier available with auto-deploys

### Deployment Steps (Vercel)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables
vercel env add CRON_SECRET
```

## Future Enhancements

- [ ] Add caching layer (Redis/in-memory)
- [ ] Implement rate limiting
- [ ] Add API key authentication for production use
- [ ] Export data in multiple formats (CSV, XML)
- [ ] Add GraphQL endpoint
- [ ] Historical trends analysis endpoint
- [ ] Email notifications for new draws
- [ ] Webhook support for real-time updates

## Data Source

IRCC Official API: https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json

This is the official Canadian government data source for Express Entry draws. Data is typically updated within hours of a new draw.

## License

MIT

## Support

For issues or questions about the IRCC draw data, refer to the official IRCC website:
https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry.html
