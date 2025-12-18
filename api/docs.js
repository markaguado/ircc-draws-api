/**
 * API Documentation Page
 * GET /api/docs
 */
export default async function handler(req, res) {
  const baseUrl = req.headers.host
  const protocol = req.headers['x-forwarded-proto'] || 'http'
  const fullUrl = `${protocol}://${baseUrl}`

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IRCC Draws API Documentation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 3rem 2rem;
      text-align: center;
    }
    h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .subtitle { opacity: 0.9; font-size: 1.1rem; }
    .content { padding: 2rem; }
    .endpoint {
      background: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 1.5rem;
      margin: 1.5rem 0;
      border-radius: 8px;
    }
    .method {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 0.3rem 0.8rem;
      border-radius: 4px;
      font-weight: bold;
      font-size: 0.85rem;
      margin-right: 0.5rem;
    }
    .path { font-family: 'Courier New', monospace; font-weight: bold; font-size: 1.1rem; }
    .description { margin: 1rem 0; color: #555; }
    .params {
      background: white;
      padding: 1rem;
      border-radius: 6px;
      margin: 1rem 0;
    }
    .param-name { font-weight: bold; color: #667eea; }
    .example {
      background: #2d3748;
      color: #68d391;
      padding: 1rem;
      border-radius: 6px;
      font-family: 'Courier New', monospace;
      font-size: 0.9rem;
      overflow-x: auto;
      margin: 1rem 0;
    }
    .try-button {
      background: #667eea;
      color: white;
      border: none;
      padding: 0.5rem 1.5rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
      text-decoration: none;
      display: inline-block;
      margin-top: 0.5rem;
    }
    .try-button:hover { background: #5568d3; }
    .section { margin: 2rem 0; }
    h2 {
      color: #667eea;
      margin: 2rem 0 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #e2e8f0;
    }
    .badge {
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 0.2rem 0.6rem;
      border-radius: 4px;
      font-size: 0.75rem;
      margin-left: 0.5rem;
    }
    footer {
      background: #f8f9fa;
      padding: 2rem;
      text-align: center;
      color: #666;
      border-top: 1px solid #e2e8f0;
    }
    a { color: #667eea; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🇨🇦 IRCC Draws API</h1>
      <p class="subtitle">RESTful API for Canadian Express Entry Draw Data</p>
    </header>

    <div class="content">
      <div class="section">
        <h2>Overview</h2>
        <p>This API provides access to historical and current Express Entry draw data from Immigration, Refugees and Citizenship Canada (IRCC). All endpoints return JSON responses.</p>
        <p><strong>Base URL:</strong> <code>${fullUrl}/api</code></p>
        <p><strong>Data Source:</strong> <a href="https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json" target="_blank">IRCC Official API</a></p>
      </div>

      <div class="section">
        <h2>Endpoints</h2>

        <div class="endpoint">
          <div>
            <span class="method">GET</span>
            <span class="path">/api/draws</span>
            <span class="badge">Public</span>
          </div>
          <div class="description">Get all Express Entry draws with optional filtering.</div>
          <div class="params">
            <strong>Query Parameters:</strong>
            <ul>
              <li><span class="param-name">year</span> (optional) - Filter by year (e.g., 2025)</li>
              <li><span class="param-name">category</span> (optional) - Filter by category (e.g., French, Healthcare, CEC)</li>
              <li><span class="param-name">limit</span> (optional) - Limit number of results</li>
            </ul>
          </div>
          <div class="example">GET ${fullUrl}/api/draws?year=2025&category=French&limit=10</div>
          <a href="${fullUrl}/api/draws" class="try-button" target="_blank">Try it</a>
          <a href="${fullUrl}/api/draws?year=2025" class="try-button" target="_blank">Try with filters</a>
        </div>

        <div class="endpoint">
          <div>
            <span class="method">GET</span>
            <span class="path">/api/draws/latest</span>
            <span class="badge">Public</span>
          </div>
          <div class="description">Get the most recent Express Entry draw.</div>
          <div class="example">GET ${fullUrl}/api/draws/latest</div>
          <a href="${fullUrl}/api/draws/latest" class="try-button" target="_blank">Try it</a>
        </div>

        <div class="endpoint">
          <div>
            <span class="method">GET</span>
            <span class="path">/api/draws/:id</span>
            <span class="badge">Public</span>
          </div>
          <div class="description">Get a specific draw by round number.</div>
          <div class="params">
            <strong>Path Parameters:</strong>
            <ul>
              <li><span class="param-name">id</span> - Round number (e.g., 388)</li>
            </ul>
          </div>
          <div class="example">GET ${fullUrl}/api/draws/388</div>
          <a href="${fullUrl}/api/draws/388" class="try-button" target="_blank">Try it</a>
        </div>

        <div class="endpoint">
          <div>
            <span class="method">GET</span>
            <span class="path">/api/draws/stats</span>
            <span class="badge">Public</span>
          </div>
          <div class="description">Get statistical summary of all draws including averages, totals, and breakdowns by category.</div>
          <div class="params">
            <strong>Query Parameters:</strong>
            <ul>
              <li><span class="param-name">year</span> (optional) - Filter stats by year</li>
            </ul>
          </div>
          <div class="example">GET ${fullUrl}/api/draws/stats?year=2025</div>
          <a href="${fullUrl}/api/draws/stats" class="try-button" target="_blank">Try it</a>
        </div>
      </div>

      <div class="section">
        <h2>Response Format</h2>
        <p>All responses return JSON with the following structure:</p>
        <div class="example">{
  "drawNumber": 388,
  "date": "2025-12-17",
  "invitationsIssued": 6000,
  "minimumCRS": 399,
  "category": "French-language",
  "roundType": "Category-based",
  "year": "2025",
  "notes": "French language proficiency"
}</div>
      </div>

      <div class="section">
        <h2>Rate Limiting</h2>
        <p>This API is publicly accessible with no authentication required. Please use responsibly.</p>
      </div>

      <div class="section">
        <h2>Data Updates</h2>
        <p>The database is automatically updated daily via a cron job that fetches the latest data from the IRCC official API.</p>
      </div>
    </div>

    <footer>
      <p>Built with ❤️ for the Canadian immigration community</p>
      <p><a href="${fullUrl}">← Back to Dashboard</a> | <a href="${fullUrl}/api">API Index</a></p>
    </footer>
  </div>
</body>
</html>
  `

  res.setHeader('Content-Type', 'text/html')
  return res.status(200).send(html)
}
