// components/dashboard/DashboardClientContent.tsx
'use client';

import { useState } from 'react';
import { FightAlertModal } from './FightAlertModal';
// ✅ 1. Import the new modal
import { GeneralEmergencyModal } from './GeneralEmergencyModal';
import { Shield } from 'lucide-react';
import { WeatherAlertModal } from './WeatherModal';

// Define the types for the props this component will receive
interface Profile {
  full_name?: string | null;
}

interface User {
  email?: string | null;
}

interface Incident {
  id: string; // or number, depending on your schema
  created_at: string;
  incident_type: string;
  status: string;
  location_details: string;
}

interface DashboardClientContentProps {
  user: User | null;
  profile: Profile | null;
  initialIncidents: Incident[];
}

export function DashboardClientContent({ user, profile, initialIncidents }: DashboardClientContentProps) {
  const [isFightModalOpen, setIsFightModalOpen] = useState(false);
  // ✅ 2. Add state for the new modal
  const [isGeneralModalOpen, setIsGeneralModalOpen] = useState(false);
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);

  const openFightModal = () => setIsFightModalOpen(true);
  const closeFightModal = () => setIsFightModalOpen(false);

  // Handlers for the new modal
  const openGeneralModal = () => setIsGeneralModalOpen(true);
  const closeGeneralModal = () => setIsGeneralModalOpen(false);

    // Handlers for the new modal
  const openWeatherModal = () => setIsWeatherModalOpen(true);
  const closeWeatherModal = () => setIsWeatherModalOpen(false);


  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <header className="mb-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-lg">
                <Shield className="text-white h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  CC's Dashboard
                </h1>
                <p className="text-slate-400">
                  Welcome back, {profile?.full_name || user?.email}!
                </p>
              </div>
            </div>
            <div>
              <span className="text-xs text-green-400">● Online</span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: Quick Actions */}
          <div className="md:col-span-1 bg-slate-800/50 p-6 rounded-lg border border-slate-700">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={openFightModal}
                className="w-full text-left p-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-md transition-colors"
              >
                Report Fight
              </button>
               {/* ✅ 3. Add the onClick handler to the Weather Alert button */}
              <button
                onClick={openWeatherModal}
                className="w-full text-left p-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-md transition-colors"
              >
                Weather Alert
              </button>
              {/* ✅ 3. Add the onClick handler to the button */}
              <button 
                onClick={openGeneralModal}
                className="w-full text-left p-3 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-md transition-colors"
              >
                General Emergency
              </button>
            </div>
          </div>

          {/* Column 2: Recent Incidents Feed */}
          <div className="md:col-span-2 bg-slate-800/50 p-6 rounded-lg border border-slate-700">
            <h2 className="text-xl font-semibold mb-4">Recent Incidents</h2>
            <div className="space-y-4">
              {initialIncidents && initialIncidents.length > 0 ? (
                initialIncidents.map((incident) => (
                  <div key={incident.id} className="p-3 bg-slate-800 rounded-md border-l-4 border-slate-600">
                    <div className="flex justify-between items-center">
                      <p className="font-bold">{incident.incident_type}</p>
                      <span className="text-xs text-slate-400">{new Date(incident.created_at).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm text-slate-300 mt-1">{incident.location_details}</p>
                    <span className="text-xs font-medium mt-2 inline-block bg-slate-700 px-2 py-1 rounded-full">{incident.status}</span>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-center py-5">No recent incidents to display.</p>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Conditionally render the modals */}
      {isFightModalOpen && <FightAlertModal onClose={closeFightModal} />}
      {isGeneralModalOpen && <GeneralEmergencyModal onClose={closeGeneralModal} />}
           {isWeatherModalOpen && <WeatherAlertModal onClose={closeWeatherModal} />}
    </div>
  );
}