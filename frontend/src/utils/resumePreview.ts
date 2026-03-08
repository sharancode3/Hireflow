import { config } from "../config";
import { loadDb } from "../mock/storage";

function isMockToken(token: string) {
  return token.startsWith("mock.");
}

export async function openResumePreview(resumeId: string, token: string) {
  if (isMockToken(token)) {
    const db = loadDb();
    const resume = db.resumes.find((r) => r.id === resumeId);

    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) throw new Error("Popup blocked");

    const title = resume ? resume.originalName : "Resume";
    const createdAt = resume ? new Date(resume.createdAt).toLocaleString() : "—";
    const sizeKb = resume ? Math.round(resume.sizeBytes / 1024) : 0;

    win.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:24px;color:#111827;background:#fff;}
      .card{border:1px solid #e5e7eb;border-radius:14px;padding:16px;max-width:720px;}
      .muted{color:#6b7280;}
      h1{margin:0 0 8px;font-size:20px;}
      code{background:#eff6ff;padding:2px 6px;border-radius:8px;}
    </style>
  </head>
  <body>
    <div class="card">
      <h1>${title}</h1>
      <div class="muted">Uploaded: ${createdAt}${resume ? ` • Size: ${sizeKb} KB` : ""}</div>
      <p style="margin-top:12px">
        Demo mode: Hireflow stores resume metadata only (no real file upload).
      </p>
      <p class="muted" style="margin:0">
        When you add a real backend later, this preview will open the actual PDF/DOC.
      </p>
      <p class="muted" style="margin-top:12px">Resume ID: <code>${resumeId}</code></p>
    </div>
  </body>
</html>`);
    win.document.close();
    return;
  }

  const res = await fetch(`${config.apiBaseUrl}/files/resume/${resumeId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const message = data && typeof data === "object" && "error" in data ? (data as any).error : "Failed to load resume";
    throw new Error(String(message));
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
