import { Hono } from 'hono'
import { cors } from 'hono/cors';

const app = new Hono()

// Apply CORS middleware
app.use('*', cors());

// Hard-coded ring sites (ordered)
const ring = [
  { id: 'buddypond.com', name: 'Buddy Pond', url: 'https://buddypond.com' },
  { id: 'fireshipquotes.com', name: 'Fireship Quotes', url: 'https://fireshipquotes.com/' },
  { id: 'aero.buddypond.com', name: 'Aero Music Player', url: 'https://aero.buddypond.com/' },
  { id: 'codyq.dev' , name: 'CodyQ Dev', url: 'https://codyq.dev/' }
]

// Utility: Get site index
function getIndexById(id) {
  return ring.findIndex(site => site.id === id)
}

// Utility: Analytics stub
async function logNavigation(type, from, to) {
  // Later: Write to Durable Object or KV log
  console.log(`[Analytics] ${type} | from: ${from} → to: ${to}`)
}

// Home / Landing Page (optional)
app.get('/', (c) => {
  return c.text('🌐 Welcome to the BuddyRing! Try /next/:siteId or /random')
})

// JSON endpoint of site data
app.get('/sites.json', (c) => {
  return c.json(ring)
})

// webring?from=codyq.dev&to=next

// Redirect to next site
app.get('/next/:id', async (c) => {
  const { id } = c.req.param()
  const index = getIndexById(id)
  if (index === -1) return c.text('Site not found', 404)

  const next = ring[(index + 1) % ring.length]
  await logNavigation('next', id, next.id)
  return c.redirect(next.url)
})

// Redirect to previous site
app.get('/prev/:id', async (c) => {
  const { id } = c.req.param()
  const index = getIndexById(id)
  if (index === -1) return c.text('Site not found', 404)

  const prev = ring[(index - 1 + ring.length) % ring.length]
  await logNavigation('prev', id, prev.id)
  return c.redirect(prev.url)
})

// Redirect to random site
app.get('/random', async (c) => {
  const randomIndex = Math.floor(Math.random() * ring.length)
  const site = ring[randomIndex]
  await logNavigation('random', null, site.id)
  return c.redirect(site.url)
})

app.get('/webring', async (c) => {
  const from = c.req.query('from')
  const to = c.req.query('to') || 'next'

  const index = getIndexById(from)
  if (index === -1 && to !== 'random') return c.text('Site not found', 404)

  let target

  if (to === 'next') {
    target = ring[(index + 1) % ring.length]
    await logNavigation('next', from, target.id)
  } else if (to === 'prev') {
    target = ring[(index - 1 + ring.length) % ring.length]
    await logNavigation('prev', from, target.id)
  } else if (to === 'random') {
    const randIndex = Math.floor(Math.random() * ring.length)
    target = ring[randIndex]
    await logNavigation('random', from, target.id)
  } else {
    return c.text('Invalid navigation direction', 400)
  }

  return c.redirect(target.url)
});


// Stub for adding site (optional for future)
app.post('/submit', async (c) => {
  const body = await c.req.json()
  // Example: store in KV or Durable Object
  console.log(`[Submit] New site submission:`, body)
  return c.text('Thanks for submitting!')
});


app.all('*', (c) => {
 return c.env.ASSETS.fetch(c.req.raw);
});


export default app
