"use client"

import { useState } from "react"
import PatientList from "@/components/patient-list"
import ChatWindow from "@/components/chat-window"
import type { Patient, Message } from "@/types/chat"

// Mock patient data
const mockPatients: Patient[] = [
    {
        id: "1",
        name: "John Anderson",
        avatar: "/patient-avatar-male-1.jpg",
        lastMessage: "My headache is getting worse",
        lastMessageTime: "2:30 PM",
        unreadCount: 2,
        status: "online",
    },
    {
        id: "2",
        name: "Sarah Johnson",
        avatar: "/patient-avatar-female-1.jpg",
        lastMessage: "Thank you for the prescription",
        lastMessageTime: "1:15 PM",
        unreadCount: 0,
        status: "online",
    },
    {
        id: "3",
        name: "Michael Chen",
        avatar: "/patient-avatar-male-2.jpg",
        lastMessage: "Follow-up appointment confirmed",
        lastMessageTime: "Yesterday",
        unreadCount: 0,
        status: "offline",
    },
    {
        id: "4",
        name: "Emma Wilson",
        avatar: "/patient-avatar-female-2.jpg",
        lastMessage: "Started the new medication",
        lastMessageTime: "11:45 AM",
        unreadCount: 1,
        status: "online",
    },
    {
        id: "5",
        name: "David Martinez",
        avatar: "/patient-avatar-male-3.jpg",
        lastMessage: "When can I schedule the test?",
        lastMessageTime: "Monday",
        unreadCount: 0,
        status: "offline",
    },
]

// Mock chat messages
const mockMessages: { [key: string]: Message[] } = {
    "1": [
        {
            id: "1",
            sender: "patient",
            text: "Good morning Doctor, I wanted to check in about my headaches",
            timestamp: "9:30 AM",
        },
        {
            id: "2",
            sender: "doctor",
            text: "Hello John, thanks for reaching out. How long have you been experiencing these headaches?",
            timestamp: "9:45 AM",
        },
        {
            id: "3",
            sender: "patient",
            text: "About 3 days now. They started after a long work meeting",
            timestamp: "10:00 AM",
        },
        {
            id: "4",
            sender: "doctor",
            text: "I see. Based on your patient data, I see you had similar episodes last month. Have you tried the relaxation exercises we discussed?",
            timestamp: "10:15 AM",
        },
        {
            id: "5",
            sender: "patient",
            text: "Not yet, I will try them today",
            timestamp: "10:20 AM",
        },
        {
            id: "6",
            sender: "patient",
            text: "My headache is getting worse",
            timestamp: "2:30 PM",
        },
    ],
    "2": [
        {
            id: "1",
            sender: "doctor",
            text: "Hi Sarah, the prescription I mentioned is now ready for pickup",
            timestamp: "1:00 PM",
        },
        {
            id: "2",
            sender: "patient",
            text: "Thank you for the prescription",
            timestamp: "1:15 PM",
        },
    ],
}

export default function Home() {
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(mockPatients[0])
    const [messages, setMessages] = useState<Message[]>(mockMessages["1"] || [])

    const handleSelectPatient = (patient: Patient) => {
        setSelectedPatient(patient)
        setMessages(mockMessages[patient.id] || [])
    }

    const handleSendMessage = (text: string) => {
        const newMessage: Message = {
            id: String(messages.length + 1),
            sender: "doctor",
            text,
            timestamp: new Date().toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            }),
        }

        setMessages([...messages, newMessage])
    }

    return (
        <div className="flex h-screen bg-background">
            <PatientList patients={mockPatients} selectedPatient={selectedPatient} onSelectPatient={handleSelectPatient} />
            {selectedPatient && (
                <ChatWindow patient={selectedPatient} messages={messages} onSendMessage={handleSendMessage} />
            )}
        </div>
    )
}
