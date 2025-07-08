// yellowbrickring.js - Marak Squires 2025 - yellowbrickring.com
import { Hono } from 'hono'
import { cors } from 'hono/cors';

import admin from './admin.js'

const app = new Hono()

// Apply CORS middleware
app.use('*', cors({
	allowMethods: ['POST', 'GET', 'OPTIONS']
}));

// Home / Landing Page (optional)
app.get('/', (c) => {
	return c.text('🌐 Welcome to the BuddyRing! Try /next/:siteId or /random')
})

// JSON endpoint of site data
app.get('/sites.json', async (c) => {
	const db = c.env.YELLOWBRICKRING_DB
	const { results } = await db.prepare('SELECT * FROM sites ORDER BY created_at ASC').all()
	return c.json(results)
});

// webring?from=codyq.dev&to=next

// Redirect to next site
app.get('/next/:id', async (c) => {
	const sites = await getSiteList(c)
	const { id } = c.req.param()
	const index = findIndex(sites, id)

	if (index === -1) return c.text('Site not found', 404)

	const next = sites[(index + 1) % sites.length]
	await logNavigation('next', id, next.id, c)
	return c.redirect(next.url)
})

// Redirect to previous site
app.get('/prev/:id', async (c) => {
	const sites = await getSiteList(c)
	const { id } = c.req.param()
	const index = findIndex(sites, id)

	if (index === -1) return c.text('Site not found', 404)

	const prev = sites[(index - 1 + sites.length) % sites.length]
	await logNavigation('prev', id, prev.id, c)
	return c.redirect(prev.url)
})

// Redirect to random site
app.get('/random', async (c) => {
	const sites = await getSiteList(c)
	if (sites.length === 0) return c.text('No sites available', 404)

	const site = sites[Math.floor(Math.random() * sites.length)]
	await logNavigation('random', null, site.id, c)
	return c.redirect(site.url)
})

app.get('/webring', async (c) => {
	const sites = await getSiteList(c)
	const from = c.req.query('from')
	const to = c.req.query('to') || 'next'

	const index = findIndex(sites, from)
	if (index === -1 && to !== 'random') return c.text('Site not found', 404)

	let target

	if (to === 'next') {
		target = sites[(index + 1) % sites.length]
		await logNavigation('next', from, target.id, c)
	} else if (to === 'prev') {
		target = sites[(index - 1 + sites.length) % sites.length]
		await logNavigation('prev', from, target.id, c)
	} else if (to === 'random') {
		target = sites[Math.floor(Math.random() * sites.length)]
		await logNavigation('random', from, target.id, c)
	} else {
		return c.text('Invalid navigation direction', 400)
	}

	return c.redirect(target.url)
})


app.post('/submit-site', async (c) => {
	const db = c.env.YELLOWBRICKRING_DB
	const ip = c.req.header('cf-connecting-ip') || 'unknown'
	const { domain, name, url } = await c.req.json()

	console.log(`Received submission from IP: ${ip}, ID: ${domain}, Name: ${name}, URL: ${url}`)

	// Check for existing pending submission from IP
	const existing = await db.prepare(`
    SELECT * FROM submissions WHERE ip = ? AND status = 'pending'
  `).bind(ip).first()

	if (existing) {
		return c.text('You already have a pending submission.', 429)
	}

	await db.prepare(`
    INSERT INTO submissions (ip, domain, name, url)
    VALUES (?, ?, ?, ?)
  `).bind(ip, domain, name, url).run()

	return c.text('Thanks for submitting! Your site will be reviewed.')
})

//
// Admin routes
//
app.route('/admin', admin)

//
// Static asset handling
//
app.all('*', (c) => {
	console.log(`Handling request for: ${c.req.path} with method: ${c.req.method}`)
	if (['GET', 'HEAD'].includes(c.req.method)) {
		return c.env.ASSETS.fetch(c.req.raw)
	} else {
		return c.text('Method Not Allowed', 405)
	}
})

async function logNavigation(type, from, to, c) {
	console.log(`[analytics] ${type} from ${from || 'unknown'} to ${to}`)
	try {
		const db = c.env.YELLOWBRICKRING_DB

		// Increment total visits for `to`
		await db.prepare(`
      INSERT INTO site_visits (site_id, total)
      VALUES (?, 1)
      ON CONFLICT(site_id) DO UPDATE SET total = total + 1
    `).bind(to).run()

		// If there's a referrer (`from`), increment referral count
		if (from) {
			await db.prepare(`
        INSERT INTO site_referrals (site_id, referrer_id, count)
        VALUES (?, ?, 1)
        ON CONFLICT(site_id, referrer_id) DO UPDATE SET count = count + 1
      `).bind(to, from).run()
		}
	} catch (err) {
		console.warn('[analytics error]', err)
	}
}


// Utility: Get site index in DB-ordered list
async function getSiteList(c) {
	const db = c.env.YELLOWBRICKRING_DB
	const { results } = await db.prepare(`
    SELECT * FROM sites ORDER BY created_at ASC
  `).all()
	return results
}

function findIndex(sites, id) {
	return sites.findIndex(site => site.id === id)
}

export default app