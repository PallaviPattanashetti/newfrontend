import { RegisterUser, Token, UserLogin } from "@/interfaces/userinterfaces";

const BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "https://realtimebank-bahgerc2cwcrfdgb.westus3-01.azurewebsites.net";

const TOKEN_STORAGE_KEY = "token";
const USER_STORAGE_KEY = "user";
const AUTH_CHANGED_EVENT = "auth-changed";

type ApiResponse<T> = {
    success?: boolean;
    message?: string;
} & T;

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

    const res = await fetch(`${BASE_URL}/api/user/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

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

    const res = await fetch(`${BASE_URL}/api/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const data = await parseJsonSafely<Token>(res);
    if (!res.ok || !data?.token) {
        return null;
    }

    setToken(data.token);
    return data;
};

export const getUserByUsername = async (userEmail: string) => {
    const res = await fetch(`${BASE_URL}/api/user/GetUserByUseremail/${encodeURIComponent(userEmail)}`, {
        headers: authHeaders(),
    });

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
    const res = await fetch(`${BASE_URL}/api/user/profile`, {
        method: "GET",
        headers: authHeaders(),
    });

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

    const putRes = await fetch(`${BASE_URL}/api/user/profile`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(payload),
    });

    if (await wasSuccessfulResponse(putRes)) {
        return true;
    }

    const postRes = await fetch(`${BASE_URL}/api/user/profile`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
    });

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

    const res = await fetch(endpoint, {
        method: "GET",
        headers: authHeaders(),
    });

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