import { RegisterUser, Token, UserLogin } from "@/interfaces/userinterfaces";

const RAW_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ??
    process.env.NEXT_PUBLIC_WEBAPP_API_URL?.trim() ??
    "https://realtimebank-bahgerc2cwcrfdgb.westus3-01.azurewebsites.net";

const BASE_URL = RAW_BASE_URL.replace(/\/+$/, "");

const BLOB_UPLOAD_ENDPOINT =
    process.env.NEXT_PUBLIC_BLOB_UPLOAD_ENDPOINT?.trim() ??
    process.env.NEXT_PUBLIC_BLOB_UPLOAD_URL?.trim() ??
    process.env.NEXT_PUBLIC_BLOB_API_ENDPOINT?.trim() ??
    "";

const TOKEN_STORAGE_KEY = "token";
const USER_STORAGE_KEY = "user";
const AUTH_CHANGED_EVENT = "auth-changed";

type ApiResponse<T> = {
    success?: boolean;
    message?: string;
} & T;

type BlobUploadResponse = {
    success?: boolean;
    url?: string;
    imageUrl?: string;
    blobUrl?: string;
    profilePictureUrl?: string;
    data?: Record<string, unknown>;
};

export type ProfilePayload = {
    name: string;
    bio: string;
    profilePictureUrl: string;
};

export type DiscoverableProfile = {
    id: string;
    profileName: string;
    description: string;
    profilePictureUrl: string;
};

export type ProfilesQueryOptions = {
    search?: string;
    skip?: number;
    take?: number;
    random?: boolean;
    onlyComplete?: boolean;
    city?: string;
    latitude?: number;
    longitude?: number;
    radiusKm?: number;
};

const parseJsonSafely = async <T>(res: Response): Promise<T | null> => {
    try {
        return (await res.json()) as T;
    } catch {
        return null;
    }
};

const safeFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
        return await fetch(input, init);
    } catch (error) {
        console.error("API request failed", {
            endpoint: String(input),
            method: init?.method ?? "GET",
            error,
        });
        return null;
    }
};

export const getApiBaseUrl = () => BASE_URL;

const getTokenExp = (token: string): number | null => {
    const parts = token.split(".");
    if (parts.length !== 3) {
        return null;
    }

    try {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))) as {
            exp?: number;
        };
        return typeof payload.exp === "number" ? payload.exp : null;
    } catch {
        return null;
    }
};

export const setToken = (token: string) => {
    if (typeof window === "undefined") {
        return;
    }
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
};

export const clearToken = () => {
    if (typeof window === "undefined") {
        return;
    }
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
};

export const getToken = () => {
    if (typeof window === "undefined") {
        return "";
    }
    return localStorage.getItem(TOKEN_STORAGE_KEY) ?? "";
};

export const checkToken = () => {
    const token = getToken();
    if (!token) {
        return false;
    }

    const exp = getTokenExp(token);
    if (exp && Date.now() >= exp * 1000) {
        clearToken();
        return false;
    }

    return true;
};

export const authHeaders = (): HeadersInit => {
    const token = getToken();
    const headers: HeadersInit = { "Content-Type": "application/json" };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
};

export const createAccount = async (user: RegisterUser) => {
    const identifier = user.usernameOrEmail.trim();
    const payload = {
        username: identifier,
        email: identifier,
        UserEmail: identifier,
        password: user.password,
    };

    const res = await safeFetch(`${BASE_URL}/api/user/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!res) {
        return false;
    }

    const data = await parseJsonSafely<ApiResponse<Record<string, unknown>>>(res);
    return res.ok && Boolean(data?.success ?? true);
};

export const login = async (user: UserLogin) => {
    const identifier = user.usernameOrEmail.trim();
    const payload = {
        username: identifier,
        email: identifier,
        UserEmail: identifier,
        password: user.password,
    };

    const res = await safeFetch(`${BASE_URL}/api/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!res) {
        return null;
    }

    const data = await parseJsonSafely<Token>(res);
    if (!res.ok || !data?.token) {
        return null;
    }

    setToken(data.token);
    return data;
};

export const getUserByUsername = async (userEmail: string) => {
    const res = await safeFetch(`${BASE_URL}/api/user/GetUserByUseremail/${encodeURIComponent(userEmail)}`, {
        headers: authHeaders(),
    });

    if (!res) {
        return null;
    }

    if (!res.ok) {
        return null;
    }

    const data = await parseJsonSafely<Record<string, unknown>>(res);
    if (data && typeof window !== "undefined") {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data));
    }

    return data;
};

