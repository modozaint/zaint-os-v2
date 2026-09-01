import { Suspense } from "react"
import { ChatInterface } from "@/components/chat/ChatInterface"

export default function ChatPage() {
  return (
    <div className="h-full">
      <Suspense fallback={null}>
        <ChatInterface />
      </Suspense>
    </div>
  )
}
