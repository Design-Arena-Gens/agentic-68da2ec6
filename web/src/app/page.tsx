import Link from "next/link";
import { AutomationForm } from "../components/automation-form";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-emerald-50 to-white pb-24">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-16 px-6 py-16 sm:px-10 lg:px-12">
        <section className="flex flex-col gap-6 rounded-3xl border border-emerald-100 bg-white/80 p-12 shadow-sm backdrop-blur">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-100 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Built for n8n
          </span>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
            Ship WhatsApp campaigns with an agentic n8n workflow and a friendly
            launchpad.
          </h1>
          <p className="max-w-2xl text-lg text-zinc-600">
            Plug your WhatsApp Cloud API or Twilio credentials into n8n,
            receive structured payloads from this dashboard, and orchestrate
            personalized, high-throughput automations in minutes.
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-zinc-500">
            <span className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1">
              ✅ Bulk & transactional messaging
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1">
              ✅ Delay & scheduling support
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1">
              ✅ Metadata passthrough for personalization
            </span>
          </div>
        </section>

        <AutomationForm />

        <section className="grid gap-8 rounded-3xl border border-zinc-200 bg-white p-10 shadow-sm lg:grid-cols-3 lg:gap-12">
          <div className="space-y-3 lg:col-span-1">
            <h2 className="text-2xl font-semibold text-zinc-900">
              n8n workflow overview
            </h2>
            <p className="text-sm text-zinc-600">
              Import the provided workflow file, attach your WhatsApp credentials,
              and publish the webhook URL as <code>N8N_WEBHOOK_URL</code> on
              Vercel. Every submission from this dashboard triggers a new n8n execution.
            </p>
          </div>
          <ol className="grid gap-6 text-sm text-zinc-600 lg:col-span-2">
            <li className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <p className="font-medium text-zinc-800">1. Webhook intake</p>
              <p>
                n8n collects the payload, validates inputs, and optionally waits
                until <code>sendAt</code> using a Wait node.
              </p>
            </li>
            <li className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <p className="font-medium text-zinc-800">2. Template merge</p>
              <p>
                A Function node fans out messages per recipient, injects workflow
                variables, and preps WhatsApp-compatible payloads.
              </p>
            </li>
            <li className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <p className="font-medium text-zinc-800">3. WhatsApp delivery</p>
              <p>
                HTTP Request nodes call the WhatsApp Cloud API (or Twilio WhatsApp)
                and return execution logs to the dashboard callback.
              </p>
            </li>
          </ol>
        </section>

        <section className="grid gap-6 rounded-3xl border border-zinc-200 bg-zinc-50 p-10 shadow-sm">
          <h2 className="text-xl font-semibold text-zinc-900">
            Need the workflow file?
          </h2>
          <p className="text-sm text-zinc-600">
            Head to{" "}
            <Link
              className="font-medium text-emerald-600 underline-offset-4 hover:underline"
              href="/workflows/whatsapp-automation.json"
            >
              /workflows/whatsapp-automation.json
            </Link>{" "}
            to download the n8n workflow export bundled with this deployment.
          </p>
        </section>
      </main>
    </div>
  );
}
