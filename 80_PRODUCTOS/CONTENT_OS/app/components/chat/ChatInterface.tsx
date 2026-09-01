"use client"

import { useState, useRef, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { MARCA_DEFAULT, esMarca } from "@/lib/marcas"
import { Send, Bot, User } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { agents } from "./AgentBadge"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  ts: string
}

function parseMarkdown(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text-primary);font-weight:600">$1</strong>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
}

const agent = agents.instagram

export function ChatInterface() {
  const desdeUrl = useSearchParams().get("marca")
  const marca = esMarca(desdeUrl) ? desdeUrl : MARCA_DEFAULT

  const [history, setHistory] = useState<{ role: string; content: string }[]>([])
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hola, equipo Dermatinta. Pregúntenme lo que quieran sobre los reels — métricas, transcripciones, hooks e ideas de contenido.",
      ts: "ahora",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || loading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      ts: new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }),
    }

    const userText = input.trim()
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, history, marca }),
      })
      const data = await res.json()
      const replyText = data.reply ?? (data.error ? `Error: ${data.error}` : "No se pudo obtener una respuesta.")

      setHistory((prev) => [
        ...prev,
        { role: "user", content: userText },
        { role: "assistant", content: replyText },
      ])

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: replyText,
          ts: new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }),
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Error al conectar con el servicio de IA.",
          ts: new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <ScrollArea className="flex-1 px-6 py-5">
        <div className="flex flex-col gap-4 max-w-3xl mx-auto">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
              {/* Avatar */}
              <div
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
                style={
                  msg.role === "user"
                    ? {
                        background: "var(--sidebar-active-bg)",
                        border: "1px solid var(--border-medium)",
                        color: "var(--text-primary)",
                      }
                    : {
                        background: "var(--bg-elevated)",
                        border: `1px solid ${agent.color}30`,
                        color: agent.color,
                      }
                }
              >
                {msg.role === "user" ? <User size={12} /> : <Bot size={12} />}
              </div>

              {/* Bubble */}
              <div className={cn("flex max-w-[78%] flex-col gap-1.5", msg.role === "user" ? "items-end" : "items-start")}>
                {msg.role === "assistant" && (
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: agent.color }}
                  >
                    {agent.handle}
                  </span>
                )}
                <div
                  className="rounded-xl px-4 py-3 text-[11px] leading-relaxed"
                  style={
                    msg.role === "user"
                      ? {
                          background: "var(--bg-floating)",
                          color: "var(--text-primary)",
                          border: "1px solid var(--border-medium)",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.20)",
                        }
                      : {
                          background: "var(--bg-elevated)",
                          color: "var(--text-secondary)",
                          border: "1px solid var(--border-subtle)",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                        }
                  }
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }}
                />
                <span style={{ fontSize: 9, color: "var(--text-faint)" }}>{msg.ts}</span>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex gap-3">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-secondary)",
                }}
              >
                <Bot size={12} />
              </div>
              <div
                className="flex items-center gap-1 rounded-xl px-4 py-3"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <span className="h-1.5 w-1.5 animate-bounce rounded-full" style={{ background: "var(--text-faint)", animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full" style={{ background: "var(--text-faint)", animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full" style={{ background: "var(--text-faint)", animationDelay: "300ms" }} />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div
        className="px-6 py-4"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <div className="flex items-end gap-3 max-w-3xl mx-auto">
          <div
            className="flex flex-1 items-end rounded-xl px-4 py-3 transition-colors duration-150"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-medium)",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-medium)")}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Preguntá sobre tus reels, métricas, hooks..."
              rows={1}
              className="flex-1 resize-none bg-transparent text-[11px] focus:outline-none"
              style={{
                color: "var(--text-primary)",
                maxHeight: "120px",
              }}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-150 cursor-pointer"
            style={
              input.trim() && !loading
                ? {
                    background: "var(--bg-floating)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-medium)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.20)",
                  }
                : {
                    background: "transparent",
                    color: "var(--text-faint)",
                    border: "1px solid var(--border-subtle)",
                    cursor: "not-allowed",
                  }
            }
          >
            <Send size={14} />
          </button>
        </div>
        <p
          className="mt-2 max-w-3xl mx-auto"
          style={{ fontSize: 10, color: "var(--text-faint)" }}
        >
          Enter para enviar · Shift+Enter para nueva línea
        </p>
      </div>
    </div>
  )
}
