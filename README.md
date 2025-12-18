# IRCC Express Entry Draws API

A lightweight RESTful API that automatically fetches Canadian IRCC (Immigration, Refugees and Citizenship Canada) Express Entry draw data and serves it in JSON format. No database required - data is stored in local JSON files.

## Features

- Fetches data from official IRCC API
- RESTful endpoints for querying draws
- Automatic daily updates via GitHub Actions
- No database required (JSON file storage)
- Filter by year, category, and more
- Statistical summaries and analytics

## Quick Start

### Installation

```bash
npm install
```

### Fetch Initial Data

Before using the API, fetch the latest IRCC draws data:

```bash
npm run fetch
```

This will create/update `database/draws.json` with the latest data from IRCC.

### Run Development Server

```bash
npm run dev
```

## API Endpoints

### Get All Draws
```
GET /api/draws
```

**Query Parameters:**
- `year` - Filter by year (e.g., 2025)
- `category` - Filter by category (French, Healthcare, CEC, PNP, etc.)
- `limit` - Limit number of results

**Example:**
```bash
curl http://localhost:3000/api/draws?year=2025&category=French&limit=10
```

### Get Latest Draw
```
GET /api/draws/latest
```

**Example:**
```bash
curl http://localhost:3000/api/draws/latest
```

### Get Specific Draw by ID
```
GET /api/draws/:id
```

**Example:**
```bash
curl http://localhost:3000/api/draws/388
```

### Get Statistics
```
GET /api/draws/stats
```

**Query Parameters:**
- `year` - Filter stats by year (optional)

**Example:**
```bash
curl http://localhost:3000/api/draws/stats?year=2025
```

## Automated Data Fetching

### GitHub Actions (Recommended)

The project includes a GitHub Actions workflow that automatically fetches new data daily.

**Setup:**
1. Push your code to a GitHub repository
2. The workflow runs automatically every day at 10:00 AM UTC
3. You can also trigger it manually from the Actions tab

**Manual Trigger:**
- Go to your repository on GitHub
- Click "Actions" tab
- Select "Fetch IRCC Draws" workflow
- Click "Run workflow"

### Local Cron Job

Alternatively, set up a local cron job:

```bash
# Edit crontab
crontab -e

# Add this line to run daily at 10 AM
0 10 * * * cd /path/to/ircc-draws-api && npm run fetch
```

## Environment Variables

Create a `.env` file (optional):

```bash
# Only needed if using the /api/scrape-draws endpoint directly
CRON_SECRET=your_secret_key_here
```

## Data Structure

Each draw in `database/draws.json` contains:

```json
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
```

## Using from Another Project

### JavaScript/Node.js

```javascript
// Fetch all draws
const response = await fetch('https://your-api-domain.com/api/draws')
const data = await response.json()
console.log(data.draws)

// Get latest draw
const latest = await fetch('https://your-api-domain.com/api/draws/latest')
const latestDraw = await latest.json()
console.log(`Latest CRS: ${latestDraw.minimumCRS}`)

// Filter by year and category
const filtered = await fetch('https://your-api-domain.com/api/draws?year=2025&category=French')
const filteredData = await filtered.json()
```

### Python

```python
import requests

# Fetch all draws
response = requests.get('https://your-api-domain.com/api/draws')
data = response.json()

# Get latest draw
latest = requests.get('https://your-api-domain.com/api/draws/latest')
latest_draw = latest.json()
print(f"Latest CRS: {latest_draw['minimumCRS']}")
```

### cURL

```bash
# Get all draws
curl https://your-api-domain.com/api/draws

# Get latest draw
curl https://your-api-domain.com/api/draws/latest

# Filter by year
curl https://your-api-domain.com/api/draws?year=2025

# Get stats
curl https://your-api-domain.com/api/draws/stats
```

## Deployment

### Vercel (Recommended)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Set environment variables (if needed):
```bash
vercel env add CRON_SECRET
```

### Other Platforms

The API works with any serverless platform that supports Node.js:
- Netlify
- Railway
- Render
- AWS Lambda
- Google Cloud Functions

## Project Structure

```
ircc-draws-api/
├── api/                    # API endpoints
│   ├── draws.js           # Get all draws
│   ├── scrape-draws.js    # Fetch data endpoint (serverless)
│   ├── docs.js            # API documentation
│   ├── index.js           # API index/root
│   └── draws/
│       ├── latest.js      # Get latest draw
│       ├── [id].js        # Get specific draw
│       └── stats.js       # Get statistics
├── database/
│   └── draws.json         # Data storage (committed to git)
├── .github/
│   └── workflows/
│       └── fetch-draws.yml # GitHub Actions workflow
├── fetch-draws.js         # Standalone fetch script
├── package.json
├── claude.md             # Claude Code documentation
└── README.md             # This file
```

## Development

### Scripts

- `npm run dev` - Start development server
- `npm run fetch` - Manually fetch latest IRCC data
- `npm run build` - Build frontend (if applicable)
- `npm run install-all` - Install all dependencies

### Adding New Endpoints

1. Create a new file in `/api` directory
2. Export a default handler function:
```javascript
export default async function handler(req, res) {
  // Your code here
}
```
3. Read from `database/draws.json`
4. Return JSON response

## Data Source

Official IRCC API: https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json

Data is typically updated by IRCC within hours of a new draw.

## Categories Supported

- **General** - All-program draws
- **PNP** - Provincial Nominee Program
- **CEC** - Canadian Experience Class
- **FSW** - Federal Skilled Worker
- **French-language** - French proficiency draws
- **Healthcare** - Healthcare occupations
- **STEM** - Science, Technology, Engineering, Math
- **Trade** - Skilled trades
- **Transport** - Transport occupations
- **Agriculture** - Agriculture and agri-food

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Support

For issues or questions about IRCC Express Entry, refer to the official website:
https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry.html
