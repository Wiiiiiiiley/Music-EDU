import { useState } from 'react'
import { Volume2, Timer, Music, Play, Users } from 'lucide-react'
import { useSocketStore } from '../../stores/socketStore'
import type { Score } from '../../types'

interface CuePanelProps {
  selectedSection?: string | null
  currentScore: Score | null
}

export default function CuePanel({ selectedSection, currentScore }: CuePanelProps) {
  const { sendCue } = useSocketStore()
  const [bpm, setBpm] = useState(120)
  const [countIn, setCountIn] = useState(4)

  const handleSendCue = (type: 'CLICK' | 'COUNT_IN' | 'METRONOME' | 'DEMO_AUDIO') => {
    sendCue({
      type,
      targetSection: selectedSection || undefined,
      bpm,
      measureNumber: 1
    })
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Users className="w-4 h-4" />
        <span>
          {selectedSection ? `发送给: ${selectedSection}` : '发送给: 全体成员'}
        </span>
      </div>

      {/* BPM 设置 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">节拍器速度 (BPM)</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="40"
            max="200"
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm font-medium w-12">{bpm}</span>
        </div>
      </div>

      {/* 提示按钮 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">发送提示</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleSendCue('COUNT_IN')}
            className="flex items-center gap-2 p-3 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-700"
          >
            <Timer className="w-4 h-4" />
            <span className="text-sm">预备拍</span>
          </button>
          <button
            onClick={() => handleSendCue('METRONOME')}
            className="flex items-center gap-2 p-3 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-700"
          >
            <Volume2 className="w-4 h-4" />
            <span className="text-sm">节拍器</span>
          </button>
          <button
            onClick={() => handleSendCue('DEMO_AUDIO')}
            disabled={!currentScore?.audioUrl}
            className="flex items-center gap-2 p-3 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-700 disabled:opacity-50"
          >
            <Music className="w-4 h-4" />
            <span className="text-sm">示范音频</span>
          </button>
          <button
            onClick={() => handleSendCue('CLICK')}
            className="flex items-center gap-2 p-3 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-700"
          >
            <Play className="w-4 h-4" />
            <span className="text-sm">开始</span>
          </button>
        </div>
      </div>
    </div>
  )
}
