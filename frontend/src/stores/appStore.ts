import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Ensemble, Score, Mark, CursorPosition } from '../types'

interface AppState {
  // 当前用户
  currentUser: User | null
  setCurrentUser: (user: User | null) => void
  
  // 当前乐团
  currentEnsemble: Ensemble | null
  setCurrentEnsemble: (ensemble: Ensemble | null) => void
  
  // 当前乐谱
  currentScore: Score | null
  setCurrentScore: (score: Score | null) => void
  
  // 当前页码
  currentPage: number
  setCurrentPage: (page: number) => void
  
  // 当前小节
  currentMeasure: number
  setCurrentMeasure: (measure: number) => void
  
  // 标记列表
  marks: Mark[]
  addMark: (mark: Mark) => void
  removeMark: (markId: string) => void
  setMarks: (marks: Mark[]) => void
  
  // 在线成员光标位置
  cursorPositions: Record<string, CursorPosition>
  updateCursorPosition: (position: CursorPosition) => void
  removeCursorPosition: (memberId: string) => void
  
  // 排练状态
  isRehearsing: boolean
  rehearsalStartTime: Date | null
  startRehearsal: () => void
  stopRehearsal: () => void
  
  // 音频设置
  masterVolume: number
  setMasterVolume: (volume: number) => void
  sectionVolumes: Record<string, number>
  setSectionVolume: (section: string, volume: number) => void
  
  // 清除所有状态
  clearState: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 用户
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),
      
      // 乐团
      currentEnsemble: null,
      setCurrentEnsemble: (ensemble) => set({ currentEnsemble: ensemble }),
      
      // 乐谱
      currentScore: null,
      setCurrentScore: (score) => set({ currentScore: score }),
      
      // 页面
      currentPage: 1,
      setCurrentPage: (page) => set({ currentPage: page }),
      
      // 小节
      currentMeasure: 1,
      setCurrentMeasure: (measure) => set({ currentMeasure: measure }),
      
      // 标记
      marks: [],
      addMark: (mark) => set((state) => ({ marks: [...state.marks, mark] })),
      removeMark: (markId) => set((state) => ({ 
        marks: state.marks.filter(m => m.id !== markId) 
      })),
      setMarks: (marks) => set({ marks }),
      
      // 光标位置
      cursorPositions: {},
      updateCursorPosition: (position) => set((state) => ({
        cursorPositions: {
          ...state.cursorPositions,
          [position.memberId]: position
        }
      })),
      removeCursorPosition: (memberId) => set((state) => {
        const newPositions = { ...state.cursorPositions }
        delete newPositions[memberId]
        return { cursorPositions: newPositions }
      }),
      
      // 排练状态
      isRehearsing: false,
      rehearsalStartTime: null,
      startRehearsal: () => set({ 
        isRehearsing: true, 
        rehearsalStartTime: new Date() 
      }),
      stopRehearsal: () => set({ 
        isRehearsing: false, 
        rehearsalStartTime: null 
      }),
      
      // 音频设置
      masterVolume: 1,
      setMasterVolume: (volume) => set({ masterVolume: volume }),
      sectionVolumes: {},
      setSectionVolume: (section, volume) => set((state) => ({
        sectionVolumes: {
          ...state.sectionVolumes,
          [section]: volume
        }
      })),
      
      // 清除
      clearState: () => set({
        currentUser: null,
        currentEnsemble: null,
        currentScore: null,
        currentPage: 1,
        currentMeasure: 1,
        marks: [],
        cursorPositions: {},
        isRehearsing: false,
        rehearsalStartTime: null,
      })
    }),
    {
      name: 'edutempo-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        currentEnsemble: state.currentEnsemble,
        currentScore: state.currentScore,
        masterVolume: state.masterVolume,
        sectionVolumes: state.sectionVolumes,
      })
    }
  )
)
