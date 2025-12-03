import React, { useState, useEffect } from 'react';
import { Pet, Vaccine, User } from '../types';
import { getCurrentUser, getPets, addPet, deletePet, getVaccines, addVaccine } from '../services/db';
import { Plus, Trash2, Syringe, Calendar, Camera, X, ChevronRight, Weight, PawPrint, Upload, Image as ImageIcon, Eye } from 'lucide-react';

const SpeciesList = ['cachorro', 'gato', 'cavalo', 'hamster', 'coelho', 'pássaro', 'peixe', 'outros'];

// Mapeamento de imagens padrão por espécie (URLs do Unsplash para garantir qualidade)
const DEFAULT_PET_IMAGES: Record<string, string> = {
  cachorro: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=300&q=80',
  gato: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=300&q=80',
  cavalo: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=300&q=80',
  hamster: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?auto=format&fit=crop&w=300&q=80',
  coelho: 'https://images.unsplash.com/photo-1585110396000-c92857427706?auto=format&fit=crop&w=300&q=80',
  pássaro: 'https://images.unsplash.com/photo-1552728089-57bdde30ebd1?auto=format&fit=crop&w=300&q=80',
  peixe: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=300&q=80',
  outros: 'https://images.unsplash.com/photo-1596707328606-2c63836d9333?auto=format&fit=crop&w=300&q=80'
};

