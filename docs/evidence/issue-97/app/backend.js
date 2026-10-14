// Talks to the Pocket Notes dev backend (scripts/notes-backend/server.js).
// ACTION=expire: every access token expires now. ACTION=assert-refreshed:
// fails unless the app has refreshed a token since the backend started.
const base = MAESTRO_BACKEND_URL;
if (ACTION === 'expire') {
  const response = http.post(`${base}/__expire`, { body: '' });
  if (!response.ok) throw new Error(`expire: HTTP ${response.status}`);
} else if (ACTION === 'assert-refreshed') {
  const stats = json(http.get(`${base}/__stats`).body);
  output.refreshes = stats.refreshes;
  if (!(stats.refreshes >= 1)) {
    throw new Error(`no token refresh (${JSON.stringify(stats)})`);
  }
} else {
  throw new Error(`unknown ACTION ${ACTION}`);
}
