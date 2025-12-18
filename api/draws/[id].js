import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Get a specific Express Entry draw by round number
 * GET /api/draws/:id
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id } = req.query
    const roundNumber = parseInt(id)

    if (isNaN(roundNumber)) {
      return res.status(400).json({ error: 'Invalid draw number' })
    }

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

    // Find draw by round number
    const data = allDraws.find(draw => draw.round_number === roundNumber)

    if (!data) {
      return res.status(404).json({ error: 'Draw not found' })
    }

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
