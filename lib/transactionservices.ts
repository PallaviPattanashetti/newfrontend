import { TransactionDTO } from "@/interfaces/creditinterfaces";
import { getApiBaseUrl, safeFetch } from "./user-services";

const DM_BASE_PATH = `${getApiBaseUrl()}/api/Credit`;

const parseJson = async (res: Response) => {
    try {
        return await res.json();
    } catch {
        return null;
    }
};

const extractErrorMessage = (data: unknown, fallback: string) => {
    if (data && typeof data === "object" && "message" in data) {
        const message = (data as { message?: unknown }).message;
        if (typeof message === "string" && message.trim()) {
            return message;
        }
    }

    return fallback;
};


export const fetchTransfer = async (transaction: TransactionDTO) => {
const res = await safeFetch(DM_BASE_PATH + "/Transfer", {
    method: "PUT",
    headers: {
        "Content-Type":  "application/json"
    },
    body: JSON.stringify(transaction)
});
if (!res) {
    throw new Error("Unable to reach transfer service.");
}

if (!res.ok)
{const data = await parseJson(res);
    const message = extractErrorMessage(data, "Transfer failed.");
    throw new Error(message);
}

const data = await parseJson(res);
return data;
}

export const fetchTransaction = async (userId: number) => {
const res = await safeFetch(DM_BASE_PATH + "/GetTransactions", {
    method: "Get",
    headers: {
        "Content-Type":  "application/json"
    },
});

if (!res) {
    throw new Error("Unable to reach transaction service.");
}

if (!res.ok)
{const data = await parseJson(res);
    const message = extractErrorMessage(data, "Unable to fetch transactions.");
    throw new Error(message);
}

const data = await parseJson(res);

if (typeof data === "object" && data && "success" in data) {
    return (data as { success?: unknown }).success;
}

return data;
}


export const getUserIdByUsername = async (username: string) => {
const encodedUsername = encodeURIComponent(username.trim());
const res = await safeFetch(DM_BASE_PATH + "/GetUserIdByUsername/" + encodedUsername);

if (!res) {
    return null;
}

if (!res.ok)
{return null;
}

const data = await parseJson(res);
if (typeof data === "number") {
    return data;
}

if (typeof data === "string") {
    const parsed = Number(data);
    return Number.isFinite(parsed) ? parsed : null;
}

if (data && typeof data === "object") {
    const userId = (data as { userId?: unknown; id?: unknown }).userId ?? (data as { userId?: unknown; id?: unknown }).id;
    const parsed = Number(userId);
    return Number.isFinite(parsed) ? parsed : null;
}

return null;
}

export const DoesUserExist = async (username: string) => {
const encodedUsername = encodeURIComponent(username.trim());
const res = await safeFetch(DM_BASE_PATH + "/DoesUserExist/" + encodedUsername);

if (!res) {
    return false;
}

if (!res.ok)
{return false;
}

const data = await parseJson(res);

if (typeof data === "boolean") {
    return data;
}

if (typeof data === "object" && data && "exists" in data) {
    return Boolean((data as { exists?: unknown }).exists);
}

if (typeof data === "object" && data && "success" in data) {
    return Boolean((data as { success?: unknown }).success);
}

return Boolean(data);
}


export const GetUserCredits = async (username: string) => {
const encodedUsername = encodeURIComponent(username.trim());
const res = await safeFetch(DM_BASE_PATH + "/GetUserCredits/" + encodedUsername);

if (!res) {
    throw new Error("Unable to reach credit service.");
}

if (!res.ok)
{const data = await parseJson(res);
    const message = extractErrorMessage(data, "Unable to fetch user credits.");
    throw new Error(message);
}

const data = await parseJson(res);

if (typeof data === "number") {
    return data;
}

if (typeof data === "string") {
    const parsed = Number(data);
    if (Number.isFinite(parsed)) {
        return parsed;
    }
}

if (typeof data === "object" && data) {
    const creditsValue =
        (data as { credits?: unknown; balance?: unknown; data?: unknown }).credits ??
        (data as { credits?: unknown; balance?: unknown; data?: unknown }).balance ??
        (data as { credits?: unknown; balance?: unknown; data?: unknown }).data;
    const parsed = Number(creditsValue);
    if (Number.isFinite(parsed)) {
        return parsed;
    }
}

throw new Error("Credit service returned an invalid balance.");
}