import { TranscriptLine, Type } from '@/lib/types'

export function SystemChatLine({ line }: { line: TranscriptLine }) {
  const content = line.content.trim()

  switch (line.type) {
    case Type.ChemistryDialogueNode:
      return (
        <div className="rounded border border-[#5a3b13] bg-[#211103] px-2 py-1 text-[#f0bb5f]">
          <strong>Chemistry</strong>: {formatChemistryValue(content)}
        </div>
      )
    case Type.SetBooleanDialogueNode:
      return (
        <div className="rounded border border-[#3a5a2f] bg-[#0f1c0f] px-2 py-1 text-[#c6e0bc]">
          <strong>Boolean set</strong>: {content || '(unnamed)'} = true
        </div>
      )
    case Type.ResetBooleanDialogueNode:
      return (
        <div className="rounded border border-[#5a2f2f] bg-[#1f0f0f] px-2 py-1 text-[#f1c3c3]">
          <strong>Boolean reset</strong>: {content || '(unnamed)'} = false
        </div>
      )
    case Type.IncCounterDialogueNode:
      return (
        <div className="rounded border border-[#3f3d1c] bg-[#181608] px-2 py-1 text-[#e6de9f]">
          <strong>Counter update</strong>: {content || '(no details)'}
        </div>
      )
    case Type.CheckBooleanDialogueNode:
    case Type.CheckBooleanScriptDialogueNode:
      return (
        <div className="rounded border border-[#2d3d5a] bg-[#0d1422] px-2 py-1 text-[#b8cbe9]">
          <strong>Boolean check</strong>: {content || '(unnamed)'}
        </div>
      )
    case Type.CheckMultiBooleanDialogueNode:
      return (
        <div className="rounded border border-[#2d3d5a] bg-[#0d1422] px-2 py-1 text-[#b8cbe9]">
          <strong>Multi-boolean check</strong>: {content || '(no expression)'}
        </div>
      )
    case Type.CheckCounterDialogueNode:
      return (
        <div className="rounded border border-[#2d3d5a] bg-[#0d1422] px-2 py-1 text-[#b8cbe9]">
          <strong>Counter check</strong>: {content || '(unnamed)'}
        </div>
      )
    default:
      return (
        <div className="rounded border border-[#403f33] bg-[#15140f] px-2 py-1 text-[#d5d0bf]">
          {content || '[system event]'}
        </div>
      )
  }
}

function formatChemistryValue(raw: string): string {
  const value = Number(raw)
  if (Number.isNaN(value)) {
    return raw || '0'
  }

  return value >= 0 ? `+${value}` : String(value)
}
