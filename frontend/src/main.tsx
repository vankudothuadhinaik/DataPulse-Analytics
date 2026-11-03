import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import "./style.css";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

function App() {
  const [metrics, setMetrics] = useState<any>({});
  const [topEvents, setTopEvents] = useState<any[]>([]);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const headers = apiKey ? { "X-API-Key": apiKey } : undefined;
    setMetrics({});
    setTopEvents([]);
    setLoading(true);
    Promise.all([
      fetch(`${API}/analytics/metrics`, { headers, signal: controller.signal }).then((response) => {
        if (!response.ok) throw new Error(`Metrics request failed (${response.status})`);
        return response.json();
      }),
      fetch(`${API}/analytics/top-events`, { headers, signal: controller.signal }).then((response) => {
        if (!response.ok) throw new Error(`Top events request failed (${response.status})`);
        return response.json();
      }),
    ])
      .then(([nextMetrics, nextEvents]) => {
        setMetrics(nextMetrics);
        setTopEvents(nextEvents);
        setError("");
      })
      .catch((cause) => {
        if (cause.name !== "AbortError") {
          setError("Could not load analytics. Check the API address and API key.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [apiKey]);

  function connectDashboard(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setApiKey(apiKeyInput.trim());
  }

  return (
    <main>
      <header>
        <div><b>DATAPULSE</b><h1>Analytics overview</h1><p>Product-event intelligence dashboard.</p></div>
        <span>{error ? "● API unavailable" : "● Analytics dashboard"}</span>
      </header>
      {error && <p role="alert" className="error-message">{error}</p>}
      <form className="api-key-form" onSubmit={connectDashboard}>
        <label htmlFor="api-key">API key <small>(only required when API authentication is enabled)</small></label>
        <input
          id="api-key"
          type="password"
          autoComplete="off"
          value={apiKeyInput}
          onChange={(event) => setApiKeyInput(event.target.value)}
          placeholder="Enter the API key if required"
        />
        <button type="submit" disabled={loading}>
          {loading ? "Loading…" : "Connect / refresh"}
        </button>
        <small>The key stays in this browser session and is not saved to local storage or bundled into the app.</small>
      </form>
      <section className="cards">
        {[
          ["Events", metrics.events ?? 0],
          ["Users", metrics.users ?? 0],
          ["Sessions", metrics.sessions ?? 0],
          ["Event value", new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(metrics.revenue ?? 0)],
        ].map(([label, value]) => (
          <article key={label}><small>{label}</small><strong>{value}</strong></article>
        ))}
      </section>
      <section className="panel">
        <h2>Top events</h2>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={topEvents}>
            <XAxis dataKey="event" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" />
          </BarChart>
        </ResponsiveContainer>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
