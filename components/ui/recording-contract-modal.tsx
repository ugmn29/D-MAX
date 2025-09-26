'use client'

import { useState, useRef, useEffect } from 'react'
import { Modal } from './modal'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Textarea } from './textarea'
import { Input } from './input'
import { Label } from './label'
import { Select } from './select'
import {
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  Save,
  X,
  FileText,
  Clock,
  Volume2,
  Download,
  Upload
} from 'lucide-react'

interface RecordingContractModalProps {
  isOpen: boolean
  onClose: () => void
  patientId: string
}

interface AudioSegment {
  id: string
  startTime: number
  endTime: number
  transcription: string
  isSelected: boolean
}

interface ContractTemplate {
  id: string
  name: string
  content: string
  category: string
}

export function RecordingContractModal({ isOpen, onClose, patientId }: RecordingContractModalProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioSegments, setAudioSegments] = useState<AudioSegment[]>([])
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentPlayTime, setCurrentPlayTime] = useState(0)
  
  // 契約編集関連
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [contractContent, setContractContent] = useState('')
  const [medicalItems, setMedicalItems] = useState({
    diagnosis: '',
    treatment: '',
    medication: '',
    notes: ''
  })

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // モックテンプレートデータ
  const contractTemplates: ContractTemplate[] = [
    {
      id: '1',
      name: '初診時契約書',
      content: '患者様の同意を得て、以下の治療を行います。',
      category: '初診'
    },
    {
      id: '2',
      name: '定期検査契約書',
      content: '定期検査の実施について同意いただきます。',
      category: '定期検査'
    },
    {
      id: '3',
      name: '緊急時対応契約書',
      content: '緊急時の対応について同意いただきます。',
      category: '緊急時'
    }
  ]

  // 録音開始
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        const audioUrl = URL.createObjectURL(audioBlob)
        
        // 音声をセグメントに分割（モック実装）
        const segmentDuration = 30 // 30秒ごとにセグメント
        const totalSegments = Math.ceil(recordingTime / segmentDuration)
        const newSegments: AudioSegment[] = []
        
        for (let i = 0; i < totalSegments; i++) {
          newSegments.push({
            id: `segment_${Date.now()}_${i}`,
            startTime: i * segmentDuration,
            endTime: Math.min((i + 1) * segmentDuration, recordingTime),
            transcription: `セグメント ${i + 1} の文字起こし（自動生成）`,
            isSelected: false
          })
        }
        
        setAudioSegments(prev => [...prev, ...newSegments])
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // 録音時間のカウント
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (error) {
      console.error('録音開始エラー:', error)
      alert('マイクへのアクセスが許可されていません')
    }
  }

  // 録音停止
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }

  // セグメント再生
  const playSegment = (segment: AudioSegment) => {
    if (audioRef.current) {
      audioRef.current.currentTime = segment.startTime
      audioRef.current.play()
      setIsPlaying(true)
      setSelectedSegment(segment.id)
      
      // 再生時間の更新
      playIntervalRef.current = setInterval(() => {
        if (audioRef.current) {
          setCurrentPlayTime(audioRef.current.currentTime)
          if (audioRef.current.currentTime >= segment.endTime) {
            setIsPlaying(false)
            if (playIntervalRef.current) {
              clearInterval(playIntervalRef.current)
            }
          }
        }
      }, 100)
    }
  }

  // 再生停止
  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }
    }
  }

  // テンプレート選択
  const handleTemplateSelect = (templateId: string) => {
    const template = contractTemplates.find(t => t.id === templateId)
    if (template) {
      setContractContent(template.content)
    }
  }

  // 文字起こし実行
  const executeTranscription = async (segmentId: string) => {
    // 実際の実装ではGoogle Cloud Speech-to-Text APIを呼び出し
    const mockTranscription = `セグメント ${segmentId} の文字起こし結果（Google Speech-to-Text APIを使用）`
    
    setAudioSegments(prev => 
      prev.map(segment => 
        segment.id === segmentId 
          ? { ...segment, transcription: mockTranscription }
          : segment
      )
    )
  }

  // 契約書保存
  const saveContract = async () => {
    try {
      // 実際の実装ではAPIに送信
      console.log('契約書保存:', {
        patientId,
        template: selectedTemplate,
        content: contractContent,
        medicalItems
      })
      alert('契約書を保存しました')
      onClose()
    } catch (error) {
      console.error('保存エラー:', error)
      alert('保存に失敗しました')
    }
  }

  // 録音時間のフォーマット
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }
    }
  }, [])

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="flex h-[600px]">
        {/* 左側：音声入力 */}
        <div className="flex-1 pr-4 border-r border-gray-200">
          <div className="h-full flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center">
                <Mic className="w-5 h-5 mr-2" />
                音声入力
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col">
              {/* 録音コントロール */}
              <div className="text-center mb-6">
                <div className="text-3xl font-bold mb-4">
                  {formatTime(recordingTime)}
                </div>
                {!isRecording ? (
                  <Button
                    onClick={startRecording}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    size="lg"
                  >
                    <Mic className="w-5 h-5 mr-2" />
                    録音開始
                  </Button>
                ) : (
                  <Button
                    onClick={stopRecording}
                    className="bg-gray-600 hover:bg-gray-700 text-white"
                    size="lg"
                  >
                    <Square className="w-5 h-5 mr-2" />
                    録音停止
                  </Button>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  最大30分まで録音可能
                </p>
              </div>

              {/* セグメント管理 */}
              <div className="flex-1 overflow-y-auto">
                <h4 className="font-medium mb-3">録音セグメント</h4>
                <div className="space-y-2">
                  {audioSegments.map((segment) => (
                    <Card key={segment.id} className={`p-3 ${
                      selectedSegment === segment.id ? 'border-blue-500 bg-blue-50' : ''
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium">
                              {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => executeTranscription(segment.id)}
                            >
                              文字起こし
                            </Button>
                          </div>
                          <div className="text-sm text-gray-600">
                            {segment.transcription}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          {isPlaying && selectedSegment === segment.id ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={stopPlayback}
                            >
                              <Pause className="w-3 h-3" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => playSegment(segment)}
                            >
                              <Play className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </div>
        </div>

        {/* 右側：契約編集 */}
        <div className="flex-1 pl-4">
          <div className="h-full flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                契約編集
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col">
              {/* テンプレート選択 */}
              <div className="mb-4">
                <Label htmlFor="template-select">テンプレート選択</Label>
                <Select
                  value={selectedTemplate}
                  onValueChange={(value) => {
                    setSelectedTemplate(value)
                    handleTemplateSelect(value)
                  }}
                >
                  <option value="">テンプレートを選択</option>
                  {contractTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </Select>
              </div>

              {/* 契約内容 */}
              <div className="mb-4">
                <Label htmlFor="contract-content">契約内容</Label>
                <Textarea
                  id="contract-content"
                  value={contractContent}
                  onChange={(e) => setContractContent(e.target.value)}
                  placeholder="契約内容を入力してください..."
                  className="h-32 resize-none"
                />
              </div>

              {/* 医療項目 */}
              <div className="space-y-3 mb-4">
                <h4 className="font-medium">医療項目</h4>
                <div>
                  <Label htmlFor="diagnosis">診断</Label>
                  <Input
                    id="diagnosis"
                    value={medicalItems.diagnosis}
                    onChange={(e) => setMedicalItems(prev => ({ ...prev, diagnosis: e.target.value }))}
                    placeholder="診断内容"
                  />
                </div>
                <div>
                  <Label htmlFor="treatment">治療</Label>
                  <Input
                    id="treatment"
                    value={medicalItems.treatment}
                    onChange={(e) => setMedicalItems(prev => ({ ...prev, treatment: e.target.value }))}
                    placeholder="治療内容"
                  />
                </div>
                <div>
                  <Label htmlFor="medication">薬剤</Label>
                  <Input
                    id="medication"
                    value={medicalItems.medication}
                    onChange={(e) => setMedicalItems(prev => ({ ...prev, medication: e.target.value }))}
                    placeholder="薬剤情報"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">備考</Label>
                  <Textarea
                    id="notes"
                    value={medicalItems.notes}
                    onChange={(e) => setMedicalItems(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="その他の備考"
                    className="h-20 resize-none"
                  />
                </div>
              </div>

              {/* 保存ボタン */}
              <div className="mt-auto">
                <Button
                  onClick={saveContract}
                  className="w-full"
                  disabled={!contractContent}
                >
                  <Save className="w-4 h-4 mr-2" />
                  契約書を保存
                </Button>
              </div>
            </CardContent>
          </div>
        </div>
      </div>
    </Modal>
  )
}
