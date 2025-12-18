import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Standalone script to fetch IRCC Express Entry draws
 * Used by GitHub Actions for automated data fetching
 */
async function fetchDraws() {
  console.log('Starting IRCC draws fetch from official API...')

  try {
    // Fetch data from IRCC's official JSON API
    console.log('Fetching data from IRCC API...')
    const response = await fetch('https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json')

    if (!response.ok) {
      throw new Error(`IRCC API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.rounds || !Array.isArray(data.rounds)) {
      throw new Error('Invalid data format from IRCC API')
    }

    console.log(`Fetched ${data.rounds.length} draws from IRCC API`)

    // Transform IRCC API data to our format
    const draws = data.rounds.map(round => {
      // Parse values, handling comma-separated numbers
      const drawNumber = parseInt(round.drawNumber)
      const invitations = parseInt(round.drawSize?.replace(/,/g, '') || '0')
      const crsScore = parseInt(round.drawCRS)

      // Extract category from drawName
      const drawName = round.drawName || ''
      let category = null

      if (drawName.includes('Provincial Nominee Program')) category = 'PNP'
      else if (drawName.includes('Canadian Experience Class')) category = 'CEC'
      else if (drawName.includes('Federal Skilled Worker')) category = 'FSW'
      else if (drawName.includes('French')) category = 'French-language'
      else if (drawName.includes('Healthcare')) category = 'Healthcare'
      else if (drawName.includes('STEM')) category = 'STEM'
      else if (drawName.includes('Trade')) category = 'Trade'
      else if (drawName.includes('Transport')) category = 'Transport'
      else if (drawName.includes('Agriculture')) category = 'Agriculture'

      // Determine round type
      let roundType = 'General'
      if (drawName.includes('Provincial Nominee')) roundType = 'Program-specific'
      else if (category && category !== 'PNP') roundType = 'Category-based'

      return {
        round_number: drawNumber,
        draw_date: round.drawDate, // Already in YYYY-MM-DD format
        round_type: roundType,
        invitations_issued: invitations,
        crs_score: crsScore,
        program_category: category,
        notes: round.drawName,
        data_source: 'ircc_api'
      }
    }).filter(draw =>
      // Filter out invalid entries
      !isNaN(draw.round_number) &&
      !isNaN(draw.invitations_issued) &&
      !isNaN(draw.crs_score) &&
      draw.draw_date
    )

    console.log(`Transformed ${draws.length} valid draws`)

    // Save to JSON file
    const dbPath = path.join(__dirname, 'database', 'draws.json')
    const jsonData = {
      lastUpdated: new Date().toISOString(),
      source: 'https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json',
      totalDraws: draws.length,
      draws: draws
    }

    // Ensure database directory exists
    const dbDir = path.dirname(dbPath)
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }

    fs.writeFileSync(dbPath, JSON.stringify(jsonData, null, 2), 'utf-8')
    console.log(`Saved ${draws.length} draws to ${dbPath}`)
    console.log(`Last updated: ${jsonData.lastUpdated}`)

    return {
      success: true,
      fetched: draws.length,
      saved: draws.length,
      timestamp: new Date().toISOString()
    }

  } catch (error) {
    console.error('Fetch error:', error)
    throw error
  }
}

// Run the fetch function
fetchDraws()
  .then(result => {
    console.log('Fetch completed successfully:', result)
    process.exit(0)
  })
  .catch(error => {
    console.error('Fetch failed:', error.message)
    process.exit(1)
  })
