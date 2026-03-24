import { Token, UserInfo } from "@/interfaces/interfaces";

const url = "";

export const createAccount = async (user: UserInfo) => {
    const res = await fetch(url + '/register', {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(user)
    });

    if(!res.ok) {
        const data = await res.json();
        const message = data.message;

        console.log(message);

        return data.success;
    }

    const data = await res.json();
    console.log(data);
    return data.success;
}

export const login = async (user: UserInfo) => {
    const res = await fetch(url + '/login', {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(user)
    });

    if(!res.ok) {
        const data = await res.json();
        const message = data.message;
        console.log(message);
        return null;
    }

    const data: Token = await res.json();
    return data;
}

export const getUserByUsername = async (useremail: string) => {
    const res = await fetch(url + `/GetUserByUseremail/${useremail}`);
    const data = await res.json();
    localStorage.setItem('user', JSON.stringify(data));
}

export const checkToken = () => {
    const token = localStorage.getItem('token');
    return !!token; 
}

export const getToken = () => localStorage.getItem('token') ?? '';

export const loggedInData = () => JSON.parse(localStorage.getItem('user')!);