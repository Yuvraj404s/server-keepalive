const SERVICES = require("../../services");

export default async function handler(req, res) {
  // If specific URLs passed, ping only those; else ping all
  const requested = req.query.urls ? req.query.urls.split(",") : null;
  const targets = requested
    ? SERVICES.filter((s) => requested.includes(s.url))
    : SERVICES;

  const results = [];

  // Always sequential — one by one
  for (const svc of targets) {
    const start = Date.now();
    let status = "error";
    let statusCode = null;
    let ms = 0;

    try {
      const response = await fetch(svc.url, {
        method: "GET",
        signal: AbortSignal.timeout(15000),
      });
      ms = Date.now() - start;
      statusCode = response.status;
      status = response.ok ? "ok" : "error";
    } catch (e) {
      ms = Date.now() - start;
      status = "error";
      statusCode = e.name === "TimeoutError" ? 504 : 0;
    }

    results.push({
      project: svc.project,
      name: svc.name,
      url: svc.url,
      status,
      statusCode,
      ms,
      lastPing: new Date().toISOString(),
    });
  }

  res.status(200).json({ results, pingedAt: new Date().toISOString() });
}
