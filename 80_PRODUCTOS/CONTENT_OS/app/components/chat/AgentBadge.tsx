import { cn } from "@/lib/utils"

export type AgentId = "instagram"

export const agents: Record<AgentId, { label: string; handle: string; color: string; description: string }> = {
  instagram: {
    label: "Instagram Intelligence",
    handle: "@InstagramIntelligence",
    color: "var(--accent-instagram)",
    description: "Reels, métricas, transcripciones",
  },
}

interface AgentBadgeProps {
  agentId: AgentId
  active?: boolean
  onClick?: (id: AgentId) => void
  size?: "sm" | "md"
}

export function AgentBadge({ agentId, active = false, onClick, size = "md" }: AgentBadgeProps) {
  const agent = agents[agentId]
  return (
    <button
      onClick={() => onClick?.(agentId)}
      className={cn(
        "rounded-lg border transition-all",
        size === "sm" ? "px-2 py-1 text-[10px]" : "px-3 py-1.5 text-xs",
        active
          ? "border-transparent font-semibold"
          : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-medium)] hover:text-[var(--text-primary)]"
      )}
      style={
        active
          ? { backgroundColor: agent.color + "18", color: agent.color, borderColor: agent.color + "40" }
          : {}
      }
    >
      {agent.handle}
    </button>
  )
}
