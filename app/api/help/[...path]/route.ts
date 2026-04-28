const DEFAULT_API_BASE_URL = "https://tbtest-hpa0bagng7azd3cc.westus3-01.azurewebsites.net";

const RAW_TARGET_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ??
  process.env.NEXT_PUBLIC_WEBAPP_API_URL?.trim() ??
  DEFAULT_API_BASE_URL;

const TARGET_BASE_URL = RAW_TARGET_BASE_URL.replace(/\/+$/, "");

type RouteParams = {
  params: Promise<{
    path: string[];
  }>;
};

const buildTargetUrl = async (request: Request, context: RouteParams) => {
  const { path } = await context.params;
  const sourceUrl = new URL(request.url);
  const targetPath = path.join("/");
  const targetUrl = new URL(`${TARGET_BASE_URL}/api/help/${targetPath}`);
  targetUrl.search = sourceUrl.search;
  return targetUrl;
};

const buildForwardHeaders = (request: Request) => {
  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  const accept = request.headers.get("accept");
  const contentType = request.headers.get("content-type");

  if (authorization) {
    headers.set("authorization", authorization);
  }

  headers.set("accept", accept || "application/json");

  if (contentType) {
    headers.set("content-type", contentType);
  }

  return headers;
};

const proxyRequest = async (request: Request, context: RouteParams, method: string) => {
  const traceId = crypto.randomUUID();
  const isDev = process.env.NODE_ENV !== "production";

  try {
    const targetUrl = await buildTargetUrl(request, context);
    const requestBody = method === "GET" ? undefined : await request.text();

    const response = await fetch(targetUrl, {
      method,
      headers: (() => {
        const headers = buildForwardHeaders(request);
        headers.set("x-proxy-trace-id", traceId);
        return headers;
      })(),
      body: requestBody,
      redirect: "manual",
    });

    let sampleBody = "";
    if (!response.ok) {
      sampleBody = await response
        .clone()
        .text()
        .then((value) => value.slice(0, 400))
        .catch(() => "");

      console.warn("Help API upstream returned non-OK response", {
        traceId,
        method,
        targetUrl: targetUrl.toString(),
        hasAuthorization: Boolean(request.headers.get("authorization")),
        requestBody: requestBody?.slice(0, 500) || "",
        status: response.status,
        statusText: response.statusText,
        sampleBody,
      });

      if (isDev) {
        return Response.json(
          {
            message: `Help API request failed with status ${response.status} (${response.statusText}).`,
            traceId,
            upstreamStatus: response.status,
            upstreamStatusText: response.statusText,
            upstreamBodySample: sampleBody || null,
            forwardedRequestBody: requestBody?.slice(0, 800) || null,
            requestMethod: method,
            hasAuthorization: Boolean(request.headers.get("authorization")),
            targetPath: targetUrl.pathname,
          },
          { status: response.status },
        );
      }

      if (!sampleBody.trim()) {
        return Response.json(
          {
            message: `Help API request failed with status ${response.status} (${response.statusText}).`,
            traceId,
          },
          { status: response.status },
        );
      }
    }

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reach help API.";
    console.error("Help API proxy failure", {
      traceId,
      method,
      errorName: error instanceof Error ? error.name : typeof error,
      message,
    });
    return Response.json({ message, traceId }, { status: 502 });
  }
};

export const GET = async (request: Request, context: RouteParams) =>
  await proxyRequest(request, context, "GET");

export const POST = async (request: Request, context: RouteParams) =>
  await proxyRequest(request, context, "POST");

export const PUT = async (request: Request, context: RouteParams) =>
  await proxyRequest(request, context, "PUT");

export const DELETE = async (request: Request, context: RouteParams) =>
  await proxyRequest(request, context, "DELETE");
