import "server-only";

import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import {
  BookingInputsSchema,
  fallbackJobBrief,
  JobBriefRequestSchema,
  JobBriefSchema,
  type BookingInputs,
  type JobBrief,
  type JobBriefSource,
} from "@/lib/jobBrief";
import { seededBriefForJob } from "@/lib/job-brief-seeds";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEM_PROMPT =
  "You are a logistics expert generating a mover's job brief from a customer's structured booking. " +
  "Be concrete, concise, and practical. Infer realistic tasks, equipment, crew size, duration, heavy items, " +
  "access considerations, and genuine risk flags from the inputs. Never invent customer items that the booking did not imply. " +
  "Video and photos are display-only attachments and are not model inputs.";

export async function POST(req: Request) {
  let inputs: BookingInputs | null = null;
  let jobId: string | undefined;

  try {
    const body: unknown = await req.json();
    const parsed = JobBriefRequestSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          error: "Invalid booking inputs",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    if ("inputs" in parsed.data) {
      inputs = parsed.data.inputs;
      jobId = parsed.data.jobId;
    } else {
      inputs = BookingInputsSchema.parse(parsed.data);
    }

    const fallback = getFallback(jobId, inputs);

    // Demo-proof: a missing key returns a complete seed instead of a blank brief.
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("[job-brief] ANTHROPIC_API_KEY is not configured; using seed");
      return briefResponse(fallback, "seed");
    }

    const { output } = await generateText({
      model: anthropic("claude-sonnet-5"),
      output: Output.object({ schema: JobBriefSchema }),
      system: SYSTEM_PROMPT,
      prompt: `Customer booking inputs:\n${JSON.stringify(inputs, null, 2)}\n\nProduce the standardized job brief.`,
      abortSignal: AbortSignal.timeout(20_000),
    });

    return briefResponse(JobBriefSchema.parse(output), "ai");
  } catch (error) {
    // Customer notes and provider details are intentionally excluded from logs.
    console.error("[job-brief] generation failed; using seed", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "Unknown failure",
    });

    if (inputs) {
      return briefResponse(getFallback(jobId, inputs), "seed");
    }

    return Response.json(
      { error: "Unable to read booking inputs" },
      { status: 400 },
    );
  }
}

function getFallback(jobId: string | undefined, inputs: BookingInputs): JobBrief {
  return seededBriefForJob(jobId) ?? fallbackJobBrief(inputs);
}

function briefResponse(brief: JobBrief, source: JobBriefSource): Response {
  return Response.json(brief, {
    headers: {
      "Cache-Control": "no-store",
      "X-Job-Brief-Source": source,
      "X-Job-Brief-Generated-At": new Date().toISOString(),
    },
  });
}
