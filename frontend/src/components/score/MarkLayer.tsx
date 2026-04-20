import type { Mark } from '../../types'

interface MarkLayerProps {
  marks: Mark[]
  tempDrawingPath: { x: number; y: number }[] | null
}

export default function MarkLayer({ marks, tempDrawingPath }: MarkLayerProps) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* 已保存的标记 */}
      {marks.map((mark) => (
        <MarkItem key={mark.id} mark={mark} />
      ))}

      {/* 临时绘图路径 */}
      {tempDrawingPath && tempDrawingPath.length > 1 && (
        <svg className="absolute inset-0 w-full h-full">
          <path
            d={`M ${tempDrawingPath.map(p => `${p.x},${p.y}`).join(' L ')}`}
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  )
}

function MarkItem({ mark }: { mark: Mark }) {
  switch (mark.type) {
    case 'DRAWING':
      return <DrawingMark mark={mark} />
    case 'TEXT':
      return <TextMark mark={mark} />
    case 'HIGHLIGHT':
      return <HighlightMark mark={mark} />
    default:
      return null
  }
}

function DrawingMark({ mark }: { mark: Mark }) {
  try {
    const data = JSON.parse(mark.data)
    const path = data.path as { x: number; y: number }[]
    
    if (!path || path.length < 2) return null

    return (
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 10 }}
      >
        <path
          d={`M ${path.map(p => `${p.x},${p.y}`).join(' L ')}`}
          fill="none"
          stroke="#ef4444"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  } catch {
    return null
  }
}

function TextMark({ mark }: { mark: Mark }) {
  return (
    <div
      className="absolute bg-yellow-100 border border-yellow-300 px-2 py-1 rounded text-sm shadow-sm"
      style={{ 
        left: mark.x, 
        top: mark.y,
        maxWidth: '200px',
        zIndex: 20
      }}
    >
      {mark.data}
      {mark.targetSection && (
        <span className="block text-xs text-gray-500 mt-1">
          目标: {mark.targetSection}
        </span>
      )}
    </div>
  )
}

function HighlightMark({ mark }: { mark: Mark }) {
  return (
    <div
      className="absolute bg-yellow-300/50 rounded pointer-events-none"
      style={{
        left: mark.x,
        top: mark.y,
        width: mark.width || 100,
        height: mark.height || 30,
        zIndex: 5
      }}
    />
  )
}
