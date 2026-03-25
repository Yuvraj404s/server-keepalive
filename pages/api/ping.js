const SERVICES = require("../../services");

export default async function handler(req, res) {
  const results = [];

  // Sequential pings — one by one, no overlap, no miscommunication
  for (const svc of SERVICES) {
    const start = Date.now();
    let status = "error";
    let statusCode = null;
    let ms = 0;

    try {
      const response = await fetch(svc.url, {
        method: "GET",
        signal: AbortSignal.timeout(15000), // 15s timeout per service
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
