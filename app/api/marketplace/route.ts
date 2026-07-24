import { NextResponse } from "next/server";
import { evaluateMarketplace } from "@/lib/marketplace";
import type { Signals } from "@/lib/engine";

export async function POST(request: Request) {
  let incentiveUsd = 0;
  let liveWorker: { id: string; signals: Signals } | undefined;
  try {
    const body = (await request.json()) as {
      incentiveUsd?: number;
      workerId?: string;
      signals?: Signals;
    };
    incentiveUsd = Number(body.incentiveUsd) || 0;
    if (body.workerId && body.signals) {
      liveWorker = { id: body.workerId, signals: body.signals };
    }
  } catch {
    incentiveUsd = 0;
  }

  return NextResponse.json(evaluateMarketplace(incentiveUsd, liveWorker));
}
