'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';

interface DefaultText {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function SubkarteSettingsPage() {
  const [defaultTexts, setDefaultTexts] = useState<DefaultText[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingText, setEditingText] = useState<DefaultText | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });

  // ローカルストレージからデフォルトテキストを読み込み
  useEffect(() => {
    const savedTexts = localStorage.getItem('default_texts');
    if (savedTexts) {
      setDefaultTexts(JSON.parse(savedTexts));
    }
  }, []);

  // デフォルトテキストを保存
  const saveDefaultTexts = (texts: DefaultText[]) => {
    setDefaultTexts(texts);
    localStorage.setItem('default_texts', JSON.stringify(texts));
  };

  // 新規追加
  const handleAdd = () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('タイトルと内容を入力してください');
      return;
    }

    const newText: DefaultText = {
      id: Date.now().toString(),
      title: formData.title,
      content: formData.content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedTexts = [...defaultTexts, newText];
    saveDefaultTexts(updatedTexts);
    setFormData({ title: '', content: '' });
    setShowAddModal(false);
  };

  // 編集開始
  const handleEdit = (text: DefaultText) => {
    setEditingText(text);
    setFormData({ title: text.title, content: text.content });
    setShowEditModal(true);
  };

  // 編集保存
  const handleEditSave = () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('タイトルと内容を入力してください');
      return;
    }

    const updatedTexts = defaultTexts.map(text =>
      text.id === editingText?.id
        ? { ...text, title: formData.title, content: formData.content, updatedAt: new Date().toISOString() }
        : text
    );

    saveDefaultTexts(updatedTexts);
    setFormData({ title: '', content: '' });
    setEditingText(null);
    setShowEditModal(false);
  };

  // 削除
  const handleDelete = (id: string) => {
    if (confirm('このデフォルトテキストを削除しますか？')) {
      const updatedTexts = defaultTexts.filter(text => text.id !== id);
      saveDefaultTexts(updatedTexts);
    }
  };

  // フォームリセット
  const resetForm = () => {
    setFormData({ title: '', content: '' });
    setEditingText(null);
    setShowAddModal(false);
    setShowEditModal(false);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">サブカルテ設定</h1>
        <p className="text-gray-600 mt-2">デフォルトテキストの管理</p>
      </div>

      {/* デフォルトテキスト一覧 */}
      <div className="space-y-4">
        {defaultTexts.map((text) => (
          <Card key={text.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{text.title}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    作成日: {new Date(text.createdAt).toLocaleDateString('ja-JP')}
                    {text.updatedAt !== text.createdAt && (
                      <span className="ml-2">
                        更新日: {new Date(text.updatedAt).toLocaleDateString('ja-JP')}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(text)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(text.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap">
                {text.content}
              </div>
            </CardContent>
          </Card>
        ))}

        {defaultTexts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            デフォルトテキストがありません
          </div>
        )}
      </div>

      {/* 新規追加ボタン */}
      <div className="mt-6">
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          新規追加
        </Button>
      </div>

      {/* 新規追加モーダル */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">デフォルトテキスト追加</h3>
              <button
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  タイトル
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="デフォルトテキストのタイトル"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  内容
                </label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="デフォルトテキストの内容"
                  rows={6}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={resetForm}>
                キャンセル
              </Button>
              <Button onClick={handleAdd}>
                <Save className="w-4 h-4 mr-2" />
                保存
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 編集モーダル */}
      {showEditModal && editingText && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">デフォルトテキスト編集</h3>
              <button
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  タイトル
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="デフォルトテキストのタイトル"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  内容
                </label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="デフォルトテキストの内容"
                  rows={6}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={resetForm}>
                キャンセル
              </Button>
              <Button onClick={handleEditSave}>
                <Save className="w-4 h-4 mr-2" />
                保存
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}