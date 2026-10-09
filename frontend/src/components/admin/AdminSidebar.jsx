import React from 'react';
import { BookOpen, Activity, Package, Settings, PlusCircle, Database } from 'lucide-react';

const AdminSidebar = ({ activeTab, setActiveTab, onOpenCreateModal, onSeedCatalog }) => {
  const navItems = [
    { id: 'books', label: 'Book Catalog', icon: BookOpen },
    { id: 'orders', label: 'Digital Orders & Sales', icon: Package },
    { id: 'activity', label: 'Activity Logs', icon: Activity },
    { id: 'system', label: 'System Health', icon: Settings },
  ];

  return (
    <aside className="w-full md:w-64 bg-[#13161c] border-b md:border-b-0 md:border-r border-gray-800 p-4 space-y-6 flex-shrink-0">
      <div className="space-y-2">
        <button
          onClick={onOpenCreateModal}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-400 text-black font-extrabold py-2.5 px-4 rounded-xl text-xs sm:text-sm hover:brightness-110 active:scale-95 transition-all shadow-md"
        >
          <PlusCircle size={16} />
          <span>Add New Book</span>
        </button>

        <button
          onClick={onSeedCatalog}
          className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-gray-300 font-bold py-2 px-3 rounded-xl text-xs hover:bg-white/10 transition-all"
        >
          <Database size={14} />
          <span>Reset / Seed Catalog</span>
        </button>
      </div>

      <nav className="space-y-1">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 px-3 mb-2">
          Navigation
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                isActive
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default AdminSidebar;
