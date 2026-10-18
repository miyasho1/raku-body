import React, { useState, useEffect, useRef } from 'react';

export default function PhotoScreen({ onUploadSuccess }) {
  const [activeTab, setActiveTab] = useState('upload');
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
    } catch {
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
    <div className="flex flex-col space-y-3 pb-2">
      <header className="flex items-center justify-between px-0.5">
        <div>
          <h1 className="text-base font-extrabold text-slate-900 leading-tight">写真記録</h1>
          <p className="text-[10px] text-slate-500">食事や体型を撮影して変化を記録</p>
        </div>
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200/70">
          保存済 {savedPhotos.length}枚
        </span>
      </header>

      {message && (
        <div
          className={`w-full p-2.5 rounded-xl text-[11px] font-bold text-center border ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <section className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm space-y-3">
        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📷 写真を撮影・保存
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gallery')}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'gallery'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🖼️ 写真履歴 ({savedPhotos.length})
          </button>
        </div>

        {activeTab === 'upload' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/70">
              <span className="text-xs font-bold text-slate-700">記録カテゴリー</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setPhotoType('meal')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    photoType === 'meal'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  🍽️ 食事
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoType('body')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    photoType === 'body'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  💪 体型
                </button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="photo-input"
            />

            {previewUrl ? (
              <div className="space-y-2.5">
                <div className="relative w-full h-44 rounded-xl overflow-hidden border border-emerald-500 bg-slate-900">
                  <img
                    src={previewUrl}
                    alt="プレビュー"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleReset}
                    className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 text-white flex items-center justify-center text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="col-span-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 text-xs cursor-pointer"
                  >
                    {isUploading ? '保存中...' : 'この写真を記録する'}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={isUploading}
                    className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <label
                htmlFor="photo-input"
                className="w-full h-40 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/70 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all flex flex-col items-center justify-center cursor-pointer p-4 text-center"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/70 flex items-center justify-center mb-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-slate-800">写真を撮影または選択</span>
                <span className="text-[10px] text-slate-400 mt-0.5">タップしてカメラ・アルバムを起動</span>
              </label>
            )}
          </div>
        ) : (
          <div>
            {savedPhotos.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-xl border border-slate-200/70 text-center text-xs text-slate-400">
                保存された写真はまだありません
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5">
                {savedPhotos.map((photo) => (
                  <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 shadow-2xs border border-slate-200">
                    <img src={photo.url} alt="写真履歴" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded font-bold">
                      {photo.record_type === 'meal' ? '食事' : '体型'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
