export interface UserInfo {

    name: string
    email: string
    password: string
    city: string
    skill: string
}


export interface UserLogin {
    email: string
    password: string
}

export interface Token {
    token: string;
}