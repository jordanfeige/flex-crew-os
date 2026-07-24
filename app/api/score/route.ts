import { NextResponse } from "next/server";
import { evaluate, type Signals } from "@/lib/engine";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const signals = (body as { signals?: Signals }).signals;
  if (!signals || typeof signals !== "object") {
    return NextResponse.json({ error: "signals required" }, { status: 400 });
  }

  const normalized: Signals = {
    onTimeRate: Number(signals.onTimeRate) || 0,
    avgRating: Number(signals.avgRating) || 0,
    acceptanceRate: Number(signals.acceptanceRate) || 0,
    jobsCompleted: Math.max(0, Math.floor(Number(signals.jobsCompleted) || 0)),
    lateCancellations: Math.max(0, Math.floor(Number(signals.lateCancellations) || 0)),
    noShows: Math.max(0, Math.floor(Number(signals.noShows) || 0)),
    trainingBonus: Math.max(0, Math.min(6, Number(signals.trainingBonus) || 0)),
  };

  return NextResponse.json(evaluate(normalized));
}
