const DEFAULT_API_BASE_URL = "https://tbtest-hpa0bagng7azd3cc.westus3-01.azurewebsites.net";

const RAW_TARGET_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ??
    process.env.NEXT_PUBLIC_WEBAPP_API_URL?.trim() ??
    DEFAULT_API_BASE_URL;

const TARGET_BASE_URL = RAW_TARGET_BASE_URL.replace(/\/+$/, "");

const buildTargetUrl = (request: Request) => {
    const sourceUrl = new URL(request.url);
    const targetUrl = new URL(`${TARGET_BASE_URL}/api/user/profiles`);
    targetUrl.search = sourceUrl.search;
    return targetUrl;
};

const buildForwardHeaders = (request: Request) => {
    const headers = new Headers();
    const authorization = request.headers.get("authorization");
    const accept = request.headers.get("accept");

    if (authorization) {
        headers.set("authorization", authorization);
    }

    if (accept) {
        headers.set("accept", accept);
    }

    return headers;
};

export const GET = async (request: Request) => {
    try {
        const response = await fetch(buildTargetUrl(request), {
            method: "GET",
            headers: buildForwardHeaders(request),
            redirect: "manual",
        });

        const responseHeaders = new Headers(response.headers);
        responseHeaders.delete("content-encoding");
        responseHeaders.delete("content-length");

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to reach upstream API.";
        return Response.json({ message }, { status: 502 });
    }
};