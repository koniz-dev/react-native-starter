// Switches the e2e mock API (scripts/e2e/mock-api.js) between 'ok' and 'error'.
const response = http.post(`${MOCK_API_URL}/__mode/${MODE}`, { body: '' });
if (!response.ok) {
  throw new Error(`mock API mode ${MODE}: HTTP ${response.status}`);
}
