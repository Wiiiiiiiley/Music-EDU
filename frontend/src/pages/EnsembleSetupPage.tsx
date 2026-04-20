import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, Plus, Trash2 } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { useSocketStore } from '../stores/socketStore'
import { v4 as uuidv4 } from '../utils/uuid'

export default function EnsembleSetupPage() {
  const navigate = useNavigate()
  const { currentUser, setCurrentEnsemble } = useAppStore()
  const { connect, joinEnsemble } = useSocketStore()
  
  const [ensembleName, setEnsembleName] = useState('')
  const [members, setMembers] = useState<Array<{ id: string; name: string; section: string }>>([])
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberSection, setNewMemberSection] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleAddMember = () => {
    if (!newMemberName.trim()) return
    
    setMembers([...members, {
      id: uuidv4(),
      name: newMemberName.trim(),
      section: newMemberSection
    }])
    setNewMemberName('')
    setNewMemberSection('')
  }

  const handleRemoveMember = (id: string) => {
    setMembers(members.filter(m => m.id !== id))
  }

  const handleCreateEnsemble = async () => {
    if (!ensembleName.trim() || !currentUser) return
    
    setIsCreating(true)
    
    try {
      // 创建乐团
      const response = await fetch('/api/ensembles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: ensembleName.trim(),
          conductorId: currentUser.id
        })
      })
      
      if (!response.ok) throw new Error('创建乐团失败')
      
      const ensemble = await response.json()
      
      // 添加成员
      for (const member of members) {
        await fetch(`/api/ensembles/${ensemble.id}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: member.name,
            role: 'PLAYER',
            section: member.section,
            instrument: member.section
          })
        })
      }
      
      // 获取完整的乐团信息
      const fullEnsembleResponse = await fetch(`/api/ensembles/${ensemble.id}`)
      const fullEnsemble = await fullEnsembleResponse.json()
      
      setCurrentEnsemble(fullEnsemble)
      
      // 连接 Socket
      connect()
      
      // 加入乐团房间
      setTimeout(() => {
        joinEnsemble(ensemble.id, currentUser)
      }, 500)
      
      navigate('/conductor')
    } catch (error) {
      console.error('创建乐团失败:', error)
      alert('创建乐团失败，请重试')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-full flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 h-14 flex items-center">
        <button 
          onClick={() => navigate('/role-select')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          返回
        </button>
        <h1 className="ml-4 font-semibold text-gray-900">创建乐团</h1>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
        <div className="panel p-6 space-y-6">
          {/* 乐团名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              乐团名称 *
            </label>
            <input
              type="text"
              value={ensembleName}
              onChange={(e) => setEnsembleName(e.target.value)}
              placeholder="例如：阳光青少年交响乐团"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* 添加成员 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              添加成员
            </label>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="成员姓名"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <select
                value={newMemberSection}
                onChange={(e) => setNewMemberSection(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">选择声部</option>
                <option value="violin1">第一小提琴</option>
                <option value="violin2">第二小提琴</option>
                <option value="viola">中提琴</option>
                <option value="cello">大提琴</option>
                <option value="bass">低音提琴</option>
                <option value="flute">长笛</option>
                <option value="oboe">双簧管</option>
                <option value="clarinet">单簧管</option>
                <option value="bassoon">大管</option>
                <option value="horn">圆号</option>
                <option value="trumpet">小号</option>
                <option value="trombone">长号</option>
                <option value="tuba">大号</option>
                <option value="timpani">定音鼓</option>
                <option value="percussion">打击乐</option>
                <option value="piano">钢琴</option>
                <option value="harp">竖琴</option>
              </select>
              <button
                onClick={handleAddMember}
                disabled={!newMemberName.trim()}
                className="btn-primary px-3"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* 成员列表 */}
            <div className="space-y-2">
              {members.map((member) => (
                <div 
                  key={member.id}
                  className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{member.name}</span>
                    {member.section && (
                      <span className="text-sm text-gray-500">
                        ({getSectionName(member.section)})
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {members.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  还没有添加成员，可以在创建后再添加
                </p>
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={() => navigate('/role-select')}
              className="flex-1 btn-secondary"
            >
              取消
            </button>
            <button
              onClick={handleCreateEnsemble}
              disabled={!ensembleName.trim() || isCreating}
              className="flex-1 btn-conductor"
            >
              {isCreating ? '创建中...' : '创建乐团'}
            </button>
          </div>
        </div>
      </main>
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
