// This could be your app/coordinator/dashboard/page.tsx or a component within it.
"use client"
import React, { useState } from 'react';
import { AlertTriangle, Cloud, Users, MapPin, Clock, Shield, Phone, Camera, Mic, Bell, Settings, User, Menu, X, ChevronRight, Zap } from 'lucide-react';
import { RealTimeClock } from '@/components/RealTimeClock';
import { FightAlertModal } from '@/components/FightAlertModal';
// Adjust path if needed

// We define the types for props that would come from a server component
type Alert = {
  time: string;
  type: string;
  status: 'active' | 'resolved';
  location: string;
}

// In a real app, this data would be passed in as props, e.g., <EmergencyAlertInterface recentAlerts={incidents} />
const EmergencyAlertInterface = ({ recentAlerts = [] }: { recentAlerts?: Alert[] }) => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [weatherData, setWeatherData] = useState({ temp: 24, condition: 'Partly Cloudy', alert: false });
  const [isRecording, setIsRecording] = useState(false);

  // The clock state is now gone from this component, solving the re-render issue.

  const emergencyButtons = [
    { id: 'fight', label: 'Fight Alert', icon: Users, color: 'from-red-500 to-red-600', hoverColor: 'hover:from-red-600 hover:to-red-700', description: 'Report physical altercation', urgency: 'high' },
    { id: 'weather', label: 'Weather Alert', icon: Cloud, color: 'from-blue-500 to-blue-600', hoverColor: 'hover:from-blue-600 hover:to-blue-700', description: 'Weather-related emergency', urgency: 'medium' },
    { id: 'emergency', label: 'Emergency', icon: AlertTriangle, color: 'from-orange-500 to-red-500', hoverColor: 'hover:from-orange-600 hover:to-red-600', description: 'Immediate danger/emergency', urgency: 'critical' }
  ];

  const quickActions = [
    { icon: Camera, label: 'Photo Report', action: () => {} },
    { icon: Mic, label: 'Voice Report', action: () => setIsRecording(!isRecording) },
    { icon: MapPin, label: 'Location Share', action: () => {} },
    { icon: Phone, label: 'Emergency Call', action: () => {} }
  ];

  const handleEmergencyClick = (buttonId: string) => {
    setActiveModal(buttonId);
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <header className="relative z-10 bg-slate-900/80 backdrop-blur-md border-b border-slate-700">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors lg:hidden"><Menu size={20} /></button>
              <div className="flex items-center gap-2"><Shield className="text-blue-400" size={24} /><h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">SafeGuard</h1></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-1"><Cloud size={16} className="text-blue-400" /><span className="text-sm">{weatherData.temp}°C</span></div>
              <RealTimeClock />
              <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors"><Bell size={20} /></button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 p-4 pb-20">
        <div className="mb-6 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3"><div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div><span className="font-medium">System Status: All Clear</span><span className="text-sm text-slate-400 ml-auto">Last updated: <RealTimeClock /></span></div>
        </div>
        <div className="grid gap-4 mb-8">
          {emergencyButtons.map((button) => {
            const IconComponent = button.icon;
            return (<button key={button.id} onClick={() => handleEmergencyClick(button.id)} className={`relative group bg-gradient-to-br ${button.color} ${button.hoverColor} p-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 border border-white/10 hover:border-white/20`}><div className="flex items-center justify-between"><div className="flex items-center gap-4"><div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm"><IconComponent size={24} className="text-white" /></div><div className="text-left"><h3 className="text-lg font-bold text-white">{button.label}</h3><p className="text-white/80 text-sm">{button.description}</p></div></div><ChevronRight className="text-white/60 group-hover:text-white transition-colors" size={20} /></div><div className="absolute top-3 right-3"><div className={`w-2 h-2 rounded-full ${button.urgency === 'critical' ? 'bg-red-300 animate-pulse' : button.urgency === 'high' ? 'bg-yellow-300' : 'bg-green-300'}`}></div></div></button>);
          })}
        </div>
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Zap className="text-yellow-400" size={20} />Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (<button key={index} onClick={action.action} className={`p-4 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-xl transition-all duration-200 group ${action.label === 'Voice Report' && isRecording ? 'bg-red-500/20 border-red-500/50' : ''}`}><div className="flex flex-col items-center gap-2"><IconComponent size={20} className={`group-hover:scale-110 transition-transform ${action.label === 'Voice Report' && isRecording ? 'text-red-400 animate-pulse' : 'text-slate-300'}`} /><span className="text-xs text-slate-400 group-hover:text-white transition-colors">{action.label}</span></div></button>);
            })}
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentAlerts.map((alert, index) => (<div key={index} className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 backdrop-blur-sm"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className={`w-3 h-3 rounded-full ${alert.status === 'active' ? 'bg-red-400 animate-pulse' : 'bg-green-400'}`}></div><div><p className="font-medium">{alert.type} Alert</p><p className="text-sm text-slate-400">{alert.location}</p></div></div><div className="text-right"><p className="text-sm font-mono text-slate-300">{alert.time}</p><p className={`text-xs px-2 py-1 rounded-full ${alert.status === 'active' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>{alert.status}</p></div></div></div>))}
          </div>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md border-t border-slate-700 p-4 z-20"><div className="flex justify-around items-center max-w-md mx-auto"><button className="p-3 hover:bg-slate-800 rounded-xl transition-colors"><Shield size={20} className="text-blue-400" /></button><button className="p-3 hover:bg-slate-800 rounded-xl transition-colors"><MapPin size={20} className="text-slate-400" /></button><button className="p-3 hover:bg-slate-800 rounded-xl transition-colors"><Bell size={20} className="text-slate-400" /></button><button className="p-3 hover:bg-slate-800 rounded-xl transition-colors"><User size={20} className="text-slate-400" /></button><button className="p-3 hover:bg-slate-800 rounded-xl transition-colors"><Settings size={20} className="text-slate-400" /></button></div></nav>

      {activeModal === 'fight' && (
        <FightAlertModal 
          onClose={() => setActiveModal(null)} 
        />
      )}

      {sidebarOpen && (<div className="fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div><div className="absolute left-0 top-0 h-full w-80 bg-slate-900 border-r border-slate-700 p-6"><div className="flex justify-between items-center mb-8"><h2 className="text-xl font-bold">Menu</h2><button onClick={() => setSidebarOpen(false)}><X size={24} /></button></div></div></div>)}
    </div>
  );
};

export default EmergencyAlertInterface;