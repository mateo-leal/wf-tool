import type { Metadata } from 'next'
import { SystemChatLine } from '@/components/system-chat-line'
import { Button } from '@/components/ui/button'
import { Window } from '@/components/ui/window'
import { WindowContent } from '@/components/ui/window-content'
import { WindowTitlebar } from '@/components/ui/window-titlebar'
import { Type } from '@/lib/types'

export const metadata: Metadata = {
  title: 'UI Test Page',
  robots: {
    index: false,
    follow: false,
  },
}

export default function Page() {
  return (
    <Window>
      <WindowTitlebar>Test</WindowTitlebar>
      <WindowContent className="gap-4">
        <div className="flex flex-col gap-2">
          <p>Buttons</p>
          <Button>Default</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button size="lg">Large</Button>
          <Button size="sm">Small</Button>
        </div>
        <div className="flex flex-col gap-2">
          <p>System Chat Lines</p>
          <SystemChatLine
            line={{
              type: Type.ChemistryDialogueNode,
              content: '10',
              user: 'system',
            }}
          />
          <SystemChatLine
            line={{
              type: Type.SetBooleanDialogueNode,
              content: 'MarieDrifter',
              user: 'system',
            }}
          />
          <SystemChatLine
            line={{
              type: Type.ResetBooleanDialogueNode,
              content: 'MarieDrifter',
              user: 'system',
            }}
          />
          <SystemChatLine
            line={{
              type: Type.IncCounterDialogueNode,
              content: 'Thermostat +1',
              user: 'system',
            }}
          />
          <SystemChatLine
            line={{
              type: Type.CheckBooleanDialogueNode,
              content: 'MarieDrifter',
              user: 'system',
            }}
          />
          <SystemChatLine
            line={{
              type: Type.CheckMultiBooleanDialogueNode,
              content: 'MarieDrifter',
              user: 'system',
            }}
          />
          <SystemChatLine
            line={{
              type: Type.CheckCounterDialogueNode,
              content: 'Thermostat >= 5',
              user: 'system',
            }}
          />
          <SystemChatLine
            line={{
              type: Type.StartDialogueNode,
              content: 'This is a start node',
              user: 'system',
            }}
          />
        </div>
      </WindowContent>
    </Window>
  )
}
