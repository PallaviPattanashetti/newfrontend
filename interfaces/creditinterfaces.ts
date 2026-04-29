export interface TransactionDTO {
    senderId: number,
    receiverUsername: string
    amount: number
}

export interface Transaction {
    TransactionId: number,
    SenderId: number,
    SenderUser: string,
    SenderCredits: number,
    ReceiverId: number,
    ReceiverUser: string,
    ReceiverCredits: number
}