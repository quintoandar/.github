"use client";

import { useCallback, useEffect, useState } from "react";
import type { CollectResult } from "@/lib/collect";

const COLORS = ["#2563eb", "#16a34a", "#ea580c", "#7c3aed", "#0891b2"];

function formatPt(iso: string, tz: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: tz,
    dateStyle: "short",
    timeStyle: "short",
  });
}

function dayLabel(ymd: string): string {
  const [, m, d] = ymd.split("-");
  return `${d}/${m}`;
}

export default function HomePage() {
  const [data, setData] = useState<CollectResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const q = refresh ? "?refresh=1" : "";
      const res = await fetch(`/api/reviews${q}`, { cache: "no-store" });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || res.statusText);
      }
      setData((await res.json()) as CollectResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  const maxDaily = data
    ? Math.max(
        1,
        ...data.reviewers.flatMap((r) => data.days.map((d) => r.daily[d] ?? 0)),
      )
    : 1;

  const maxTotal = data
    ? Math.max(1, ...data.reviewers.map((r) => r.total))
    : 1;

  return (
    <main style={{ maxWidth: 920, margin: "0 auto", padding: "1.5rem" }}>
      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", margin: "0 0 0.5rem" }}>
          Reviews GitHub do time
        </h1>
        <p style={{ margin: 0, color: "#525252" }}>
          Últimos {data?.periodDays ?? 7} dias · fuso {data?.timezone ?? "America/Fortaleza"}
        </p>
        {data && (
          <p style={{ margin: "0.35rem 0", fontSize: "0.85rem", color: "#737373" }}>
            Fonte: {data.source}
            {data.sampleData ? " · configure o token no publish" : ""}
            {" · "}
            Atualizado: {formatPt(data.generatedAt, data.timezone)}
          </p>
        )}
        <button
          type="button"
          onClick={() => void load(true)}
          disabled={loading}
          style={{
            marginTop: "0.75rem",
            padding: "0.5rem 1rem",
            cursor: loading ? "wait" : "pointer",
          }}
        >
          {loading ? "Buscando no GitHub…" : "Atualizar agora"}
        </button>
        {error && (
          <p style={{ color: "#b91c1c", marginTop: "0.5rem" }} role="alert">
            {error}
          </p>
        )}
      </header>

      {data && (
        <>
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "0.75rem",
              marginBottom: "1.5rem",
            }}
          >
            {data.reviewers.map((r, i) => (
              <fieldset
                key={r.primaryLogin}
                style={{
                  border: `2px solid ${COLORS[i % COLORS.length]}`,
                  borderRadius: 8,
                  padding: "0.75rem",
                  margin: 0,
                }}
              >
                <legend style={{ fontSize: "0.75rem", padding: "0 4px" }}>
                  {r.name.split(" ")[0]}
                </legend>
                <div style={{ fontSize: "1.75rem", fontWeight: 600 }}>{r.total}</div>
                <div style={{ fontSize: "0.7rem", color: "#666" }}>{r.primaryLogin}</div>
              </fieldset>
            ))}
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.1rem" }}>Total no período</h2>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 160 }}>
              {data.reviewers.map((r, i) => (
                <div key={r.primaryLogin} style={{ flex: 1, textAlign: "center" }}>
                  <div
                    style={{
                      height: `${(r.total / maxTotal) * 130}px`,
                      background: COLORS[i % COLORS.length],
                      borderRadius: 4,
                      minHeight: r.total > 0 ? 4 : 0,
                    }}
                    title={`${r.total}`}
                  />
                  <div style={{ fontSize: "0.7rem", marginTop: 4 }}>
                    {r.name.split(" ")[0]}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: "1.1rem" }}>Evolução diária</h2>
            <p style={{ fontSize: "0.8rem", color: "#666", marginTop: 0 }}>
              Reviews enviados por dia (submitted_at)
            </p>
            <svg
              viewBox={`0 0 ${Math.max(400, data.days.length * 48)} 200`}
              style={{ width: "100%", height: 220 }}
              role="img"
              aria-label="Gráfico de linhas por revisor"
            >
              {data.reviewers.map((r, si) => {
                const pts = data.days.map((day, di) => {
                  const x = 40 + di * 48;
                  const v = r.daily[day] ?? 0;
                  const y = 180 - (v / maxDaily) * 150;
                  return `${x},${y}`;
                });
                return (
                  <polyline
                    key={r.primaryLogin}
                    fill="none"
                    stroke={COLORS[si % COLORS.length]}
                    strokeWidth={2}
                    points={pts.join(" ")}
                  />
                );
              })}
              {data.days.map((day, di) => (
                <text
                  key={day}
                  x={40 + di * 48}
                  y={196}
                  fontSize={10}
                  textAnchor="middle"
                  fill="#666"
                >
                  {dayLabel(day)}
                </text>
              ))}
            </svg>
            <ul style={{ fontSize: "0.8rem", paddingLeft: "1.2rem" }}>
              {data.reviewers.map((r, i) => (
                <li key={r.primaryLogin}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 10,
                      height: 10,
                      background: COLORS[i % COLORS.length],
                      marginRight: 6,
                    }}
                  />
                  {r.name}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}