"use client";

import { useEffect, useState } from "react";
import type { EmailDispatchResult, Profile } from "@/lib/agents/types";

export default function EmailDispatchModal({
  recipientEmail,
  companyName,
  roleTitle,
  initialMessage,
  profile,
  onClose,
  onDispatched,
}: {
  recipientEmail: string;
  companyName: string;
  roleTitle: string;
  initialMessage: string;
  profile: Profile | null;
  onClose: () => void;
  onDispatched: (result: EmailDispatchResult) => void;
}) {
  const [to, setTo] = useState(recipientEmail);
  const [subject, setSubject] = useState(`Following up on application: ${roleTitle} — ${profile?.name || "Candidate"}`);
  const [message, setMessage] = useState(initialMessage);
  const [sending, setSending] = useState(false);
  const [config, setConfig] = useState<{ configured: boolean; provider: string; details: string } | null>(null);
  const [result, setResult] = useState<EmailDispatchResult | null>(null);

  useEffect(() => {
    fetch("/api/email/dispatch")
      .then((r) => r.json())
      .then((d) => setConfig(d.config))
      .catch(() => {});
  }, []);

  async function handleSend(testMode = false) {
    if (!to.trim() || !message.trim()) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/email/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          subject,
          message,
          testMode,
          profile,
        }),
      });
      const data = await res.json();
      if (res.ok && data.result) {
        setResult(data.result);
        onDispatched(data.result);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900">📧 Approve &amp; Dispatch Follow-Up</h3>
              <span className={`badge ${config?.configured ? "bg-emerald-100 text-emerald-800" : "bg-indigo-50 text-indigo-700"}`}>
                {config?.details || "Checking email transport…"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Review message and delivery recipient before sending</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 font-bold text-lg">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {result ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-emerald-900">
                  {result.status === "sent" ? "✓ Email Dispatched via Production Transport" : "✓ Safe Simulation Dispatched & Logged"}
                </p>
                <span className="badge bg-emerald-200 text-emerald-800 uppercase text-[10px]">{result.status}</span>
              </div>
              <div className="text-xs text-slate-700 space-y-1">
                <p><strong>Recipient:</strong> {result.recipient}</p>
                <p><strong>Message ID:</strong> {result.messageId}</p>
                <p><strong>Timestamp:</strong> {new Date(result.timestamp).toLocaleString()}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-slate-600">
                  Recipient Email
                  <input
                    className="input mt-1"
                    required
                    type="email"
                    placeholder="recruiter@company.com"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-600">
                  Subject Line
                  <input
                    className="input mt-1"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </label>
              </div>

              <label className="block text-xs font-semibold text-slate-600">
                Message Body
                <textarea
                  className="input mt-1 min-h-[200px] text-xs font-mono leading-relaxed"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </label>

              {!config?.configured && (
                <p className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  💡 Running in verified preview simulator mode. Set <code className="font-mono text-indigo-700">SMTP_HOST</code> or <code className="font-mono text-indigo-700">RESEND_API_KEY</code> in your environment for outbound mail transport.
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button onClick={onClose} className="btn-ghost text-xs">
            {result ? "Close" : "Cancel"}
          </button>
          {!result && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSend(true)}
                disabled={sending || !to.trim()}
                className="btn-secondary text-xs"
              >
                Test Simulator Dispatch
              </button>
              <button
                type="button"
                onClick={() => handleSend(false)}
                disabled={sending || !to.trim()}
                className="btn-primary text-xs"
              >
                {sending ? "Dispatching…" : config?.configured ? "Approve & Send Real Email →" : "Approve & Log Dispatch →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
