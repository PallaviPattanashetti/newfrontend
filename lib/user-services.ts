import { RegisterUser, Token, UserLogin } from "@/interfaces/userinterfaces";

const DEFAULT_API_BASE_URL = "https://tbtest-hpa0bagng7azd3cc.westus3-01.azurewebsites.net";

// const DEFAULT_API_BASE_URL = "http://localhost:5056/";

const RAW_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ??
    process.env.NEXT_PUBLIC_WEBAPP_API_URL?.trim() ??
    DEFAULT_API_BASE_URL;

const BASE_URL = RAW_BASE_URL.replace(/\/+$/, "");

if (!process.env.NEXT_PUBLIC_API_BASE_URL?.trim() && !process.env.NEXT_PUBLIC_WEBAPP_API_URL?.trim()) {
    console.warn(
        `NEXT_PUBLIC_API_BASE_URL is not set. Falling back to ${DEFAULT_API_BASE_URL}. ` +
            "Set the variable in your deployment environment to avoid build-time mismatches."
    );
}

const BLOB_UPLOAD_ENDPOINT =
    process.env.NEXT_PUBLIC_BLOB_UPLOAD_ENDPOINT?.trim() ??
    process.env.NEXT_PUBLIC_BLOB_UPLOAD_URL?.trim() ??
    process.env.NEXT_PUBLIC_BLOB_API_ENDPOINT?.trim() ??
    "";

const TOKEN_STORAGE_KEY = "token";
const USER_STORAGE_KEY = "user";
const CHAT_USERNAME_STORAGE_KEY = "username";
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

export type UploadProfileImageResult = {
    imageUrl: string | null;
    error: string;
};

export type ProfilePayload = {
    name: string;
    bio: string;
    profilePictureUrl: string;
};

export type DiscoverableProfile = {
    id: string;
    profileName: string;
    username: string;
    description: string;
    profilePictureUrl: string;
    latitude?: number;
    longitude?: number;
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

export const parseJsonSafely = async <T>(res: Response): Promise<T | null> => {
    try {
        return (await res.json()) as T;
    } catch {
        return null;
    }
};

export const safeFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
        return await fetch(input, init);
    } catch (error) {
        const errorName = error instanceof Error ? error.name : typeof error;
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isOnline = typeof navigator !== "undefined" ? navigator.onLine : undefined;

        // Network failures (CORS/offline/DNS) are expected sometimes in dev.
        // Keep this as a warning so it does not trigger noisy runtime error overlays.
        console.warn("API request failed", {
            endpoint: String(input),
            method: init?.method ?? "GET",
            errorName,
            errorMessage,
            isOnline,
        });
        return null;
    }
};

export const getApiBaseUrl = () => BASE_URL;

const getProfilesApiBaseUrl = () => {
    if (typeof window !== "undefined") {
        return "";
    }

    return BASE_URL;
};

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
//test change
export const clearToken = () => {
    if (typeof window === "undefined") {
        return;
    }
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(CHAT_USERNAME_STORAGE_KEY);
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
    const headers: HeadersInit = {};

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
};

const pickStoredUsername = (obj: Record<string, unknown> | null | undefined) => {
    if (!obj) {
        return "";
    }

    const candidates = [
        obj.username,
        obj.userName,
        obj.loginName,
        obj.displayName,
        obj.name,
        obj.email,
        obj.userEmail,
    ];

    for (const value of candidates) {
        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
    }

    return "";
};

const syncStoredChatIdentity = async (fallbackIdentifier: string) => {
    if (typeof window === "undefined") {
        return;
    }

    let resolvedUsername = fallbackIdentifier;

    const profileRes = await safeFetch(`${BASE_URL}/api/user/profile`, {
        method: "GET",
        headers: authHeaders(),
    });

    if (profileRes?.ok) {
        const profile = await parseJsonSafely<Record<string, unknown>>(profileRes);
        if (profile) {
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
            resolvedUsername = pickStoredUsername(profile) || fallbackIdentifier;
        }
    }

    localStorage.setItem(CHAT_USERNAME_STORAGE_KEY, resolvedUsername);
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
};

