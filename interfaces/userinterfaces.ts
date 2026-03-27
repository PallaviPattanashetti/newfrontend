export interface UserInfo {

    name: string
    email: string
    password: string
    city: string
    skill: string
}


export interface UserLogin {
    UserEmail: string
    password: string
}

export interface Token {
    token: string;
}