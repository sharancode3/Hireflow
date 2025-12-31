import { useEffect, useMemo, useState } from "react";
import { apiJson } from "../api/client";
import type { Trends } from "../mock/types";
import { BarChart, LineChart, PieChart } from "../components/Charts";

type TrendResponse = { trends: Trends };

function normalizeSeries(items: { label: string; value: number }[] | undefined, max = 12) {
  if (!Array.isArray(items)) return [] as { label: string; value: number }[];
  return items
    .filter((x) => x && typeof x.label === "string" && Number.isFinite(Number(x.value)))
    .slice(0, max)
    .map((x) => ({ label: x.label, value: Number(x.value) }));
}

export function HireTrendsPage() {
  const [data, setData] = useState<TrendResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const trends = useMemo(() => {
    const t = data?.trends;
    return {
      topRoles: normalizeSeries(t?.topRoles),
      trendingSkills: normalizeSeries(t?.trendingSkills),
      topCompanies: normalizeSeries(t?.topCompanies),
      industryHiring: normalizeSeries(t?.industryHiring),
      growth: normalizeSeries(t?.growth),
    } satisfies Trends;
  }, [data]);

  useEffect(() => {
    (async () => {
      try {
        setError(null);
        const res = await apiJson<TrendResponse>("/trends");
        setData(res);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load trends");
      }
    })();
  }, []);

  return (
    <div className="grid">
      <div className="card" style={{ marginBottom: 0 }}>
        <h2 style={{ marginTop: 0 }}>Talent Trends</h2>
        <p className="muted" style={{ margin: 0 }}>
          Premium analytics-style trends useful for both Job Seekers and Recruiters.
        </p>
      </div>

      {error ? <div className="card">{error}</div> : null}

      {!data ? (
        <div className="grid grid-2">
          <div className="card">
            <div className="skeleton" style={{ height: 14, width: 140 }} />
            <div className="skeleton" style={{ height: 28, width: 220, marginTop: 10 }} />
            <div className="skeleton" style={{ height: 14, width: 180, marginTop: 10 }} />
          </div>
          <div className="card">
            <div className="skeleton" style={{ height: 14, width: 160 }} />
            <div className="skeleton" style={{ height: 180, width: "100%", marginTop: 10 }} />
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-3">
            <div className="card">
              <div className="muted">Top hiring role</div>
              <div style={{ fontWeight: 900, fontSize: 18 }}>{trends.topRoles[0]?.label ?? "—"}</div>
              <div className="muted">Openings index: {trends.topRoles[0]?.value ?? 0}</div>
            </div>
            <div className="card">
              <div className="muted">Trending skill</div>
              <div style={{ fontWeight: 900, fontSize: 18 }}>{trends.trendingSkills[0]?.label ?? "—"}</div>
              <div className="muted">Mentions index: {trends.trendingSkills[0]?.value ?? 0}</div>
            </div>
            <div className="card">
              <div className="muted">Top hiring company</div>
              <div style={{ fontWeight: 900, fontSize: 18 }}>{trends.topCompanies[0]?.label ?? "—"}</div>
              <div className="muted">Posts index: {trends.topCompanies[0]?.value ?? 0}</div>
            </div>
          </div>

          <div className="grid grid-2">
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Top hiring roles</h3>
              <BarChart
                title="Top hiring roles"
                labels={trends.topRoles.map((x) => x.label)}
                values={trends.topRoles.map((x) => x.value)}
              />
            </div>

            <div className="card">
              <h3 style={{ marginTop: 0 }}>Hiring by industry</h3>
              <PieChart
                title="Hiring by industry"
                labels={trends.industryHiring.map((x) => x.label)}
                values={trends.industryHiring.map((x) => x.value)}
              />
            </div>

            <div className="card">
              <h3 style={{ marginTop: 0 }}>Trending skills</h3>
              <BarChart
                title="Trending skills"
                labels={trends.trendingSkills.map((x) => x.label)}
                values={trends.trendingSkills.map((x) => x.value)}
              />
            </div>

            <div className="card">
              <h3 style={{ marginTop: 0 }}>Top hiring companies</h3>
              <BarChart
                title="Top hiring companies"
                labels={trends.topCompanies.map((x) => x.label)}
                values={trends.topCompanies.map((x) => x.value)}
              />
            </div>

            <div className="card">
              <h3 style={{ marginTop: 0 }}>Growth momentum</h3>
              <LineChart
                title="Growth"
                labels={trends.growth.map((x) => x.label)}
                values={trends.growth.map((x) => x.value)}
              />
              <p className="muted" style={{ margin: "10px 0 0" }}>
                Trend index across recent periods. Demo data stored locally.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
