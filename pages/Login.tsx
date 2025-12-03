import React, { useState } from 'react';
import { Bird, AlertCircle, ArrowRight, Check, Lock, Mail, User } from 'lucide-react';
import { loginUser, registerUser, loginWithSocial, resetPassword } from '../services/db';

interface LoginProps {
  onLoginSuccess: () => void;
}

type AuthMode = 'login' | 'register' | 'forgot';

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Custom Pattern with Paws, Bones, Cats and Dogs
  const petPattern = `data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg' fill='%233b82f6' fill-opacity='0.08'%3E%3C!-- Paw --%3E%3Cpath d='M12 2C10 2 9 4 9 6C9 8 10 9 12 9C14 9 15 8 15 6C15 4 14 2 12 2ZM6 7C4 7 3 9 3 11C3 13 4 14 6 14C8 14 9 13 9 11C9 9 8 7 6 7ZM18 7C16 7 15 9 15 11C15 13 16 14 18 14C20 14 21 13 21 11C21 9 20 7 18 7ZM12 11C9 11 7 13 7 17C7 21 9 23 12 23C15 23 17 21 17 17C17 13 15 11 12 11Z' transform='translate(5, 5)'/%3E%3C!-- Bone --%3E%3Cpath d='M20.6 9.4C19.5 8.3 17.7 8.3 16.6 9.4L6.6 19.4C5.5 18.3 3.7 18.3 2.6 19.4C1.5 20.5 1.5 22.3 2.6 23.4C3.7 24.5 5.5 24.5 6.6 23.4L16.6 13.4C17.7 14.5 19.5 14.5 20.6 13.4C21.7 12.3 21.7 10.5 20.6 9.4Z' transform='translate(40, 5) scale(1.2)'/%3E%3C!-- Cat Head --%3E%3Cpath d='M8 18L6 8L12 12L18 8L16 18C16 22 12 24 12 24C12 24 8 22 8 18Z' transform='translate(10, 50) scale(1.2)'/%3E%3C!-- Dog Head (Simplified) --%3E%3Cpath d='M12 2C7 2 3 7 3 12C3 17 7 22 12 22C17 22 21 17 21 12C21 7 17 2 12 2ZM8 8C9 8 10 9 10 10C10 11 9 12 8 12C7 12 6 11 6 10C6 9 7 8 8 8ZM16 8C17 8 18 9 18 10C18 11 17 12 16 12C15 12 14 11 14 10C14 9 15 8 16 8ZM12 18C10 18 8 16 8 16H16C16 16 14 18 12 18Z' transform='translate(60, 60)'/%3E%3C!-- Small Paw --%3E%3Cpath d='M12 2C10 2 9 4 9 6C9 8 10 9 12 9C14 9 15 8 15 6C15 4 14 2 12 2ZM6 7C4 7 3 9 3 11C3 13 4 14 6 14C8 14 9 13 9 11C9 9 8 7 6 7ZM18 7C16 7 15 9 15 11C15 13 16 14 18 14C20 14 21 13 21 11C21 9 20 7 18 7ZM12 11C9 11 7 13 7 17C7 21 9 23 12 23C15 23 17 21 17 17C17 13 15 11 12 11Z' transform='translate(80, 20) scale(0.6)'/%3E%3C/svg%3E`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await loginUser(email, password);
        onLoginSuccess();
      } else if (mode === 'register') {
        if (!name) throw new Error("Nome é obrigatório");
        await registerUser(email, password, name);
        onLoginSuccess();
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setSuccessMsg('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
        setLoading(false);
        return; // Stay on forgot screen to show message
      }
    } catch (err: any) {
      // Traduzir erros comuns do Firebase
      let msg = err.message;
      if (msg.includes('auth/invalid-credential')) msg = 'E-mail ou senha incorretos.';
      if (msg.includes('auth/user-not-found')) msg = 'Usuário não encontrado.';
      if (msg.includes('auth/wrong-password')) msg = 'Senha incorreta.';
      if (msg.includes('auth/email-already-in-use')) msg = 'Este e-mail já está cadastrado.';
      if (msg.includes('auth/weak-password')) msg = 'A senha deve ter pelo menos 6 caracteres.';
      if (msg.includes('auth/too-many-requests')) msg = 'Muitas tentativas. Tente novamente mais tarde.';
      
      setError(msg || "Ocorreu um erro. Tente novamente.");
    } finally {
      if (mode !== 'forgot') setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setError('');
    setLoading(true);
    try {
      await loginWithSocial(provider);
      onLoginSuccess();
    } catch (err: any) {
      let msg = err.message;
      if (msg.includes('auth/popup-closed-by-user')) msg = "Login cancelado.";
      else if (msg.includes('auth/cancelled-popup-request')) msg = ""; // Ignore duplicate popup clicks
      else if (msg.includes('configuração')) msg = "Login social não configurado neste ambiente demo.";
      
      if(msg) setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-100" style={{ backgroundImage: `url("${petPattern}")` }} />

      <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md relative z-10 border border-white animate-slideUp">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200 transform rotate-3">
            <Bird size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">InfoPets</h1>
          <p className="text-gray-400 font-bold uppercase text-xs tracking-widest mt-1">Seu melhor amigo digital</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-blue-50 p-1.5 rounded-2xl mb-6 relative">
          <div 
             className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-out ${mode === 'register' ? 'left-[calc(50%+3px)]' : 'left-1.5'}`}
          />
          <button 
            onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-3 text-sm font-black rounded-xl relative z-10 transition-colors ${mode === 'login' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Entrar
          </button>
          <button 
            onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-3 text-sm font-black rounded-xl relative z-10 transition-colors ${mode === 'register' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Criar Conta
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="relative group">
              <User className="absolute left-4 top-4 text-gray-300 group-focus-within:text-blue-400 transition-colors" size={20} />
              <input
                type="text"
                placeholder="Seu Nome"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all font-bold text-gray-700 placeholder:font-normal"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={mode === 'register'}
              />
            </div>
          )}

          <div className="relative group">
            <Mail className="absolute left-4 top-4 text-gray-300 group-focus-within:text-blue-400 transition-colors" size={20} />
            <input
              type="email"
              placeholder="E-mail"
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all font-bold text-gray-700 placeholder:font-normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {mode !== 'forgot' && (
            <div className="relative group">
              <Lock className="absolute left-4 top-4 text-gray-300 group-focus-within:text-blue-400 transition-colors" size={20} />
              <input
                type="password"
                placeholder="Senha"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all font-bold text-gray-700 placeholder:font-normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 animate-bounceIn">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {successMsg && (
            <div className="bg-green-50 text-green-600 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 animate-bounceIn">
              <Check size={16} /> {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-200 transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Processando...' : mode === 'login' ? 'Acessar Conta' : mode === 'register' ? 'Cadastrar' : 'Recuperar Senha'}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        {/* Footer Actions */}
        <div className="mt-6 space-y-4">
          {mode === 'login' && (
            <button 
              onClick={() => { setMode('forgot'); setError(''); }}
              className="w-full text-center text-xs font-bold text-gray-400 hover:text-blue-500 transition-colors"
            >
              Esqueci minha senha
            </button>
          )}
          
          {mode === 'forgot' && (
             <button 
              onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
              className="w-full text-center text-xs font-bold text-gray-400 hover:text-blue-500 transition-colors"
            >
              Voltar para o login
            </button>
          )}

          {(mode === 'login' || mode === 'register') && (
            <>
              <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-gray-100"></div>
                  <span className="flex-shrink-0 mx-4 text-gray-300 text-[10px] font-black uppercase">Ou entre com</span>
                  <div className="flex-grow border-t border-gray-100"></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleSocialLogin('google')} className="flex items-center justify-center gap-2 bg-gray-50 hover:bg-white border border-gray-100 hover:border-gray-200 py-3 rounded-xl transition-all">
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                  <span className="text-xs font-bold text-gray-600">Google</span>
                </button>
                <button onClick={() => handleSocialLogin('apple')} className="flex items-center justify-center gap-2 bg-gray-50 hover:bg-white border border-gray-100 hover:border-gray-200 py-3 rounded-xl transition-all">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" className="w-4 h-4" alt="Apple" />
                  <span className="text-xs font-bold text-gray-600">Apple</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      
      <p className="text-[10px] text-blue-300 font-bold mt-8 text-center max-w-xs relative z-10 leading-relaxed">
         Seus dados são salvos com segurança na nuvem. Ao trocar de aparelho, basta fazer login novamente.
      </p>
    </div>
  );
};

export default Login;