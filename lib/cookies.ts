'use server'

import { cookies } from "next/headers";
import { Cookie } from "../interfaces/cookieinterfaces";

export const hasCookie = async (name: string) => {
    const cookieStore = await cookies();
    return cookieStore.has(name);
}

export const saveCookie = async ({ name, value }: Cookie) => {
    const cookieStore = await cookies();
    cookieStore.set({
        name,
        value: JSON.stringify(value),
        httpOnly: true

    });

    return await hasCookie(name);
}

export const getCookie = async (name: string) => {
    const cookieStore = await cookies();
    const value = cookieStore.get(name)?.value;

    if (value != undefined && value != null) {
        try {
            return JSON.parse(value);

        } catch {
            return value
        }
    }
    return null;
}

export const deleteCookie = async (name: string) => {
    const cookieStore = await cookies();
    cookieStore.delete(name);

    return !(await hasCookie(name));
}

