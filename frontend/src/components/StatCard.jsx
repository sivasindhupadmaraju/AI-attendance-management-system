import React from 'react';

const StatCard = ({ title, value, icon: Icon, description, trend, color = 'blue' }) => {
  const colorMap = {
    blue: {
      bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      glow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]',
    },
    green: {
      bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      glow: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]',
    },
    orange: {
      bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      glow: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]',
    },
    purple: {
      bg: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
      glow: 'hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]',
    },
  };

  const selectedColor = colorMap[color] || colorMap.blue;

  return (
    <div className={`glass-card p-6 rounded-2xl transition-all duration-300 ${selectedColor.glow}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-400 tracking-wide">{title}</p>
          <h3 className="text-3xl font-bold font-outfit mt-2 text-white">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl border ${selectedColor.bg}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {(description || trend) && (
        <div className="mt-4 flex items-center space-x-2">
          {trend && (
            <span className={`text-xs font-bold ${trend.type === 'positive' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trend.value}
            </span>
          )}
          {description && (
            <span className="text-xs text-slate-500 font-medium">{description}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
