export interface Patient {
    id: string
    name: string
    avatar: string
    lastMessage: string
    lastMessageTime: string
    unreadCount: number
    status: "online" | "offline"
}

export interface Message {
    id: string
    sender: "doctor" | "patient"
    text: string
    timestamp: string
}
