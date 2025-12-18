/**
 * API Index - List all available endpoints
 * GET /api
 */
export default async function handler(req, res) {
  const baseUrl = req.headers.host
  const protocol = req.headers['x-forwarded-proto'] || 'http'
  const fullUrl = `${protocol}://${baseUrl}`

  const endpoints = {
    name: 'IRCC Express Entry Draws API',
    version: '1.0.0',
    description: 'RESTful API for Canadian Express Entry draw data',
    endpoints: {
      draws: {
        'GET /api/draws': {
          description: 'Get all Express Entry draws',
          parameters: {
            year: 'Filter by year (e.g., 2025)',
            category: 'Filter by category (e.g., French, Healthcare, CEC)',
            limit: 'Limit number of results'
          },
          example: `${fullUrl}/api/draws?year=2025&category=French&limit=10`
        },
        'GET /api/draws/latest': {
          description: 'Get the most recent draw',
          example: `${fullUrl}/api/draws/latest`
        },
        'GET /api/draws/:id': {
          description: 'Get a specific draw by round number',
          example: `${fullUrl}/api/draws/388`
        },
        'GET /api/draws/stats': {
          description: 'Get statistical summary of all draws',
          parameters: {
            year: 'Filter stats by year (optional)'
          },
          example: `${fullUrl}/api/draws/stats`
        }
      },
      scraper: {
        'POST /api/scrape-draws': {
          description: 'Fetch latest draws from IRCC (authenticated)',
          note: 'Requires CRON_SECRET authorization header'
        }
      }
    },
    dataSource: 'IRCC Official API',
    sourceUrl: 'https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json',
    documentation: `${fullUrl}/api/docs`
  }

  return res.status(200).json(endpoints)
}
