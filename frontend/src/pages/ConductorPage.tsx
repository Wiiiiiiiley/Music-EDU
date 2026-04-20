import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Music, Plus, LogOut, Mic } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { useSocketStore } from '../stores/socketStore'
import ScoreViewer from '../components/score/ScoreViewer'
import AnnotationTools from '../components/conductor/AnnotationTools'
import CuePanel from '../components/conductor/CuePanel'
import MemberList from '../components/conductor/MemberList'
import RehearsalControls from '../components/conductor/RehearsalControls'

export default function ConductorPage() {
  const navigate = useNavigate()
  const { currentUser, currentEnsemble, currentScore, addMark, clearState } = useAppStore()
  const { connect, joinEnsemble, setupEventListeners, isConnected } = useSocketStore()
  const [showMemberList, setShowMemberList] = useState(false)
  const [activeTool, setActiveTool] = useState<'select' | 'pen' | 'highlight' | 'text'>('select')
  const [selectedSection, setSelectedSection] = useState<string | null>(null)

  // 连接 Socket 并加入乐团
  useEffect(() => {
    if (!currentUser || !currentEnsemble) {
      navigate('/role-select')
      return
    }

    connect()
    
    const timer = setTimeout(() => {
      if (currentEnsemble) {
        joinEnsemble(currentEnsemble.id, currentUser)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [currentUser, currentEnsemble, connect, joinEnsemble, navigate])

  // 设置事件监听
  useEffect(() => {
    if (!isConnected) return

    setupEventListeners({
      onMarkAdded: (mark) => {
        addMark(mark)
      },
      onMemberJoined: (member) => {
        console.log('成员加入:', member)
      },
      onMemberLeft: (data) => {
        console.log('成员离开:', data)
      }
    })
  }, [isConnected, setupEventListeners, addMark])

  const handleLogout = () => {
    clearState()
    navigate('/')
  }

  if (!currentUser || !currentEnsemble) {
    return null
  }

  return (
    <div className="h-full flex flex-col bg-gray-100">
      {/* 顶部工具栏 */}
      <header className="bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="font-bold text-gray-900">{currentEnsemble.name}</h1>
          <span className="text-sm text-gray-500">指挥: {currentUser.name}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowMemberList(!showMemberList)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            title="成员列表"
          >
            <Users className="w-5 h-5" />
          </button>
          <button 
            onClick={() => navigate('/upload')}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            title="上传乐谱"
          >
            <Plus className="w-5 h-5" />
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
        {/* 左侧工具栏 */}
        <aside className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-2 flex-shrink-0">
          <AnnotationTools 
            activeTool={activeTool} 
            onToolChange={setActiveTool}
          />
        </aside>

        {/* 中间乐谱区 */}
        <main className="flex-1 overflow-hidden relative">
          {currentScore ? (
            <ScoreViewer 
              score={currentScore}
              activeTool={activeTool}
              selectedSection={selectedSection}
              isConductor={true}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Music className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">还没有选择乐谱</p>
                <button 
                  onClick={() => navigate('/upload')}
                  className="btn-primary"
                >
                  上传乐谱
                </button>
              </div>
            </div>
          )}
        </main>

        {/* 右侧面板 */}
        <aside className="w-80 bg-white border-l border-gray-200 flex flex-col flex-shrink-0">
          {showMemberList ? (
            <MemberList 
              ensembleId={currentEnsemble.id}
              onSelectSection={setSelectedSection}
              selectedSection={selectedSection}
            />
          ) : (
            <>
              <CuePanel 
                selectedSection={selectedSection}
                currentScore={currentScore}
              />
              <RehearsalControls />
            </>
          )}
        </aside>
      </div>

      {/* 底部状态栏 */}
      <footer className="bg-white border-t border-gray-200 px-4 h-10 flex items-center justify-between text-sm flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className={`flex items-center gap-1 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            {isConnected ? '已连接' : '未连接'}
          </span>
          <span className="text-gray-500">当前页: 1</span>
        </div>
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-gray-400" />
          <span className="text-gray-500">音频就绪</span>
        </div>
      </footer>
    </div>
  )
}
