import React from 'react';
import { LogOut, RefreshCw, Shield, KeyRound, User as UserIcon } from 'lucide-react';

const AdminHeader = ({ adminUser, onLogout, onRefresh, refreshing, onChangePassword }) => {
  return (
    <header className="bg-[#13161c] border-b border-gray-800 sticky top-0 z-30 px-3 sm:px-6 py-3 flex items-center justify-between gap-2 text-white">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <div className="p-2 bg-gradient-to-tr from-amber-500 to-amber-300 text-black rounded-lg font-bold flex items-center justify-center flex-shrink-0">
          <Shield size={18} />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm sm:text-lg font-extrabold font-display leading-tight truncate">
            redkitindia Admin Portal
          </h1>
          <p className="text-[11px] text-gray-400 truncate hidden xs:block">
            System Control &amp; Digital Catalog
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
          title="Refresh Dashboard Data"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">Refresh</span>
        </button>

        <button
          onClick={onChangePassword}
          className="p-2 sm:px-3 sm:py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-400 text-xs font-bold transition-all flex items-center gap-1.5"
          title="Change Admin Password"
        >
          <KeyRound size={14} />
          <span className="hidden sm:inline">Change Password</span>
        </button>

        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-gray-800 text-xs text-gray-300">
          <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center border border-amber-500/30 flex-shrink-0">
            <UserIcon size={14} />
          </div>
          <div className="text-left max-w-[120px] sm:max-w-[200px]">
            <p className="font-bold text-white text-[12px] leading-tight truncate" title={adminUser?.name || 'Administrator'}>
              {adminUser?.name || 'Administrator'}
            </p>
            <p className="text-[10px] text-gray-400 truncate hidden sm:block">{adminUser?.email}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 p-2 sm:px-3 sm:py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;
