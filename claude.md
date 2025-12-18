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

#### Option 2: GitHub Actions (Currently Configured)
The project is configured to run 3 times daily via `.github/workflows/fetch-draws.yml`:
```yaml
name: Fetch IRCC Draws
on:
  schedule:
    - cron: '0 8 * * *'   # 8:00 AM UTC (Morning)
    - cron: '0 13 * * *'  # 1:00 PM UTC (Afternoon)
    - cron: '0 17 * * *'  # 5:00 PM UTC (Evening)
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

Your API code is stored on GitHub but needs to be deployed to a serverless platform to actually run and be accessible via HTTP endpoints.

### Why You Need to Deploy

- **GitHub** = Storage for your code (like a recipe book)
- **Vercel/Netlify** = Execution environment that runs your code (the kitchen)
- The `/api` folder contains serverless functions that need to be executed, not just stored

### Recommended Platforms

1. **Vercel** ⭐ (Recommended) - Zero-config deployment with serverless functions
2. **Netlify** - Similar to Vercel with automatic builds
3. **Cloudflare Workers** - Edge computing platform (like the reference API: can-ee-draws)
4. **Railway** - Simple deployment with environment variables
5. **Render** - Free tier available with auto-deploys

### Option 1: Deploy via Vercel Web Interface (Easiest)

1. **Sign in to Vercel**
   - Go to https://vercel.com
   - Sign in with your GitHub account

2. **Import Your Repository**
   - Click "Add New" → "Project"
   - Select `markaguado/ircc-draws-api` from your repositories
   - Click "Import"

3. **Configure Project (Use Defaults)**
   - Framework Preset: Other
   - Root Directory: `./`
   - Build Command: (leave empty)
   - Output Directory: (leave empty)
   - Click "Deploy"

4. **Get Your Live URL**
   - After deployment completes, you'll get a URL like:
   - `https://ircc-draws-api.vercel.app`
   - Or: `https://ircc-draws-api-yourusername.vercel.app`

5. **Test Your API**
   ```bash
   # Replace with your actual Vercel URL
   curl https://ircc-draws-api.vercel.app/api/draws/latest
   ```

### Option 2: Deploy via Vercel CLI

```bash
# Navigate to your project
cd /path/to/ircc-draws-api

# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (follow the prompts)
vercel

# For production deployment
vercel --prod
```

**First-time deployment prompts:**
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- What's your project's name? `ircc-draws-api`
- In which directory is your code located? `./`
- Want to override settings? **N**

**Your API will be live at:**
- Preview: `https://ircc-draws-api-xxx.vercel.app`
- Production: `https://ircc-draws-api.vercel.app`

### Option 3: Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy

# Production deploy
netlify deploy --prod
```

### Option 4: Deploy to Cloudflare Workers

For edge computing similar to the reference API (can-ee-draws):

1. Install Wrangler CLI:
```bash
npm install -g wrangler
```

2. Configure `wrangler.toml`:
```toml
name = "ircc-draws-api"
main = "src/index.js"
compatibility_date = "2024-01-01"
```

3. Deploy:
```bash
wrangler deploy
```

### After Deployment

#### 1. Update GitHub Actions (Optional)
If you want to trigger deployments automatically, add to your workflow:

```yaml
- name: Deploy to Vercel
  run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

#### 2. Set Environment Variables (If Needed)

For Vercel:
```bash
# Via CLI
vercel env add CRON_SECRET

# Or via web interface
# Go to Project Settings → Environment Variables
```

#### 3. Test Your Live API

```bash
# Get latest draw
curl https://your-app.vercel.app/api/draws/latest

# Get all draws
curl https://your-app.vercel.app/api/draws

# Filter by year
curl https://your-app.vercel.app/api/draws?year=2024

# Get statistics
curl https://your-app.vercel.app/api/draws/stats
```

### Using Your Deployed API

Once deployed, use it in any project:

**JavaScript/Node.js:**
```javascript
const API_URL = 'https://ircc-draws-api.vercel.app'

// Get latest draw
const response = await fetch(`${API_URL}/api/draws/latest`)
const latestDraw = await response.json()
console.log(`Latest CRS: ${latestDraw.minimumCRS}`)

// Get all draws from 2025
const draws2025 = await fetch(`${API_URL}/api/draws?year=2025`)
const data = await draws2025.json()
console.log(`Found ${data.count} draws in 2025`)
```

**Python:**
```python
import requests

API_URL = 'https://ircc-draws-api.vercel.app'

# Get latest draw
response = requests.get(f'{API_URL}/api/draws/latest')
latest = response.json()
print(f"Latest CRS: {latest['minimumCRS']}")
```

**cURL:**
```bash
curl https://ircc-draws-api.vercel.app/api/draws/latest | jq
```

### Monitoring & Logs

**Vercel:**
- View logs: https://vercel.com/dashboard
- Real-time function logs
- Performance analytics

**Netlify:**
- View logs: https://app.netlify.com
- Function logs and monitoring

### Troubleshooting Deployment

**Issue:** "Repository not found" or deployment fails
- **Solution:** Ensure your GitHub repo is public or Vercel has access to private repos

**Issue:** API endpoints return 404
- **Solution:** Ensure `/api` folder structure is correct and files have default exports

**Issue:** Functions timeout
- **Solution:** Check function execution time limits (Vercel: 10s free tier, 60s pro)

**Issue:** Data not updating
- **Solution:** Verify GitHub Actions workflow ran successfully and committed `database/draws.json`

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
