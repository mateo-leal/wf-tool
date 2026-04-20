'use client'

import { NodeType } from '@tenno-companion/kim/constants'
import type { Node } from '@tenno-companion/kim/types'

export function SystemChatLine({ node }: { node: Node }) {
  switch (node.type) {
    case NodeType.Chemistry:
      return (
        <div className="rounded border border-[#5a3b13] bg-[#211103] px-2 py-1 text-[#f0bb5f]">
          <strong>Chemistry</strong>:{' '}
          {formatChemistryValue(node.ChemistryDelta)}
        </div>
      )
    case NodeType.SetBoolean:
      return (
        <div className="rounded border border-[#3a5a2f] bg-[#0f1c0f] px-2 py-1 text-[#c6e0bc]">
          <strong>Boolean set</strong>: {node.Content} = true
        </div>
      )
    case NodeType.ResetBoolean:
      return (
        <div className="rounded border border-[#5a2f2f] bg-[#1f0f0f] px-2 py-1 text-[#f1c3c3]">
          <strong>Boolean reset</strong>: {node.Content} = false
        </div>
      )
    case NodeType.IncCounter:
      return (
        <div className="rounded border border-[#3f3d1c] bg-[#181608] px-2 py-1 text-[#e6de9f]">
          <strong>Counter update</strong>: {node.Content}
        </div>
      )
    case NodeType.CheckBoolean:
    case NodeType.CheckBooleanScript:
      return (
        <div className="rounded border border-[#2d3d5a] bg-[#0d1422] px-2 py-1 text-[#b8cbe9]">
          <strong>Boolean check</strong>: {node.Content}
        </div>
      )
    case NodeType.CheckMultiBoolean: {
      const booleans = node.Outputs.map(
        (output) => `[${output.Expression}]`
      ).join(', ')
      return (
        <div className="rounded border border-[#2d3d5a] bg-[#0d1422] px-2 py-1 text-[#b8cbe9]">
          <strong>Multi-boolean check</strong>: {booleans}
        </div>
      )
    }
    case NodeType.CheckCounter:
      return (
        <div className="rounded border border-[#2d3d5a] bg-[#0d1422] px-2 py-1 text-[#b8cbe9]">
          <strong>Counter check</strong>: {node.Content}
        </div>
      )
    case NodeType.Start:
      return (
        <div className="rounded border border-[#403f33] bg-[#15140f] px-2 py-1 text-[#d5d0bf]">
          {node.Content}
        </div>
      )
    case NodeType.End:
    case NodeType.SpecialCompletion:
      return (
        <div className="rounded border border-[#403f33] bg-[#15140f] px-2 py-1 text-[#d5d0bf]">
          {node.Content ?? 'End'}
        </div>
      )
  }
}

function formatChemistryValue(value: number): string {
  return value >= 0 ? `+${value}` : String(value)
}
