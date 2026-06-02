// Temp endpoint — BOUNDED schema-capability test harness (PAT). DELETE AFTER USE.
//
// Proves what schema.bases:write can/can't do on this base. Each ?test= runs one
// fixed, hardcoded Airtable Meta API call and returns the exact status + body.
//   ?test=createField   create a throwaway singleSelect w/ choices  (expect 200)
//   ?test=renameOnly    PATCH Has Creatine: keep ALL 7 choices+color, Unknown->Unreachable
//   ?test=addOnly       PATCH Big Box: keep Yes/No+color, add Unreachable+Pending
//   ?test=deleteField&fid=fldXXXX   delete a throwaway field (cleanup)
//   (default)           name/desc scope test + report

const BASE = process.env.AIRTABLE_BASE_ID;
const PAT = process.env.AIRTABLE_PAT;
const TABLE = 'tblfNOtY2VthbPanL';
const F_HAS_CREATINE = 'fldg8yX6El4OxL88d';
const F_BIGBOX = 'fldX7DwFlZAFEVM6l';

async function call(method, path, body) {
  const r = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${PAT}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await r.text();
  let parsed; try { parsed = JSON.parse(text); } catch { parsed = text; }
  return { status: r.status, body: parsed };
}

export default async function handler(req, res) {
  if (!PAT || !BASE) return res.status(500).json({ error: 'env missing' });
  const test = req.query.test;
  try {
    if (test === 'createField') {
      return res.json(await call('POST', `/tables/${TABLE}/fields`, {
        name: `ZZ Scope Test ${req.query.n || '1'}`,
        type: 'singleSelect',
        options: { choices: [{ name: 'Alpha' }, { name: 'Beta' }] },
      }));
    }
    if (test === 'renameOnly') {
      // All existing choices present with color; ONLY Unknown's name changes. No add, no delete.
      return res.json(await call('PATCH', `/tables/${TABLE}/fields/${F_HAS_CREATINE}`, {
        options: { choices: [
          { id: 'selWfg3SvQ6hIE41H', name: 'Powder', color: 'yellowLight2' },
          { id: 'selmrefyf6lVzM5Nz', name: 'Gummies', color: 'greenLight1' },
          { id: 'selRDH7QNHdqOpsa8', name: 'Chews', color: 'redLight2' },
          { id: 'selGEtbYTX6fnSOUF', name: 'No', color: 'redBright' },
          { id: 'sel7DQxN8ntML2Z6a', name: 'Unreachable', color: 'grayLight2' },
          { id: 'selvFqAy6mqocLve6', name: 'Chewables', color: 'redLight2' },
          { id: 'selIhClMGwCW14WY5', name: 'Capsules', color: 'greenLight1' },
        ] },
      }));
    }
    if (test === 'addOnly') {
      // Keep both existing choices (rename Yes/No too) + add two. No delete.
      return res.json(await call('PATCH', `/tables/${TABLE}/fields/${F_BIGBOX}`, {
        options: { choices: [
          { id: 'seluCaaZmFYqo7Fw5', name: 'In Big Box', color: 'greenLight1' },
          { id: 'sel7fbQExzIvCzKfw', name: 'Not Found', color: 'redBright' },
          { name: 'Unreachable' },
          { name: 'Pending' },
        ] },
      }));
    }
    if (test === 'deleteField') {
      const fid = req.query.fid;
      if (!fid) return res.status(400).json({ error: 'need fid' });
      return res.json(await call('DELETE', `/tables/${TABLE}/fields/${fid}`));
    }
    // default scope/report
    const scope = await call('PATCH', `/tables/${TABLE}/fields/${F_HAS_CREATINE}`, {
      description: 'Creatine format detected (Shopify scrape). Unreachable = site failed to load.',
    });
    return res.json({ scopeTest: scope, tests: ['createField', 'renameOnly', 'addOnly', 'deleteField'] });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
