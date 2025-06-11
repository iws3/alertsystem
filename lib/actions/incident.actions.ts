// lib/actions/incident.actions.ts
'use server';

import { z } from 'zod';
// Use the server client
import { revalidatePath } from 'next/cache';
import { createClient } from '../server';

// Define the shape of our form data for strong validation
const FightSchema = z.object({
  studentNames: z.string().min(3, { message: 'Please enter at least one student name.' }),
  locationDetails: z.string().min(5, { message: 'Location details must be at least 5 characters.' }),
  severity: z.enum(['Low', 'Medium', 'High', 'Critical']),
});

// This defines the object that our action will return
export type ActionState = {
  error?: string;
  message?: string;
};

// This is the Server Action function
export async function reportFightIncident(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = createClient();

  // 1. Check if the user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'You must be logged in to report an incident.' };
  }

  // 2. Validate the incoming form data using Zod
  const validatedFields = FightSchema.safeParse({
    studentNames: formData.get('studentNames'),
    locationDetails: formData.get('locationDetails'),
    severity: formData.get('severity'),
  });

  // If validation fails, return the error messages
  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    const errorMessage = Object.values(fieldErrors).flat()[0] || 'Invalid data provided.';
    return { error: errorMessage };
  }

  const { studentNames, locationDetails, severity } = validatedFields.data;

  // 3. Insert the validated data into the 'incidents' table
  const { error } = await supabase.from('incidents').insert({
    reported_by: user.id,
    incident_type: 'Fight',
    severity: severity,
    location_details: locationDetails,
    incident_data: { student_names: studentNames.split(',').map(name => name.trim()) }, 
    status: 'Reported',
  });

  if (error) {
    console.error('Database Insert Error:', error);
    return { error: 'Failed to report incident. Please try again.' };
  }

  // 4. Revalidate the dashboard path to instantly update the incident list
  revalidatePath('/coordinator/dashboard');
  
  return { message: 'Fight incident reported successfully!' };
}