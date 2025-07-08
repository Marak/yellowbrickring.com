// yellowBrickRing.js
export default function yellowBrickRing (app) {
  const apiUrl = 'http://0.0.0.0:3001' // or use https://yellowbrickring.com in production

  const client = {
    // Fetch the full list of sites
    async getSites() {
      try {
        const res = await fetch(`${apiUrl}/sites.json`)
        if (!res.ok) throw new Error('Failed to fetch site list')
        return await res.json()
      } catch (err) {
        console.error('[yellowBrickRing] Failed to fetch sites:', err)
        return []
      }
    },

    // Submit a new site (stub for now)
    async submitSite(site) {
      try {
        const res = await fetch(`${apiUrl}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(site)
        })
        return await res.text()
      } catch (err) {
        console.error('[yellowBrickRing] Failed to submit site:', err)
        return null
      }
    },

    // Redirect user to next, prev, or random
    goTo(direction, fromId = null) {
      const url = new URL(`${apiUrl}/webring`)
      if (fromId) url.searchParams.set('from', fromId)
      url.searchParams.set('to', direction)
      window.location.href = url.toString()
    }
  }

  // Expose to global app object
  app.ring = client
}
