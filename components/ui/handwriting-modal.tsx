'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Save, Trash2, Type, Pen, Eraser, Highlighter, User } from 'lucide-react';
import { Button } from './button';
import { getStaff } from '@/lib/api/staff';

interface HandwritingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: string, type: 'handwriting' | 'text') => void;
  initialContent?: string;
  initialType?: 'handwriting' | 'text';
  editingEntryId?: string;
}

export function HandwritingModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialContent = '', 
  initialType = 'handwriting',
  editingEntryId
}: HandwritingModalProps) {
  const [activeTool, setActiveTool] = useState<'pen' | 'marker' | 'eraser' | 'text'>('pen');
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [penSize, setPenSize] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [hasDrawing, setHasDrawing] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffList, setStaffList] = useState<Array<{id: string, name: string, position?: {id: string, name: string, sort_order: number}}>>([]);
  const [textInputPosition, setTextInputPosition] = useState<{x: number, y: number} | null>(null);
  const [tempTextInput, setTempTextInput] = useState('');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const colors = [
    { name: '黒', value: '#000000' },
    { name: '赤', value: '#ff0000' },
    { name: '青', value: '#0000ff' },
    { name: '緑', value: '#008000' },
    { name: '黄', value: '#ffff00' }
  ];

  const penSizes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  useEffect(() => {
    if (isOpen) {
      setActiveTool('pen');
      
      // 編集時の初期化
      if (editingEntryId) {
        console.log('編集モードで手書きモーダルを開く:', editingEntryId, initialContent, initialType);
      }
      
      // 背景キャンバスに点線を描画（少し遅延させて確実に描画）
      setTimeout(() => {
        if (backgroundCanvasRef.current) {
          const backgroundCanvas = backgroundCanvasRef.current;
          const backgroundCtx = backgroundCanvas.getContext('2d');
          if (backgroundCtx) {
            // 背景を白に設定
            backgroundCtx.fillStyle = '#ffffff';
            backgroundCtx.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
            drawGuidelines(backgroundCtx, backgroundCanvas.width, backgroundCanvas.height);
          }
        }
      }, 100);
      
      // 手書きキャンバスをクリア（少し遅延させて確実に描画）
      setTimeout(() => {
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // 手書きキャンバスは透明のまま（背景キャンバスの点線が見えるように）
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
          // 初期コンテンツがある場合は描画
          if (initialContent && initialType === 'handwriting') {
            const img = new Image();
            img.onload = () => {
              // キャンバスをクリアしてから画像を描画
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0);
              setHasDrawing(true);
            };
            img.onerror = (error) => {
              console.error('手書き画像の読み込みに失敗しました:', error);
            };
            img.src = initialContent;
          }
          }
        }
      }, 100);
      
      // テキストコンテンツの初期化
      if (initialType === 'text' && initialContent) {
        setTextContent(initialContent);
      } else if (initialType === 'mixed' && initialContent) {
        try {
          const mixedData = JSON.parse(initialContent);
          console.log('ミックス形式のコンテンツを読み込み:', mixedData);
          if (mixedData.text) {
            setTextContent(mixedData.text);
          }
          if (mixedData.handwriting) {
            const img = new Image();
            img.onload = () => {
              if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                  // キャンバスをクリアしてから画像を描画
                  ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                  ctx.drawImage(img, 0, 0);
                  setHasDrawing(true);
                }
              }
            };
            img.onerror = (error) => {
              console.error('画像の読み込みに失敗しました:', error);
            };
            img.src = mixedData.handwriting;
          }
        } catch (error) {
          console.error('ミックス形式のコンテンツの解析に失敗しました:', error);
        }
      }
    }
  }, [isOpen, initialContent, initialType]);

  // スタッフデータの取得
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const staffData = await getStaff('11111111-1111-1111-1111-111111111111');
        setStaffList(staffData);
      } catch (error) {
        console.error('スタッフデータの取得に失敗しました:', error);
      }
    };
    
    if (isOpen) {
      fetchStaff();
    }
  }, [isOpen]);

  const drawGuidelines = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.globalCompositeOperation = 'source-over'; // 点線は常に上書き
    
    const lineHeight = 40;
    for (let y = lineHeight; y < height; y += lineHeight) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    ctx.restore();
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === 'pen' || activeTool === 'marker' || activeTool === 'eraser') {
      setIsDrawing(true);
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.beginPath();
          ctx.moveTo(x, y);
        }
      }
    } else if (activeTool === 'text') {
      // テキストツールが選択されている場合、クリック位置にテキスト入力エリアを表示
      console.log('テキストツールでクリック検知');
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        console.log('テキスト入力位置:', { x, y });
        setTextInputPosition({ x, y });
        setTempTextInput('');
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (activeTool === 'pen' || activeTool === 'marker') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = selectedColor;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // マーカーの場合は半透明で描画、太さも調整
        if (activeTool === 'marker') {
          ctx.globalAlpha = 0.3;
          ctx.lineWidth = penSize * 3; // マーカーは3倍の太さ
        } else {
          ctx.globalAlpha = 1.0;
          ctx.lineWidth = penSize;
        }
        
        setHasDrawing(true);
      } else if (activeTool === 'eraser') {
        // 消しゴムは手書き内容のみを削除（点線は保護）
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = penSize * 2;
        setHasDrawing(true);
      }
      
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };


  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // 手書きキャンバスを透明にクリア（背景キャンバスの点線が見えるように）
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawing(false); // 描画状態をリセット
      }
    }
  };

  const getCanvasBounds = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return { x: 0, y: 0, width: canvas.width, height: canvas.height };
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let minX = canvas.width;
    let minY = canvas.height;
    let maxX = 0;
    let maxY = 0;
    
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const index = (y * canvas.width + x) * 4;
        const alpha = data[index + 3];
        const red = data[index];
        const green = data[index + 1];
        const blue = data[index + 2];
        
        // 点線の色（#e5e7eb）を除外
        const isGuideline = red === 229 && green === 231 && blue === 235;
        
        if (alpha > 0 && !isGuideline) { // 透明でないピクセルかつ点線でない
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
    
    // 描画がない場合は元のキャンバスサイズを返す
    if (minX === canvas.width || minY === canvas.height) {
      return { x: 0, y: 0, width: canvas.width, height: canvas.height };
    }
    
    // マージンを追加
    const margin = 20;
    return {
      x: Math.max(0, minX - margin),
      y: Math.max(0, minY - margin),
      width: Math.min(canvas.width, maxX - minX + margin * 2),
      height: Math.min(canvas.height, maxY - minY + margin * 2)
    };
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    let handwritingData = '';
    let textData = textContent.trim();
    
    // 手書きデータの処理
    if (canvas && hasDrawing) {
      const bounds = getCanvasBounds(canvas);
      
      // 描画範囲が検出された場合のみトリミング
      if (bounds.width > 0 && bounds.height > 0 && bounds.width < canvas.width && bounds.height < canvas.height) {
        const trimmedCanvas = document.createElement('canvas');
        const trimmedCtx = trimmedCanvas.getContext('2d');
        
        if (trimmedCtx) {
          trimmedCanvas.width = bounds.width;
          trimmedCanvas.height = bounds.height;
          trimmedCtx.drawImage(
            canvas,
            bounds.x, bounds.y, bounds.width, bounds.height,
            0, 0, bounds.width, bounds.height
          );
          handwritingData = trimmedCanvas.toDataURL('image/png');
        }
      } else {
        // 描画範囲が検出されない場合は元のキャンバスをそのまま使用
        handwritingData = canvas.toDataURL('image/png');
      }
    }
    
    console.log('手書きモーダル保存:', { textData, handwritingData, editingEntryId, selectedStaff, getSelectedStaffNames: getSelectedStaffNames() });
    
    // テキストと手書きの両方がある場合はミックス形式で保存
    if (handwritingData && textData) {
      const mixedContent = JSON.stringify({
        type: 'mixed',
        text: textData,
        handwriting: handwritingData
      });
      onSave(mixedContent, 'mixed', getSelectedStaffNames());
    } else if (handwritingData) {
      onSave(handwritingData, 'handwriting', getSelectedStaffNames());
    } else if (textData) {
      onSave(textData, 'text', getSelectedStaffNames());
    } else {
      // 何もない場合は空のテキストを保存
      onSave('', 'text', getSelectedStaffNames());
    }
    
    onClose();
  };

  const handleColorSelect = (color: string, isMarker: boolean = false) => {
    setSelectedColor(color);
    if (isMarker) {
      // マーカーの場合は背景色として適用
      setActiveTool('pen');
    }
  };

  // スタッフ選択機能
  const handleStaffSelect = (staffId: string) => {
    setSelectedStaff(prev => 
      prev.includes(staffId) 
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    );
  };

  const getSelectedStaffNames = () => {
    return selectedStaff.map(id => {
      const staff = staffList.find(s => s.id === id);
      return staff ? staff.name : '';
    }).filter(name => name).join(', ');
  };

  const getStaffByPosition = () => {
    const grouped = staffList.reduce((groups, staff) => {
      const positionName = staff.position?.name || '未設定';
      if (!groups[positionName]) {
        groups[positionName] = [];
      }
      groups[positionName].push(staff);
      return groups;
    }, {} as Record<string, typeof staffList>);

    return Object.entries(grouped).sort(([,a], [,b]) => {
      const aOrder = a[0]?.position?.sort_order || 999;
      const bOrder = b[0]?.position?.sort_order || 999;
      return aOrder - bOrder;
    });
  };

  // テキストをキャンバスに描画
  const drawTextToCanvas = (text: string, x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.font = `${penSize * 4}px Arial`;
    ctx.fillStyle = selectedColor;
    ctx.textBaseline = 'top';
    ctx.fillText(text, x, y);
    ctx.restore();
    
    setHasDrawing(true);
  };

  // テキスト入力を確定
  const confirmTextInput = () => {
    if (textInputPosition && tempTextInput.trim()) {
      drawTextToCanvas(tempTextInput, textInputPosition.x, textInputPosition.y);
      setTextContent(prev => prev + tempTextInput + '\n');
    }
    setTextInputPosition(null);
    setTempTextInput('');
  };

  // テキスト入力をキャンセル
  const cancelTextInput = () => {
    setTextInputPosition(null);
    setTempTextInput('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-lg w-[95%] max-w-7xl h-[95vh] flex flex-col"
      >
        {/* ツールバー */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-4">
            {/* ツール選択 */}
            <div className="flex items-center space-x-2">
              <Button
                variant={activeTool === 'pen' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTool('pen')}
              >
                <Pen className="w-4 h-4" />
              </Button>
              <Button
                variant={activeTool === 'marker' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTool('marker')}
              >
                <Highlighter className="w-4 h-4" />
              </Button>
              <Button
                variant={activeTool === 'eraser' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTool('eraser')}
              >
                <Eraser className="w-4 h-4" />
              </Button>
              <Button
                variant={activeTool === 'text' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  console.log('テキストツール選択');
                  setActiveTool('text');
                }}
                className={activeTool === 'text' ? 'bg-blue-500 text-white' : ''}
              >
                <Type className="w-4 h-4" />
              </Button>
            </div>

            {/* 色選択 */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">色:</span>
              {colors.map((color) => (
                <button
                  key={color.value}
                  className={`w-6 h-6 rounded-full border-2 ${
                    selectedColor === color.value ? 'ring-2 ring-blue-500' : ''
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setSelectedColor(color.value)}
                  title={color.name}
                />
              ))}
            </div>

            {/* ペン太さ */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">太さ:</span>
              <input
                type="range"
                min="1"
                max="10"
                value={penSize}
                onChange={(e) => setPenSize(parseInt(e.target.value))}
                className="w-24"
              />
              <span className="text-sm text-gray-600">{penSize}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={clearCanvas}>
              <Trash2 className="w-4 h-4 mr-1" />
              クリア
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4 mr-1" />
              キャンセル
            </Button>
          </div>
        </div>

        {/* 手書きエリア */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto overflow-x-hidden p-4">
            <div className="relative inline-block">
              {/* 背景キャンバス（点線用） */}
              <canvas
                ref={backgroundCanvasRef}
                width={1600}
                height={1600}
                className="absolute border border-gray-300 bg-white pointer-events-none"
                style={{ zIndex: 1 }}
              />
              {/* 手書きキャンバス */}
              <canvas
                ref={canvasRef}
                width={1600}
                height={1600}
                className={`relative border border-gray-300 bg-transparent ${
                  activeTool === 'text' ? 'cursor-text' : 'cursor-crosshair'
                }`}
                style={{ zIndex: 2 }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
              
              {/* テキスト入力エリア（キャンバス上に表示） */}
              {textInputPosition && (
                <div
                  className="absolute border-2 border-blue-500 bg-white shadow-xl rounded-lg p-3 min-w-48"
                  style={{
                    left: Math.max(0, textInputPosition.x - 24),
                    top: Math.max(0, textInputPosition.y - 8),
                    zIndex: 3
                  }}
                >
                  <div className="text-xs text-gray-500 mb-1">テキスト入力</div>
                  <input
                    type="text"
                    value={tempTextInput}
                    onChange={(e) => setTempTextInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        confirmTextInput();
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        cancelTextInput();
                      }
                    }}
                    onBlur={() => {
                      // 少し遅延させて確定処理を実行
                      setTimeout(confirmTextInput, 100);
                    }}
                    autoFocus
                    className="border border-gray-300 rounded px-2 py-1 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ 
                      color: selectedColor,
                      fontSize: `${Math.max(12, penSize * 3)}px`
                    }}
                    placeholder="テキストを入力..."
                  />
                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={confirmTextInput}
                      className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                    >
                      確定
                    </button>
                    <button
                      onClick={cancelTextInput}
                      className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="flex items-center justify-center p-4 border-t space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStaffModal(true)}
            className={`${selectedStaff.length > 0 ? 'bg-blue-50 border-blue-300' : ''}`}
            title={selectedStaff.length > 0 ? `選択中: ${getSelectedStaffNames()}` : 'スタッフ選択'}
          >
            <User className="w-4 h-4" />
          </Button>
          <Button 
            onClick={handleSave} 
            className="px-8"
          >
            <Save className="w-4 h-4 mr-2" />
            送信
          </Button>
        </div>
      </div>

      {/* スタッフ選択モーダル */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">スタッフ選択</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStaffModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {getStaffByPosition().map(([positionName, staffs]) => (
                <div key={positionName}>
                  <h4 className="font-medium text-gray-700 mb-2">{positionName}</h4>
                  <div className="space-y-2">
                    {staffs.map((staff) => (
                      <label key={staff.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedStaff.includes(staff.id)}
                          onChange={() => handleStaffSelect(staff.id)}
                          className="rounded"
                        />
                        <span className="text-sm">{staff.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedStaff([]);
                  setShowStaffModal(false);
                }}
              >
                クリア
              </Button>
              <Button onClick={() => setShowStaffModal(false)}>
                確定
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
