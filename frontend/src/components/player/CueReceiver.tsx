import { useEffect, useState } from 'react'
import { Volume2, Timer, Music } from 'lucide-react'
import { useSocketStore } from '../../stores/socketStore'

interface Cue {
  type: 'CLICK' | 'COUNT_IN' | 'METRONOME' | 'DEMO_AUDIO'
  fromConductor: boolean
  timestamp: number
  bpm?: number
}

export default function CueReceiver() {
  const { setupEventListeners } = useSocketStore()
  const [activeCue, setActiveCue] = useState<Cue | null>(null)

  useEffect(() => {
    setupEventListeners({
      onCueReceived: (cue: Cue) => {
        setActiveCue(cue)
        
        // 3秒后清除提示
        setTimeout(() => {
          setActiveCue(null)
        }, 3000)

        // 播放对应的提示音
        playCueSound(cue)
      }
    })
  }, [setupEventListeners])

  const playCueSound = (cue: Cue) => {
    // 这里可以实现实际的音频播放逻辑
    console.log('播放提示音:', cue.type)
  }

  if (!activeCue) return null

  const icons = {
    CLICK: Volume2,
    COUNT_IN: Timer,
    METRONOME: Timer,
    DEMO_AUDIO: Music
  }

  const labels = {
    CLICK: '开始演奏',
    COUNT_IN: '预备拍',
    METRONOME: '节拍器',
    DEMO_AUDIO: '示范音频'
  }

  const Icon = icons[activeCue.type]

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-primary-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
        <Icon className="w-5 h-5" />
        <span className="font-medium">{labels[activeCue.type]}</span>
        {activeCue.bpm && <span className="text-sm">({activeCue.bpm} BPM)</span>}
      </div>
    </div>
  )
}
