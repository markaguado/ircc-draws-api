import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * RESTful API endpoint for Express Entry draws
 * GET /api/draws - Get all draws (with optional filters)
 * Query parameters:
 *   - year: Filter by year (e.g., 2025)
 *   - category: Filter by category (e.g., French, Healthcare, CEC)
 *   - limit: Limit number of results (default: all)
 */
export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Read draws from JSON file
    const dbPath = path.join(__dirname, '..', 'database', 'draws.json')

    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({
        error: 'No data available',
        message: 'Please fetch data first using POST /api/scrape-draws'
      })
    }

    const fileContent = fs.readFileSync(dbPath, 'utf-8')
    const jsonData = JSON.parse(fileContent)
    let allDraws = jsonData.draws || []

    // Parse query parameters
    const { year, category, limit } = req.query

    // Apply filters
    let filteredDraws = [...allDraws]

    if (year) {
      const yearStr = String(year)
      filteredDraws = filteredDraws.filter(draw =>
        draw.draw_date && draw.draw_date.startsWith(yearStr)
      )
    }

    if (category) {
      const categoryLower = category.toLowerCase()
      filteredDraws = filteredDraws.filter(draw =>
        draw.program_category &&
        draw.program_category.toLowerCase().includes(categoryLower)
      )
    }

    // Sort by date (most recent first)
    filteredDraws.sort((a, b) => {
      if (!a.draw_date) return 1
      if (!b.draw_date) return -1
      return b.draw_date.localeCompare(a.draw_date)
    })

    // Apply limit
    if (limit) {
      filteredDraws = filteredDraws.slice(0, parseInt(limit))
    }

    // Transform to match standard API format
    const draws = filteredDraws.map(draw => ({
      drawNumber: draw.round_number,
      date: draw.draw_date,
      invitationsIssued: draw.invitations_issued,
      minimumCRS: draw.crs_score,
      category: draw.program_category,
      roundType: draw.round_type,
      year: draw.draw_date ? draw.draw_date.split('-')[0] : null,
      notes: draw.notes
    }))

    return res.status(200).json({
      draws,
      count: draws.length,
      filters: { year, category, limit },
      lastUpdated: jsonData.lastUpdated
    })

  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    })
  }
}
