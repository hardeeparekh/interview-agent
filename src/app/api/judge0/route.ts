import { NextResponse } from "next/server";
import { runCodeInSandbox } from "../../../lib/compilerRunner";

// Minimal language mapping — adjust IDs if your Judge0 deployment uses different ones.
const LANGUAGE_MAP: Record<string, number> = {
  "C++ 17": 54, // common GCC C++ (may vary by deployment)
  "C++ 20": 54,
  "Python 3": 71,
  "Java": 62,
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const code: string = body?.code ?? "";
    const language: string = body?.language ?? "C++ 17";
    const stdin: string | undefined = body?.stdin;

    const judge0Url = process.env.JUDGE0_URL?.trim();
    const judge0Key = process.env.JUDGE0_API_KEY?.trim();

    if (judge0Url) {
      try {
        const url = `${judge0Url.replace(/\/$/, "")}/submissions?base64_encoded=false&wait=true`;
        const payload: any = { source_code: code, stdin: stdin ?? undefined };
        const mapped = LANGUAGE_MAP[language];
        if (typeof mapped === 'number') payload.language_id = mapped;
        // Allow passing numeric language directly from client
        if (/^\d+$/.test(String(language))) payload.language_id = Number(language);

        const headers: any = { 'Content-Type': 'application/json' };
        if (judge0Key) headers['X-Auth-Token'] = judge0Key;

        const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
        const data = await r.json().catch(() => ({} as any));
        const resp: any = { ok: r.ok };
        if (data.stdout) resp.stdout = data.stdout;
        if (data.stderr) resp.stderr = data.stderr;
        if (data.compile_output) resp.compileStderr = data.compile_output;
        if (data.status) resp.status = data.status;
        if (data.token) resp.token = data.token;
        return NextResponse.json(resp, { status: 200 });
      } catch (e) {
        console.warn('Judge0 proxy failed, falling back to local runner', e);
      }
    }

    // Local fallback (development): use the existing runner
    const result = await runCodeInSandbox({ code, language, stdin, timeoutMs: 8000 });
    const resp: any = { ok: !!result.ok };
    if (result.diagnostics && Array.isArray(result.diagnostics) && result.diagnostics.length > 0) resp.errors = result.diagnostics;
    if (result.compileStderr) resp.compileStderr = result.compileStderr;
    if (result.runStdout) resp.stdout = result.runStdout;
    if (result.runStderr) resp.stderr = result.runStderr;
    if (result.error) resp.error = result.error;
    return NextResponse.json(resp, { status: 200 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