export const Pets: React.FC = () => {
  const [currentUser] = useState<User | null>(getCurrentUser());
  const [pets, setPets] = useState<Pet[]>([]);
  const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

  // Correção: Carregamento Assíncrono
  useEffect(() => {
    const loadPets = async () => {
        if (currentUser) {
            try {
                const loadedPets = await getPets(currentUser.uid);
                setPets(loadedPets);
            } catch (error) {
                console.error("Erro ao carregar pets:", error);
            }
        }
    };
    loadPets();
  }, [currentUser, view]);

  if (!currentUser) return null;

  const handleDeletePet = async (id: string) => {
    if (confirm('Tem certeza que deseja apagar este pet?')) {
      await deletePet(id);
      const updatedPets = await getPets(currentUser.uid);
      setPets(updatedPets);
      if (selectedPet?.petId === id) {
        setSelectedPet(null);
        setView('list');
      }
    }
  };

  return (
    <div>
      {view === 'list' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-gray-800">Meus Pets</h2>
            <button 
              onClick={() => setView('create')}
              className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-2xl shadow-lg shadow-blue-200 transition-transform active:scale-95"
            >
              <Plus size={24} strokeWidth={3} />
            </button>
          </div>

          {pets.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-[2rem] shadow-sm border border-blue-50">
               <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-300 mb-4 animate-bounceIn">
                  <PawPrint size={40} />
               </div>
               <p className="text-gray-500 font-medium">Nenhum pet cadastrado.</p>
               <button onClick={() => setView('create')} className="mt-4 text-blue-500 font-bold hover:underline">Cadastrar o primeiro</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pets.map(pet => (
                <div 
                  key={pet.petId}
                  onClick={() => { setSelectedPet(pet); setView('detail'); }}
                  className="bg-white p-4 rounded-3xl shadow-sm border border-gray-50 flex items-center gap-4 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group"
                >
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                    {pet.fotoUrl ? (
                      <img src={pet.fotoUrl} alt={pet.nome} className="w-full h-full object-cover" />
                    ) : (
                      <PawPrint className="text-blue-300" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-gray-800 text-lg">{pet.nome}</h3>
                    <p className="text-xs text-gray-500 capitalize font-bold bg-blue-50 px-2 py-0.5 rounded-lg inline-block">{pet.especie} • {pet.raca}</p>
                  </div>
                  <ChevronRight className="ml-auto text-blue-200" size={24} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'create' && (
        <CreatePetForm 
          ownerId={currentUser.uid} 
          onCancel={() => setView('list')} 
          onSuccess={() => setView('list')} 
        />
      )}

      {view === 'detail' && selectedPet && (
        <PetDetail 
          pet={selectedPet} 
          onBack={() => { setSelectedPet(null); setView('list'); }}
          onDelete={() => handleDeletePet(selectedPet.petId)}
        />
      )}
    </div>
  );
};

const CreatePetForm: React.FC<{ ownerId: string, onCancel: () => void, onSuccess: () => void }> = ({ ownerId, onCancel, onSuccess }) => {
  const [formData, setFormData] = useState<Partial<Pet>>({
    especie: 'cachorro',
    fotoUrl: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, fotoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.pesoKg || isSubmitting) return;

    setIsSubmitting(true);
    // Seleciona a imagem padrão baseada na espécie se o usuário não enviou uma
    const especieKey = formData.especie || 'outros';
    const defaultImage = DEFAULT_PET_IMAGES[especieKey] || DEFAULT_PET_IMAGES['outros'];

    const newPet: Pet = {
      petId: 'pet_' + Date.now(),
      donoId: ownerId,
      nome: formData.nome,
      especie: formData.especie as any,
      raca: formData.raca || 'Desconhecida',
      dataNascimento: formData.dataNascimento || new Date().toISOString(),
      pesoKg: Number(formData.pesoKg),
      fotoUrl: formData.fotoUrl || defaultImage,
      criadoEm: Date.now()
    };
    
    await addPet(newPet);
    setIsSubmitting(false);
    onSuccess();
  };

  // Helper to safely get date string YYYY-MM-DD
  const getDateValue = (isoDate?: string) => {
    if (!isoDate) return '';
    try {
      return isoDate.split('T')[0];
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 animate-slideUp">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-black text-gray-800">Novo Pet</h3>
        <button onClick={onCancel} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:bg-gray-200">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Profile Photo Upload */}
        <div className="flex flex-col items-center mb-4">
           <label className="relative cursor-pointer group">
              <div className="w-32 h-32 rounded-full bg-blue-50 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden group-hover:border-blue-200 transition-all">
                 {formData.fotoUrl ? (
                   <img src={formData.fotoUrl} className="w-full h-full object-cover" alt="Preview" />
                 ) : (
                   <Camera size={32} className="text-blue-300" />
                 )}
              </div>
              <div className="absolute bottom-1 right-1 bg-blue-500 text-white p-2.5 rounded-full shadow-md group-hover:scale-110 transition-transform">
                 <Plus size={20} strokeWidth={3} />
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
           </label>
           <span className="text-xs text-blue-400 mt-2 font-bold uppercase tracking-wide">Adicionar foto</span>
        </div>

        <div>
          <label className="block text-xs font-black text-gray-400 uppercase mb-2 pl-2">Nome</label>
          <input 
            className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:bg-white focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold text-gray-700" 
            placeholder="Ex: Rex"
            value={formData.nome || ''}
            onChange={e => setFormData({...formData, nome: e.target.value})}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-2 pl-2">Espécie</label>
            <div className="relative">
              <select 
                className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:bg-white focus:ring-4 focus:ring-blue-100 outline-none capitalize font-bold text-gray-700 appearance-none"
                value={formData.especie}
                onChange={e => setFormData({...formData, especie: e.target.value as any})}
              >
                {SpeciesList.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-2 pl-2">Raça</label>
            <input 
              className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:bg-white focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold text-gray-700" 
              placeholder="Ex: Poodle"
              value={formData.raca || ''}
              onChange={e => setFormData({...formData, raca: e.target.value})}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-2 pl-2">Peso (kg)</label>
            <input 
              type="number" step="0.1"
              className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:bg-white focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold text-gray-700" 
              value={formData.pesoKg || ''}
              onChange={e => setFormData({...formData, pesoKg: Number(e.target.value)})}
              required
            />
          </div>
           <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-2 pl-2">Nascimento</label>
            <input 
              type="date"
              className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:bg-white focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold text-gray-700" 
              value={getDateValue(formData.dataNascimento)}
              onChange={e => setFormData({...formData, dataNascimento: e.target.value})}
            />
          </div>
        </div>
        <button type="submit" disabled={isSubmitting} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-200 transition-transform active:scale-95 mt-6 disabled:opacity-70">
          {isSubmitting ? 'Salvando...' : 'Salvar Pet'}
        </button>
      </form>
    </div>
  );
};

const PetDetail: React.FC<{ pet: Pet, onBack: () => void, onDelete: () => void }> = ({ pet, onBack, onDelete }) => {
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [showAddVaccine, setShowAddVaccine] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Correção: Carregamento Assíncrono
  useEffect(() => {
    const loadVaccines = async () => {
        try {
            const v = await getVaccines(pet.petId);
            setVaccines(v);
        } catch (error) {
            console.error("Erro ao carregar vacinas", error);
        }
    };
    loadVaccines();
  }, [pet.petId, showAddVaccine]);

  const calculateAge = (dob: string) => {
    if (!dob) return '';
    const diff = Date.now() - new Date(dob).getTime();
    const ageDate = new Date(diff); 
    return Math.abs(ageDate.getUTCFullYear() - 1970) + ' anos';
  };

  const isDueSoon = (date: string) => {
    if (!date) return false;
    const due = new Date(date).getTime();
    const now = Date.now();
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  };

  return (
    <div className="animate-fadeIn">
      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
          <div className="bg-white p-2 rounded-2xl max-w-full max-h-full relative overflow-auto shadow-2xl animate-bounceIn">
             <img src={previewImage} alt="Rótulo ampliado" className="max-w-full max-h-[80vh] rounded-xl" />
             <button className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-2" onClick={() => setPreviewImage(null)}>
               <X size={20} />
             </button>
          </div>
        </div>
      )}

      <button onClick={onBack} className="text-blue-500 font-bold mb-4 flex items-center gap-1 hover:underline pl-2">
        ← Voltar
      </button>

      <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 relative mb-6">
        <button onClick={onDelete} className="absolute top-6 right-6 text-gray-300 hover:text-red-500 p-2 bg-gray-50 rounded-full">
          <Trash2 size={20} />
        </button>
        
        <div className="flex flex-col items-center">
           <div className="w-32 h-32 bg-blue-100 rounded-[2rem] flex items-center justify-center overflow-hidden mb-4 border-4 border-white shadow-xl rotate-3 hover:rotate-0 transition-transform duration-300">
               {pet.fotoUrl ? (
                 <img src={pet.fotoUrl} alt={pet.nome} className="w-full h-full object-cover" />
               ) : (
                 <PawPrint size={48} className="text-blue-300" />
               )}
           </div>
           <h2 className="text-3xl font-black text-gray-800">{pet.nome}</h2>
           <p className="text-gray-500 font-bold bg-blue-50 px-3 py-1 rounded-full mt-2 capitalize">{pet.especie} • {pet.raca}</p>
           
           <div className="grid grid-cols-2 gap-4 mt-8 w-full">
             <div className="bg-blue-50 p-4 rounded-3xl text-center">
                <p className="text-[10px] text-blue-400 font-black uppercase tracking-wider mb-1">Idade</p>
                <p className="font-bold text-gray-700 text-lg">{calculateAge(pet.dataNascimento)}</p>
             </div>
             <div className="bg-blue-50 p-4 rounded-3xl text-center">
                <p className="text-[10px] text-blue-400 font-black uppercase tracking-wider mb-1">Peso</p>
                <div className="flex items-center justify-center gap-1">
                   <Weight size={16} className="text-blue-400"/>
                   <p className="font-bold text-gray-700 text-lg">{pet.pesoKg} kg</p>
                </div>
             </div>
           </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4 px-2">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Syringe className="text-blue-500" size={24} /> Vacinas
        </h3>
        <button onClick={() => setShowAddVaccine(true)} className="text-blue-500 text-sm font-bold hover:bg-blue-50 px-3 py-1 rounded-lg transition-colors">
          + Adicionar
        </button>
      </div>

      {showAddVaccine && (
        <AddVaccineForm petId={pet.petId} onCancel={() => setShowAddVaccine(false)} onSuccess={() => setShowAddVaccine(false)} />
      )}

      <div className="space-y-3">
        {vaccines.length === 0 && !showAddVaccine && (
           <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-2xl border border-dashed border-gray-200">
             Nenhuma vacina registrada ainda.
           </div>
        )}
        {vaccines.map(vac => (
          <div key={vac.vacinaId} className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col relative shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className={`mt-1 w-4 h-4 rounded-full border-2 border-white shadow-sm flex-shrink-0 ${vac.aplicada ? 'bg-green-500' : 'bg-blue-400'}`} />
              <div className="flex-1">
                <p className="font-bold text-gray-800 text-lg">{vac.observacoes || 'Vacina'}</p>
                <div className="text-xs text-gray-500 mt-2 flex flex-wrap gap-3">
                   <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg font-bold"><Calendar size={12}/> 1ª Dose: {new Date(vac.dataPrimeiraDose).toLocaleDateString()}</span>
                   {vac.dataProximaDose && (
                     <span className={`flex items-center gap-1 font-bold px-2 py-1 rounded-lg ${isDueSoon(vac.dataProximaDose) ? 'bg-red-50 text-red-500 animate-pulse' : 'bg-gray-50'}`}>
                        <Calendar size={12}/> Próxima: {new Date(vac.dataProximaDose).toLocaleDateString()}
                     </span>
                   )}
                </div>
              </div>
            </div>
            
            {/* Vaccine Label Photo */}
            {vac.fotoCarteira && (
              <div className="mt-4 ml-8">
                <button 
                  onClick={() => setPreviewImage(vac.fotoCarteira || null)}
                  className="flex items-center gap-3 bg-gray-50 hover:bg-blue-50 border border-gray-100 rounded-xl p-2 transition-colors text-xs font-bold text-gray-600 w-full sm:w-auto"
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden shrink-0 border border-white shadow-sm">
                     <img src={vac.fotoCarteira} className="w-full h-full object-cover" alt="Rótulo" />
                  </div>
                  <span className="flex-1 text-left">Ver Comprovante</span>
                  <Eye size={16} className="text-blue-500" />
                </button>
              </div>
            )}

            {isDueSoon(vac.dataProximaDose) && (
              <span className="absolute top-4 right-4 bg-red-100 text-red-600 text-[10px] px-2 py-1 rounded-lg font-black uppercase tracking-wide">
                Vence em breve!
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const AddVaccineForm: React.FC<{ petId: string, onCancel: () => void, onSuccess: () => void }> = ({ petId, onCancel, onSuccess }) => {
  const [data, setData] = useState<Partial<Vaccine>>({});
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.dataPrimeiraDose || isSubmitting) return;

    setIsSubmitting(true);
    await addVaccine({
      vacinaId: 'vac_' + Date.now(),
      petId,
      dataPrimeiraDose: data.dataPrimeiraDose,
      dataProximaDose: data.dataProximaDose || '',
      aplicada: true,
      observacoes: data.observacoes || 'Nova Vacina',
      fotoCarteira: photoPreview
    });
    setIsSubmitting(false);
    onSuccess();
  };

  return (
    <div className="bg-blue-50/50 p-5 rounded-3xl mb-4 border border-blue-100 animate-slideUp">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-[10px] uppercase text-blue-400 font-black pl-2 mb-1 block">Nome da Vacina</label>
          <input 
            className="w-full p-3 rounded-xl border border-blue-100 focus:bg-white focus:ring-2 focus:ring-blue-200 text-sm font-bold outline-none" 
            placeholder="Ex: Raiva, V10..."
            onChange={e => setData({...data, observacoes: e.target.value})}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
           <div>
             <label className="text-[10px] uppercase text-blue-400 font-black pl-2 mb-1 block">Data Dose</label>
             <input type="date" className="w-full p-3 rounded-xl border border-blue-100 focus:bg-white focus:ring-2 focus:ring-blue-200 text-sm font-bold outline-none text-gray-600" onChange={e => setData({...data, dataPrimeiraDose: e.target.value})} required />
           </div>
           <div>
             <label className="text-[10px] uppercase text-blue-400 font-black pl-2 mb-1 block">Próxima Dose</label>
             <input type="date" className="w-full p-3 rounded-xl border border-blue-100 focus:bg-white focus:ring-2 focus:ring-blue-200 text-sm font-bold outline-none text-gray-600" onChange={e => setData({...data, dataProximaDose: e.target.value})} />
           </div>
        </div>

        {/* Photo Upload for Vaccine Label */}
        <div>
           <label className="flex items-center gap-3 cursor-pointer bg-white border-2 border-dashed border-blue-200 p-3 rounded-xl hover:bg-blue-50 transition-colors group">
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              {photoPreview ? (
                <div className="flex items-center gap-3 w-full">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                    <img src={photoPreview} className="w-full h-full object-cover" alt="Preview" />
                  </div>
                  <span className="text-xs text-green-600 font-bold flex-1">Foto anexada!</span>
                  <button type="button" onClick={(e) => { e.preventDefault(); setPhotoPreview(''); }} className="p-1.5 bg-gray-100 hover:bg-red-100 rounded-full text-gray-400 hover:text-red-500">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-blue-100 p-2 rounded-full text-blue-400 group-hover:scale-110 transition-transform">
                     <Camera size={18} />
                  </div>
                  <span className="text-xs text-gray-500 font-bold">Anexar foto do rótulo</span>
                </>
              )}
           </label>
        </div>

        <div className="flex gap-3 justify-end mt-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-500 font-bold hover:text-gray-700">Cancelar</button>
          <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-black shadow-lg shadow-blue-100 disabled:opacity-70">
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
};