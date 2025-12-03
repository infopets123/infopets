import React, { useState } from 'react';
import { Calculator, Check, X, Search, Package, Loader2, Sparkles, AlertCircle, AlertTriangle, Bone, Cat, Dog, Lock, Coffee, Dumbbell } from 'lucide-react';
import { analyzePetFood, FoodAnalysisResult } from '../services/geminiService';
import { checkLimit, incrementUsage, getCurrentUser } from '../services/db';

export const Tools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'calc' | 'foods'>('calc');

  return (
    <div>
      <div className="flex space-x-2 mb-6 p-1.5 bg-white rounded-2xl shadow-sm border border-blue-100">
        <button
          onClick={() => setActiveTab('calc')}
          className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${activeTab === 'calc' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Calculadora
        </button>
        <button
          onClick={() => setActiveTab('foods')}
          className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${activeTab === 'foods' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Alimentos
        </button>
      </div>

      {activeTab === 'calc' ? <FoodCalculator /> : <FoodGuide />}
    </div>
  );
};

const FoodCalculator: React.FC = () => {
  const [weight, setWeight] = useState('');
  const [foodName, setFoodName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FoodAnalysisResult | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const user = getCurrentUser();

  const calculate = async () => {
    const w = parseFloat(weight);
    if (!w) return;
    if (!checkLimit('calc')) { setLimitReached(true); return; }
    
    setLoading(true);
    
    // --- INSTANT ESTIMATION LOGIC (Heuristics) ---
    const lowerName = foodName.toLowerCase();
    const isCat = lowerName.includes('gato') || lowerName.includes('cat') || lowerName.includes('feline');
    const isPuppy = lowerName.includes('filhote') || lowerName.includes('puppy') || lowerName.includes('kitten');
    const isPremium = lowerName.includes('premium') || lowerName.includes('super') || lowerName.includes('natural');

    // 1. Calculate Grams (Optimistic)
    // Cats need fewer grams per kg but more protein. Dogs vary.
    // Dog formula approx: 95 * kg^0.75 | Cat formula approx: 70 * kg^0.75 (higher density calories usually)
    const factor = isCat ? 70 : 95;
    const optimisticGrams = Math.round(factor * Math.pow(w, 0.75));

    // 2. Estimate Protein Percentage
    let estProteinPct = isCat ? 32 : 22; // Base: Cat 32%, Dog 22%
    if (isPuppy) estProteinPct += 4;     // Growth needs protein
    if (isPremium) estProteinPct += 3;   // Better quality usually higher protein

    // 3. Calculate Protein Grams
    const estProteinGrams = Math.round(optimisticGrams * (estProteinPct / 100));

    // 4. Estimate Fiber
    const estFiber = isPremium ? 3 : 4.5;

    // Set Immediate Result
    setResult({ 
      grams: optimisticGrams, 
      cups: `Aprox. ${(optimisticGrams / 100).toFixed(1)} xícaras`, 
      caloriesPerKg: isCat ? 4000 : 3600, 
      proteinPct: estProteinPct, 
      proteinGrams: estProteinGrams,
      fiberPct: estFiber, 
      qualityNote: "Refinando análise com IA...", 
      foodType: isPremium ? "Possível Premium" : "Standard" 
    });

    // --- END INSTANT ESTIMATION ---

    try {
      // Fetch accurate data from Gemini
      const data = await analyzePetFood(w, foodName);
      setResult(data);
      incrementUsage('calcTests');
    } catch (error) { 
      console.error(error); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 animate-fadeIn relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

      <h3 className="text-2xl font-black mb-2 flex items-center gap-2 text-gray-800 relative z-10">
        <Calculator className="text-blue-500" size={28} /> Ração Inteligente
      </h3>
      <p className="text-sm text-gray-500 mb-8 font-medium relative z-10">
        Descubra a porção ideal e a quantidade de proteína para seu pet.
      </p>

      {user?.plano === 'free' && (
          <div className="mb-6 bg-cyan-50 text-cyan-800 p-4 rounded-2xl text-xs flex items-start gap-2 border border-cyan-100 font-bold">
              <AlertTriangle size={16} className="mt-0.5 text-cyan-500" />
              <span>Plano Grátis: 1 teste disponível.</span>
          </div>
      )}

      {limitReached ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2rem] p-8 text-center">
            <Lock className="mx-auto mb-3 text-gray-300" size={40} />
            <h4 className="font-bold text-gray-800 mb-1 text-lg">Limite Atingido</h4>
            <p className="text-sm text-gray-500 mb-6 px-4">Faça o upgrade para calcular dietas ilimitadas para todos seus pets.</p>
            <button 
                onClick={() => { const premiumBtn = document.querySelectorAll('nav button')[4] as HTMLButtonElement; if(premiumBtn) premiumBtn.click(); }}
                className="bg-blue-500 text-white font-black py-3 px-6 rounded-xl w-full hover:bg-blue-600 transition-colors"
            >
                Liberar Agora
            </button>
        </div>
      ) : (
        <div className="space-y-5 mb-8">
            <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 pl-2">Qual ração seu pet come?</label>
            <div className="relative">
                <Package className="absolute left-4 top-4 text-blue-300" size={20} />
                <input type="text" value={foodName} onChange={(e) => setFoodName(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 text-sm font-bold text-gray-700 placeholder:font-normal" placeholder="Ex: Golden Gatos, Royal Canin..." />
            </div>
            </div>

            <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 pl-2">Peso do Pet (kg)</label>
                <div className="flex gap-3">
                    <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-1/3 p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 text-xl font-black text-center text-gray-800 placeholder:text-gray-300" placeholder="0.0" />
                    <button 
                        onClick={calculate} 
                        disabled={loading && result?.qualityNote === 'Refinando análise com IA...'}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-2xl font-black shadow-lg shadow-blue-200 active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                        Calcular
                    </button>
                </div>
            </div>
        </div>
      )}

      {result && (
        <div className="bg-blue-50 rounded-[2.5rem] p-6 text-center animate-slideUp border border-blue-100">
          <div className="mb-6">
             <div className="flex justify-center items-center gap-2 mb-3">
                <span className="bg-blue-200 text-blue-800 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  {result.foodType}
                </span>
             </div>
             <p className="text-gray-400 text-[10px] uppercase font-black tracking-widest mb-1">Recomendação Diária</p>
             <p className="text-6xl font-black text-blue-500 tracking-tighter drop-shadow-sm">{result.grams}<span className="text-2xl ml-1 text-blue-300">g</span></p>
             
             <div className="flex items-center justify-center gap-2 mt-3 text-blue-700 bg-white py-2 px-4 rounded-xl inline-flex mx-auto shadow-sm">
                <Coffee size={18} strokeWidth={2.5} className="text-blue-400" />
                <p className="text-sm font-bold">{result.cups}</p>
             </div>
          </div>

          {/* New Protein Card */}
          <div className="bg-white rounded-2xl p-4 mb-4 flex items-center justify-between border border-blue-100/50 shadow-sm relative overflow-hidden group">
             <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
                <Dumbbell size={64} className="text-blue-500" />
             </div>
             <div className="text-left">
                <p className="text-[10px] font-black text-blue-400 uppercase mb-0.5">Proteína Ingerida</p>
                <div className="flex items-baseline gap-1">
                   <span className="text-2xl font-black text-gray-800">{result.proteinGrams}g</span>
                   <span className="text-xs font-bold text-gray-400">/ dia</span>
                </div>
             </div>
             <div className="text-right">
                <p className="text-[10px] font-black text-gray-300 uppercase">Teor</p>
                <p className="text-xl font-black text-blue-500">{result.proteinPct}%</p>
             </div>
          </div>
          
          <div className="bg-white rounded-2xl p-4 mb-4 text-left shadow-sm border border-blue-100/50">
             <p className="text-[10px] font-black text-gray-400 uppercase mb-2 flex items-center gap-1">
               <Search size={12} /> Análise Nutricional
             </p>
             <p className="text-sm text-gray-600 leading-relaxed font-medium">
               {result.qualityNote}
             </p>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-blue-100 pt-4">
             <div className="text-center">
               <p className="text-blue-300 text-[10px] uppercase font-black">Calorias</p>
               <p className="text-lg font-black text-gray-700">~{result.caloriesPerKg} <span className="text-[10px] text-gray-400">kcal/kg</span></p>
            </div>
             <div className="text-center">
               <p className="text-blue-300 text-[10px] uppercase font-black">Fibra</p>
               <p className="text-lg font-black text-gray-700">{result.fiberPct}%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

type FoodStatus = 'safe' | 'moderate' | 'toxic';
interface FoodItem { name: string; status: FoodStatus; reason: string; target: 'dog' | 'cat' | 'both'; }

const FoodGuide: React.FC = () => {
    const [search, setSearch] = useState('');
    const foods: FoodItem[] = [
        { name: 'Arroz branco cozido', status: 'safe', target: 'dog', reason: 'Fácil digestão.' },
        { name: 'Frango cozido', status: 'safe', target: 'both', reason: 'Sem osso/pele/tempero.' },
        { name: 'Carne cozida magra', status: 'safe', target: 'both', reason: 'Sem sal. Ótima proteína.' },
        { name: 'Cenoura', status: 'safe', target: 'dog', reason: 'Crua ou cozida. Limpa dentes.' },
        { name: 'Maçã', status: 'safe', target: 'dog', reason: 'Sem sementes. Vitaminas.' },
        { name: 'Banana', status: 'safe', target: 'dog', reason: 'Rica em potássio.' },
        { name: 'Abóbora cozida', status: 'safe', target: 'both', reason: 'Fibras e digestão.' },
        { name: 'Batata-doce cozida', status: 'safe', target: 'dog', reason: 'Boa fonte de energia.' },
        { name: 'Ovos cozidos', status: 'safe', target: 'both', reason: 'Proteína excelente.' },
        { name: 'Peixe cozido', status: 'safe', target: 'both', reason: 'Sem espinhas. Ômega 3.' },
        { name: 'Pepino', status: 'safe', target: 'dog', reason: 'Baixa caloria.' },
        { name: 'Pão', status: 'moderate', target: 'both', reason: 'Pouco valor nutricional. Evite fermento.' },
        { name: 'Queijo', status: 'moderate', target: 'both', reason: 'Alguns pets são intolerantes à lactose.' },
        { name: 'Melancia', status: 'safe', target: 'dog', reason: 'Sem sementes e casca. Hidratante.' },
        { name: 'Chocolate', status: 'toxic', target: 'both', reason: 'Contém teobromina. Fatal.' },
        { name: 'Uva / Passas', status: 'toxic', target: 'both', reason: 'Causa falência renal.' },
        { name: 'Cebola / Alho', status: 'toxic', target: 'both', reason: 'Destrói glóbulos vermelhos.' },
        { name: 'Abacate', status: 'toxic', target: 'both', reason: 'Contém persina.' },
        { name: 'Xilitol', status: 'toxic', target: 'both', reason: 'Adoçante fatal. Causa hipoglicemia.' },
        { name: 'Café / Cafeína', status: 'toxic', target: 'both', reason: 'Afeta coração e sistema nervoso.' },
        { name: 'Ossos cozidos', status: 'toxic', target: 'both', reason: 'Podem perfurar o intestino.' },
        { name: 'Macadâmia', status: 'toxic', target: 'dog', reason: 'Afeta sistema nervoso e músculos.' }
    ];
    const filteredFoods = foods.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 animate-fadeIn min-h-[400px]">
             <h3 className="text-2xl font-black mb-6 flex items-center gap-2 text-gray-800">
                <Bone className="text-blue-500" size={28} /> Guia de Alimentos
            </h3>
            
            <div className="relative mb-6">
                <Search className="absolute left-4 top-3.5 text-gray-300" size={20} />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 text-sm font-bold text-gray-700" placeholder="Buscar alimento (ex: Uva, Chocolate)..." />
            </div>

            <div className="space-y-3">
                {filteredFoods.length === 0 && <div className="text-center text-gray-400 py-8 font-medium">Nenhum alimento encontrado.</div>}
                {filteredFoods.map((food, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-gray-50 hover:bg-blue-50/30 transition-colors">
                        <div>
                            <p className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                                {food.name}
                                {food.target === 'dog' && <Dog size={16} className="text-gray-300" />}
                                {food.target === 'cat' && <Cat size={16} className="text-gray-300" />}
                                {food.target === 'both' && <span className="flex"><Dog size={16} className="text-gray-300" /><Cat size={16} className="text-gray-300" /></span>}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 font-medium">{food.reason}</p>
                        </div>
                        <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 ${food.status === 'safe' ? 'bg-green-100 text-green-700' : ''} ${food.status === 'moderate' ? 'bg-amber-100 text-amber-700' : ''} ${food.status === 'toxic' ? 'bg-red-100 text-red-700' : ''}`}>
                            {food.status === 'safe' && <Check size={14} strokeWidth={3} />}
                            {food.status === 'moderate' && <AlertCircle size={14} strokeWidth={3} />}
                            {food.status === 'toxic' && <X size={14} strokeWidth={3} />}
                            {food.status === 'safe' ? 'Liberado' : food.status === 'moderate' ? 'Atenção' : 'Proibido'}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};