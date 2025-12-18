import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Get the latest Express Entry draw
 * GET /api/draws/latest
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Read draws from JSON file
    const dbPath = path.join(__dirname, '..', '..', 'database', 'draws.json')

    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({
        error: 'No data available',
        message: 'Please fetch data first using POST /api/scrape-draws'
      })
    }

    const fileContent = fs.readFileSync(dbPath, 'utf-8')
    const jsonData = JSON.parse(fileContent)
    const allDraws = jsonData.draws || []

    if (allDraws.length === 0) {
      return res.status(404).json({ error: 'No draws found' })
    }

    // Get the most recent draw (sort by date)
    const sortedDraws = [...allDraws].sort((a, b) => {
      if (!a.draw_date) return 1
      if (!b.draw_date) return -1
      return b.draw_date.localeCompare(a.draw_date)
    })

    const data = sortedDraws[0]

    // Transform to match standard API format
    const draw = {
      drawNumber: data.round_number,
      date: data.draw_date,
      invitationsIssued: data.invitations_issued,
      minimumCRS: data.crs_score,
      category: data.program_category,
      roundType: data.round_type,
      year: data.draw_date ? data.draw_date.split('-')[0] : null,
      notes: data.notes
    }

    return res.status(200).json(draw)

  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    })
  }
}