export const createAccount = async (user: RegisterUser) => {
    const identifier = user.usernameOrEmail.trim();
    const payload = {
        username: identifier,
        email: identifier,
        UserEmail: identifier,
        password: user.password,
    };

    const res = await safeFetch(`${BASE_URL}/api/auth/register`, {
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

    const res = await safeFetch(`${BASE_URL}/api/auth/login`, {
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
    await syncStoredChatIdentity(identifier);
    return data;
};

export const searchUser = async (username: string) => {
const res = await safeFetch(`${BASE_URL}/api/user/GetUserByUseremail/${encodeURIComponent(username)}`);
       if (!res) {
        return null;
    }

    if (!res.ok) {
        return null;
    }
const data = await res.json();
console.log(data);
    return data;
}



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
        cache: "no-store",
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

    const headers: HeadersInit = {
        ...authHeaders(),
        "Content-Type": "application/json",
    };

    const putRes = await safeFetch(`${BASE_URL}/api/user/profile`, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
    });

    if (!putRes) {
        return false;
    }

    if (await wasSuccessfulResponse(putRes)) {
        // After successful save, refresh the profile data in localStorage
        const freshProfile = await getProfile();
        if (freshProfile && typeof window !== "undefined") {
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(freshProfile));
            window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
        }
        return true;
    }

    const postRes = await safeFetch(`${BASE_URL}/api/user/profile`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
    });

    if (!postRes) {
        return false;
    }

    if (await wasSuccessfulResponse(postRes)) {
        // After successful save, refresh the profile data in localStorage
        const freshProfile = await getProfile();
        if (freshProfile && typeof window !== "undefined") {
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(freshProfile));
            window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
        }
        return true;
    }

    return false;
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
        `${BASE_URL}/api/user/upload-profile-picture`,
        `${BASE_URL}/api/user/profile-picture/upload`,
        `${BASE_URL}/api/user/profile/upload`,
        `${BASE_URL}/api/user/upload`,
        `${BASE_URL}/api/blob/upload`,
        `${BASE_URL}/api/blobs/upload`,
        `${BASE_URL}/api/blobstorage/upload`,
        `${BASE_URL}/api/image/upload`,
        `${BASE_URL}/api/images/upload`,
        `${BASE_URL}/api/upload/image`,
        `${BASE_URL}/api/upload/profile-picture`,
        `${BASE_URL}/api/upload/profile-image`,
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

export const uploadProfileImage = async (file: File): Promise<UploadProfileImageResult> => {
    const endpoints = getBlobUploadCandidates();
    if (endpoints.length === 0) {
        return {
            imageUrl: null,
            error: "No blob upload endpoint is configured.",
        };
    }

    const token = getToken();
    const uploadFieldNames = ["file", "image", "profileImage", "profilePicture", "upload"];
    let lastError = "Upload failed. Endpoint did not return a usable image URL.";

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
                    lastError = "Unable to reach blob upload endpoint.";
                    continue;
                }

                if (!res.ok) {
                    if (res.status === 401 || res.status === 403) {
                        return {
                            imageUrl: null,
                            error: "You are not authorized to upload. Please sign in again.",
                        };
                    }

                    const errorSample = await res
                        .clone()
                        .text()
                        .then((value) => value.slice(0, 180))
                        .catch(() => "");

                    const endpointHint = `Endpoint: ${endpoint} (field: ${fieldName}).`;
                    lastError = errorSample
                        ? `Upload endpoint rejected the file (${res.status}). ${endpointHint} ${errorSample}`
                        : `Upload endpoint rejected the file (${res.status}). ${endpointHint}`;
                    continue;
                }

                const payload = await parseJsonSafely<BlobUploadResponse | Record<string, unknown>>(res);
                const imageUrl = extractImageUrlFromPayload(payload);
                if (imageUrl) {
                    return {
                        imageUrl,
                        error: "",
                    };
                }

                lastError =
                    "Upload succeeded but response did not contain image URL. Expected one of: url, imageUrl, blobUrl, profilePictureUrl.";
            } catch {
                // Ignore candidate endpoint failures and try the next endpoint.
                lastError = `Upload call failed for endpoint ${endpoint}.`;
            }
        }
    }

    return {
        imageUrl: null,
        error: lastError,
    };
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
    let username = "";
    let description = "";
    let profilePictureUrl = "";
    let profileId = "";

    for (const candidate of nestedCandidates) {
        if (!profileName) {
            profileName = pickText(candidate, [
                "profileName",
                "displayName",
                "name",
                "fullName",
            ]);
        }

        if (!username) {
            username = pickText(candidate, [
                "userName",
                "username",
                "loginName",
                "email",
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
        username,
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
    const profilesBaseUrl = getProfilesApiBaseUrl();
    const endpoint = query
        ? `${profilesBaseUrl}/api/user/profiles?${query}`
        : `${profilesBaseUrl}/api/user/profiles`;

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

    return profiles.filter((profile) => {
        const searchableProfileName = profile.profileName.toLowerCase();
        const searchableUsername = profile.username.toLowerCase();
        return searchableProfileName.includes(query) || searchableUsername.includes(query);
    });
};

export const getStoredChatUsername = () => {
    if (typeof window === "undefined") {
        return "";
    }

    return localStorage.getItem(CHAT_USERNAME_STORAGE_KEY) ?? "";
};