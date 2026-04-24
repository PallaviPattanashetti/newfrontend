import { TransactionDTO } from "@/interfaces/creditinterfaces";
import { getApiBaseUrl } from "./user-services";

const DM_BASE_PATH = `${getApiBaseUrl()}/api/Credit`;

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
