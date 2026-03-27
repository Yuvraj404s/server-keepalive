// ============================================================
//  ADD / REMOVE SERVICES HERE — this is the only file to edit
// ============================================================
export const SERVICES = [
  // GateKeeper
  { project: "GateKeeper", name: "API Gateway",       url: "https://gatekeeper-api-gateway.onrender.com/actuator/health" },
  { project: "GateKeeper", name: "Rate Limiter",      url: "https://gatekeeper-rate-limiter.onrender.com/actuator/health" },
  { project: "GateKeeper", name: "Analytics Service", url: "https://gatekeeper-analytics.onrender.com/analytics/health" },
  { project: "GateKeeper", name: "Resource Service",  url: "https://gatekeeper-resource.onrender.com/api/resource/health" },

  // CloudSentinel
  { project: "CloudSentinel", name: "Backend", url: "https://cloudsentinel-backend-hwfg.onrender.com/api/health" },
];

export default SERVICES;
