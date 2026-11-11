import { warmModel } from "@/lib/ollama";

export const maxDuration = 30;

export async function GET() {
  const result = await warmModel();
  return Response.json(result, { status: result.ok ? 200 : 503 });
}
