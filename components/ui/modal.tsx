import React from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'small' | 'medium' | 'large' | 'xlarge'
  className?: string
  zIndex?: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, size = 'medium', className, zIndex = 'z-50', children }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-4`}>
      {/* オーバーレイ */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* モーダルコンテンツ */}
      <div className={`relative bg-white rounded-lg shadow-xl w-full overflow-y-auto ${
        className || (
          size === 'small' ? 'max-w-md max-h-[85vh]' :
          size === 'large' ? 'max-w-5xl max-h-[85vh]' :
          size === 'xlarge' ? 'max-w-7xl max-h-[92vh]' :
          'max-w-4xl max-h-[85vh]'
        )
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
