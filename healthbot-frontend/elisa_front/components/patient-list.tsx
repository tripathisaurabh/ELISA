"use client"

import type { Patient } from "@/types/chat"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState } from "react"

interface PatientListProps {
    patients: Patient[]
    selectedPatient: Patient | null
    onSelectPatient: (patient: Patient) => void
}

export default function PatientList({ patients, selectedPatient, onSelectPatient }: PatientListProps) {
    const [searchQuery, setSearchQuery] = useState("")

    const filteredPatients = patients.filter((patient) => patient.name.toLowerCase().includes(searchQuery.toLowerCase()))

    return (
        <div className="w-80 flex flex-col border-r border-border bg-card">
            {/* Header */}
            <div className="p-4 border-b border-border">
                <h1 className="text-2xl font-bold text-foreground mb-4">Messages</h1>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search patients..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 py-2 bg-secondary text-foreground placeholder-muted-foreground border-0"
                    />
                </div>
            </div>

            {/* Patient List */}
            <div className="flex-1 overflow-y-auto">
                {filteredPatients.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">No patients found</div>
                ) : (
                    filteredPatients.map((patient) => (
                        <button
                            key={patient.id}
                            onClick={() => onSelectPatient(patient)}
                            className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-secondary/50 transition-colors border-b border-border/50 ${selectedPatient?.id === patient.id ? "bg-primary/10 border-l-4 border-l-primary" : ""
                                }`}
                        >
                            {/* Avatar with Status */}
                            <div className="relative flex-shrink-0">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center overflow-hidden">
                                    <img
                                        src={patient.avatar || "/placeholder.svg"}
                                        alt={patient.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {patient.status === "online" && (
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                                )}
                            </div>

                            {/* Patient Info */}
                            <div className="flex-1 min-w-0 text-left">
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className="font-semibold text-foreground truncate">{patient.name}</h3>
                                    <span className="text-xs text-muted-foreground flex-shrink-0">{patient.lastMessageTime}</span>
                                </div>
                                <p className="text-sm text-muted-foreground truncate mt-1">{patient.lastMessage}</p>
                            </div>

                            {/* Unread Badge */}
                            {patient.unreadCount > 0 && (
                                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground flex-shrink-0">
                                    {patient.unreadCount}
                                </div>
                            )}
                        </button>
                    ))
                )}
            </div>
        </div>
    )
}
