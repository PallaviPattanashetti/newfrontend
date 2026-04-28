import {
  type ApiMessageResponse,
  type CreateHelpPostPayload,
  type GetHelpPostsQuery,
  type HelpCategoriesResponse,
  type HelpChatThread,
  type HelpPost,
  type HelpPostsResponse,
  type StartHelpChatPayload,
  type UpdateHelpPostPayload,
} from "@/interfaces/help-post-interfaces";
import { authHeaders, parseJsonSafely, safeFetch } from "@/lib/user-services";

const HELP_BASE_PATH = "/api/help";

const authJsonHeaders = (): HeadersInit => ({
  ...authHeaders(),
  "Content-Type": "application/json",
});

const toQueryString = (query: GetHelpPostsQuery) => {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    params.set(key, String(value));
  });

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
};

const extractHelpPostList = (payload: HelpPostsResponse | HelpPost[] | null): HelpPost[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && Array.isArray(payload.data)) {
    return payload.data;
  }

  return [];
};

const readApiErrorMessage = async (res: Response) => {
  const payload = await parseJsonSafely<
    ApiMessageResponse & {
      traceId?: string;
      upstreamBodySample?: string | null;
      forwardedRequestBody?: string | null;
      requestMethod?: string;
      hasAuthorization?: boolean;
      targetPath?: string;
    } & Record<string, unknown>
  >(
    res.clone(),
  );
  if (payload?.message && typeof payload.message === "string") {
    const traceSuffix = payload.traceId ? ` (trace: ${payload.traceId})` : "";
    const upstreamSuffix = payload.upstreamBodySample ? ` Details: ${payload.upstreamBodySample}` : "";
    const requestBodySuffix = payload.forwardedRequestBody
      ? ` Forwarded body: ${payload.forwardedRequestBody}`
      : "";
    const requestSuffix = payload.requestMethod && payload.targetPath
      ? ` Route: ${payload.requestMethod} ${payload.targetPath}.`
      : "";
    const authSuffix =
      typeof payload.hasAuthorization === "boolean"
        ? ` Auth header forwarded: ${payload.hasAuthorization ? "yes" : "no"}.`
        : "";

    return `${payload.message}${traceSuffix}${upstreamSuffix}${requestBodySuffix}${requestSuffix}${authSuffix}`;
  }

  const text = await res
    .text()
    .then((value) => value.trim())
    .catch(() => "");

  return text || "Request failed.";
};

export const getHelpCategories = async (): Promise<string[]> => {
  const res = await safeFetch(`${HELP_BASE_PATH}/help-categories`, {
    method: "GET",
  });

  if (!res?.ok) {
    return [];
  }

  const payload = await parseJsonSafely<HelpCategoriesResponse>(res);
  if (!payload?.data || !Array.isArray(payload.data)) {
    return [];
  }

  return payload.data
    .map((item) => item.category?.trim())
    .filter((category): category is string => Boolean(category));
};

export const createHelpPost = async (
  body: CreateHelpPostPayload,
): Promise<{ post: HelpPost | null; message: string; status: number }> => {
  const payload: Record<string, unknown> = {
    category: body.category,
    postType: body.postType,
    title: body.title,
    description: body.description,
    latitude: body.latitude,
    longitude: body.longitude,
  };

  console.log("[createHelpPost] Payload:", JSON.stringify(payload, null, 2));

  const res = await safeFetch(`${HELP_BASE_PATH}/help-posts`, {
    method: "POST",
    headers: authJsonHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res) {
    return {
      post: null,
      message: "Unable to reach help post API.",
      status: 0,
    };
  }

  if (!res.ok) {
    return {
      post: null,
      message: await readApiErrorMessage(res),
      status: res.status,
    };
  }

  const post = await parseJsonSafely<HelpPost>(res);

  return {
    post,
    message: "",
    status: res.status,
  };
};

export const getHelpPosts = async (query: GetHelpPostsQuery = {}): Promise<HelpPost[]> => {
  const res = await safeFetch(`${HELP_BASE_PATH}/help-posts${toQueryString(query)}`, {
    method: "GET",
    headers: authHeaders(),
    cache: "no-store",
  });

  if (!res?.ok) {
    return [];
  }

  const payload = await parseJsonSafely<HelpPostsResponse | HelpPost[]>(res);
  return extractHelpPostList(payload);
};

export const getHelpPost = async (postId: number): Promise<HelpPost | null> => {
  const res = await safeFetch(`${HELP_BASE_PATH}/help-posts/${postId}`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (!res?.ok) {
    return null;
  }

  return await parseJsonSafely<HelpPost>(res);
};

export const getMyHelpPosts = async (): Promise<HelpPost[]> => {
  const res = await safeFetch(`${HELP_BASE_PATH}/my-help-posts`, {
    method: "GET",
    headers: authHeaders(),
    cache: "no-store",
  });

  if (!res?.ok) {
    return [];
  }

  const payload = await parseJsonSafely<HelpPostsResponse | HelpPost[]>(res);
  return extractHelpPostList(payload);
};

export const updateHelpPost = async (
  postId: number,
  body: UpdateHelpPostPayload,
): Promise<HelpPost | null> => {
  const res = await safeFetch(`${HELP_BASE_PATH}/help-posts/${postId}`, {
    method: "PUT",
    headers: authJsonHeaders(),
    body: JSON.stringify(body),
  });

  if (!res?.ok) {
    return null;
  }

  return await parseJsonSafely<HelpPost>(res);
};

export const deleteHelpPost = async (postId: number): Promise<boolean> => {
  const res = await safeFetch(`${HELP_BASE_PATH}/help-posts/${postId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  return Boolean(res?.ok);
};

export const closeHelpPost = async (postId: number): Promise<boolean> => {
  const res = await safeFetch(`${HELP_BASE_PATH}/help-posts/${postId}/close`, {
    method: "POST",
    headers: authJsonHeaders(),
    body: JSON.stringify({}),
  });

  return Boolean(res?.ok);
};

export const startHelpChat = async (
  body: StartHelpChatPayload,
): Promise<{ thread: HelpChatThread | null; message: string }> => {
  const res = await safeFetch(`${HELP_BASE_PATH}/chats/start`, {
    method: "POST",
    headers: authJsonHeaders(),
    body: JSON.stringify(body),
  });

  if (!res) {
    return { thread: null, message: "Unable to connect to chat service." };
  }

  if (!res.ok) {
    const errorPayload = await parseJsonSafely<ApiMessageResponse>(res);
    return {
      thread: null,
      message: errorPayload?.message ?? "Unable to start chat.",
    };
  }

  const thread = await parseJsonSafely<HelpChatThread>(res);
  return {
    thread,
    message: "",
  };
};
