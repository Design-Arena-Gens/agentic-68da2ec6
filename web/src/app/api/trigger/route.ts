import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const N8N_API_KEY = process.env.N8N_API_KEY;

const inboundSchema = z.object({
  workflowTag: z.string().trim().min(1, "workflowTag is required"),
  recipients: z
    .array(
      z
        .string()
        .trim()
        .regex(/^\d{6,15}$/, "Recipients must be numeric in international format"),
    )
    .min(1, "Provide at least one recipient"),
  message: z.string().trim().min(1, "message is required"),
  mediaUrl: z.string().url().optional(),
  workflowVars: z.record(z.string(), z.string()).optional(),
  sendAt: z
    .string()
    .optional()
    .refine(
      (value) => !value || !Number.isNaN(Date.parse(value)),
      "sendAt must be a valid ISO 8601 date string",
    ),
});

export async function POST(request: NextRequest) {
  if (!N8N_WEBHOOK_URL) {
    return NextResponse.json(
      {
        message:
          "N8N_WEBHOOK_URL is not configured. Set it in your Vercel project environment variables.",
      },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json(
      { message: "Invalid JSON payload", issues: [String(error)] },
      { status: 400 },
    );
  }

  const parsed = inboundSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Validation failed",
        issues: parsed.error.issues.map((issue) => issue.message),
      },
      { status: 422 },
    );
  }

  const payload = {
    ...parsed.data,
    requestedAt: new Date().toISOString(),
    origin: request.headers.get("origin") ?? undefined,
  };

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(N8N_API_KEY ? { "X-N8N-API-KEY": N8N_API_KEY } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const details = await response.text();
      return NextResponse.json(
        {
          message: `n8n responded with status ${response.status}`,
          issues: details ? [details] : undefined,
        },
        { status: 502 },
      );
    }

    const result = await safeJson(response);

    return NextResponse.json(
      {
        message: "Workflow dispatched to n8n.",
        n8nResponse: result,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[n8n] webhook call failed", error);
    return NextResponse.json(
      {
        message: "Failed to communicate with n8n webhook.",
        issues: [error instanceof Error ? error.message : String(error)],
      },
      { status: 504 },
    );
  }
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}
