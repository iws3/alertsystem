// lib/actions/emergency.actions.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '../server';
// import { createClient } from '@/utils/supabase/server'; // Adjust to your server client path

// This is the same type definition, you can share it or redefine it
export type ActionState = {
  error?: string;
  message?: string;
};

// Define the shape for the General Emergency form
const GeneralEmergencySchema = z.object({
  emergencyType: z.enum(['Fire', 'Security Threat', 'Medical Emergency', 'Lockdown']),
  locationDetails: z.string().min(5, { message: 'Location details must be at least 5 characters.' }),
  severity: z.enum(['Low', 'Medium', 'High', 'Critical']),
});

export async function reportGeneralEmergency(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'You must be logged in to report an emergency.' };
  }

  const validatedFields = GeneralEmergencySchema.safeParse({
    emergencyType: formData.get('emergencyType'),
    locationDetails: formData.get('locationDetails'),
    severity: formData.get('severity'),
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.errors.map(e => e.message).join(', ') };
  }

  const { emergencyType, locationDetails, severity } = validatedFields.data;

  // ✅ **THE CRITICAL CHANGE**: We now insert into the 'emergencies' table.
  const { data: newEmergency, error } = await supabase.from('emergencies').insert({
    reported_by: user.id,
    emergency_type: emergencyType,
    severity: severity,
    location_details: locationDetails,
    status: 'Active',
  }).select().single();

  if (error) {
    console.error('Emergency Insert Error:', error);
    return { error: 'Failed to report emergency.' };
  }

  // Your Zapier webhook logic can go here, sending the `newEmergency` data
  // ...

  revalidatePath('/coordinator/dashboard');
  return { message: `${emergencyType} emergency reported successfully!` };
}