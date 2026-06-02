// Temp endpoint — schema ops on Brands table. DELETE AFTER USE.
//
// Diagnostic + executor. Reports each op with full Airtable error body so we can
// distinguish 403 (scope missing) from 422 (payload). Push redeploys → picks up
// any updated AIRTABLE_PAT env value.
//
// Usage: GET /api/admin-ops            → runs read-only diagnostics + lists views
//        GET /api/admin-ops?write=1    → also performs the schema mutations

const BASE = process.env.AIRTABLE_BASE_ID;
const PAT = process.env.AIRTABLE_PAT;
const TABLE = 'tblfNOtY2VthbPanL';
const F_HAS_CREATINE = 'fldg8yX6El4OxL88d';
const F_BIGBOX = 'fldX7DwFlZAFEVM6l';

const H = () => ({ Authorization: `Bearer ${PAT}`, 'Content-Type': 'application/json' });

async function call(method, path, body) {
  try {
    const r = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE}${path}`, {
      method,
      headers: H(),
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const text = await r.text();
    return { status: r.status, body: text.slice(0, 800) };
  } catch (e) {
    return { error: String(e) };
  }
}

export default async function handler(req, res) {
  if (!PAT || !BASE) return res.status(500).json({ error: 'env missing' });
  const write = req.query.write === '1';
  const out = {};

  // 1. List views — confirms read works, shows whether the creatine view exists.
  out.listViews = await call('GET', `/tables/${TABLE}/views`);

  // 2. Scope test — name+description PATCH only (always-valid body). 403 => scope missing.
  out.scopeTest = await call('PATCH', `/tables/${TABLE}/fields/${F_HAS_CREATINE}`, {
    description: 'Creatine format detected (Shopify scrape). Unreachable = site failed to load.',
  });

  if (!write) {
    out.note = 'read-only run. add ?write=1 to perform mutations.';
    return res.status(200).json(out);
  }

  // 3. Has Creatine: rename Unknown->Unreachable, drop Chews (omit it).
  out.hasCreatineChoices = await call('PATCH', `/tables/${TABLE}/fields/${F_HAS_CREATINE}`, {
    options: {
      choices: [
        { id: 'selWfg3SvQ6hIE41H', name: 'Powder' },
        { id: 'selmrefyf6lVzM5Nz', name: 'Gummies' },
        { id: 'selGEtbYTX6fnSOUF', name: 'No' },
        { id: 'sel7DQxN8ntML2Z6a', name: 'Unreachable' },
        { id: 'selvFqAy6mqocLve6', name: 'Chewables' },
        { id: 'selIhClMGwCW14WY5', name: 'Capsules' },
      ],
    },
  });

  // 4. Big Box Status: rename Yes->In Big Box, No->Not Found, add Unreachable + Pending.
  out.bigBoxChoices = await call('PATCH', `/tables/${TABLE}/fields/${F_BIGBOX}`, {
    options: {
      choices: [
        { id: 'seluCaaZmFYqo7Fw5', name: 'In Big Box' },
        { id: 'sel7fbQExzIvCzKfw', name: 'Not Found' },
        { name: 'Unreachable' },
        { name: 'Pending' },
      ],
    },
  });

  // 5. Create the creatine view (skip if listViews already shows it).
  const exists = (out.listViews.body || '').includes('All Creatine Brands (68)');
  if (exists) {
    out.viewCreate = { skipped: 'view already exists' };
  } else {
    out.viewCreate = await call('POST', `/tables/${TABLE}/views`, {
      name: 'All Creatine Brands (68)',
      type: 'grid',
    });
  }

  return res.status(200).json(out);
}
