import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PageNavigatorProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function PageNavigator({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: PageNavigatorProps) {
  return (
    <div className="bg-white border-t border-gray-200 px-4 h-12 flex items-center justify-between flex-shrink-0">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage <= 1}
        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">
          第 <span className="font-medium text-gray-900">{currentPage}</span> / {totalPages} 页
        </span>
      </div>

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage >= totalPages}
        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  )
}
