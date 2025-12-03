import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Loader2, Bot, User, Lock } from 'lucide-react';
import { sendMessageToAssistant } from '../services/geminiService';
import { ChatMessage } from '../types';
import { checkLimit, incrementUsage, getCurrentUser, saveChatMessage, getChatHistory } from '../services/db';

export const Assistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = getCurrentUser();

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };
  
  // Load History on Mount
  useEffect(() => {
    const loadHistory = async () => {
      if (user) {
        try {
          const history = await getChatHistory(user.uid);
          if (history.length > 0) {
            setMessages(history);
          } else {
             const welcomeMsg: ChatMessage = {
                id: 'welcome',
                role: 'model',
                text: 'Olá! Sou sua assistente veterinária virtual. Posso ajudar com dicas de saúde, nutrição e cuidados. O que deseja saber?',
                timestamp: Date.now()
             };
             setMessages([welcomeMsg]);
             // Don't necessarily need to save welcome message to DB, but we can if desired.
          }
        } catch (error) {
          console.error("Failed to load chat history", error);
        }
      }
    };
    loadHistory();
  }, []); // Run once on mount (technically on user change too if we added user to dep array, but user is stable here)

  useEffect(() => { scrollToBottom(); }, [messages, limitReached]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1];
        setSelectedImage(base64Data);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if ((!inputText.trim() && !selectedImage) || loading) return;
    if (!checkLimit('ai')) { setLimitReached(true); return; }
    
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: inputText, imageUrl: selectedImage ? `data:image/jpeg;base64,${selectedImage}` : undefined, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    if (user) saveChatMessage(user.uid, userMsg);
    
    setInputText('');
    setLoading(true);
    const imageToSend = selectedImage;
    setSelectedImage(null);
    
    try {
        const responseText = await sendMessageToAssistant(userMsg.text, imageToSend || undefined);
        incrementUsage('aiQuestions');
        const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText, timestamp: Date.now() };
        setMessages(prev => [...prev, botMsg]);
        if (user) saveChatMessage(user.uid, botMsg);
    } catch (error) {
        const errorMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: "Desculpe, tive um erro de conexão. Tente novamente.", timestamp: Date.now() };
        setMessages(prev => [...prev, errorMsg]);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <div className="bg-white p-4 rounded-b-[2rem] shadow-sm mb-2 sticky top-0 z-10 border border-blue-50">
        <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
          <Bot className="text-blue-500" size={24} /> Assistente IA
        </h2>
        <p className="text-xs text-gray-400 font-bold">Powered by Gemini 2.5 • {user?.plano === 'free' ? 'Plano Grátis (2 msgs)' : 'Plano Premium'}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-[1.5rem] p-5 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white rounded-tr-sm'
                  : 'bg-white text-gray-700 border border-gray-100 rounded-tl-sm'
              }`}
            >
              {msg.imageUrl && (
                <img src={msg.imageUrl} alt="Upload" className="w-full h-32 object-cover rounded-xl mb-3 border-2 border-white/20" />
              )}
              <p className="text-sm whitespace-pre-wrap leading-relaxed font-medium">{msg.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start animate-pulse">
             <div className="bg-white p-4 rounded-[1.5rem] rounded-tl-sm border border-gray-100 flex items-center gap-3">
                <Loader2 className="animate-spin text-blue-500" size={20} />
                <span className="text-xs text-gray-400 font-bold">Pensando...</span>
             </div>
          </div>
        )}

        {limitReached && (
           <div className="flex justify-center my-4 animate-slideUp">
             <div className="bg-gray-800 text-white p-6 rounded-[2rem] shadow-xl w-full max-w-xs text-center border-4 border-white">
               <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Lock className="text-cyan-400" size={24} />
               </div>
               <h3 className="font-bold text-lg mb-1">Ops, limite atingido!</h3>
               <p className="text-xs text-gray-300 mb-4 px-2">Assine o Premium para conversar à vontade com nossa vet virtual.</p>
               <button 
                  onClick={() => { const premiumBtn = document.querySelectorAll('nav button')[4] as HTMLButtonElement; if(premiumBtn) premiumBtn.click(); }}
                  className="bg-blue-500 hover:bg-blue-400 text-white text-sm font-black py-3 px-6 rounded-xl w-full shadow-lg"
               >
                 Ver Planos
               </button>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white p-3 rounded-[2rem] shadow-[0_-5px_20px_rgba(0,0,0,0.05)] border border-blue-50 mt-2">
        {selectedImage && (
          <div className="mb-2 relative w-16 h-16 ml-2">
            <img src={`data:image/jpeg;base64,${selectedImage}`} className="w-full h-full object-cover rounded-xl border-2 border-blue-100" alt="Preview"/>
            <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md"><User size={12}/></button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <label className={`cursor-pointer p-3 rounded-full hover:bg-blue-50 transition-colors ${limitReached ? 'text-gray-300 cursor-not-allowed' : 'text-blue-400'}`}>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} disabled={limitReached} />
            <ImageIcon size={24} />
          </label>
          <input
            type="text"
            className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:text-gray-400 font-bold text-gray-700 placeholder:font-normal"
            placeholder={limitReached ? "Limite atingido" : "Digite sua dúvida..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={limitReached}
          />
          <button
            onClick={handleSend}
            disabled={loading || (!inputText && !selectedImage) || limitReached}
            className="p-3 bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-200 disabled:opacity-50 hover:bg-blue-600 transition-colors disabled:cursor-not-allowed transform active:scale-95"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};