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