
import React, { useState, useEffect, useRef } from 'react';
import * as Lucide from 'lucide-react';
import { Level, Question, SubItem } from './types';
import { generateQuiz } from './geminiService';

const { 
  Trophy, BookOpen, Brain, Rocket, Lock, 
  ChevronRight, Volume2, Home, CheckCircle2, 
  RefreshCw, GraduationCap, Music, Send, Play, AlertCircle, Eye
} = Lucide;

const LICENSE_KEY = "TKHA2026-PRO";

const App: React.FC = () => {
  const [isLicensed, setIsLicensed] = useState(false);
  const [licenseInput, setLicenseInput] = useState("");
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState<Level | null>(null);
  const [quizData, setQuizData] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userTFAnswers, setUserTFAnswers] = useState<Record<number, boolean>>({});
  const [shortAnswerInput, setShortAnswerInput] = useState("");
  const [showExplanation, setShowExplanation] = useState(false);
  
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const mathJax = (window as any).MathJax;
    if (mathJax && mathJax.typesetPromise) {
      mathJax.typesetPromise().catch(() => {});
    }
  }, [quizData, currentQuestionIndex, showResult, level, isLoading, showExplanation]);

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    // Ưu tiên giọng miền Nam nếu có
    const southernVoice = voices.find(v => v.name.includes('Linh') || v.name.includes('Southern'));
    const vnVoice = southernVoice || voices.find(v => v.lang.includes('vi'));
    
    if (vnVoice) utterance.voice = vnVoice;
    utterance.pitch = 1.2;
    utterance.rate = 1.0;
    utterance.lang = 'vi-VN';
    window.speechSynthesis.speak(utterance);
  };

  const playFeedback = (isCorrect: boolean) => {
    const correctMsgs = [
      "Trời ơi giỏi quá xá luôn nè con!",
      "Đúng rồi đó, con học kiểu này chắc đậu thủ khoa quá hà!",
      "Hay dữ thần ôn luôn, tiếp tục phát huy nghen!"
    ];
    const wrongMsgs = [
      "Hổng đúng rồi, coi kỹ lại chút xíu nghen con!",
      "Tiếc quá hà, sai một ly đi một dặm đó, ráng lên!",
      "Ủa ngộ nghen, câu này đâu có khó đâu nè, làm lại thử coi!"
    ];
    const msg = isCorrect ? correctMsgs[Math.floor(Math.random() * 3)] : wrongMsgs[Math.floor(Math.random() * 3)];
    speak(msg);
  };

  const handleStartQuiz = async (selectedLevel: Level) => {
    if (!topic.trim()) {
      alert("Nhập cái gì đó để học đi con!");
      return;
    }
    setError(null);
    setLevel(selectedLevel);
    setIsLoading(true);
    setQuizData([]);
    try {
      const data = await generateQuiz(topic, selectedLevel);
      setQuizData(data);
      setCurrentQuestionIndex(0);
      setScore(0);
      setShowResult(false);
      setUserTFAnswers({});
      setShortAnswerInput("");
      setShowExplanation(false);
    } catch (e: any) {
      setError("Lỗi rồi nè con ơi, mạng hay AI nó bị gì rồi á. Thử lại nghen!");
      setLevel(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (userAnswer: any) => {
    const currentQ = quizData[currentQuestionIndex];
    if (!currentQ) return;
    
    let isCorrect = false;
    if (currentQ.type === 'multiple-choice') {
      isCorrect = userAnswer === currentQ.answer;
      playFeedback(isCorrect);
      if (isCorrect) setScore(s => s + 1);
      nextStep();
    } else if (currentQ.type === 'true-false') {
      // Kiểm tra xem đã chọn đủ 4 ý chưa
      if (Object.keys(userTFAnswers).length < 4) {
        alert("Con phải chọn hết 4 ý mới nộp bài được nghen!");
        return;
      }
      // Tính điểm dựa trên số ý đúng (Logic THPT mới có thể phức tạp hơn, ở đây tính 1 câu đúng nếu đúng hết)
      const allCorrect = currentQ.subItems?.every((item, idx) => userTFAnswers[idx] === item.answer);
      playFeedback(!!allCorrect);
      if (allCorrect) setScore(s => s + 1);
      nextStep();
    } else if (currentQ.type === 'short-answer') {
      // So sánh tương đối cho câu trả lời ngắn
      isCorrect = shortAnswerInput.trim().toLowerCase() === currentQ.answer?.toString().toLowerCase();
      playFeedback(isCorrect);
      if (isCorrect) setScore(s => s + 1);
      setShowExplanation(true); // Luôn hiện đáp án cho cấp độ Về Đích
    }
  };

  const nextStep = () => {
    setTimeout(() => {
      setShowExplanation(false);
      setShortAnswerInput("");
      setUserTFAnswers({});
      if (currentQuestionIndex < quizData.length - 1) {
        setCurrentQuestionIndex(idx => idx + 1);
      } else {
        setShowResult(true);
      }
    }, 1500);
  };

  if (!isLicensed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-green-50 to-orange-50">
        <div className="quiz-card w-full max-w-md p-10 rounded-[2.5rem] text-center border-none shadow-2xl animate-fade-in">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Lock size={40} />
          </div>
          <h1 className="text-4xl font-black text-slate-800 mb-2">TKHA_2026</h1>
          <p className="text-slate-500 mb-8 font-medium italic">Học là phải đậu, không đậu là tại chưa học!</p>
          <form onSubmit={(e) => { e.preventDefault(); if(licenseInput.trim() === LICENSE_KEY) { setIsLicensed(true); speak("Chào mừng con đã tới với lò luyện thi của thầy nghen!"); } else alert("Mã sai rồi, coi lại đi con!"); }}>
            <input 
              type="text" 
              className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl mb-5 text-center font-bold tracking-widest text-slate-700 outline-none focus:ring-4 focus:ring-green-500/20"
              placeholder="MÃ BẢN QUYỀN"
              value={licenseInput}
              onChange={e => setLicenseInput(e.target.value)}
            />
            <button className="w-full py-5 btn-green rounded-2xl font-black text-lg shadow-xl shadow-green-100 active:scale-95 transition-all">VÀO LÒ LUYỆN THI</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      <audio ref={bgAudioRef} loop src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" />
      
      <header className="max-w-5xl mx-auto px-6 pt-12 text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-slate-800 text-white px-5 py-2 rounded-full text-sm font-black mb-6 shadow-lg">
          <GraduationCap size={18} className="text-green-400" /> TKHA_2026 - LUYỆN THI THPT
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-2">
          Học chủ đề: <span className="text-green-600 underline decoration-orange-400">{topic || "[Đang đợi con nhập...]"}</span>
        </h1>
      </header>

      <main className="max-w-5xl mx-auto px-6">
        {error && (
          <div className="quiz-card p-8 rounded-3xl border-rose-200 bg-rose-50 text-center mb-8 animate-fade-in">
            <AlertCircle className="mx-auto text-rose-500 mb-4" size={48} />
            <h3 className="text-xl font-bold text-rose-800 mb-2">Gặp trục trặc rồi!</h3>
            <p className="text-rose-600 mb-6 font-medium">{error}</p>
            <button onClick={() => { setError(null); setLevel(null); }} className="px-8 py-3 btn-orange rounded-xl font-bold">Làm lại từ đầu</button>
          </div>
        )}

        {!level || showResult ? (
          <div className="space-y-8 animate-fade-in">
            {!showResult && (
              <div className="quiz-card p-10 rounded-[2.5rem] border-none shadow-xl">
                <label className="block text-xl font-black text-slate-700 mb-5">Con muốn ôn kiến thức gì hôm nay?</label>
                <div className="relative">
                  <input 
                    type="text" 
                    className="w-full p-6 pr-20 bg-slate-50 border-2 border-slate-100 rounded-3xl text-2xl font-bold focus:ring-4 focus:ring-blue-500/10 outline-none"
                    placeholder="Ví dụ: Nguyên hàm, Oxyz, Lịch sử 12..."
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300">
                    <BookOpen size={32} />
                  </div>
                </div>
              </div>
            )}

            {!showResult && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { id: 'SIEU_DE', title: 'SIÊU DỄ', icon: <Play />, color: 'bg-emerald-500', desc: '12 Câu trắc nghiệm nhận biết (4 lựa chọn)' },
                  { id: 'THU_SUC', title: 'THỬ SỨC', icon: <Brain />, color: 'bg-orange-500', desc: '4 Câu Đúng/Sai (Thông hiểu & Vận dụng)' },
                  { id: 'VE_DICH', title: 'VỀ ĐÍCH', icon: <Rocket />, color: 'bg-indigo-600', desc: '6 Câu trả lời ngắn (Toán thực tế & Chuyên)' }
                ].map(lv => (
                  <button key={lv.id} onClick={() => handleStartQuiz(lv.id as Level)} className="quiz-card p-8 rounded-[2.5rem] flex flex-col items-center hover:-translate-y-3 transition-all shadow-xl group border-b-8 border-slate-200">
                    <div className={`w-16 h-16 rounded-2xl mb-6 text-white flex items-center justify-center ${lv.color} shadow-lg group-hover:scale-110 transition-transform`}>{lv.icon}</div>
                    <h3 className="text-2xl font-black text-slate-800 mb-2">{lv.title}</h3>
                    <p className="text-slate-400 font-medium leading-relaxed">{lv.desc}</p>
                  </button>
                ))}
              </div>
            )}

            {showResult && (
              <div className="quiz-card p-12 rounded-[3rem] text-center shadow-2xl animate-fade-in bg-white border-t-8 border-green-500">
                <Trophy className="mx-auto mb-6 text-amber-500 drop-shadow-lg" size={100} />
                <h2 className="text-4xl font-black text-slate-800 mb-2">KẾT QUẢ CUỐI CÙNG</h2>
                <p className="text-8xl font-black text-green-600 mb-10 tabular-nums">{score} / {quizData.length}</p>
                <div className="p-6 bg-slate-50 rounded-2xl mb-10 italic text-slate-600 font-medium">
                  {score === quizData.length ? "Tuyệt vời ông mặt trời luôn! Con đi thi là chỉ có đậu thôi!" : "Cũng tạm được rồi đó, nhưng ráng luyện thêm cho chắc cú nghen con!"}
                </div>
                <button onClick={() => { setLevel(null); setQuizData([]); setShowResult(false); }} className="px-12 py-5 btn-orange rounded-2xl font-black text-xl shadow-2xl hover:scale-105 transition-transform">LUYỆN CHỦ ĐỀ MỚI</button>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {isLoading ? (
              <div className="quiz-card p-20 rounded-[3rem] text-center space-y-8 animate-fade-in shadow-2xl">
                <div className="relative w-24 h-24 mx-auto">
                  <RefreshCw className="animate-spin text-green-500 w-full h-full" />
                  <div className="absolute inset-0 flex items-center justify-center text-green-600 font-black">AI</div>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-800 mb-2">Đang bốc đề thi cho con...</h3>
                  <p className="text-slate-400 font-bold italic">Chờ thầy xíu, AI đang soạn câu hỏi xịn nhất cho con nè!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-2">
                  <div className="flex items-center gap-4">
                    <button onClick={() => { if(confirm("Bỏ cuộc hả con?")) setLevel(null); }} className="p-4 bg-white rounded-2xl shadow-lg text-slate-400 hover:text-rose-500 transition-colors"><Home size={28} /></button>
                    <div>
                      <h4 className="text-xl font-black text-slate-800 tracking-tighter">CÂU {currentQuestionIndex + 1} / {quizData.length}</h4>
                      <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-black text-slate-500">{level}</span>
                    </div>
                  </div>
                  <div className="w-full md:w-80 h-4 bg-slate-200 rounded-full overflow-hidden border-4 border-white shadow-inner relative">
                    <div className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-1000" style={{ width: `${((currentQuestionIndex + 1) / quizData.length) * 100}%` }} />
                  </div>
                </div>

                <div className="quiz-card p-10 md:p-14 rounded-[3.5rem] shadow-2xl relative overflow-hidden bg-white border-b-8 border-slate-100">
                  <div className="content-text text-2xl md:text-3xl font-bold leading-relaxed mb-12 text-slate-800">
                    {quizData[currentQuestionIndex]?.content}
                  </div>

                  {quizData[currentQuestionIndex]?.type === 'multiple-choice' && (
                    <div className="grid grid-cols-1 gap-5">
                      {quizData[currentQuestionIndex].options?.map((opt, idx) => (
                        <button key={idx} onClick={() => handleAnswer(opt)} className="group p-6 text-left border-2 border-slate-100 rounded-[2rem] hover:border-green-500 hover:bg-green-50 transition-all flex items-center gap-6 active:scale-95 shadow-sm">
                          <div className="w-14 h-14 rounded-2xl bg-slate-100 group-hover:bg-green-500 group-hover:text-white flex items-center justify-center text-2xl font-black transition-colors shadow-inner">{String.fromCharCode(65 + idx)}</div>
                          <span className="text-xl font-bold text-slate-700 leading-tight">{opt}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {quizData[currentQuestionIndex]?.type === 'true-false' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 gap-6">
                        {quizData[currentQuestionIndex].subItems?.map((item, idx) => (
                          <div key={idx} className="flex flex-col sm:flex-row justify-between items-center p-6 bg-slate-50 rounded-3xl gap-6 border-l-8 border-orange-400">
                            <span className="text-xl font-bold text-slate-700 leading-snug flex-1">
                              {String.fromCharCode(97 + idx)}) {item.text}
                            </span>
                            <div className="flex gap-4">
                              <button 
                                onClick={() => setUserTFAnswers(prev => ({...prev, [idx]: true}))}
                                className={`px-8 py-4 rounded-2xl font-black text-lg transition-all shadow-md ${userTFAnswers[idx] === true ? 'bg-green-500 text-white scale-105' : 'bg-white text-green-600 border-2 border-green-100 hover:bg-green-50'}`}
                              >
                                ĐÚNG
                              </button>
                              <button 
                                onClick={() => setUserTFAnswers(prev => ({...prev, [idx]: false}))}
                                className={`px-8 py-4 rounded-2xl font-black text-lg transition-all shadow-md ${userTFAnswers[idx] === false ? 'bg-rose-500 text-white scale-105' : 'bg-white text-rose-600 border-2 border-rose-100 hover:bg-rose-50'}`}
                              >
                                SAI
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button onClick={handleAnswer} className="w-full py-6 bg-orange-500 text-white rounded-[2rem] font-black text-2xl shadow-2xl hover:bg-orange-600 transition-colors mt-8 flex items-center justify-center gap-4 active:scale-95">
                        NỘP BÀI CÂU NÀY <ChevronRight size={32} />
                      </button>
                    </div>
                  )}

                  {quizData[currentQuestionIndex]?.type === 'short-answer' && (
                    <div className="space-y-8">
                      <div className="relative">
                        <input 
                          type="text"
                          className="w-full p-8 bg-slate-50 border-4 border-dashed border-slate-200 rounded-[2.5rem] text-3xl font-black text-center focus:border-indigo-500 outline-none transition-colors"
                          placeholder="Nhập kết quả cuối cùng..."
                          value={shortAnswerInput}
                          onChange={e => setShortAnswerInput(e.target.value)}
                        />
                      </div>
                      
                      {showExplanation ? (
                        <div className="p-8 bg-indigo-50 rounded-[2.5rem] border-2 border-indigo-100 animate-in fade-in slide-in-from-top-4">
                          <h5 className="text-xl font-black text-indigo-800 mb-4 flex items-center gap-2"><Eye size={24}/> ĐÁP ÁN & HƯỚNG DẪN:</h5>
                          <div className="text-2xl font-bold text-indigo-700 mb-4 underline decoration-indigo-200">KẾT QUẢ: {quizData[currentQuestionIndex].answer}</div>
                          <p className="text-lg text-slate-600 leading-relaxed italic">{quizData[currentQuestionIndex].explanation || "Tự tin lên con, câu này giải theo hướng logic thực tế là ra hà!"}</p>
                          <button onClick={nextStep} className="mt-8 px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl w-full">TIẾP TỤC HÀNH TRÌNH</button>
                        </div>
                      ) : (
                        <button onClick={() => handleAnswer(null)} className="w-full py-6 bg-indigo-600 text-white rounded-[2.5rem] font-black text-2xl shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-4">
                          XÁC NHẬN KẾT QUẢ <Send size={28} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="fixed bottom-8 left-0 right-0 flex justify-center px-4 z-50">
        <div className="bg-slate-900/90 backdrop-blur-2xl shadow-2xl rounded-full px-10 py-4 border border-white/20 flex items-center gap-10 pointer-events-auto">
          <button onClick={() => { if(confirm("Quay lại trang chủ nghen con?")) { setLevel(null); setQuizData([]); setError(null); }}} className="text-white/40 hover:text-green-400 transition-colors"><Home size={32} /></button>
          <div className="w-px h-10 bg-white/10"></div>
          <button onClick={() => { if(bgAudioRef.current) { if(isMusicPlaying) bgAudioRef.current.pause(); else bgAudioRef.current.play(); setIsMusicPlaying(!isMusicPlaying); }}} className={`${isMusicPlaying ? 'text-orange-400' : 'text-white/40'} hover:text-orange-500 transition-colors`}><Music size={32} /></button>
          <div className="w-px h-10 bg-white/10"></div>
          <button onClick={() => speak("Cố gắng học nghen con, tương lai của con nằm ở cây bút trên tay đó!")} className="text-white/40 hover:text-blue-400 transition-colors"><Volume2 size={32} /></button>
        </div>
      </footer>
    </div>
  );
};

export default App;
