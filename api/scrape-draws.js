import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Fetch with timeout support
 * Wraps fetch() with AbortController for timeout functionality
 */
async function fetchWithTimeout(url, options = {}) {
  const { timeout = 30000 } = options // Default 30 second timeout

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`)
    }
    throw error
  }
}

/**
 * Fetch with retry logic and exponential backoff
 * Retries failed requests with increasing delays
 */
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let lastError

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Fetch attempt ${attempt}/${maxRetries}...`)

      const response = await fetchWithTimeout(url, {
        ...options,
        timeout: 30000, // 30 second timeout per attempt
        headers: {
          'User-Agent': 'IRCC-Draws-API/1.0 (Vercel Serverless; +https://github.com/markaguado/ircc-draws-api)',
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          ...options.headers,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      console.log(`Fetch successful on attempt ${attempt}`)
      return response

    } catch (error) {
      lastError = error
      console.error(`Attempt ${attempt} failed: ${error.message}`)

      // Don't retry on certain errors
      if (error.message.includes('HTTP 4')) {
        // 4xx errors are client errors, don't retry
        throw error
      }

      // If this wasn't the last attempt, wait before retrying
      if (attempt < maxRetries) {
        // Exponential backoff: 2s, 4s, 8s
        const delayMs = Math.pow(2, attempt) * 1000
        console.log(`Waiting ${delayMs}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    }
  }

  // All retries exhausted
  throw new Error(`Failed after ${maxRetries} attempts: ${lastError.message}`)
}

/**
 * Serverless Function to fetch IRCC Express Entry draws
 * Uses official IRCC JSON API (no scraping needed!)
 * Saves data to local JSON file
 * Authenticated with CRON_SECRET environment variable
 */
export default async function handler(req, res) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers['authorization']
  const cronSecret = authHeader?.split(' ')[1] || authHeader

  if (cronSecret !== process.env.CRON_SECRET) {
    console.error('Unauthorized scrape attempt')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  console.log('Starting IRCC draws fetch from official API...')
  console.log(`Timestamp: ${new Date().toISOString()}`)

  try {
    // Fetch data from IRCC's official JSON API with retry logic
    console.log('Fetching data from IRCC API...')
    const response = await fetchWithRetry(
      'https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json'
    )

    console.log('Parsing JSON response...')
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
    const dbPath = path.join(__dirname, '..', 'database', 'draws.json')
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

    return res.status(200).json({
      success: true,
      fetched: draws.length,
      saved: draws.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Fetch error:', error)
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
  }
}
