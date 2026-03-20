export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://doc-scanner-93ny.onrender.com/health",
    );
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(502).json({ error: `Proxy error: ${err.message}` });
  }
}
