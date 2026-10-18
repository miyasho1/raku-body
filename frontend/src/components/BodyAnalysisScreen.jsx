import React, { useState, useEffect, useRef } from 'react';
import { analyzeBodyImage } from '../utils/geminiAnalyzer';

export default function BodyAnalysisScreen({ onBack, onApplyWorkoutMenu }) {
  const [idealFiles, setIdealFiles] = useState([]);
  const [idealPreviews, setIdealPreviews] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);
  const [currentPreview, setCurrentPreview] = useState(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [message, setMessage] = useState(null);

  const idealInputRef = useRef(null);
  const currentInputRef = useRef(null);

  useEffect(() => {
    fetchLatestAnalysis();
  }, []);

  const fetchLatestAnalysis = async () => {
    try {
      const res = await fetch('/api/body-analysis');
      if (res.ok) {
        const data = await res.json();
        if (data.has_analysis) {
          setAnalysisResult(data.data);
          if (data.ideal_urls && data.ideal_urls.length > 0) {
            setIdealPreviews(data.ideal_urls);
          }
          if (data.current_url) {
            setCurrentPreview(data.current_url);
          }
        }
      }
    } catch {
    }
  };

  const handleIdealChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIdealFiles((prev) => [...prev, ...files]);
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setIdealPreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveIdeal = (index) => {
    setIdealFiles((prev) => prev.filter((_, i) => i !== index));
    setIdealPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCurrentChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCurrentFile(file);
      setCurrentPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveCurrent = () => {
    setCurrentFile(null);
    setCurrentPreview(null);
    if (currentInputRef.current) {
      currentInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    if (!currentPreview) {
      setMessage({ type: 'error', text: '現在の体型写真を選択してください。' });
      return;
    }
    if (idealPreviews.length === 0) {
      setMessage({ type: 'error', text: 'なりたい理想の体型写真を1枚以上選択してください。' });
      return;
    }

    setIsAnalyzing(true);
    setMessage(null);

    const formData = new FormData();
    if (idealFiles.length > 0) {
      idealFiles.forEach((file) => {
        formData.append('ideal_files', file);
      });
    } else {
      const dummyBlob = new Blob(['sample'], { type: 'image/jpeg' });
      formData.append('ideal_files', dummyBlob, 'ideal_prev.jpg');
    }

    if (currentFile) {
      formData.append('current_file', currentFile);
    } else {
      const dummyBlob = new Blob(['sample'], { type: 'image/jpeg' });
      formData.append('current_file', dummyBlob, 'curr_prev.jpg');
    }

    try {
      let analysis = null;
      if (currentFile) {
        try {
          analysis = await analyzeBodyImage(currentFile);
        } catch {}
      }

      const res = await fetch('/api/analyze-body-target', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const resData = await res.json();
        setAnalysisResult(analysis ? { ...resData.data, ...analysis } : resData.data);
        setMessage({ type: 'success', text: 'AIによる体型比較・メニュー生成が完了しました！' });
      } else if (analysis) {
        setAnalysisResult(analysis);
        setMessage({ type: 'success', text: 'AIによる体型分析・メニュー生成が完了しました！' });
      } else {
        setMessage({ type: 'error', text: '分析処理に失敗しました。もう一度お試しください。' });
      }
    } catch {
      if (currentFile) {
        try {
          const fallbackAnalysis = await analyzeBodyImage(currentFile);
          setAnalysisResult(fallbackAnalysis);
          setMessage({ type: 'success', text: 'AIによる体型分析・メニュー生成が完了しました！' });
        } catch {
          setMessage({ type: 'error', text: '通信エラーが発生しました。' });
        }
      } else {
        setMessage({ type: 'error', text: '通信エラーが発生しました。' });
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)] px-5 py-6 pb-40 bg-slate-100 no-scrollbar [&::-webkit-scrollbar]:hidden">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-medium text-[#475467] hover:text-[#1A1A1C] bg-white border border-[#D0D5DD] px-3 py-1.5 rounded-md cursor-pointer transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          ホームへ戻る
        </button>
        <span className="text-xs font-bold text-[#0056B3] bg-[#F2F4F7] px-2.5 py-1 rounded border border-[#D0D5DD]">
          体型写真分析
        </span>
      </div>

      <header className="mb-4">
        <h1 className="text-lg font-bold text-[#1A1A1C]">体型画像比較分析</h1>
        <p className="text-xs text-[#475467] mt-0.5">理想の写真と現状の写真を比較し、推奨メニューを生成します</p>
      </header>

      <section className="bg-white rounded-lg p-4 border border-[#D0D5DD] shadow-sm mb-4 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-[#1A1A1C] flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-[#0056B3] text-white flex items-center justify-center text-[10px]">1</span>
              <span>理想の体型写真（複数選択可）</span>
            </label>
            <span className="text-[10px] text-[#475467]">目標とする体型</span>
          </div>

          <input
            ref={idealInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleIdealChange}
            className="hidden"
            id="ideal-file-input"
          />

          <div className="grid grid-cols-3 gap-2">
            {idealPreviews.map((url, idx) => (
              <div key={idx} className="relative aspect-square rounded-md overflow-hidden bg-[#F2F4F7] border border-[#D0D5DD] group">
                <img src={url} alt={`理想写真 ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveIdeal(idx)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-md bg-black/60 text-white flex items-center justify-center text-[10px] cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ))}

            <label
              htmlFor="ideal-file-input"
              className="aspect-square rounded-md border border-dashed border-[#D0D5DD] hover:border-[#0056B3] bg-[#F8F9FA] hover:bg-[#F2F4F7] flex flex-col items-center justify-center cursor-pointer transition-colors p-2 text-center"
            >
              <div className="w-6 h-6 rounded-md bg-white border border-[#D0D5DD] text-[#0056B3] flex items-center justify-center mb-1 text-xs font-bold">
                +
              </div>
              <span className="text-[10px] font-medium text-[#475467]">写真を追加</span>
            </label>
          </div>
        </div>

        <div className="border-t border-[#D0D5DD] pt-3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-[#1A1A1C] flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-[#0056B3] text-white flex items-center justify-center text-[10px]">2</span>
              <span>現在の体型写真（正面または側面）</span>
            </label>
            <span className="text-[10px] text-[#475467]">現状の把握</span>
          </div>

          <input
            ref={currentInputRef}
            type="file"
            accept="image/*"
            onChange={handleCurrentChange}
            className="hidden"
            id="current-file-input"
          />

          {currentPreview ? (
            <div className="relative w-full h-40 rounded-md overflow-hidden border border-[#D0D5DD] bg-[#F2F4F7]">
              <img src={currentPreview} alt="現在の体型" className="w-full h-full object-contain" />
              <button
                type="button"
                onClick={handleRemoveCurrent}
                className="absolute top-2 right-2 px-2.5 py-1 rounded-md bg-black/70 text-white text-[11px] font-medium cursor-pointer"
              >
                変更
              </button>
            </div>
          ) : (
            <label
              htmlFor="current-file-input"
              className="w-full h-24 rounded-md border border-dashed border-[#D0D5DD] hover:border-[#0056B3] bg-[#F8F9FA] hover:bg-[#F2F4F7] flex flex-col items-center justify-center cursor-pointer transition-colors p-3 text-center"
            >
              <span className="text-xs font-bold text-[#0056B3]">体型写真を選択・撮影</span>
              <span className="text-[10px] text-[#475467] mt-0.5">輪郭が分かる状態の写真</span>
            </label>
          )}
        </div>

        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="w-full h-12 py-3 bg-[#0056B3] hover:bg-[#004494] text-white font-bold rounded-lg transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>骨格・部位別の差分を分析中...</span>
            </>
          ) : (
            <span>体型比較と推奨メニューを生成</span>
          )}
        </button>

        {message && (
          <div className={`p-2.5 rounded-lg text-xs font-medium text-center border ${
            message.type === 'success'
              ? 'bg-[#F2F4F7] text-[#0056B3] border-[#D0D5DD]'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {message.text}
          </div>
        )}
      </section>

      {analysisResult && (
        <div className="space-y-4 mb-4">
          <section className="bg-white text-[#1A1A1C] rounded-lg p-4 shadow-sm border border-[#D0D5DD]">
            <div className="flex items-center gap-1.5 mb-2">
              <h2 className="text-xs font-bold text-[#1A1A1C] uppercase tracking-wider">体型分析総評</h2>
            </div>
            <p className="text-xs leading-relaxed text-[#1A1A1C] font-medium">
              {analysisResult.summary}
            </p>
            {analysisResult.focus_areas && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#D0D5DD]">
                <span className="text-[10px] text-[#475467] font-bold">重点部位:</span>
                {analysisResult.focus_areas.map((area, idx) => (
                  <span key={idx} className="text-[10px] bg-[#F2F4F7] text-[#0056B3] border border-[#D0D5DD] px-2 py-0.5 rounded font-bold">
                    {area}
                  </span>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white rounded-lg p-4 shadow-sm border border-[#D0D5DD]">
            <div className="flex items-center gap-1.5 mb-3">
              <h2 className="text-xs font-bold text-[#1A1A1C]">理想と現在の部位別ギャップ</h2>
            </div>

            <div className="space-y-2">
              {analysisResult.parts_analysis?.map((part, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-[#F8F9FA] border border-[#D0D5DD]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#1A1A1C]">{part.part}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-[#D0D5DD] bg-white text-[#1A1A1C]">
                      優先度: {part.priority}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-[#475467] mt-1.5 bg-white p-2 rounded-md border border-[#D0D5DD]">
                    <div>
                      <span className="text-[10px] text-[#475467] block">現在</span>
                      <span className="font-medium text-[#1A1A1C]">{part.status}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#475467] block">目標</span>
                      <span className="font-bold text-[#0056B3]">{part.target}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-[#475467] mt-1.5 flex items-center gap-1">
                    <span className="font-bold text-[#0056B3]">差分:</span>
                    <span>{part.gap}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-lg p-4 shadow-sm border border-[#D0D5DD]">
            <div className="flex items-center justify-between mb-3 border-b border-[#D0D5DD] pb-2">
              <h2 className="text-xs font-bold text-[#1A1A1C]">強化メニュー提案</h2>
              <span className="text-[10px] text-[#0056B3] bg-[#F2F4F7] font-bold px-2 py-0.5 rounded border border-[#D0D5DD]">
                複合関節種目
              </span>
            </div>

            <div className="space-y-3">
              {analysisResult.compound_menu?.map((menu, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-[#D0D5DD] bg-white">
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-xs font-bold text-[#1A1A1C]">{menu.name}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-[#D0D5DD] bg-[#F2F4F7] text-[#0056B3]">
                      {menu.category === 'gym' ? 'ジム' : '宅トレ'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {menu.targets?.map((t, tIdx) => (
                      <span key={tIdx} className="text-[9px] bg-[#F2F4F7] text-[#475467] px-1.5 py-0.5 rounded border border-[#D0D5DD]">
                        対象: {t}
                      </span>
                    ))}
                  </div>

                  <div className="text-[11px] font-bold text-[#0056B3] mb-1.5">
                    目安: {menu.reps} × {menu.sets}
                  </div>

                  <p className="text-[11px] text-[#475467] leading-relaxed mb-3">
                    {menu.point}
                  </p>

                  <button
                    onClick={() => onApplyWorkoutMenu(menu)}
                    className="w-full py-2 bg-[#0056B3] hover:bg-[#004494] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    このメニューを今日の記録に反映
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-[#F8F9FA] rounded-lg p-4 border border-[#D0D5DD]">
            <div className="text-[#1A1A1C] font-bold text-xs mb-1">
              アドバイス
            </div>
            <p className="text-xs text-[#475467] leading-relaxed">
              {analysisResult.advice}
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
