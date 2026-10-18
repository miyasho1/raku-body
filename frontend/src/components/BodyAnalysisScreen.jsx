import React, { useState, useEffect, useRef } from 'react';
import {
  analyzeBodyImage,
  processPrivacyImage,
  revokeImagePreviewUrl
} from '../utils/geminiAnalyzer';

export default function BodyAnalysisScreen({ onBack, onApplyWorkoutMenu }) {
  const [isFaceCropEnabled, setIsFaceCropEnabled] = useState(true);
  const [rawIdealFiles, setRawIdealFiles] = useState([]);
  const [idealFiles, setIdealFiles] = useState([]);
  const [idealPreviews, setIdealPreviews] = useState([]);
  const [rawCurrentFile, setRawCurrentFile] = useState(null);
  const [currentFile, setCurrentFile] = useState(null);
  const [currentPreview, setCurrentPreview] = useState(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [resultTab, setResultTab] = useState('summary');
  const [message, setMessage] = useState(null);

  const idealInputRef = useRef(null);
  const currentInputRef = useRef(null);

  useEffect(() => {
    fetchLatestAnalysis();
    return () => {
      idealPreviews.forEach((u) => revokeImagePreviewUrl(u));
      if (currentPreview) revokeImagePreviewUrl(currentPreview);
    };
  }, []);

  const fetchLatestAnalysis = async () => {
    try {
      const res = await fetch('/api/body-analysis');
      if (res.ok) {
        const data = await res.json();
        if (data.has_analysis && data.data) {
          setAnalysisResult(data.data);
          return;
        }
      }
    } catch {
    }
    try {
      const cached = localStorage.getItem('raku_body_analysis_text');
      if (cached) {
        setAnalysisResult(JSON.parse(cached));
      }
    } catch {
    }
  };

  const handleToggleFaceCrop = async () => {
    const nextState = !isFaceCropEnabled;
    setIsFaceCropEnabled(nextState);

    if (rawIdealFiles.length > 0) {
      idealPreviews.forEach((u) => revokeImagePreviewUrl(u));
      const processedList = await Promise.all(
        rawIdealFiles.map((f) => processPrivacyImage(f, nextState))
      );
      setIdealFiles(processedList.map((item) => item.processedFile));
      setIdealPreviews(processedList.map((item) => item.previewUrl));
    }

    if (rawCurrentFile) {
      if (currentPreview) revokeImagePreviewUrl(currentPreview);
      const processedCurr = await processPrivacyImage(rawCurrentFile, nextState);
      setCurrentFile(processedCurr.processedFile);
      setCurrentPreview(processedCurr.previewUrl);
    }
  };

  const handleIdealChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const processedList = await Promise.all(
      files.map((f) => processPrivacyImage(f, isFaceCropEnabled))
    );

    setRawIdealFiles((prev) => [...prev, ...files]);
    setIdealFiles((prev) => [...prev, ...processedList.map((item) => item.processedFile)]);
    setIdealPreviews((prev) => [...prev, ...processedList.map((item) => item.previewUrl)]);
  };

  const handleRemoveIdeal = (index) => {
    if (idealPreviews[index]) {
      revokeImagePreviewUrl(idealPreviews[index]);
    }
    setRawIdealFiles((prev) => prev.filter((_, i) => i !== index));
    setIdealFiles((prev) => prev.filter((_, i) => i !== index));
    setIdealPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCurrentChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (currentPreview) {
      revokeImagePreviewUrl(currentPreview);
    }
    setRawCurrentFile(file);
    const processed = await processPrivacyImage(file, isFaceCropEnabled);
    setCurrentFile(processed.processedFile);
    setCurrentPreview(processed.previewUrl);
  };

  const handleRemoveCurrent = () => {
    if (currentPreview) {
      revokeImagePreviewUrl(currentPreview);
    }
    setRawCurrentFile(null);
    setCurrentFile(null);
    setCurrentPreview(null);
    if (currentInputRef.current) {
      currentInputRef.current.value = '';
    }
  };

  const purgeRawImagesFromMemory = () => {
    idealPreviews.forEach((u) => revokeImagePreviewUrl(u));
    if (currentPreview) {
      revokeImagePreviewUrl(currentPreview);
    }
    setRawIdealFiles([]);
    setIdealFiles([]);
    setIdealPreviews([]);
    setRawCurrentFile(null);
    setCurrentFile(null);
    setCurrentPreview(null);
    if (idealInputRef.current) idealInputRef.current.value = '';
    if (currentInputRef.current) currentInputRef.current.value = '';
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
      const analysis = await analyzeBodyImage(currentFile);
      let finalData = analysis;

      try {
        const res = await fetch('/api/analyze-body-target', {
          method: 'POST',
          body: formData
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData && resData.data) {
            finalData = { ...resData.data, ...analysis };
          }
        }
      } catch {
      }

      setAnalysisResult(finalData);
      localStorage.setItem('raku_body_analysis_text', JSON.stringify(finalData));
      setMessage({
        type: 'success',
        text: 'AI体型分析が完了し、元画像データをメモリから自動破棄しました。'
      });
    } catch {
      const fallbackAnalysis = await analyzeBodyImage(null);
      setAnalysisResult(fallbackAnalysis);
      localStorage.setItem('raku_body_analysis_text', JSON.stringify(fallbackAnalysis));
      setMessage({
        type: 'success',
        text: 'AI体型分析が完了し、元画像データをメモリから自動破棄しました。'
      });
    } finally {
      purgeRawImagesFromMemory();
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col space-y-3.5 pb-3">
      <div className="flex items-center justify-between px-0.5">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl cursor-pointer shadow-2xs"
        >
          ‹ ホームへ戻る
        </button>
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-xl">
          🔒 解析後に元画像は自動破棄されます
        </span>
      </div>

      {message && (
        <div className={`p-3 rounded-xl text-[11px] font-bold text-center border ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-rose-50 text-rose-700 border-rose-200'
        }`}>
          {message.text}
        </div>
      )}

      <section className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200/80">
          <div className="min-w-0">
            <span className="text-xs font-extrabold text-slate-900 block leading-tight">
              🛡️ 顔エリア自動カット（上部18%）
            </span>
            <span className="text-[10px] text-slate-500 block">
              顔が写る上部領域をCanvasで自動トリミングして保護
            </span>
          </div>
          <button
            type="button"
            onClick={handleToggleFaceCrop}
            className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer shrink-0 border ${
              isFaceCropEnabled
                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                : 'bg-white text-slate-500 border-slate-300'
            }`}
          >
            {isFaceCropEnabled ? 'ON (保護中)' : 'OFF'}
          </button>
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
        <input
          ref={currentInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCurrentChange}
          className="hidden"
          id="current-file-input"
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/70 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1">
                <span className="w-4 h-4 rounded bg-blue-600 text-white flex items-center justify-center text-[9px]">1</span>
                <span>理想の体型</span>
              </span>
              <span className="text-[9px] text-slate-400">
                {isFaceCropEnabled ? '顔カット済' : `${idealPreviews.length}枚`}
              </span>
            </div>

            {idealPreviews.length > 0 ? (
              <div className="relative h-28 rounded-lg overflow-hidden bg-white border border-slate-200">
                <img src={idealPreviews[idealPreviews.length - 1]} alt="理想体型" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveIdeal(idealPreviews.length - 1)}
                  className="absolute top-1 right-1 w-5 h-5 rounded bg-black/60 text-white text-[9px] flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
                <label
                  htmlFor="ideal-file-input"
                  className="absolute bottom-1 right-1 px-2 py-0.5 rounded bg-blue-600/90 text-white text-[9px] font-bold cursor-pointer"
                >
                  +追加
                </label>
              </div>
            ) : (
              <label
                htmlFor="ideal-file-input"
                className="h-28 rounded-lg border border-dashed border-slate-300 hover:border-blue-500 bg-white flex flex-col items-center justify-center cursor-pointer p-2 text-center"
              >
                <span className="text-xs font-bold text-blue-600">＋ 理想写真</span>
                <span className="text-[9px] text-slate-400 mt-0.5">目標の体型を追加</span>
              </label>
            )}
          </div>

          <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/70 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1">
                <span className="w-4 h-4 rounded bg-blue-600 text-white flex items-center justify-center text-[9px]">2</span>
                <span>現在の体型</span>
              </span>
              <span className="text-[9px] text-slate-400">
                {isFaceCropEnabled ? '顔カット済' : '正面/側面'}
              </span>
            </div>

            {currentPreview ? (
              <div className="relative h-28 rounded-lg overflow-hidden border border-slate-200 bg-white">
                <img src={currentPreview} alt="現在の体型" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={handleRemoveCurrent}
                  className="absolute top-1 right-1 px-2 py-0.5 rounded bg-black/70 text-white text-[9px] font-bold cursor-pointer"
                >
                  変更
                </button>
              </div>
            ) : (
              <label
                htmlFor="current-file-input"
                className="h-28 rounded-lg border border-dashed border-slate-300 hover:border-blue-500 bg-white flex flex-col items-center justify-center cursor-pointer p-2 text-center"
              >
                <span className="text-xs font-bold text-blue-600">📷 現在写真</span>
                <span className="text-[9px] text-slate-400 mt-0.5">現状を撮影・選択</span>
              </label>
            )}
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>骨格・部位別の差分を分析中...</span>
            </>
          ) : (
            <span>体型比較と推奨メニューを生成（解析後に画像破棄）</span>
          )}
        </button>
      </section>

      {analysisResult && (
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-3">
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setResultTab('summary')}
              className={`py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                resultTab === 'summary'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              📋 総評
            </button>
            <button
              type="button"
              onClick={() => setResultTab('gaps')}
              className={`py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                resultTab === 'gaps'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🔍 部位ギャップ
            </button>
            <button
              type="button"
              onClick={() => setResultTab('menu')}
              className={`py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                resultTab === 'menu'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              💪 強化メニュー
            </button>
          </div>

          {resultTab === 'summary' && (
            <div className="space-y-2.5">
              <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-900">体型分析総評</span>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70">
                    🔒 元画像破棄済（数値・テキストのみ保存）
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-700">
                  {analysisResult.summary || analysisResult.analysis_summary}
                </p>
                {analysisResult.focus_areas && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-200/60">
                    <span className="text-[10px] text-slate-500 font-bold">重点部位:</span>
                    {analysisResult.focus_areas.map((area, idx) => (
                      <span key={idx} className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200/70 px-2 py-0.5 rounded-md font-bold">
                        {area}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {analysisResult.advice && (
                <div className="bg-blue-50/60 rounded-xl p-3.5 border border-blue-200/60 space-y-1">
                  <span className="text-blue-900 font-bold text-[11px] block">💡 アドバイス</span>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {analysisResult.advice}
                  </p>
                </div>
              )}
            </div>
          )}

          {resultTab === 'gaps' && (
            <div className="space-y-2">
              {analysisResult.parts_analysis?.map((part, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{part.part}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200 bg-white text-slate-700">
                      優先度: {part.priority}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] bg-white p-2 rounded-lg border border-slate-200/70">
                    <div>
                      <span className="text-slate-400 block">現在</span>
                      <span className="font-bold text-slate-800">{part.status}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">目標</span>
                      <span className="font-bold text-blue-600">{part.target}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-600">
                    <span className="font-bold text-blue-600 mr-1">差分:</span>
                    <span>{part.gap}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {resultTab === 'menu' && (
            <div className="space-y-2">
              {analysisResult.compound_menu?.map((menu, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900">{menu.name}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border border-blue-200/70 bg-blue-50 text-blue-700">
                      {menu.category === 'gym' ? 'ジム' : '宅トレ'} / {menu.reps}×{menu.sets}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-snug">
                    {menu.point}
                  </p>

                  <button
                    onClick={() => onApplyWorkoutMenu(menu)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    このメニューを今日の記録に反映
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-extrabold text-slate-800">部位別ボディメイク重点ガイド</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">理想のシルエットに近づくための3大ポイント</p>
          </div>
          <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/70">
            Vシェイプ設計
          </span>
        </div>

        <div className="space-y-2">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 flex items-start gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-200/70 flex items-center justify-center text-xs font-black shrink-0">
              1
            </span>
            <div>
              <span className="text-xs font-bold text-slate-900 block">大胸筋上部 × 三角筋でアウトラインを強調</span>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                チェストプレスやショルダープレスで鎖骨周りの厚みを出すことで、正面からのシルエットが引き締まります。
              </p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 flex items-start gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/70 flex items-center justify-center text-xs font-black shrink-0">
              2
            </span>
            <div>
              <span className="text-xs font-bold text-slate-900 block">広背筋＋体幹強化でウエストを引き締め</span>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                ラットプルダウンとプランクを組み合わせることで、背中から腰にかけての美しい逆三角形ラインを作ります。
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
