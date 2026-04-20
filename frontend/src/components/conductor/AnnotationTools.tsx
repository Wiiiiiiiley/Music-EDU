import { MousePointer2, Pen, Highlighter, Type } from 'lucide-react'

interface AnnotationToolsProps {
  activeTool: 'select' | 'pen' | 'highlight' | 'text'
  onToolChange: (tool: 'select' | 'pen' | 'highlight' | 'text') => void
}

export default function AnnotationTools({ activeTool, onToolChange }: AnnotationToolsProps) {
  const tools = [
    { id: 'select' as const, icon: MousePointer2, label: '选择' },
    { id: 'pen' as const, icon: Pen, label: '画笔' },
    { id: 'highlight' as const, icon: Highlighter, label: '高亮' },
    { id: 'text' as const, icon: Type, label: '文字' },
  ]

  return (
    <div className="flex flex-col gap-1">
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => onToolChange(tool.id)}
          className={`p-2 rounded-lg transition-colors ${
            activeTool === tool.id
              ? 'bg-primary-100 text-primary-600'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
          title={tool.label}
        >
          <tool.icon className="w-5 h-5" />
        </button>
      ))}
    </div>
  )
}
