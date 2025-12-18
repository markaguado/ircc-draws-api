import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Get statistical summary of Express Entry draws
 * GET /api/draws/stats
 * Query parameters:
 *   - year: Filter stats by year (optional)
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { year } = req.query

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
    let data = jsonData.draws || []

    // Apply year filter if provided
    if (year) {
      const yearStr = String(year)
      data = data.filter(draw =>
        draw.draw_date && draw.draw_date.startsWith(yearStr)
      )
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'No draws found' })
    }

    // Calculate statistics
    const crsScores = data.map(d => d.crs_score)
    const invitations = data.map(d => d.invitations_issued)

    const stats = {
      totalDraws: data.length,
      totalInvitations: invitations.reduce((sum, val) => sum + val, 0),
      crs: {
        average: Math.round(crsScores.reduce((sum, val) => sum + val, 0) / crsScores.length),
        minimum: Math.min(...crsScores),
        maximum: Math.max(...crsScores),
        median: calculateMedian(crsScores)
      },
      invitations: {
        average: Math.round(invitations.reduce((sum, val) => sum + val, 0) / invitations.length),
        minimum: Math.min(...invitations),
        maximum: Math.max(...invitations),
        total: invitations.reduce((sum, val) => sum + val, 0)
      },
      byRoundType: groupByField(data, 'round_type'),
      byCategory: groupByField(data, 'program_category'),
      byYear: groupByYear(data),
      dateRange: {
        earliest: data[data.length - 1]?.draw_date,
        latest: data[0]?.draw_date
      },
      filter: year ? { year } : null
    }

    return res.status(200).json(stats)

  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    })
  }
}

// Helper function to calculate median
function calculateMedian(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid]
}

// Helper function to group by a field
function groupByField(data, field) {
  const groups = {}
  data.forEach(draw => {
    const value = draw[field] || 'Not specified'
    if (!groups[value]) {
      groups[value] = {
        count: 0,
        totalInvitations: 0,
        avgCRS: 0,
        crsScores: []
      }
    }
    groups[value].count++
    groups[value].totalInvitations += draw.invitations_issued
    groups[value].crsScores.push(draw.crs_score)
  })

  // Calculate averages
  Object.keys(groups).forEach(key => {
    const group = groups[key]
    group.avgCRS = Math.round(group.crsScores.reduce((sum, val) => sum + val, 0) / group.crsScores.length)
    delete group.crsScores // Remove temporary array
  })

  return groups
}

// Helper function to group by year
function groupByYear(data) {
  const years = {}
  data.forEach(draw => {
    const year = draw.draw_date ? draw.draw_date.split('-')[0] : 'Unknown'
    if (!years[year]) {
      years[year] = {
        count: 0,
        totalInvitations: 0
      }
    }
    years[year].count++
    years[year].totalInvitations += draw.invitations_issued
  })
  return years
}
