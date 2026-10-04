// Investor portal endpoint. Does not read or store the request body.
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false });
  }
  await new Promise((r) => setTimeout(r, 500 + Math.floor(Math.random() * 500)));
  return res.status(401).json({ ok: false, error: 'The user name or password provided is incorrect.' });
};