export const loggedInData = () => {
    if (typeof window === "undefined") {
        return null;
    }

    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

export const getProfile = async () => {
    const res = await safeFetch(`${BASE_URL}/api/user/profile`, {
        method: "GET",
        headers: authHeaders(),
    });

    if (!res) {
        return null;
    }

    if (!res.ok) {
        return null;
    }

    return await parseJsonSafely<Record<string, unknown>>(res);
};

const buildProfilePayload = (profile: ProfilePayload) => ({
    name: profile.name,
    displayName: profile.name,
    bio: profile.bio,
    aboutMe: profile.bio,
    description: profile.bio,
    profileDescription: profile.bio,
    profilePictureUrl: profile.profilePictureUrl,
    imageUrl: profile.profilePictureUrl,
});

const wasSuccessfulResponse = async (res: Response) => {
    if (!res.ok) {
        return false;
    }

    const data = await parseJsonSafely<ApiResponse<Record<string, unknown>>>(res);
    if (data && typeof data.success === "boolean") {
        return data.success;
    }

    return true;
};

export const saveProfile = async (profile: ProfilePayload) => {
    const payload = buildProfilePayload(profile);

    const putRes = await safeFetch(`${BASE_URL}/api/user/profile`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(payload),
    });

    if (!putRes) {
        return false;
    }

    if (await wasSuccessfulResponse(putRes)) {
        return true;
    }

    const postRes = await safeFetch(`${BASE_URL}/api/user/profile`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
    });

    if (!postRes) {
        return false;
    }

    return await wasSuccessfulResponse(postRes);
};

const pickText = (obj: Record<string, unknown> | null | undefined, keys: string[]) => {
    if (!obj) {
        return "";
    }

    for (const key of keys) {
        const value = obj[key];
        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
    }

    return "";
};

const isValidImageUrl = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
        return false;
    }

    if (trimmed.startsWith("/") || trimmed.startsWith("data:")) {
        return true;
    }

    try {
        const parsed = new URL(trimmed);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
        return false;
    }
};

const collectObjects = (value: unknown): Record<string, unknown>[] => {
    const result: Record<string, unknown>[] = [];
    const stack: unknown[] = [value];

    while (stack.length > 0) {
        const current = stack.pop();
        if (Array.isArray(current)) {
            for (const item of current) {
                stack.push(item);
            }
            continue;
        }

        if (current && typeof current === "object") {
            const record = current as Record<string, unknown>;
            result.push(record);
            for (const nested of Object.values(record)) {
                if (nested && (Array.isArray(nested) || typeof nested === "object")) {
                    stack.push(nested);
                }
            }
        }
    }

    return result;
};

const getBlobUploadCandidates = () => {
    const candidates = [
        BLOB_UPLOAD_ENDPOINT,
        `${BASE_URL}/api/user/profile-picture`,
        `${BASE_URL}/api/blob/upload`,
        `${BASE_URL}/api/blobstorage/upload`,
        `${BASE_URL}/api/image/upload`,
        `${BASE_URL}/api/images/upload`,
        `${BASE_URL}/api/user/profile-image/upload`,
    ];

    return [...new Set(candidates.map((value) => value.trim()).filter(Boolean))];
};

const extractImageUrlFromPayload = (payload: unknown): string => {
    const objects = collectObjects(payload);

    for (const item of objects) {
        const direct = pickText(item, [
            "url",
            "imageUrl",
            "blobUrl",
            "blobUri",
            "profilePictureUrl",
            "fileUrl",
            "absoluteUrl",
            "absoluteUri",
            "publicUrl",
            "uri",
            "location",
        ]);

        if (isValidImageUrl(direct)) {
            return direct;
        }
    }

    return "";
};

