export interface UserInfo {

    name: string
    email: string
    password: string
    city: string
    skill: string
}

export interface RegisterUser {
    usernameOrEmail: string
    password: string
}


export interface UserLogin {
    usernameOrEmail: string
    password: string
}

export interface Token {
    token: string;
}