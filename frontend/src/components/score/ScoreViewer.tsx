import { useEffect, useRef, useState, useCallback } from 'react'
import type { Score } from '../../types'
import { useAppStore } from '../../stores/appStore'
import { useSocketStore } from '../../stores/socketStore'
import MarkLayer from './MarkLayer'
import PageNavigator from './PageNavigator'

interface ScoreViewerProps {
  score: Score
  activeTool: 'select' | 'pen' | 'highlight' | 'text'
  selectedSection?: string | null
  isConductor: boolean
}

export default function ScoreViewer({ 
  score, 
  activeTool, 
  selectedSection,
  isConductor 
}: ScoreViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { currentUser, currentPage, setCurrentPage, marks } = useAppStore()
  const { sendMark } = useSocketStore()
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawingPath, setDrawingPath] = useState<{x: number, y: number}[]>([])
  const [textInput, setTextInput] = useState<{x: number, y: number, value: string} | null>(null)

  // PDF 渲染模式
  const isPdf = score.fileType === 'pdf'

  // 处理绘图开始
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (activeTool === 'select' || !isConductor) return
    
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (activeTool === 'text') {
      setTextInput({ x, y, value: '' })
      return
    }

    setIsDrawing(true)
    setDrawingPath([{ x, y }])
  }, [activeTool, isConductor])

  // 处理绘图移动
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || activeTool !== 'pen') return

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setDrawingPath(prev => [...prev, { x, y }])
  }, [isDrawing, activeTool])

  // 处理绘图结束
  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !isConductor) return

    if (activeTool === 'pen' && drawingPath.length > 0) {
      // 发送绘图标记
      const mark = {
        scoreId: score.id,
        type: 'DRAWING' as const,
        data: JSON.stringify(drawingPath),
        x: drawingPath[0].x,
        y: drawingPath[0].y,
        page: currentPage,
        targetSection: selectedSection || undefined,
        creatorId: currentUser?.id || ''
      }
      
      sendMark(mark)
    } else if (activeTool === 'highlight') {
      // 处理高亮区域
      // TODO: 实现高亮区域选择
    }

    setIsDrawing(false)
    setDrawingPath([])
  }, [isDrawing, isConductor, activeTool, drawingPath, score.id, currentPage, selectedSection, sendMark])

  // 处理文本输入完成
  const handleTextSubmit = () => {
    if (!textInput?.value.trim() || !isConductor) return

    const mark = {
      scoreId: score.id,
      type: 'TEXT' as const,
      data: textInput.value,
      x: textInput.x,
      y: textInput.y,
      page: currentPage,
      targetSection: selectedSection || undefined,
      creatorId: currentUser?.id || ''
    }

    sendMark(mark)
    setTextInput(null)
  }

  // 渲染 MusicXML
  useEffect(() => {
    if (isPdf || !containerRef.current) return

    // 使用 VexFlow 渲染 MusicXML
    // 简化版本：显示占位符
    containerRef.current.innerHTML = `
      <div class="flex items-center justify-center h-full text-gray-500">
        <div class="text-center">
          <p class="mb-2">MusicXML 渲染</p>
          <p class="text-sm">${score.title}</p>
          <p class="text-xs text-gray-400 mt-2">小节数: ${score.measures?.length || 0}</p>
        </div>
      </div>
    `
  }, [score, isPdf, currentPage])

  return (
    <div className="h-full flex flex-col">
      {/* 乐谱显示区域 */}
      <div 
        ref={containerRef}
        className={`flex-1 overflow-auto bg-gray-200 p-4 relative ${
          activeTool !== 'select' && isConductor ? 'cursor-crosshair' : 'cursor-default'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {isPdf ? (
          // PDF 渲染 - 使用 iframe 或 canvas
          <div className="bg-white shadow-lg mx-auto max-w-4xl min-h-full">
            <div className="p-8 text-center">
              <h2 className="text-xl font-bold mb-4">{score.title}</h2>
              {score.composer && <p className="text-gray-600 mb-8">{score.composer}</p>}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12">
                <p className="text-gray-400">PDF 乐谱预览</p>
                <p className="text-sm text-gray-400 mt-2">第 {currentPage} 页</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* 标记层 */}
        <MarkLayer 
          marks={marks.filter(m => m.page === currentPage)}
          tempDrawingPath={isDrawing ? drawingPath : null}
        />

        {/* 文本输入框 */}
        {textInput && (
          <div 
            className="absolute bg-white shadow-lg rounded p-2 z-50"
            style={{ left: textInput.x, top: textInput.y }}
          >
            <input
              type="text"
              value={textInput.value}
              onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
              placeholder="输入批注..."
              className="border rounded px-2 py-1 text-sm"
              autoFocus
            />
            <div className="flex gap-1 mt-2">
              <button 
                onClick={handleTextSubmit}
                className="text-xs bg-primary-500 text-white px-2 py-1 rounded"
              >
                确定
              </button>
              <button 
                onClick={() => setTextInput(null)}
                className="text-xs bg-gray-200 px-2 py-1 rounded"
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 页面导航 */}
      <PageNavigator 
        currentPage={currentPage}
        totalPages={10} // 假设有10页
        onPageChange={setCurrentPage}
      />
    </div>
  )
}
