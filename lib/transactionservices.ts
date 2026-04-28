import { TransactionDTO } from "@/interfaces/creditinterfaces";
import { getApiBaseUrl, safeFetch } from "./user-services";
const DEFAULT_API_BASE_URL = "https://tbtest-hpa0bagng7azd3cc.westus3-01.azurewebsites.net";

const DM_BASE_PATH = `${getApiBaseUrl()}/api/Credit`;

const RAW_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ??
    process.env.NEXT_PUBLIC_WEBAPP_API_URL?.trim() ??
    DEFAULT_API_BASE_URL;

const BASE_URL = RAW_BASE_URL.replace(/\/+$/, "");


export const fetchTransfer = async (transaction: TransactionDTO) => {
const res = await fetch(DM_BASE_PATH + "/Transfer", {
    method: "PUT",
    headers: {
        "Content-Type":  "application/json"
    },
    body: JSON.stringify(transaction)
});
if (!res.ok)
{const data = await res.json();
    const message = data.message;
    console.log(message);
    return data;
}

const data = await res.json();
return data;
}

export const fetchTransaction = async (userId: number) => {
const res = await fetch(DM_BASE_PATH + "/GetTransactions", {
    method: "Get",
    headers: {
        "Content-Type":  "application/json"
    },
});

if (!res.ok)
{const data = await res.json();
    const message = data.message;
    console.log(message);
    return data.success;
}

const data = await res.json();
return data.success;
}


export const getUserIdByUsername = async (username: string) => {
const res : any = await fetch(DM_BASE_PATH + "/GetUserIdByUsername/" + username);

if (!res.ok)
{const data = await res.json();
    const message = data.message;
    console.log(message);
    return data;
}

const data = await res.json();
return data;
}

export const DoesUserExist = async (username: string) => {
const res = await fetch(DM_BASE_PATH + "/DoesUserExist/" + username);

if (!res.ok)
{const data = await res.json();
    const message = data.message;
    console.log(message);
    return data;
}

const data = await res.json();
console.log(data);
return data;
}


export const GetUserCredits = async (username: string) => {
const res : any = await fetch(DM_BASE_PATH + "/GetUserCredits/" + username);

if (!res.ok)
{const data = await res.json();
    const message = data.message;
    console.log(message);
    return data;
}

const data = await res.json();
return data;
}