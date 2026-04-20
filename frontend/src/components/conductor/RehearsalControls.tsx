import { Play, Square, Pause } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { useSocketStore } from '../../stores/socketStore'

export default function RehearsalControls() {
  const { isRehearsing, startRehearsal, stopRehearsal, currentScore, currentEnsemble } = useAppStore()
  const { startRehearsal: emitStart, stopRehearsal: emitStop } = useSocketStore()

  const handleStart = () => {
    if (!currentScore || !currentEnsemble) return
    
    startRehearsal()
    emitStart({
      scoreId: currentScore.id,
      rehearsalId: 'temp-id' // TODO: 从API获取
    })
  }

  const handleStop = () => {
    stopRehearsal()
    emitStop()
  }

  return (
    <div className="p-4 border-t">
      <h3 className="font-semibold text-gray-900 mb-3">排练控制</h3>
      
      <div className="flex gap-2">
        {!isRehearsing ? (
          <button
            onClick={handleStart}
            disabled={!currentScore}
            className="flex-1 btn-conductor flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" />
            开始排练
          </button>
        ) : (
          <>
            <button
              onClick={handleStop}
              className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex items-center justify-center gap-2"
            >
              <Square className="w-4 h-4" />
              停止
            </button>
            <button className="btn-secondary p-2">
              <Pause className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {isRehearsing && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2 text-green-700">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">排练进行中</span>
          </div>
        </div>
      )}
    </div>
  )
}
