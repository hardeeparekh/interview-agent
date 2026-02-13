import { NextResponse } from "next/server";
import { runCodeInSandbox } from "../../../lib/compilerRunner";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const code: string = body?.code ?? "";
    const language: string = body?.language ?? "C++ 17";
    const stdin: string | undefined = body?.stdin;

    if (!code) return NextResponse.json({ ok: false, error: "No code submitted" }, { status: 400 });

    const result = await runCodeInSandbox({ code, language, stdin, timeoutMs: 10000 });

    const resp: any = { ok: !!result.ok };
    if (result.diagnostics && result.diagnostics.length > 0) resp.errors = result.diagnostics;
    if (result.runStdout) resp.stdout = result.runStdout;
    if (result.runStderr) resp.stderr = result.runStderr;
    if (result.compileStderr) resp.compileStderr = result.compileStderr;
    if (result.ok) {
      resp.result = "Accepted (mock)";
      return NextResponse.json(resp, { status: 200 });
    }

    resp.error = result.error ?? "Compilation/Runtime error";
    return NextResponse.json(resp, { status: 200 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
