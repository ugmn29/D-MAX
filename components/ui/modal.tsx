import React from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'small' | 'medium' | 'large'
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, size = 'medium', children }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* オーバーレイ */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* モーダルコンテンツ */}
      <div className={`relative bg-white rounded-lg shadow-xl w-full max-h-[85vh] overflow-y-auto ${
        size === 'small' ? 'max-w-md' : 
        size === 'large' ? 'max-w-5xl' : 
        'max-w-4xl'
      }`}>
        {/* ヘッダー */}
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        
        {/* コンテンツ */}
        <div className={title ? "p-6" : "p-0"}>
          {children}
        </div>
      </div>
    </div>
  )
}
