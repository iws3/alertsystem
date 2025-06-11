// app/coordinator/dashboard/page.tsx

// STEP 1: Import the reusable server client creator
// import { createClient } from '@/lib/supabase/server'; 

// STEP 2: Import any icons or other components you might need
import { createClient } from '@/lib/supabaseClient';
import { Shield } from 'lucide-react';

// This is an async Server Component
export default async function CoordinatorDashboard() {
  // STEP 3: Create the Supabase client instance for this request
  const supabase = createClient();

  // STEP 4: Fetch the currently logged-in user's data
  const { data: { user } } = await supabase.auth.getUser();

  // It's good practice to fetch the user's profile for more details
  const { data: profile } = user 
    ? await supabase.from('profiles').select('full_name').eq('id', user.id).single()
    : { data: null };
  
  // STEP 5: Fetch data that the dashboard needs, like recent incidents
  const { data: incidents, error: incidentsError } = await supabase
    .from('incidents')
    .select('id, created_at, incident_type, status, location_details')
    .order('created_at', { ascending: false })
    .limit(5); // Get the 5 most recent incidents

  if (incidentsError) {
    console.error('Error fetching incidents:', incidentsError.message);
    // You could render an error message to the user here
  }

  // STEP 6: Render the page with the fetched data
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
                  Coordinator Dashboard
                </h1>
                <p className="text-slate-400">
                  Welcome back, {profile?.full_name || user?.email}!
                </p>
              </div>
            </div>
            {/* A placeholder for a logout button or other actions */}
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
              <button className="w-full text-left p-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-md transition-colors">
                Report Fight
              </button>
              <button className="w-full text-left p-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-md transition-colors">
                Weather Alert
              </button>
              <button className="w-full text-left p-3 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-md transition-colors">
                General Emergency
              </button>
            </div>
          </div>

          {/* Column 2: Recent Incidents Feed */}
          <div className="md:col-span-2 bg-slate-800/50 p-6 rounded-lg border border-slate-700">
            <h2 className="text-xl font-semibold mb-4">Recent Incidents</h2>
            <div className="space-y-4">
              {incidents && incidents.length > 0 ? (
                // @ts-ignore
                incidents.map((incident) => (
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
    </div>
  );
}