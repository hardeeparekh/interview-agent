import { NextResponse } from "next/server";
import { runCodeInSandbox } from "../../../lib/compilerRunner";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const code: string = body?.code ?? "";
    const language: string = body?.language ?? "C++ 17";
    const stdin: string | undefined = body?.stdin;

    const result = await runCodeInSandbox({ code, language, stdin, timeoutMs: 8000 });

    // Normalize response: ensure `errors` is present for editor consumption
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
