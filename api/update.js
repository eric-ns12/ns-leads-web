// Vercel serverless function — POST /api/update
// Write-back for the leads UI. Field IDs only (global rule: never names).
// Whitelisted fields only — this is a public endpoint.
//
// Body:
//   { recordId, set: { fieldId, value } }   → set one whitelisted field (e.g. Include)
//   { recordId, appendNote: "text" }         → prepend "[YYYY-MM-DD] text" to IMN Notes (no overwrite)

const TABLE_FIELDS = {
  include: 'fldAcAzSUDvpwYnTH', // Include (checkbox)
  notes: 'fldnBo5h14FyLK4dx',   // IMN Notes (multilineText)
};
const WRITABLE = new Set([TABLE_FIELDS.include, TABLE_FIELDS.notes]);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { AIRTABLE_PAT, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME } = process.env;
  if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_NAME) {
    return res.status(500).json({ error: 'env missing' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const { recordId, set, appendNote } = body || {};
  if (!recordId || !/^rec[A-Za-z0-9]{14}$/.test(recordId)) {
    return res.status(400).json({ error: 'bad recordId' });
  }

  const recUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}/${recordId}`;
  const headers = { Authorization: `Bearer ${AIRTABLE_PAT}`, 'Content-Type': 'application/json' };

  try {
    // --- append a timestamped note (read current, prepend, write) ---
    if (typeof appendNote === 'string') {
      const text = appendNote.trim();
      if (!text) return res.status(400).json({ error: 'empty note' });
      const g = await fetch(`${recUrl}?returnFieldsByFieldId=true&fields[]=${TABLE_FIELDS.notes}`, { headers });
      if (!g.ok) return res.status(502).json({ error: 'read failed', status: g.status });
      const cur = ((await g.json()).fields || {})[TABLE_FIELDS.notes] || '';
      const stamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const entry = `[${stamp}] ${text}`;
      const next = cur ? `${entry}\n\n${cur}` : entry;
      const p = await fetch(recUrl, { method: 'PATCH', headers, body: JSON.stringify({ fields: { [TABLE_FIELDS.notes]: next } }) });
      if (!p.ok) return res.status(502).json({ error: 'write failed', status: p.status, body: (await p.text()).slice(0, 300) });
      return res.status(200).json({ ok: true, notes: next });
    }

    // --- set a single whitelisted field ---
    if (set && set.fieldId) {
      if (!WRITABLE.has(set.fieldId)) return res.status(400).json({ error: 'field not writable' });
      const p = await fetch(recUrl, { method: 'PATCH', headers, body: JSON.stringify({ fields: { [set.fieldId]: set.value } }) });
      if (!p.ok) return res.status(502).json({ error: 'write failed', status: p.status, body: (await p.text()).slice(0, 300) });
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'nothing to do' });
  } catch (err) {
    console.error('update error', err);
    return res.status(500).json({ error: 'network error' });
  }
}
