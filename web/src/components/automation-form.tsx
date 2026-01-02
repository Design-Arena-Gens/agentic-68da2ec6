"use client";

import { formatISO, parseISO } from "date-fns";
import { useMemo, useState, useTransition } from "react";
import { z } from "zod";

const payloadSchema = z.object({
  workflowTag: z.string().trim().min(1, "Workflow tag is required"),
  recipients: z
    .string()
    .trim()
    .min(1, "At least one recipient is required")
    .transform((value) =>
      value
        .split(/[\n,]+/)
        .map((entry) => entry.trim())
        .filter(Boolean),
    ),
  message: z.string().trim().min(1, "A message body is required"),
  mediaUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  workflowVars: z.record(z.string(), z.string()).optional(),
  sendAt: z
    .string()
    .optional()
    .refine(
      (value) => !value || !Number.isNaN(Date.parse(value)),
      "Send at must be a valid ISO date",
    ),
});

type PayloadInput = z.input<typeof payloadSchema>;

type FormState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; issues?: string[] };

const defaultValues: PayloadInput = {
  workflowTag: "whatsapp-broadcast",
  recipients: "15551234567",
  message:
    "Hello from your n8n automation! Replace this text with a personalized message.",
  mediaUrl: "",
  workflowVars: {
    source: "web-portal",
  },
  sendAt: "",
};

