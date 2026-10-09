import React from 'react';
import { LogOut, RefreshCw, Shield, User as UserIcon } from 'lucide-react';

const AdminHeader = ({ adminUser, onLogout, onRefresh, refreshing }) => {
  return (
    <header className="bg-[#13161c] border-b border-gray-800 sticky top-0 z-30 px-4 sm:px-6 py-3 flex items-center justify-between text-white">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-tr from-amber-500 to-amber-300 text-black rounded-lg font-bold flex items-center justify-center">
          <Shield size={20} />
        </div>
        <div>
          <h1 className="text-base sm:text-lg font-extrabold font-display leading-tight">
            BookMart Admin Portal
          </h1>
          <p className="text-[11px] text-gray-400">
            System Control & Inventory Management
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
          title="Refresh Dashboard Data"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">Refresh</span>
        </button>

        <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-gray-800 text-xs text-gray-300">
          <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center border border-amber-500/30">
            <UserIcon size={14} />
          </div>
          <div className="text-left">
            <p className="font-bold text-white text-[12px] leading-tight">
              {adminUser?.name || 'Administrator'}
            </p>
            <p className="text-[10px] text-gray-400">{adminUser?.email}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 p-2 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;
