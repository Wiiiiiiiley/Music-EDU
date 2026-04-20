import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Headphones, Volume2, LogOut } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { useSocketStore } from '../stores/socketStore'
import ScoreViewer from '../components/score/ScoreViewer'
import AudioMixer from '../components/player/AudioMixer'
import CueReceiver from '../components/player/CueReceiver'

export default function PlayerPage() {
  const navigate = useNavigate()
  const { ensembleId } = useParams()
  const { currentUser, currentEnsemble, currentScore, clearState, setCurrentEnsemble, setCurrentScore } = useAppStore()
  const { connect, joinEnsemble, joinAudioRoom, setupEventListeners, isConnected } = useSocketStore()
  const [showAudioMixer, setShowAudioMixer] = useState(false)
  const [joined, setJoined] = useState(false)

  // 连接 Socket
  useEffect(() => {
    if (!currentUser) {
      navigate('/role-select')
      return
    }

    connect()
  }, [currentUser, connect, navigate])

  // 加入乐团和音频房间
  useEffect(() => {
    if (!isConnected || !currentUser) return

    const targetEnsembleId = ensembleId || currentEnsemble?.id
    if (!targetEnsembleId) {
      // 显示加入界面
      return
    }

    joinEnsemble(targetEnsembleId, currentUser)
    joinAudioRoom(targetEnsembleId, currentUser)
    setJoined(true)

    // 获取乐团信息
    fetch(`/api/ensembles/${targetEnsembleId}`)
      .then(res => res.json())
      .then(data => {
        setCurrentEnsemble(data)
        if (data.scores?.[0]) {
          setCurrentScore(data.scores[0])
        }
      })
  }, [isConnected, currentUser, ensembleId, currentEnsemble?.id, joinEnsemble, joinAudioRoom, setCurrentEnsemble, setCurrentScore])

  // 设置事件监听
  useEffect(() => {
    if (!isConnected) return

    setupEventListeners({
      onCueReceived: (cue) => {
        console.log('收到提示:', cue)
        // 播放提示音或显示视觉提示
      },
      onMarkAdded: (mark) => {
        console.log('收到标记:', mark)
      },
      onRehearsalStarted: () => {
        console.log('排练开始')
      },
      onRehearsalStopped: () => {
        console.log('排练结束')
      }
    })
  }, [isConnected, setupEventListeners])

  const handleLogout = () => {
    clearState()
    navigate('/')
  }

  // 加入乐团界面
  if (!joined && !ensembleId) {
    return <JoinEnsembleView onJoin={(id) => navigate(`/player/${id}`)} />
  }

  if (!currentUser) {
    return null
  }

  return (
    <div className="h-full flex flex-col bg-gray-100">
      {/* 顶部工具栏 */}
      <header className="bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="font-bold text-gray-900">{currentEnsemble?.name || '乐团排练'}</h1>
          <span className="text-sm text-gray-500">{currentUser.name}</span>
          {currentUser.section && (
            <span className="text-sm px-2 py-0.5 bg-primary-100 text-primary-700 rounded">
              {getSectionName(currentUser.section)}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowAudioMixer(!showAudioMixer)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            title="音频设置"
          >
            <Headphones className="w-5 h-5" />
          </button>
          <button 
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-gray-100 text-red-500"
            title="退出"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 乐谱区 */}
        <main className="flex-1 overflow-hidden relative">
          {currentScore ? (
            <ScoreViewer 
              score={currentScore}
              activeTool="select"
              isConductor={false}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Volume2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">等待指挥选择乐谱...</p>
              </div>
            </div>
          )}
        </main>

        {/* 右侧面板 */}
        {showAudioMixer && (
          <aside className="w-72 bg-white border-l border-gray-200 flex-shrink-0">
            <AudioMixer />
          </aside>
        )}
      </div>

      {/* 提示接收器 */}
      <CueReceiver />

      {/* 底部状态栏 */}
      <footer className="bg-white border-t border-gray-200 px-4 h-10 flex items-center justify-between text-sm flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className={`flex items-center gap-1 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            {isConnected ? '已连接' : '未连接'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Headphones className="w-4 h-4 text-gray-400" />
          <span className="text-gray-500">佩戴耳机以获得最佳体验</span>
        </div>
      </footer>
    </div>
  )
}

// 加入乐团界面
function JoinEnsembleView({ onJoin }: { onJoin: (id: string) => void }) {
  const [ensembleId, setEnsembleId] = useState('')
  const [isJoining, setIsJoining] = useState(false)

  const handleJoin = async () => {
    if (!ensembleId.trim()) return
    
    setIsJoining(true)
    
    try {
      const response = await fetch(`/api/ensembles/${ensembleId.trim()}`)
      if (response.ok) {
        onJoin(ensembleId.trim())
      } else {
        alert('乐团不存在，请检查ID')
      }
    } catch (error) {
      alert('加入失败，请重试')
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center p-4 bg-gray-50">
      <div className="panel p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">加入乐团</h1>
          <p className="text-gray-600">输入乐团ID加入排练</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              乐团ID
            </label>
            <input
              type="text"
              value={ensembleId}
              onChange={(e) => setEnsembleId(e.target.value)}
              placeholder="请输入乐团ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <button
            onClick={handleJoin}
            disabled={!ensembleId.trim() || isJoining}
            className="w-full btn-primary"
          >
            {isJoining ? '加入中...' : '加入乐团'}
          </button>
        </div>

        <div className="mt-6 pt-6 border-t text-center">
          <p className="text-sm text-gray-500">
            不知道乐团ID？请联系指挥获取
          </p>
        </div>
      </div>
    </div>
  )
}

function getSectionName(section: string): string {
  const sectionMap: Record<string, string> = {
    violin1: '第一小提琴',
    violin2: '第二小提琴',
    viola: '中提琴',
    cello: '大提琴',
    bass: '低音提琴',
    flute: '长笛',
    oboe: '双簧管',
    clarinet: '单簧管',
    bassoon: '大管',
    horn: '圆号',
    trumpet: '小号',
    trombone: '长号',
    tuba: '大号',
    timpani: '定音鼓',
    percussion: '打击乐',
    piano: '钢琴',
    harp: '竖琴',
  }
  return sectionMap[section] || section
}
