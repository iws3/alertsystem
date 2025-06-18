// app/coordinator/dashboard/page.tsx
import { DashboardClientContent } from '@/components/DashboardClientContent';
import { createClient } from '@/lib/server'; // Use your server client
// Import the new client component
// import { DashboardClientContent } from '@/components/dashboard/DashboardClientContent'; // Adjust path as needed

// This remains an async Server Component
export default async function CoordinatorDashboard() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // If no user, the layout should handle redirection, but good to have a check
  if (!user) {
    // Or redirect('/login') if layout isn't catching it for some reason
    return <p>User not authenticated. Please log in.</p>;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();
  
  const { data: incidentsData, error: incidentsError } = await supabase
    .from('incidents')
    .select('id, created_at, incident_type, status, location_details') // Ensure these fields match your Incident type
    .order('created_at', { ascending: false })
    .limit(5);

  if (incidentsError) {
    console.error('Error fetching incidents:', incidentsError.message);
    // Handle error appropriately, maybe pass an error state to client component
  }

  // Ensure incidentsData is an array, even if null/undefined from Supabase
  const incidents = incidentsData || [];

  return (
    <DashboardClientContent
      user={{ email: user.email }} // Pass only necessary user fields
      profile={profile ? { full_name: profile.full_name } : null} // Pass only necessary profile fields
      initialIncidents={incidents}
    />
  );
}