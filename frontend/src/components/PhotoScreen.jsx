import React, { useState, useEffect, useRef } from 'react';

export default function PhotoScreen({ onUploadSuccess }) {
  const [photoType, setPhotoType] = useState('meal');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [savedPhotos, setSavedPhotos] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const res = await fetch('/api/photos');
      if (res.ok) {
        const data = await res.json();
        if (data.photos) {
          setSavedPhotos(data.photos);
        }
      }
    } catch {
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('record_type', photoType);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('アップロードに失敗しました');
      }

      const data = await response.json();
      setMessage({ type: 'success', text: '写真を保存しました！' });
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      fetchPhotos();
      if (onUploadSuccess) {
        onUploadSuccess(data);
      }
    } catch (err) {
      setMessage({ type: 'error', text: '保存中にエラーが発生しました。' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)] px-5 py-6">
      <header className="text-center mb-5">
        <h1 className="text-xl font-bold text-neutral-800">写真記録</h1>
        <p className="text-xs text-neutral-500 mt-1">食事や体型を撮影して変化を残しましょう</p>
      </header>

      <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-200/70 rounded-xl mb-5">
        <button
          onClick={() => setPhotoType('meal')}
          className={`py-2 text-xs font-bold rounded-lg transition-all ${
            photoType === 'meal'
              ? 'bg-white text-green-700 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-800'
          }`}
        >
          食事を記録
        </button>
        <button
          onClick={() => setPhotoType('body')}
          className={`py-2 text-xs font-bold rounded-lg transition-all ${
            photoType === 'body'
              ? 'bg-white text-green-700 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-800'
          }`}
        >
          体型を記録
        </button>
      </div>

      <div className="flex flex-col items-center justify-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id="photo-input"
        />

        {previewUrl ? (
          <div className="w-full flex flex-col items-center">
            <div className="relative w-full aspect-square max-w-xs rounded-2xl overflow-hidden border-2 border-green-500 shadow-md bg-neutral-900">
              <img
                src={previewUrl}
                alt="プレビュー"
                className="w-full h-full object-cover"
              />
              <button
                onClick={handleReset}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center text-sm hover:bg-black/80 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="w-full max-w-xs mt-4 flex gap-3">
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 text-sm"
              >
                {isUploading ? '保存中...' : 'この写真を記録する'}
              </button>
              <button
                onClick={handleReset}
                disabled={isUploading}
                className="px-4 py-3 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-bold rounded-xl text-sm transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <label
            htmlFor="photo-input"
            className="w-full aspect-square max-w-xs rounded-2xl border-2 border-dashed border-neutral-300 bg-white hover:border-green-500 hover:bg-green-50/30 transition-all flex flex-col items-center justify-center cursor-pointer p-6 text-center shadow-sm"
          >
            <div className="w-16 h-16 rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-sm font-bold text-neutral-700">写真を撮影または選択</span>
            <span className="text-xs text-neutral-400 mt-1">タップしてカメラ・アルバムを起動</span>
          </label>
        )}

        {message && (
          <div
            className={`w-full max-w-xs mt-4 p-3 rounded-xl text-xs font-semibold text-center ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>

      {savedPhotos.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-neutral-700">保存済みの写真履歴</h2>
            <span className="text-[11px] text-neutral-400">{savedPhotos.length} 枚</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {savedPhotos.map((photo) => (
              <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden bg-neutral-200 shadow-sm border border-neutral-100 group">
                <img src={photo.url} alt="写真履歴" className="w-full h-full object-cover" />
                <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded font-medium">
                  {photo.record_type === 'meal' ? '食事' : '体型'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-200 text-xs text-neutral-500 mt-6 text-center">
        💡 写真は完全無料のローカルデータベースに安全に保存されます
      </div>
    </div>
  );
}
