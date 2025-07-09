// admin.js - Marak Squires 2025 - yellowbrickring.com
import { Hono } from 'hono'
import { basicAuth } from 'hono/basic-auth'

const admin = new Hono()

// ✅ Protect all routes under admin using basic auth with environment variables
admin.use('*', async (c, next) => {
    const auth = basicAuth({
        username: c.env.ADMIN_USERNAME || 'admin',
        password: c.env.ADMIN_PASSWORD || 'admin',
    })
    return await auth(c, next)
});

// Show all pending submissions
admin.get('/submissions', async (c) => {
    const db = c.env.YELLOWBRICKRING_DB
    const { results } = await db.prepare(`
    SELECT * FROM submissions WHERE status = 'pending' ORDER BY created_at DESC
  `).all()
    return c.json(results)
})

// Show all approved sites with analytics
admin.get('/sites', async (c) => {
    const db = c.env.YELLOWBRICKRING_DB
    const { results: sites } = await db.prepare(`
    SELECT * FROM sites ORDER BY order_index ASC, created_at ASC;
  `).all()

    const enriched = []

    for (const site of sites) {
        const visit = await db.prepare(`
      SELECT total FROM site_visits WHERE site_id = ?
    `).bind(site.id).first()

        const { results: referrals } = await db.prepare(`
      SELECT referrer_id, count FROM site_referrals
      WHERE site_id = ?
      ORDER BY count DESC
    `).bind(site.id).all()

        enriched.push({
            ...site,
            totalVisits: visit?.total || 0,
            referrals
        })
    }

    return c.json(enriched)
})

// View analytics for a single site
admin.get('/analytics/:id', async (c) => {
    const db = c.env.YELLOWBRICKRING_DB
    const id = c.req.param('id')

    const visit = await db.prepare(`SELECT total FROM site_visits WHERE site_id = ?`)
        .bind(id).first()

    const { results: referrals } = await db.prepare(`
    SELECT referrer_id, count FROM site_referrals
    WHERE site_id = ?
    ORDER BY count DESC
  `).bind(id).all()

    return c.json({
        site: id,
        totalVisits: visit?.total || 0,
        referrals
    })
})

admin.post('/approve/:id', async (c) => {
	const db = c.env.YELLOWBRICKRING_DB
	const submissionId = c.req.param('id')

	const submission = await db.prepare(`
		SELECT * FROM submissions WHERE id = ?
	`).bind(submissionId).first()

	if (!submission) return c.text('Submission not found', 404)

	// Get next order_index
	const row = await db.prepare(`SELECT COALESCE(MAX(order_index), 0) + 1 as next_order FROM sites`).first()
	const nextOrder = row?.next_order ?? 0

	// Insert into sites with proper order_index
	await db.prepare(`
		INSERT INTO sites (id, name, url, order_index)
		VALUES (?, ?, ?, ?)
	`).bind(submission.domain, submission.name, submission.url, nextOrder).run()

	// Mark submission as approved
	await db.prepare(`UPDATE submissions SET status = 'approved' WHERE id = ?`).bind(submissionId).run()

	return c.text('✅ Site approved and added to ring!')
})


// Deny submission
admin.post('/deny/:id', async (c) => {
    const db = c.env.YELLOWBRICKRING_DB
    const id = c.req.param('id')

    const submission = await db.prepare(`
    SELECT * FROM submissions WHERE id = ? AND status = 'pending'
  `).bind(id).first()

    if (!submission) return c.text('Submission not found.', 404)

    await db.prepare(`UPDATE submissions SET status = 'denied' WHERE id = ?`)
        .bind(id).run()

    return c.text('Denied.')
})

// Remove a site
admin.post('/remove/:id', async (c) => {
    const db = c.env.YELLOWBRICKRING_DB
    const id = c.req.param('id')

    await db.prepare(`DELETE FROM sites WHERE id = ?`).bind(id).run()
    await db.prepare(`DELETE FROM site_visits WHERE site_id = ?`).bind(id).run()
    await db.prepare(`DELETE FROM site_referrals WHERE site_id = ?`).bind(id).run()

    return c.text('Site removed.')
})
admin.post('/reorder', async (c) => {
    const db = c.env.YELLOWBRICKRING_DB
    const { orderedIds } = await c.req.json()

    console.log('Reordering sites:', orderedIds)

    for (let i = 0; i < orderedIds.length; i++) {
        const id = orderedIds[i]
        await db.prepare(`UPDATE sites SET order_index = ? WHERE id = ?`)
            .bind(i, id).run()
    }

    return c.text('Order updated!')
})


export default admin
