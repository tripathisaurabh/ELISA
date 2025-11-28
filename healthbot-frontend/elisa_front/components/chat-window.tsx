"use client"

import type { Patient, Message } from "@/types/chat"
import { Send, MoreVertical, Phone, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRef, useEffect, useState } from "react"

interface ChatWindowProps {
    patient: Patient
    messages: Message[]
    onSendMessage: (text: string) => void
}

export default function ChatWindow({ patient, messages, onSendMessage }: ChatWindowProps) {
    const [inputValue, setInputValue] = useState("")
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSendMessage = () => {
        if (inputValue.trim()) {
            onSendMessage(inputValue)
            setInputValue("")
        }
    }

    return (
        <div className="flex-1 flex flex-col bg-background">
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center overflow-hidden">
                            <img
                                src={patient.avatar || "/placeholder.svg"}
                                alt={patient.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        {patient.status === "online" && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card"></div>
                        )}
                    </div>
                    <div>
                        <h2 className="font-semibold text-foreground">{patient.name}</h2>
                        <p className="text-xs text-muted-foreground">{patient.status === "online" ? "Active now" : "Offline"}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                        <Phone className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <Video className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <MoreVertical className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <img
                                src={patient.avatar || "/placeholder.svg"}
                                alt={patient.name}
                                className="w-full h-full rounded-full object-cover"
                            />
                        </div>
                        <h3 className="font-semibold text-foreground mb-2">{patient.name}</h3>
                        <p className="text-sm text-muted-foreground">Start a conversation to discuss the patient's health</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div key={message.id} className={`flex ${message.sender === "doctor" ? "justify-end" : "justify-start"}`}>
                            <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${message.sender === "doctor"
                                    ? "bg-primary text-primary-foreground rounded-br-none"
                                    : "bg-secondary text-foreground rounded-bl-none"
                                    }`}
                            >
                                <p className="text-sm break-words">{message.text}</p>
                                <p
                                    className={`text-xs mt-1 ${message.sender === "doctor" ? "text-primary-foreground/70" : "text-muted-foreground"
                                        }`}
                                >
                                    {message.timestamp}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="px-6 py-4 border-t border-border bg-card">
                <div className="flex items-center gap-3">
                    <div className="flex-1">
                        <Input
                            placeholder="Type your message..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleSendMessage()
                                }
                            }}
                            className="bg-secondary border-0 text-foreground placeholder-muted-foreground"
                        />
                    </div>
                    <Button
                        onClick={handleSendMessage}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-2 w-10 h-10"
                    >
                        <Send className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
