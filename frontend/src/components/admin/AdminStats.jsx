import React from 'react';
import { BookOpen, AlertTriangle, IndianRupee, Sparkles, Flame, Users } from 'lucide-react';

const AdminStats = ({ stats }) => {
  if (!stats) return null;

  const cards = [
    {
      title: 'Total Inventory',
      value: stats.books?.total || 0,
      subtext: `${stats.books?.inStock || 0} in stock`,
      icon: BookOpen,
      color: 'from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/30',
    },
    {
      title: 'Out of Stock',
      value: stats.books?.outOfStock || 0,
      subtext: 'Needs immediate restock',
      icon: AlertTriangle,
      color: 'from-red-500/20 to-red-600/5 text-red-400 border-red-500/30',
    },
    {
      title: 'Digital Sales Revenue',
      value: `₹${(stats.orders?.revenue || 0).toLocaleString()}`,
      subtext: `${stats.orders?.total || 0} digital orders placed`,
      icon: IndianRupee,
      color: 'from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/30',
    },
    {
      title: 'Featured & Bestsellers',
      value: `${stats.books?.featured || 0} / ${stats.books?.bestsellers || 0}`,
      subtext: `${stats.orders?.pendingRefunds || 0} pending refunds`,
      icon: Sparkles,
      color: 'from-amber-500/20 to-amber-600/5 text-amber-400 border-amber-500/30',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className={`bg-gradient-to-br ${c.color} border p-4 sm:p-5 rounded-2xl flex flex-col justify-between shadow-lg`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                {c.title}
              </span>
              <div className="p-2 bg-white/10 rounded-xl">
                <Icon size={18} />
              </div>
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white font-display">
                {c.value}
              </h3>
              <p className="text-[11px] opacity-70 mt-1">{c.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AdminStats;
