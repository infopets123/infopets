import React from 'react';
import { AppTab } from '../types';
import { Home, Map, MessageCircle, PenTool, CreditCard, LogOut, Bird } from 'lucide-react';
import { logoutUser } from '../services/db';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onLogout: () => void;
}

// Custom Pattern with Paws, Bones, Cats and Dogs
const petPattern = `data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg' fill='%233b82f6' fill-opacity='0.06'%3E%3C!-- Paw --%3E%3Cpath d='M12 2C10 2 9 4 9 6C9 8 10 9 12 9C14 9 15 8 15 6C15 4 14 2 12 2ZM6 7C4 7 3 9 3 11C3 13 4 14 6 14C8 14 9 13 9 11C9 9 8 7 6 7ZM18 7C16 7 15 9 15 11C15 13 16 14 18 14C20 14 21 13 21 11C21 9 20 7 18 7ZM12 11C9 11 7 13 7 17C7 21 9 23 12 23C15 23 17 21 17 17C17 13 15 11 12 11Z' transform='translate(5, 5)'/%3E%3C!-- Bone --%3E%3Cpath d='M20.6 9.4C19.5 8.3 17.7 8.3 16.6 9.4L6.6 19.4C5.5 18.3 3.7 18.3 2.6 19.4C1.5 20.5 1.5 22.3 2.6 23.4C3.7 24.5 5.5 24.5 6.6 23.4L16.6 13.4C17.7 14.5 19.5 14.5 20.6 13.4C21.7 12.3 21.7 10.5 20.6 9.4Z' transform='translate(40, 5) scale(1.2)'/%3E%3C!-- Cat Head --%3E%3Cpath d='M8 18L6 8L12 12L18 8L16 18C16 22 12 24 12 24C12 24 8 22 8 18Z' transform='translate(10, 50) scale(1.2)'/%3E%3C!-- Dog Head (Simplified) --%3E%3Cpath d='M12 2C7 2 3 7 3 12C3 17 7 22 12 22C17 22 21 17 21 12C21 7 17 2 12 2ZM8 8C9 8 10 9 10 10C10 11 9 12 8 12C7 12 6 11 6 10C6 9 7 8 8 8ZM16 8C17 8 18 9 18 10C18 11 17 12 16 12C15 12 14 11 14 10C14 9 15 8 16 8ZM12 18C10 18 8 16 8 16H16C16 16 14 18 12 18Z' transform='translate(60, 60)'/%3E%3C!-- Small Paw --%3E%3Cpath d='M12 2C10 2 9 4 9 6C9 8 10 9 12 9C14 9 15 8 15 6C15 4 14 2 12 2ZM6 7C4 7 3 9 3 11C3 13 4 14 6 14C8 14 9 13 9 11C9 9 8 7 6 7ZM18 7C16 7 15 9 15 11C15 13 16 14 18 14C20 14 21 13 21 11C21 9 20 7 18 7ZM12 11C9 11 7 13 7 17C7 21 9 23 12 23C15 23 17 21 17 17C17 13 15 11 12 11Z' transform='translate(80, 20) scale(0.6)'/%3E%3C/svg%3E`;

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, onLogout }) => {
  
  const handleLogout = () => {
    logoutUser();
    onLogout();
  };

  const NavItem = ({ tab, icon: Icon, label }: { tab: AppTab, icon: any, label: string }) => (
    <button
      onClick={() => onTabChange(tab)}
      className={`flex flex-col items-center justify-center p-2 w-full transition-all duration-300 ${
        activeTab === tab ? 'text-blue-500 scale-110' : 'text-gray-400 hover:text-blue-300'
      }`}
    >
      <div className={`p-1.5 rounded-2xl ${activeTab === tab ? 'bg-blue-100' : 'bg-transparent'}`}>
         <Icon size={24} strokeWidth={activeTab === tab ? 2.5 : 2} />
      </div>
      <span className={`text-[10px] mt-0.5 font-bold ${activeTab === tab ? 'text-blue-600' : 'text-gray-400'}`}>{label}</span>
    </button>
  );

  return (
    <div className="h-screen bg-blue-50 flex flex-col relative overflow-hidden text-gray-800 font-sans">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-100" style={{ backgroundImage: `url("${petPattern}")` }} />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-20 shadow-sm px-4 py-3 flex justify-between items-center shrink-0 border-b border-blue-100">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 transform rotate-3">
            <Bird size={24} fill="currentColor" />
          </div>
          <div>
             <h1 className="text-xl font-black bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent leading-none">
              InfoPets
            </h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Seu app animal</p>
          </div>
        </div>
        <button onClick={handleLogout} className="text-gray-300 hover:text-red-500 transition-colors p-2 bg-white rounded-xl shadow-sm border border-gray-50">
          <LogOut size={20} />
        </button>
      </header>

      {/* Main Content */}
      <main className={`relative flex-1 z-10 w-full max-w-2xl mx-auto flex flex-col ${activeTab === AppTab.MAP ? 'pb-[68px] overflow-hidden' : 'p-4 pb-28 overflow-y-auto'}`}>
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-blue-100 z-30 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.02)]">
        <div className="flex justify-between items-center max-w-2xl mx-auto px-2 pt-2 pb-1">
          <NavItem tab={AppTab.HOME} icon={Home} label="Pets" />
          <NavItem tab={AppTab.MAP} icon={Map} label="Clínicas" />
          <NavItem tab={AppTab.ASSISTANT} icon={MessageCircle} label="IA" />
          <NavItem tab={AppTab.TOOLS} icon={PenTool} label="Ferramentas" />
          <NavItem tab={AppTab.PREMIUM} icon={CreditCard} label="Premium" />
        </div>
      </nav>
    </div>
  );
};

export default Layout;