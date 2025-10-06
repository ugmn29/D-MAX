'use client'

import { useState, useRef, useEffect } from 'react'
import { TreatmentMenu } from '@/types/database'

interface HierarchicalMenuProps {
  level1Menus: TreatmentMenu[]
  level2Menus: TreatmentMenu[]
  level3Menus: TreatmentMenu[]
  selectedMenu1: TreatmentMenu | null
  selectedMenu2: TreatmentMenu | null
  selectedMenu3: TreatmentMenu | null
  onMenu1Select: (menu: TreatmentMenu) => void
  onMenu2Select: (menu: TreatmentMenu) => void
  onMenu3Select: (menu: TreatmentMenu) => void
}

export function HierarchicalMenu({
  level1Menus,
  level2Menus,
  level3Menus,
  selectedMenu1,
  selectedMenu2,
  selectedMenu3,
  onMenu1Select,
  onMenu2Select,
  onMenu3Select
}: HierarchicalMenuProps) {
  const [hoveredMenu1, setHoveredMenu1] = useState<string | null>(null)
  const [showSubMenu, setShowSubMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const subMenuRef = useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // ホバー時のサブメニュー表示
  const handleMenu1Hover = (menuId: string) => {
    // 既存のタイムアウトをクリア
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    
    setHoveredMenu1(menuId)
    setShowSubMenu(true)
  }

  const handleMenu1Leave = () => {
    // 少し遅延を設けてサブメニューが消えるのを防ぐ
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredMenu1(null)
      setShowSubMenu(false)
    }, 150)
  }

  const handleSubMenuEnter = () => {
    // タイムアウトをクリア
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    setShowSubMenu(true)
  }

  const handleSubMenuLeave = () => {
    setShowSubMenu(false)
    setHoveredMenu1(null)
  }

  // 診療メニュー2の直接選択
  const handleMenu2DirectSelect = (menu2: TreatmentMenu) => {
    // 親の診療メニュー1を自動選択
    const parentMenu1 = level1Menus.find(menu1 => menu1.id === menu2.parent_id)
    if (parentMenu1) {
      onMenu1Select(parentMenu1)
    }
    onMenu2Select(menu2)
    setShowSubMenu(false)
    setHoveredMenu1(null)
    
    // 選択完了後にモーダルを閉じる（少し遅延を設けて選択状態を確認できるように）
    setTimeout(() => {
      // モーダルを閉じる処理は親コンポーネントで行う
      // ここでは選択完了のシグナルを送る
    }, 300)
  }

  // 診療メニュー3の直接選択
  const handleMenu3DirectSelect = (menu3: TreatmentMenu) => {
    // 親の診療メニュー1と2を自動選択
    const parentMenu2 = level2Menus.find(menu2 => menu2.id === menu3.parent_id)
    if (parentMenu2) {
      const parentMenu1 = level1Menus.find(menu1 => menu1.id === parentMenu2.parent_id)
      if (parentMenu1) {
        onMenu1Select(parentMenu1)
      }
      onMenu2Select(parentMenu2)
    }
    onMenu3Select(menu3)
    setShowSubMenu(false)
    setHoveredMenu1(null)
    
    // 選択完了後にモーダルを閉じる（少し遅延を設けて選択状態を確認できるように）
    setTimeout(() => {
      // モーダルを閉じる処理は親コンポーネントで行う
      // ここでは選択完了のシグナルを送る
    }, 300)
  }

  // 現在選択されているメニューの表示
  const getDisplayText = () => {
    if (selectedMenu3) {
      return `${selectedMenu1?.name} > ${selectedMenu2?.name} > ${selectedMenu3.name}`
    }
    if (selectedMenu2) {
      return `${selectedMenu1?.name} > ${selectedMenu2.name}`
    }
    if (selectedMenu1) {
      return selectedMenu1.name
    }
    return '診療メニューを選択'
  }

  // ホバー中の診療メニュー2を取得
  const getHoveredMenu2Items = () => {
    if (!hoveredMenu1) return []
    return level2Menus.filter(menu => menu.parent_id === hoveredMenu1)
  }

  // 選択された診療メニュー2の診療メニュー3を取得
  const getSelectedMenu3Items = () => {
    if (!selectedMenu2) return []
    return level3Menus.filter(menu => menu.parent_id === selectedMenu2.id)
  }

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* 1段目: 診療メニュー1（横並び表示） */}
      <div className="space-y-3">
        <div className="text-sm font-medium text-gray-700">診療メニュー1</div>
        <div className="flex flex-wrap gap-3">
          {level1Menus.map(menu1 => {
            const subMenuCount = level2Menus.filter(m => m.parent_id === menu1.id).length
            const isSelected = selectedMenu1?.id === menu1.id
            const isHovered = hoveredMenu1 === menu1.id
            
            return (
              <div key={menu1.id} className="relative">
                <button
                  className={`
                    px-4 py-3 rounded-lg border-2 transition-all duration-200 min-w-[120px] text-left
                    ${isSelected 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : isHovered 
                        ? 'border-blue-300 bg-blue-25 text-blue-600' 
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                  onMouseEnter={() => handleMenu1Hover(menu1.id)}
                  onMouseLeave={handleMenu1Leave}
                  onClick={() => onMenu1Select(menu1)}
                >
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: menu1.color }}
                    />
                    <span className="text-sm font-medium">{menu1.name}</span>
                  </div>
                </button>

                {/* ホバー時のサブメニュー表示 */}
                {isHovered && showSubMenu && getHoveredMenu2Items().length > 0 && (
                  <div
                    ref={subMenuRef}
                    className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px] p-3"
                    onMouseEnter={handleSubMenuEnter}
                    onMouseLeave={handleSubMenuLeave}
                  >
                    <div className="text-xs text-gray-500 mb-2 font-medium">
                      {menu1.name} のサブメニュー
                    </div>
                    <div className="space-y-1">
                      {getHoveredMenu2Items().map(menu2 => (
                        <button
                          key={menu2.id}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 rounded text-sm transition-colors"
                          onClick={() => handleMenu2DirectSelect(menu2)}
                        >
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: menu2.color }}
                            />
                            <span>{menu2.name}</span>
                            {menu2.standard_duration && (
                              <span className="text-xs text-gray-500">
                                ({menu2.standard_duration}分)
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 2段目: 診療メニュー2（選択された診療メニュー1のサブメニュー） */}
      {selectedMenu1 && (
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-700">
            診療メニュー2 - {selectedMenu1.name}
          </div>
          <div className="flex flex-wrap gap-3">
            {level2Menus
              .filter(menu => menu.parent_id === selectedMenu1.id)
              .map(menu2 => {
                const isSelected = selectedMenu2?.id === menu2.id
                return (
                  <button
                    key={menu2.id}
                    className={`
                      px-4 py-3 rounded-lg border-2 transition-all duration-200 min-w-[120px] text-left
                      ${isSelected 
                        ? 'border-green-500 bg-green-50 text-green-700' 
                        : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-25'
                      }
                    `}
                    onClick={() => onMenu2Select(menu2)}
                  >
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: menu2.color }}
                      />
                      <span className="text-sm font-medium">{menu2.name}</span>
                      {menu2.standard_duration && (
                        <span className="text-xs text-gray-500">
                          ({menu2.standard_duration}分)
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
          </div>
        </div>
      )}

      {/* 3段目: 診療メニュー3（選択された診療メニュー2のサブメニュー） */}
      {selectedMenu2 && getSelectedMenu3Items().length > 0 && (
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-700">
            診療メニュー3 - {selectedMenu2.name}
          </div>
          <div className="flex flex-wrap gap-3">
            {getSelectedMenu3Items().map(menu3 => {
              const isSelected = selectedMenu3?.id === menu3.id
              return (
                <button
                  key={menu3.id}
                  className={`
                    px-4 py-3 rounded-lg border-2 transition-all duration-200 min-w-[120px] text-left
                    ${isSelected 
                      ? 'border-orange-500 bg-orange-50 text-orange-700' 
                      : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-25'
                    }
                  `}
                  onClick={() => onMenu3Select(menu3)}
                >
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: menu3.color }}
                    />
                    <span className="text-sm font-medium">{menu3.name}</span>
                    {menu3.standard_duration && (
                      <span className="text-xs text-gray-500">
                        ({menu3.standard_duration}分)
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 選択状況の表示 */}
      {(selectedMenu1 || selectedMenu2 || selectedMenu3) && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium text-gray-700 mb-2">選択状況</div>
          <div className="text-sm text-gray-600">
            {getDisplayText()}
          </div>
        </div>
      )}
    </div>
  )
}
