import React, { useState } from 'react';
import { getCurrentUser, updateUserPlan } from '../services/db';
import { verifyReceipt } from '../services/geminiService';
import { Check, Star, UploadCloud, Loader2, ShieldCheck, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export const Premium: React.FC = () => {
  const user = getCurrentUser();
  const [uploading, setUploading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{approved: boolean, details: string} | null>(null);
  const [selectedTargetPlan, setSelectedTargetPlan] = useState<'mensal' | 'anual' | null>(null);

  const getExpirationInfo = () => {
    if (!user || user.plano === 'free' || !user.planExpiresAt) return null;
    const now = Date.now();
    const diffMs = user.planExpiresAt - now;
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const expiresDate = new Date(user.planExpiresAt).toLocaleDateString('pt-BR');
    return { daysLeft, expiresDate };
  };

  const expirationInfo = getExpirationInfo();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !selectedTargetPlan) return;
    setUploading(true);
    setVerificationResult(null);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(',')[1];
      try {
        const result = await verifyReceipt(base64Data);
        setVerificationResult(result);
        if (result.approved) {
             await updateUserPlan(user.uid, selectedTargetPlan); 
             setTimeout(() => window.location.reload(), 2000);
        }
      } catch (err) {
        setVerificationResult({ approved: false, details: "Erro ao analisar imagem. Tente novamente." });
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const PlanCard = ({ type, title, price, period, features, highlightText }: { type: 'free' | 'mensal' | 'anual', title: string, price: string, period: string, features: string[], highlightText?: string }) => {
    const isCurrentPlan = user?.plano === type;
    const isSelected = selectedTargetPlan === type;
    let borderClass = 'border-gray-100';
    let bgClass = 'bg-white';
    let shadowClass = 'shadow-sm';

    if (isCurrentPlan) {
      borderClass = 'border-green-400';
      bgClass = 'bg-green-50/50';
    } else if (isSelected) {
      borderClass = 'border-blue-500';
      bgClass = 'bg-blue-50';
      shadowClass = 'shadow-xl ring-2 ring-blue-200';
    }

    return (
      <div className={`p-6 rounded-[2rem] border-2 relative transition-all duration-300 ${borderClass} ${bgClass} ${shadowClass} flex flex-col`}>
          {isCurrentPlan && (
            <span className="absolute -top-3 right-6 bg-green-500 text-white text-[10px] font-black px-3 py-1 rounded-lg flex items-center gap-1 shadow-sm uppercase tracking-wide">
              <CheckCircle2 size={12} /> Plano Atual
            </span>
          )}
          
          <h3 className="font-black text-gray-800 text-xl mb-1">{title}</h3>
          <p className="text-3xl font-black text-blue-500 mb-2 tracking-tight">{price} <span className="text-sm text-gray-400 font-bold">{period}</span></p>
          
          {highlightText && (
            <p className="text-[10px] text-green-700 font-bold mb-4 bg-green-100 inline-block px-3 py-1 rounded-lg self-start uppercase">
              {highlightText}
            </p>
          )}
          
          <ul className="space-y-3 mt-2 mb-8 flex-1">
              {features.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                      <div className="bg-blue-100 p-1 rounded-full"><Check size={10} className="text-blue-600" strokeWidth={4} /></div> {f}
                  </li>
              ))}
          </ul>

          {type !== 'free' && !isCurrentPlan && (
            <button 
              onClick={() => { setSelectedTargetPlan(type); setVerificationResult(null); setTimeout(() => { document.getElementById('payment-section')?.scrollIntoView({ behavior: 'smooth' }); }, 100); }}
              className={`w-full py-3.5 rounded-2xl font-black transition-all active:scale-95 ${
                isSelected 
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-200' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {isSelected ? 'Plano Selecionado' : 'Selecionar Plano'}
            </button>
          )}
          {isCurrentPlan && type !== 'free' && ( <div className="w-full py-3 text-center text-green-600 font-bold text-sm bg-green-100 rounded-xl opacity-75 cursor-default">Plano Ativo</div> )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      
      {expirationInfo && (
        <div className={`rounded-[2.5rem] p-6 shadow-lg border-2 animate-slideUp relative overflow-hidden ${
           expirationInfo.daysLeft <= 2 ? 'bg-red-50 border-red-200' : 'bg-gray-900 border-gray-800 text-white'
        }`}>
          <div className="flex justify-between items-start mb-4 relative z-10">
             <div>
                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${expirationInfo.daysLeft <= 2 ? 'text-red-400' : 'text-gray-400'}`}>Sua Assinatura</p>
                <h3 className={`text-2xl font-black ${expirationInfo.daysLeft <= 2 ? 'text-red-700' : 'text-white'}`}>Plano {user?.plano === 'mensal' ? 'Mensal' : 'Anual'}</h3>
             </div>
             <div className={`p-2.5 rounded-2xl ${expirationInfo.daysLeft <= 2 ? 'bg-red-200 text-red-600' : 'bg-gray-800'}`}>
                {expirationInfo.daysLeft <= 2 ? <AlertTriangle size={24} /> : <ShieldCheck size={24} className="text-green-400" />}
             </div>
          </div>
          <div className="flex items-center gap-4 relative z-10">
             <div className={`flex-1 rounded-2xl p-4 ${expirationInfo.daysLeft <= 2 ? 'bg-white' : 'bg-gray-800'}`}>
                <div className="flex items-center gap-2 mb-1">
                   <Clock size={14} className={expirationInfo.daysLeft <= 2 ? 'text-red-500' : 'text-blue-400'} />
                   <span className={`text-[10px] font-black uppercase ${expirationInfo.daysLeft <= 2 ? 'text-red-400' : 'text-gray-400'}`}>Expira em</span>
                </div>
                <p className={`text-3xl font-black ${expirationInfo.daysLeft <= 2 ? 'text-red-600' : 'text-white'}`}>{expirationInfo.daysLeft} <span className="text-sm font-bold opacity-50">dias</span></p>
             </div>
             <div className="text-right pr-2">
                <p className={`text-[10px] uppercase font-bold ${expirationInfo.daysLeft <= 2 ? 'text-red-400' : 'text-gray-400'}`}>Válido até</p>
                <p className={`font-bold ${expirationInfo.daysLeft <= 2 ? 'text-red-700' : 'text-white'}`}>{expirationInfo.expiresDate}</p>
             </div>
          </div>
        </div>
      )}

      <div className="text-center mb-6">
         <h2 className="text-2xl font-black text-gray-800">Clube Premium</h2>
         <p className="text-gray-500 text-sm font-medium">Melhore a vida do seu melhor amigo</p>
      </div>

      <div className="grid gap-6">
          <PlanCard type="free" title="Gratuito" price="R$ 0,00" period="/mês" features={["Cadastro de 1 Pet", "Calculadora (1 Teste)", "Mapa Bloqueado"]} />
          <PlanCard type="mensal" title="Mensal" price="R$ 10,99" period="/mês" features={["Pets Ilimitados", "IA Assistente 24/7", "Mapa Veterinário GPS"]} />
          <PlanCard type="anual" title="Anual" price="R$ 119,99" period="/ano" highlightText="Ganhe 7 dias grátis" features={["Tudo do Mensal", "Prioridade no Suporte", "Carteirinha Digital"]} />
      </div>

      {selectedTargetPlan && (
        <div id="payment-section" className="bg-white rounded-[2.5rem] p-6 shadow-2xl border border-blue-100 mt-8 animate-slideUp relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 to-cyan-500"></div>
           <h3 className="font-black text-gray-800 flex items-center gap-2 mb-6 text-xl"><ShieldCheck className="text-blue-500" /> Finalizar Assinatura</h3>
           <div className="bg-blue-50 p-5 rounded-2xl text-sm text-gray-700 mb-6 border border-blue-100">
               <div className="flex justify-between items-center mb-4 pb-4 border-b border-blue-200">
                 <span className="text-gray-500 font-bold uppercase text-xs">Total a pagar</span>
                 <span className="text-2xl font-black text-blue-600">{selectedTargetPlan === 'mensal' ? 'R$ 10,99' : 'R$ 119,99'}</span>
               </div>
               <p className="mb-2 text-[10px] text-gray-400 uppercase font-black">Chave Pix (E-mail)</p>
               <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-blue-100 mb-2 shadow-sm">
                 <code className="flex-1 font-mono text-blue-600 text-center font-bold text-lg select-all">fitstartmpe@gmail.com</code>
               </div>
               <p className="text-xs text-gray-400 text-center font-medium mt-3">Copie a chave e faça o pagamento no seu banco.</p>
           </div>

           <div className={`border-2 border-dashed rounded-[2rem] p-8 text-center transition-colors ${verificationResult?.approved ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'}`}>
               {uploading ? (
                   <div className="flex flex-col items-center py-2">
                       <Loader2 className="animate-spin text-blue-500 mb-3" size={32} />
                       <p className="text-sm font-bold text-gray-600">Validando com Inteligência Artificial...</p>
                   </div>
               ) : verificationResult?.approved ? (
                  <div className="flex flex-col items-center py-2 animate-bounceIn">
                      <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-3 shadow-sm">
                        <CheckCircle2 size={32} />
                      </div>
                      <p className="font-black text-green-700 text-lg">Sucesso!</p>
                      <p className="text-sm text-green-600 font-medium">Seu plano foi ativado.</p>
                  </div>
               ) : (
                  <label className="cursor-pointer flex flex-col items-center py-2">
                      <div className="bg-blue-100 p-4 rounded-full text-blue-400 mb-3"><UploadCloud size={32} /></div>
                      <span className="font-black text-gray-700 text-lg">Enviar Comprovante</span>
                      <span className="text-xs text-gray-400 mt-1 font-medium">Clique para enviar a foto do Pix</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  </label>
               )}
           </div>
           {verificationResult && !verificationResult.approved && (
               <div className="mt-4 p-4 rounded-2xl text-xs font-bold bg-red-50 text-red-600 border border-red-100 flex items-center gap-2 animate-bounceIn">
                   <ShieldCheck size={16} /> {verificationResult.details}
               </div>
           )}
        </div>
      )}
    </div>
  );
};