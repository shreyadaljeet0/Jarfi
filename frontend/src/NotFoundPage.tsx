import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div style={{ maxWidth: 480, margin: "80px auto", padding: 24, textAlign: "center" }}>
      <h1 style={{ fontSize: 20, marginBottom: 12 }}>Page not found</h1>
      <p style={{ marginBottom: 20, color: "var(--text)" }}>
        There's nothing here. Head back to the SaveJar app.
      </p>
      <Link to="/app">Go to the app</Link>
    </div>
  );
}
