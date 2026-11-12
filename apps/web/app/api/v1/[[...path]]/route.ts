import { ApiError, radar } from "../../../../lib/radar-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Context = { params: Promise<{ path?: string[] }> };

function cors(request: Request) {
  const origin = request.headers.get("origin");
  const allowed = (process.env.WEB_ORIGIN ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  return {
    "Access-Control-Allow-Origin":
      origin && allowed.includes(origin) ? origin : (allowed[0] ?? "*"),
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    Vary: "Origin",
  };
}
function json(request: Request, value: unknown, status = 200) {
  return Response.json(value, { status, headers: cors(request) });
}
function authorized(request: Request) {
  const expected = process.env.INGEST_TOKEN;
  return Boolean(
    expected && request.headers.get("authorization") === `Bearer ${expected}`,
  );
}

async function dispatch(request: Request, { params }: Context) {
  const path = (await params).path ?? [];
  const key = path.join("/");
  const url = new URL(request.url);
  if (request.method === "GET" && key === "health")
    return json(request, { ok: true, runtime: "vercel-function" });
  if (request.method === "GET" && key === "status")
    return json(request, await radar.status());
  if (request.method === "GET" && key === "reports/latest")
    return json(request, await radar.latest());
  if (request.method === "GET" && key === "reports")
    return json(
      request,
      await radar.reports(
        Number(url.searchParams.get("page")) || 1,
        Number(url.searchParams.get("limit")) || 10,
      ),
    );
  if (request.method === "GET" && key === "companies")
    return json(request, await radar.companies());
  if (request.method === "GET" && path[0] === "companies" && path[1])
    return json(request, await radar.company(path[1]));
  if (request.method === "GET" && key === "events")
    return json(request, await radar.events(url.searchParams));
  if (
    request.method === "POST" &&
    (key === "internal/ingest" || key === "internal/runs")
  ) {
    if (!authorized(request))
      return json(request, { message: "Unauthorized" }, 401);
    const body = await request.json();
    return key === "internal/ingest"
      ? json(request, await radar.ingest(body), 201)
      : json(request, await radar.recordRun(body), 202);
  }
  return json(request, { message: "Not found" }, 404);
}

async function handler(request: Request, context: Context) {
  const startedAt = Date.now();
  const path = (await context.params).path ?? [];
  const route = `/api/v1/${path.join("/")}`;
  const requestId = request.headers.get("x-vercel-id");
  console.log(
    JSON.stringify({
      level: "info",
      message: "request_started",
      method: request.method,
      route,
      requestId,
    }),
  );
  try {
    const response = await dispatch(request, {
      params: Promise.resolve({ path }),
    });
    console.log(
      JSON.stringify({
        level: "info",
        message: "request_completed",
        method: request.method,
        route,
        status: response.status,
        durationMs: Date.now() - startedAt,
        requestId,
      }),
    );
    return response;
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    console.error(
      JSON.stringify({
        level: "error",
        message: "request_failed",
        method: request.method,
        route,
        status,
        durationMs: Date.now() - startedAt,
        requestId,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    if (error instanceof ApiError)
      return json(
        request,
        { message: error.message, details: error.details },
        error.status,
      );
    return json(request, { message: "Internal server error" }, 500);
  }
}

export const GET = handler;
export const POST = handler;
export function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: cors(request) });
}
