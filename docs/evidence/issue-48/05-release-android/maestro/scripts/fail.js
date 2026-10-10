// Turns the mock backend's notes failure on or off through the TLS proxy's control port.
const response = http.get(`http://localhost:4001/fail/${MODE}`);
if (!response.ok) throw new Error(`fail/${MODE}: HTTP ${response.status}`);
