-- Sites that are approved and live
CREATE TABLE IF NOT EXISTS sites (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Submissions pending approval
CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip TEXT NOT NULL,
  domain TEXT NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Total visits per site
CREATE TABLE IF NOT EXISTS site_visits (
  site_id TEXT PRIMARY KEY,
  total INTEGER NOT NULL DEFAULT 0
);

-- Referrer breakdown per site
CREATE TABLE IF NOT EXISTS site_referrals (
  site_id TEXT NOT NULL,
  referrer_id TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (site_id, referrer_id)
);

-- Only one pending submission per IP
CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_ip_pending
  ON submissions(ip) WHERE status = 'pending';

-- Adds an order index to sites for sorting
-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
ALTER TABLE sites ADD COLUMN order_index INTEGER DEFAULT 0;

-- Create index on order_index (safe to run multiple times)
CREATE INDEX IF NOT EXISTS idx_sites_order_index ON sites(order_index);