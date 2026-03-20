export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Collect raw body (multipart form-data)
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);

    const response = await fetch(
      "https://doc-scanner-93ny.onrender.com/upload",
      {
        method: "POST",
        headers: { "content-type": req.headers["content-type"] },
        body: body,
      },
    );

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(502).json({ error: `Proxy error: ${err.message}` });
  }
}