export const uploadProfileImage = async (file: File): Promise<string | null> => {
    const endpoints = getBlobUploadCandidates();
    if (endpoints.length === 0) {
        return null;
    }

    const token = getToken();
    const uploadFieldNames = ["file", "image", "profileImage", "profilePicture", "upload"];

    for (const endpoint of endpoints) {
        for (const fieldName of uploadFieldNames) {
            const formData = new FormData();
            formData.append(fieldName, file);

            const headers: HeadersInit = {};
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            try {
                const res = await safeFetch(endpoint, {
                    method: "POST",
                    headers,
                    body: formData,
                });

                if (!res) {
                    continue;
                }

                if (!res.ok) {
                    continue;
                }

                const payload = await parseJsonSafely<BlobUploadResponse | Record<string, unknown>>(res);
                const imageUrl = extractImageUrlFromPayload(payload);
                if (imageUrl) {
                    return imageUrl;
                }
            } catch {
                // Ignore candidate endpoint failures and try the next endpoint.
            }
        }
    }

    return null;
};

const toDiscoverableProfile = (obj: Record<string, unknown>): DiscoverableProfile | null => {
    const nestedCandidates: Array<Record<string, unknown>> = [
        obj,
        (obj.user as Record<string, unknown>) ?? {},
        (obj.owner as Record<string, unknown>) ?? {},
        (obj.author as Record<string, unknown>) ?? {},
        (obj.createdBy as Record<string, unknown>) ?? {},
        (obj.profile as Record<string, unknown>) ?? {},
    ];

    let profileName = "";
    let description = "";
    let profilePictureUrl = "";
    let profileId = "";

    for (const candidate of nestedCandidates) {
        if (!profileName) {
            profileName = pickText(candidate, [
                "profileName",
                "displayName",
                "name",
                "userName",
                "username",
                "fullName",
            ]);
        }

        if (!description) {
            description = pickText(candidate, [
                "description",
                "profileDescription",
                "bio",
                "aboutMe",
            ]);
        }

        if (!profilePictureUrl) {
            profilePictureUrl = pickText(candidate, [
                "profilePictureUrl",
                "avatarUrl",
                "imageUrl",
                "profileImageUrl",
            ]);
        }

        if (!profileId) {
            profileId = pickText(candidate, ["id", "userId", "profileId", "username", "email"]);
        }
    }

    if (!profileName || !description || !isValidImageUrl(profilePictureUrl)) {
        return null;
    }

    return {
        id: profileId || `${profileName}-${description}`,
        profileName,
        description,
        profilePictureUrl,
    };
};

const getProfilesPayload = async (options: ProfilesQueryOptions = {}) => {
    const params = new URLSearchParams();

    if (options.search && options.search.trim()) {
        params.set("search", options.search.trim());
    }
    if (typeof options.skip === "number") {
        params.set("skip", String(options.skip));
    }
    if (typeof options.take === "number") {
        params.set("take", String(options.take));
    }
    if (typeof options.random === "boolean") {
        params.set("random", String(options.random));
    }
    if (typeof options.onlyComplete === "boolean") {
        params.set("onlyComplete", String(options.onlyComplete));
    }
    if (options.city && options.city.trim()) {
        params.set("city", options.city.trim());
    }
    if (typeof options.latitude === "number") {
        params.set("latitude", String(options.latitude));
    }
    if (typeof options.longitude === "number") {
        params.set("longitude", String(options.longitude));
    }
    if (typeof options.radiusKm === "number") {
        params.set("radiusKm", String(options.radiusKm));
    }

    const query = params.toString();
    const endpoint = query
        ? `${BASE_URL}/api/user/profiles?${query}`
        : `${BASE_URL}/api/user/profiles`;

    const res = await safeFetch(endpoint, {
        method: "GET",
        headers: authHeaders(),
    });

    if (!res) {
        return null;
    }

    if (!res.ok) {
        return null;
    }

    return await parseJsonSafely<unknown>(res);
};

export const getDiscoverableProfiles = async (searchName = "", options: ProfilesQueryOptions = {}) => {
    const payload = await getProfilesPayload({
        ...options,
        search: searchName,
    });
    if (!payload) {
        return [] as DiscoverableProfile[];
    }

    const objects = collectObjects(payload);
    const dedupe = new Map<string, DiscoverableProfile>();

    for (const obj of objects) {
        const profile = toDiscoverableProfile(obj);
        if (!profile) {
            continue;
        }

        const key = `${profile.id}-${profile.profileName.toLowerCase()}`;
        if (!dedupe.has(key)) {
            dedupe.set(key, profile);
        }
    }

    const query = searchName.trim().toLowerCase();
    const profiles = [...dedupe.values()];

    if (!query) {
        return profiles;
    }

    return profiles.filter((profile) => profile.profileName.toLowerCase().includes(query));
};