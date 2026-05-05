const https = require('https')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const apiKey = process.env.ANTHROPIC_KEY
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_KEY missing' })

  let body = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { return res.status(400).json({ error: 'Bad JSON' }) }
  }

  const payload = JSON.stringify(body)

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      }
    }
    const request = https.request(options, (response) => {
      let data = ''
      response.on('data', chunk => { data += chunk })
      response.on('end', () => {
        try { res.status(response.statusCode).json(JSON.parse(data)) }
        catch { res.status(500).json({ error: 'Parse error', raw: data.slice(0, 200) }) }
        resolve()
      })
    })
    request.on('error', err => { res.status(500).json({ error: err.message }); resolve() })
    request.write(payload)
    request.end()
  })
}