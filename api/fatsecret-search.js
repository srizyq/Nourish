// Serverless proxy for FatSecret Platform API food search.
//
// FatSecret uses OAuth 2.0 client-credentials with a Client Secret that
// signs/authenticates every request — unlike USDA's plain query-string key,
// this secret must never reach the browser (anyone reading it out of the
// bundle could exhaust or abuse the account's quota). This function holds
// the secret, exchanges it for a short-lived bearer token (cached across
// warm invocations), and proxies the actual search so the browser only
// ever talks to our own origin.

let cachedToken = null;
let cachedTokenExpiresAt = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < cachedTokenExpiresAt) return cachedToken;

  const clientId = process.env.FATSECRET_CLIENT_ID;
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("FatSecret credentials are not configured");
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch("https://oauth.fatsecret.com/connect/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    // "premier" is required once the account is upgraded — a token scoped
    // to "basic" alone gets rejected with "Missing scope: scope 'premier'"
    // on a Premier account, confirmed via direct API testing.
    body: "grant_type=client_credentials&scope=basic%20premier",
  });
  if (!res.ok) throw new Error(`FatSecret token request failed: ${res.status}`);
  const data = await res.json();

  cachedToken = data.access_token;
  // Refresh a minute early so a request never runs on an about-to-expire token.
  cachedTokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

async function searchFoods(query, token) {
  const url = `https://platform.fatsecret.com/rest/foods/search/v5?search_expression=${encodeURIComponent(query)}&format=json&region=AU&max_results=30`;
  return fetch(url, { headers: { Authorization: `Bearer ${token}` } });
}

export default async function handler(req, res) {
  const query = req.query?.q;
  if (!query || !query.trim()) {
    res.status(400).json({ error: "Missing query parameter 'q'" });
    return;
  }

  try {
    let token = await getAccessToken();
    let res2 = await searchFoods(query, token);
    // A cached token that expired early (clock skew, revoked, etc.) fails
    // with 401 — force one fresh token + retry before giving up.
    if (res2.status === 401) {
      cachedToken = null;
      token = await getAccessToken();
      res2 = await searchFoods(query, token);
    }
    if (!res2.ok) {
      res.status(502).json({ error: `FatSecret search failed: ${res2.status}` });
      return;
    }
    const data = await res2.json();
    res.status(200).json(data);
  } catch (err) {
    console.error("FatSecret proxy error:", err);
    // TEMPORARY: surfacing err.message for live debugging — revert once
    // the root cause is confirmed.
    res.status(502).json({ error: "FatSecret search is temporarily unavailable", debug: err.message });
  }
}
