"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CFUser {
  handle: string;
  rating: number;
  maxRating: number;
  rank: string;
  maxRank: string;
  avatar: string;
}

interface CFSubmission {
  id: number;
  creationTimeSeconds: number;
  verdict: string;
  problem: {
    contestId: number;
    index: string;
    name: string;
    rating?: number;
    tags: string[];
  };
  programmingLanguage: string;
}

interface CFRatingChange {
  contestId: number;
  contestName: string;
  ratingUpdateTimeSeconds: number;
  newRating: number;
  oldRating: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RANK_COLORS: Record<string, string> = {
  newbie: "#808080",
  pupil: "#008000",
  specialist: "#03a89e",
  expert: "#0000ff",
  "candidate master": "#aa00aa",
  master: "#ff8c00",
  "international master": "#ff8c00",
  grandmaster: "#ff0000",
  "international grandmaster": "#ff0000",
  "legendary grandmaster": "#ff0000",
};

function getRankColor(rank: string) {
  return RANK_COLORS[rank?.toLowerCase()] ?? "#888";
}

function isToday(timestampSeconds: number) {
  const d = new Date(timestampSeconds * 1000);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

function verdictBadgeVariant(verdict: string) {
  if (verdict === "OK") return "default";
  if (verdict === "WRONG_ANSWER") return "destructive";
  return "secondary";
}

function verdictLabel(verdict: string) {
  const map: Record<string, string> = {
    OK: "AC",
    WRONG_ANSWER: "WA",
    TIME_LIMIT_EXCEEDED: "TLE",
    MEMORY_LIMIT_EXCEEDED: "MLE",
    RUNTIME_ERROR: "RTE",
    COMPILATION_ERROR: "CE",
    SKIPPED: "SK",
  };
  return map[verdict] ?? verdict.slice(0, 3);
}

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── API calls ────────────────────────────────────────────────────────────────

async function fetchUser(handle: string): Promise<CFUser> {
  const res = await fetch(
    `https://codeforces.com/api/user.info?handles=${handle}`
  );
  const json = await res.json();
  if (json.status !== "OK") throw new Error(json.comment ?? "Failed to fetch user");
  return json.result[0];
}

async function fetchSubmissions(handle: string): Promise<CFSubmission[]> {
  const res = await fetch(
    `https://codeforces.com/api/user.status?handle=${handle}&from=1&count=100`
  );
  const json = await res.json();
  if (json.status !== "OK") throw new Error(json.comment ?? "Failed to fetch submissions");
  return json.result;
}

async function fetchRatingHistory(handle: string): Promise<CFRatingChange[]> {
  const res = await fetch(
    `https://codeforces.com/api/user.rating?handle=${handle}`
  );
  const json = await res.json();
  if (json.status !== "OK") throw new Error(json.comment ?? "Failed to fetch rating");
  return json.result;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <Card className="flex-1 min-w-35">
      <CardContent className="pt-5 pb-4">
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-bold" style={accent ? { color: accent } : {}}>
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function RatingChart({ data }: { data: CFRatingChange[] }) {
  const chartData = data.map((d) => ({
    name: formatDate(d.ratingUpdateTimeSeconds),
    rating: d.newRating,
    contest: d.contestName,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          Rating History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              domain={["auto", "auto"]}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(val: number | undefined) => [val, "Rating"]}
              labelFormatter={(label) => label}
            />
            <Line
              type="monotone"
              dataKey="rating"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function SubmissionRow({ sub }: { sub: CFSubmission }) {
  return (
    <div className="flex items-center justify-between py-2.5 gap-3">
      <div className="flex-1 min-w-0">
        <a
          href={`https://codeforces.com/problemset/problem/${sub.problem.contestId}/${sub.problem.index}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium hover:underline truncate block"
        >
          {sub.problem.name}
        </a>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatDate(sub.creationTimeSeconds)} · {sub.programmingLanguage}
          {sub.problem.rating ? ` · ★${sub.problem.rating}` : ""}
        </p>
      </div>
      <Badge variant={verdictBadgeVariant(sub.verdict)} className="shrink-0 font-mono text-xs">
        {verdictLabel(sub.verdict)}
      </Badge>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CodeforcesDashboard() {
  const HANDLE = "saksy999";

  const [user, setUser] = useState<CFUser | null>(null);
  const [submissions, setSubmissions] = useState<CFSubmission[]>([]);
  const [ratingHistory, setRatingHistory] = useState<CFRatingChange[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [u, subs, rating] = await Promise.all([
        fetchUser(HANDLE),
        fetchSubmissions(HANDLE),
        fetchRatingHistory(HANDLE),
      ]);
      setUser(u);
      setSubmissions(subs);
      setRatingHistory(rating);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // Fetch on mount, then re-fetch every 60 seconds
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60_000);
    return () => clearInterval(interval);
  }, []);

  // ── Derived stats ────────────────────────────────────────────────
  const acceptedSubs = submissions.filter((s) => s.verdict === "OK");

  // Deduplicate by problem key
  const uniqueSolvedKeys = new Set(
    acceptedSubs.map((s) => `${s.problem.contestId}-${s.problem.index}`)
  );
  const totalSolved = uniqueSolvedKeys.size;

  // Today's unique solves
  const todaySolvedKeys = new Set(
    acceptedSubs
      .filter((s) => isToday(s.creationTimeSeconds))
      .map((s) => `${s.problem.contestId}-${s.problem.index}`)
  );
  const todaySolved = todaySolvedKeys.size;

  // Unique problem names solved
  const solvedProblems = Array.from(
    new Map(
      acceptedSubs.map((s) => [
        `${s.problem.contestId}-${s.problem.index}`,
        s.problem,
      ])
    ).values()
  ).slice(0, 50); // show latest 50

  // Recent submissions (all verdicts, last 20)
  const recentSubs = submissions.slice(0, 20);

  return (
    <div className="min-h-screen bg-transparent text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        {/* ── Header ── */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Saksham&apos;s CodeForces Progress</h1>
        </div>

        {/* ── Content ── */}
        {user && (
          <div className="space-y-6">

            {/* Profile strip */}
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-xl font-bold">@{user.handle}</h2>
                <p
                  className="text-sm font-medium capitalize"
                  style={{ color: getRankColor(user.rank) }}
                >
                  {user.rank}
                </p>
              </div>
            </div>

            <Separator />

            {/* Stat cards */}
            <div className="flex flex-wrap gap-3">
              <StatCard label="Rating" value={user.rating} sub={`Peak: ${user.maxRating}`} />
              <StatCard label="Solved Total" value={totalSolved} sub="unique problems (last 100 subs)" />
              <StatCard label="Solved Today" value={todaySolved} accent={todaySolved > 0 ? "hsl(var(--primary))" : undefined} />
            </div>

            {/* Rating chart */}
            {ratingHistory.length > 0 && <RatingChart data={ratingHistory} />}

            {/* Two-column: solved problems + recent submissions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Solved problems */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                    Problems Solved
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-80 px-4">
                    {solvedProblems.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4">No solved problems found.</p>
                    ) : (
                      solvedProblems.map((p, i) => (
                        <div key={`${p.contestId}-${p.index}`}>
                          <div className="flex items-center justify-between py-2.5 gap-2">
                            <a
                              href={`https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium hover:underline truncate"
                            >
                              {p.contestId}{p.index} · {p.name}
                            </a>
                            {p.rating && (
                              <span className="text-xs text-muted-foreground shrink-0">★{p.rating}</span>
                            )}
                          </div>
                          {i < solvedProblems.length - 1 && <Separator />}
                        </div>
                      ))
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Recent submissions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                    Recent Submissions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-80 px-4">
                    {recentSubs.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4">No submissions found.</p>
                    ) : (
                      recentSubs.map((sub, i) => (
                        <div key={sub.id}>
                          <SubmissionRow sub={sub} />
                          {i < recentSubs.length - 1 && <Separator />}
                        </div>
                      ))
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {!user && !loading && !error && (
          <div className="text-center py-20 text-muted-foreground text-sm">
            Connecting to Codeforces…
          </div>
        )}
      </div>
    </div>
  );
}