export function AutomationForm() {
  const [form, setForm] = useState(() => ({
    workflowTag: defaultValues.workflowTag,
    recipients: defaultValues.recipients,
    message: defaultValues.message,
    mediaUrl: defaultValues.mediaUrl,
    sendAt: defaultValues.sendAt,
    workflowVars: JSON.stringify(defaultValues.workflowVars, null, 2),
  }));
  const [formState, setFormState] = useState<FormState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();

  const canSubmit = useMemo(() => {
    const parsedVars = tryParseWorkflowVars(form.workflowVars);
    if (parsedVars.status === "error") {
      return false;
    }

    const { success } = payloadSchema.safeParse({
      workflowTag: form.workflowTag,
      recipients: form.recipients,
      message: form.message,
      mediaUrl: form.mediaUrl,
      sendAt: form.sendAt,
      workflowVars: parsedVars.value,
    });
    return success && !isPending;
  }, [form, isPending]);

  const handleChange =
    (field: keyof typeof form) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
    };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      setFormState({ status: "idle" });
      const parsedVars = tryParseWorkflowVars(form.workflowVars);
      if (parsedVars.status === "error") {
        setFormState({
          status: "error",
          message: parsedVars.message,
        });
        return;
      }

      const parsed = payloadSchema.safeParse({
        workflowTag: form.workflowTag,
        recipients: form.recipients,
        message: form.message,
        mediaUrl: form.mediaUrl,
        sendAt: normalizeDateField(form.sendAt),
        workflowVars: parsedVars.value,
      });

      if (!parsed.success) {
        setFormState({
          status: "error",
          message: "Fix the highlighted issues.",
          issues: parsed.error.issues.map((issue) => issue.message),
        });
        return;
      }

      try {
        const response = await fetch("/api/trigger", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(parsed.data),
        });

        if (!response.ok) {
          const details = await response.json().catch(() => null);
          const message =
            details?.message ??
            `Request failed with status ${response.status}.`;
          const issues = Array.isArray(details?.issues) ? details.issues : [];
          setFormState({
            status: "error",
            message,
            issues,
          });
          return;
        }

        const result = await response.json().catch(() => null);
        setFormState({
          status: "success",
          message:
            result?.message ??
            "n8n workflow triggered successfully. Check your n8n execution log for details.",
        });
      } catch (error) {
        console.error(error);
        setFormState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Unexpected network error. Try again.",
        });
      }
    });
  };

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700">
          WhatsApp via n8n
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Launch high-converting WhatsApp automations
        </h1>
        <p className="text-base text-zinc-600">
          Configure the webhook payload that n8n will receive and relay to your
          WhatsApp Cloud API or Twilio endpoint. Share the workflow tag with
          teammates and trigger bulk or personalized outreach instantly.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm"
      >
        <fieldset className="grid gap-3">
          <legend className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Connection
          </legend>
          <div className="grid gap-2">
            <label
              htmlFor="workflowTag"
              className="text-sm font-medium text-zinc-700"
            >
              Workflow tag
            </label>
            <input
              id="workflowTag"
              name="workflowTag"
              type="text"
              value={form.workflowTag}
              onChange={handleChange("workflowTag")}
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-900 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              placeholder="whatsapp-broadcast"
              autoComplete="off"
              required
            />
            <p className="text-xs text-zinc-500">
              This value is forwarded to n8n so you can branch the workflow with
              a Switch node.
            </p>
          </div>
        </fieldset>

        <fieldset className="grid gap-3">
          <legend className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Recipients & message
          </legend>
          <div className="grid gap-2">
            <label
              htmlFor="recipients"
              className="text-sm font-medium text-zinc-700"
            >
              Recipient numbers
            </label>
            <textarea
              id="recipients"
              name="recipients"
              value={form.recipients}
              onChange={handleChange("recipients")}
              className="min-h-[120px] rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              placeholder="15551234567, 15557654321"
              required
            />
            <p className="text-xs text-zinc-500">
              Paste one number per line or comma separate values. Use the full
              international format without leading <code>+</code>.
            </p>
          </div>

          <div className="grid gap-2">
            <label
              htmlFor="message"
              className="text-sm font-medium text-zinc-700"
            >
              Message template
            </label>
            <textarea
              id="message"
              name="message"
              value={form.message}
              onChange={handleChange("message")}
              className="min-h-[160px] rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              placeholder="Write a message to broadcast..."
              required
            />
            <p className="text-xs text-zinc-500">
              Use handlebars-friendly tokens like <code>{`{{name}}`}</code>{" "}
              and hydrate them inside n8n before sending.
            </p>
          </div>

          <div className="grid gap-2">
            <label
              htmlFor="mediaUrl"
              className="text-sm font-medium text-zinc-700"
            >
              Media URL (optional)
            </label>
            <input
              id="mediaUrl"
              name="mediaUrl"
              type="url"
              value={form.mediaUrl}
              onChange={handleChange("mediaUrl")}
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              placeholder="https://example.com/catalog.pdf"
            />
            <p className="text-xs text-zinc-500">
              Optional attachment to transform the message into a rich media
              push.
            </p>
          </div>
        </fieldset>

        <fieldset className="grid gap-3">
          <legend className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Runtime options
          </legend>
          <div className="grid gap-2">
            <label
              htmlFor="sendAt"
              className="text-sm font-medium text-zinc-700"
            >
              Send at (ISO 8601, optional)
            </label>
            <input
              id="sendAt"
              name="sendAt"
              type="datetime-local"
              value={form.sendAt}
              onChange={handleChange("sendAt")}
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
            <p className="text-xs text-zinc-500">
              Leave empty to deliver immediately. n8n waits until this timestamp
              before hitting WhatsApp.
            </p>
          </div>

          <div className="grid gap-2">
            <label
              htmlFor="workflowVars"
              className="text-sm font-medium text-zinc-700"
            >
              Workflow variables (JSON, optional)
            </label>
            <textarea
              id="workflowVars"
              name="workflowVars"
              value={form.workflowVars}
              onChange={handleChange("workflowVars")}
              className="min-h-[144px] rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 font-mono text-sm text-zinc-900 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
            <p className="text-xs text-zinc-500">
              Free-form JSON forwarded to n8n. Perfect for injecting metadata or
              personalization tokens.
            </p>
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-emerald-400"
        >
          {isPending ? "Dispatching to n8n..." : "Trigger WhatsApp send"}
        </button>

        {formState.status === "success" && (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {formState.message}
          </p>
        )}

        {formState.status === "error" && (
          <div className="space-y-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <p>{formState.message}</p>
            {formState.issues?.length ? (
              <ul className="list-disc pl-5 text-xs text-rose-500">
                {formState.issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </form>

      <aside className="grid gap-4 rounded-3xl border border-zinc-200 bg-zinc-50 p-8">
        <h2 className="text-lg font-semibold text-zinc-800">
          Call this endpoint from your CRM or scripts
        </h2>
        <pre className="overflow-x-auto rounded-2xl border border-zinc-200 bg-black p-4 text-xs text-emerald-200">
{`curl -X POST "https://your-vercel-app.vercel.app/api/trigger" \\
  -H "Content-Type: application/json" \\
  -d '{
    "workflowTag": "${form.workflowTag}",
    "recipients": ["15551234567"],
    "message": "Hello from n8n",
    "sendAt": "2024-01-01T12:00:00.000Z"
  }'`}
        </pre>
      </aside>
    </section>
  );
}

function normalizeDateField(value?: string) {
  if (!value) return undefined;
  try {
    return formatISO(parseISO(value));
  } catch {
    return value;
  }
}

function tryParseWorkflowVars(input: string):
  | { status: "ok"; value?: Record<string, string> }
  | { status: "error"; message: string } {
  if (!input.trim()) {
    return { status: "ok" };
  }

  try {
    const parsed = JSON.parse(input);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {
        status: "error",
        message: "Workflow variables must be a JSON object.",
      };
    }

    const value = Object.entries(parsed).reduce<Record<string, string>>(
      (acc, [key, current]) => {
        acc[key] = String(current);
        return acc;
      },
      {},
    );
    return { status: "ok", value };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? `Invalid workflow variables JSON: ${error.message}`
          : "Invalid workflow variables JSON.",
    };
  }
}
