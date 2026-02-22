import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Zap, 
  Wind, 
  Hand, 
  Sun, 
  Atom, 
  TrendingUp, 
  ShieldCheck, 
  Trophy,
  ArrowUpCircle,
  Settings,
  LayoutDashboard,
  Factory,
  ChevronRight,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState, Generator, Expansion, LeaderboardEntry } from './types';
import { INITIAL_GENERATORS, INITIAL_EXPANSIONS } from './constants';

const SAVE_KEY = 'neon_tycoon_save';

const IconMap: Record<string, any> = {
  Hand,
  Wind,
  Zap,
  Sun,
  Atom
};

export default function App() {
  const [state, setState] = useState<GameState>(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load save', e);
      }
    }
    return {
      money: 0,
      totalEarned: 0,
      generators: INITIAL_GENERATORS,
      expansions: INITIAL_EXPANSIONS,
      lastUpdate: Date.now(),
      prestigeLevel: 0
    };
  });

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'generators' | 'expansions' | 'leaderboard'>('generators');
  const socketRef = useRef<WebSocket | null>(null);

  // WebSocket Setup
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}`);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'LEADERBOARD_UPDATE') {
        setLeaderboard(data.leaderboard);
      }
    };

    return () => socket.close();
  }, []);

  const [username] = useState(() => {
    const saved = localStorage.getItem('neon_tycoon_username');
    if (saved) return saved;
    const newName = `Player_${Math.floor(Math.random() * 10000)}`;
    localStorage.setItem('neon_tycoon_username', newName);
    return newName;
  });

  // Game Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        const now = Date.now();
        const delta = (now - prev.lastUpdate) / 1000;
        
        let income = 0;
        prev.generators.forEach(gen => {
          if (gen.unlocked && gen.level > 0) {
            income += gen.baseIncome * gen.level * (1 + prev.prestigeLevel * 0.1);
          }
        });

        const earned = income * delta;
        const newState = {
          ...prev,
          money: prev.money + earned,
          totalEarned: prev.totalEarned + earned,
          lastUpdate: now
        };

        // Save to local storage
        localStorage.setItem(SAVE_KEY, JSON.stringify(newState));
        
        // Sync with server occasionally
        if (socketRef.current?.readyState === WebSocket.OPEN && Math.random() < 0.05) {
          socketRef.current.send(JSON.stringify({ 
            type: 'SYNC_STATE', 
            state: newState,
            username: username
          }));
        }

        return newState;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [username]);

  const buyGenerator = (id: string) => {
    setState(prev => {
      const genIndex = prev.generators.findIndex(g => g.id === id);
      const gen = prev.generators[genIndex];
      
      if (prev.money >= gen.baseCost && !gen.unlocked) {
        const newGenerators = [...prev.generators];
        newGenerators[genIndex] = { ...gen, unlocked: true, level: 1 };
        return {
          ...prev,
          money: prev.money - gen.baseCost,
          generators: newGenerators
        };
      }
      return prev;
    });
  };

  const upgradeGenerator = (id: string) => {
    setState(prev => {
      const genIndex = prev.generators.findIndex(g => g.id === id);
      const gen = prev.generators[genIndex];
      const cost = Math.floor(gen.baseCost * Math.pow(1.5, gen.level));
      
      if (prev.money >= cost && gen.unlocked) {
        const newGenerators = [...prev.generators];
        newGenerators[genIndex] = { ...gen, level: gen.level + 1 };
        return {
          ...prev,
          money: prev.money - cost,
          generators: newGenerators
        };
      }
      return prev;
    });
  };

  const buyExpansion = (id: string) => {
    setState(prev => {
      const expIndex = prev.expansions.findIndex(e => e.id === id);
      const exp = prev.expansions[expIndex];
      
      if (prev.money >= exp.cost && !exp.unlocked) {
        const newExpansions = [...prev.expansions];
        newExpansions[expIndex] = { ...exp, unlocked: true };
        return {
          ...prev,
          money: prev.money - exp.cost,
          expansions: newExpansions
        };
      }
      return prev;
    });
  };

  const prestige = () => {
    if (state.totalEarned < 100000) return;
    
    const bonus = Math.floor(state.totalEarned / 100000);
    setState({
      money: 0,
      totalEarned: 0,
      generators: INITIAL_GENERATORS,
      expansions: INITIAL_EXPANSIONS,
      lastUpdate: Date.now(),
      prestigeLevel: state.prestigeLevel + bonus
    });
  };

  const [showChangelog, setShowChangelog] = useState(false);

  const formatMoney = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
    return `$${Math.floor(val)}`;
  };

  const changelog = [
    { date: '2026-02-21', version: 'v1.0.0', changes: ['Initial release', 'Core tycoon mechanics', 'Multiplayer leaderboard', 'Prestige system'] },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white font-sans selection:bg-emerald-500/30">
      {/* Changelog Modal */}
      <AnimatePresence>
        {showChangelog && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setShowChangelog(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#121214] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-6">Changelog</h2>
              <div className="space-y-6">
                {changelog.map((entry, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 font-bold">{entry.version}</span>
                      <span className="text-xs text-white/20 font-mono">{entry.date}</span>
                    </div>
                    <ul className="space-y-1">
                      {entry.changes.map((change, j) => (
                        <li key={j} className="text-sm text-white/60 flex items-center gap-2">
                          <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setShowChangelog(false)}
                className="w-full mt-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Header / HUD */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0A0A0B]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <TrendingUp className="text-black w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">NEON TYCOON</h1>
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Automation Empire v1.0</p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-mono mb-1">Available Capital</p>
            <p className="text-2xl font-bold text-emerald-400 tabular-nums">{formatMoney(state.money)}</p>
          </div>
          <div className="h-10 w-px bg-white/10 hidden sm:block" />
          <div className="hidden sm:block text-right">
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-mono mb-1">Prestige Level</p>
            <p className="text-xl font-bold text-violet-400 tabular-nums">Lvl {state.prestigeLevel}</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
        {/* Left Column: Game View */}
        <div className="space-y-8">
          {/* Navigation Tabs */}
          <div className="flex gap-2 p-1 bg-white/5 rounded-2xl w-fit">
            {[
              { id: 'generators', icon: Factory, label: 'Machines' },
              { id: 'expansions', icon: LayoutDashboard, label: 'Expansions' },
              { id: 'leaderboard', icon: Trophy, label: 'Global Rank' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white/10 text-white shadow-lg' 
                    : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'generators' && (
              <motion.div 
                key="generators"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {state.generators.map((gen) => {
                  const Icon = IconMap[gen.icon] || Hand;
                  const upgradeCost = Math.floor(gen.baseCost * Math.pow(1.5, gen.level));
                  const canAffordUpgrade = state.money >= upgradeCost;
                  const canAffordUnlock = state.money >= gen.baseCost;

                  return (
                    <div 
                      key={gen.id}
                      className={`relative group p-6 rounded-3xl border transition-all duration-300 ${
                        gen.unlocked 
                          ? 'bg-white/[0.02] border-white/5 hover:border-emerald-500/30' 
                          : 'bg-white/[0.01] border-white/5 opacity-60 grayscale'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-2xl ${gen.unlocked ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/20'}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        {gen.unlocked && (
                          <div className="text-right">
                            <p className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Level</p>
                            <p className="text-xl font-bold">{gen.level}</p>
                          </div>
                        )}
                      </div>

                      <h3 className="text-lg font-bold mb-1">{gen.name}</h3>
                      <p className="text-sm text-white/40 mb-6 line-clamp-2">{gen.description}</p>

                      <div className="flex items-center justify-between mt-auto">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Income</p>
                          <p className="text-lg font-bold text-emerald-400">+{formatMoney(gen.baseIncome * gen.level * (1 + state.prestigeLevel * 0.1))}/s</p>
                        </div>
                        
                        {gen.unlocked ? (
                          <button
                            onClick={() => upgradeGenerator(gen.id)}
                            disabled={!canAffordUpgrade}
                            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                              canAffordUpgrade 
                                ? 'bg-emerald-500 text-black hover:scale-105 active:scale-95' 
                                : 'bg-white/5 text-white/20 cursor-not-allowed'
                            }`}
                          >
                            <ArrowUpCircle className="w-4 h-4" />
                            {formatMoney(upgradeCost)}
                          </button>
                        ) : (
                          <button
                            onClick={() => buyGenerator(gen.id)}
                            disabled={!canAffordUnlock}
                            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                              canAffordUnlock 
                                ? 'bg-white text-black hover:scale-105 active:scale-95' 
                                : 'bg-white/5 text-white/20 cursor-not-allowed'
                            }`}
                          >
                            <Plus className="w-4 h-4" />
                            Unlock {formatMoney(gen.baseCost)}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {activeTab === 'expansions' && (
              <motion.div 
                key="expansions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {state.expansions.map((exp) => (
                  <div 
                    key={exp.id}
                    className={`p-6 rounded-3xl border flex items-center justify-between transition-all ${
                      exp.unlocked 
                        ? 'bg-emerald-500/5 border-emerald-500/20' 
                        : 'bg-white/[0.02] border-white/5'
                    }`}
                  >
                    <div>
                      <h3 className="text-lg font-bold">{exp.name}</h3>
                      <p className="text-sm text-white/40">{exp.description}</p>
                    </div>
                    {exp.unlocked ? (
                      <div className="flex items-center gap-2 text-emerald-400 font-bold">
                        <ShieldCheck className="w-5 h-5" />
                        UNLOCKED
                      </div>
                    ) : (
                      <button
                        onClick={() => buyExpansion(exp.id)}
                        disabled={state.money < exp.cost}
                        className={`px-6 py-3 rounded-xl font-bold transition-all ${
                          state.money >= exp.cost 
                            ? 'bg-white text-black hover:scale-105' 
                            : 'bg-white/5 text-white/20'
                        }`}
                      >
                        Buy for {formatMoney(exp.cost)}
                      </button>
                    )}
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'leaderboard' && (
              <motion.div 
                key="leaderboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden"
              >
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <h3 className="font-bold flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Global Leaderboard
                  </h3>
                  <span className="text-xs text-white/40 font-mono uppercase tracking-widest">Top 10 Players</span>
                </div>
                <div className="divide-y divide-white/5">
                  {leaderboard.length > 0 ? leaderboard.map((entry, i) => (
                    <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-4">
                        <span className={`w-6 text-sm font-mono ${i < 3 ? 'text-yellow-500 font-bold' : 'text-white/20'}`}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div>
                          <p className="font-medium">{entry.username || 'Anonymous'}</p>
                          <p className="text-[10px] text-violet-400 font-mono uppercase tracking-tighter">Prestige Lvl {entry.prestigeLevel}</p>
                        </div>
                      </div>
                      <p className="font-bold text-emerald-400 font-mono">{formatMoney(entry.totalEarned)}</p>
                    </div>
                  )) : (
                    <div className="p-12 text-center text-white/20">
                      <p>No data available yet.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Stats & Prestige */}
        <aside className="space-y-6">
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Empire Statistics
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-sm text-white/40">Total Lifetime Earnings</span>
                <span className="font-bold font-mono">{formatMoney(state.totalEarned)}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-sm text-white/40">Active Machines</span>
                <span className="font-bold font-mono">{state.generators.filter(g => g.unlocked).length}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-sm text-white/40">Global Multiplier</span>
                <span className="font-bold font-mono text-violet-400">x{(1 + state.prestigeLevel * 0.1).toFixed(1)}</span>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/5">
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Prestige Reset</h4>
              <p className="text-xs text-white/30 mb-6 leading-relaxed">
                Reset all progress to gain permanent prestige levels. Each level grants a 10% income bonus.
                Requires $100K total earnings.
              </p>
              <button
                onClick={prestige}
                disabled={state.totalEarned < 100000}
                className={`w-full py-4 rounded-2xl font-bold transition-all ${
                  state.totalEarned >= 100000 
                    ? 'bg-violet-500 text-white hover:bg-violet-600 shadow-[0_0_20px_rgba(139,92,246,0.3)]' 
                    : 'bg-white/5 text-white/20 cursor-not-allowed'
                }`}
              >
                {state.totalEarned >= 100000 ? `Prestige for +${Math.floor(state.totalEarned / 100000)} Lvl` : 'Need $100K Total'}
              </button>
            </div>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-500 rounded-lg">
                <Settings className="w-4 h-4 text-black" />
              </div>
              <h3 className="font-bold text-emerald-400">Automation Active</h3>
            </div>
            <p className="text-xs text-emerald-400/60 leading-relaxed">
              Your machines are currently generating capital at a rate of {formatMoney(state.generators.reduce((acc, g) => acc + (g.unlocked ? g.baseIncome * g.level * (1 + state.prestigeLevel * 0.1) : 0), 0))}/s.
            </p>
          </div>
        </aside>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto p-6 mt-12 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-white/20 font-mono">© 2026 NEON TYCOON INDUSTRIES. ALL RIGHTS RESERVED.</p>
        <div className="flex gap-6">
          <button onClick={() => setShowChangelog(true)} className="text-xs text-white/20 hover:text-white/40 transition-colors cursor-pointer">CHANGELOG</button>
          <a href="#" className="text-xs text-white/20 hover:text-white/40 transition-colors">SUPPORT</a>
          <a href="#" className="text-xs text-white/20 hover:text-white/40 transition-colors">TERMS</a>
        </div>
      </footer>
    </div>
  );
}
