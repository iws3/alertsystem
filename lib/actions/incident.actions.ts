// // lib/actions/incident.actions.ts
// 'use server';

// import { z } from 'zod';
// import { revalidatePath } from 'next/cache';
// import { createClient } from '../server';
// // Assuming you have a Supabase server client configured correctly
// // If not, you'll need to create one here using the service_role key for admin actions
// // Adjust this path to your server client

// // Define the shape of our form data for strong validation
// const FightSchema = z.object({
//   studentNames: z.string().min(3, { message: 'Please enter at least one student name.' }),
//   locationDetails: z.string().min(5, { message: 'Location details must be at least 5 characters.' }),
//   severity: z.enum(['Low', 'Medium', 'High', 'Critical']),
// });

// export type ActionState = {
//   error?: string;
//   message?: string;
// };

// export async function reportFightIncident(prevState: ActionState, formData: FormData): Promise<ActionState> {
//   const supabase = createClient();

//   // 1. Check if the user is authenticated
//   const { data: { user } } = await supabase.auth.getUser();
//   if (!user) {
//     return { error: 'You must be logged in to report an incident.' };
//   }

//   // 2. Validate the incoming form data using Zod
//   const validatedFields = FightSchema.safeParse({
//     studentNames: formData.get('studentNames'),
//     locationDetails: formData.get('locationDetails'),
//     severity: formData.get('severity'),
//   });

//   if (!validatedFields.success) {
//     const fieldErrors = validatedFields.error.flatten().fieldErrors;
//     const errorMessage = Object.values(fieldErrors).flat()[0] || 'Invalid data provided.';
//     return { error: errorMessage };
//   }

//   const { studentNames, locationDetails, severity } = validatedFields.data;

//   // 3. Insert the validated data into the 'incidents' table
//   const { data: newIncident, error } = await supabase.from('incidents').insert({
//     reported_by: user.id,
//     incident_type: 'Fight',
//     severity: severity,
//     location_details: locationDetails,
//     incident_data: { student_names: studentNames.split(',').map(name => name.trim()) },
//     status: 'Reported',
//   }).select().single(); // Use .select().single() to get the newly created row back

//   if (error) {
//     console.error('Database Insert Error:', error);
//     return { error: 'Failed to report incident. Please try again.' };
//   }

//   // ===================================================================
//   // ✅ NEW: Section to call the Zapier Webhook
//   // ===================================================================
//   // This runs only if the database insert was successful.
//   if (process.env.ZAPIER_INCIDENT_WEBHOOK_URL) {
//     // We wrap this in a try/catch so that a failure in Zapier
//     // does NOT prevent the user from getting a success message.
//     try {
//       const payload = {
//         id: newIncident.id,
//         type: newIncident.incident_type,
//         severity: newIncident.severity,
//         location: newIncident.location_details,
//         reported_at: newIncident.created_at,
//         reported_by_email: user.email, // Very useful for notifications
//         student_names: studentNames,
//       };

//       await fetch(process.env.ZAPIER_INCIDENT_WEBHOOK_URL, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload),
//       });

//     } catch (zapierError) {
//       // Log the error for debugging, but don't block the user flow.
//       console.error("Failed to send data to Zapier:", zapierError);
//     }
//   } else {
//     console.warn("ZAPIER_INCIDENT_WEBHOOK_URL is not set. Skipping webhook call.");
//   }
//   // ===================================================================
//   // End of new section
//   // ===================================================================


//   // 4. Revalidate the dashboard path to instantly update the incident list
//   revalidatePath('/coordinator/dashboard');
  
//   return { message: 'Fight incident reported successfully! The administration has been notified.' };
// }








// lib/actions/incident.actions.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '../server'; // Or your server client path

// Define the shape of our form data for strong validation
const FightSchema = z.object({
  studentNames: z.string().min(3, { message: 'Please enter at least one student name.' }),
  locationDetails: z.string().min(5, { message: 'Location details must be at least 5 characters.' }),
  severity: z.enum(['Low', 'Medium', 'High', 'Critical']),
});

const WeatherAlertSchema = z.object({
  location: z.string(),
  temperature: z.coerce.number(), // coerce will convert string from form to number
  condition: z.string(),
  windSpeed: z.coerce.number(),
  humidity: z.coerce.number(),
  rawData: z.string(), // The stringified JSON from the API
});


export type ActionState = {
  error?: string;
  message?: string;
};

// This function is now correctly placed. It only deals with 'incidents'.
export async function reportFightIncident(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'You must be logged in to report an incident.' };
  }

  const validatedFields = FightSchema.safeParse({
    studentNames: formData.get('studentNames'),
    locationDetails: formData.get('locationDetails'),
    severity: formData.get('severity'),
  });

  if (!validatedFields.success) {
    // ... error handling ...
    return { error: 'Invalid data provided.' };
  }
  
  const { studentNames, locationDetails, severity } = validatedFields.data;

  // ✅ This correctly inserts into the 'incidents' table.
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

  // Your Zapier webhook logic for incidents can go here
  // ...

  revalidatePath('/coordinator/dashboard');
  return { message: 'Fight incident reported successfully!' };
}

export async function confirmWeatherAlert(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'You must be logged in to confirm an alert.' };
  }

  const validatedFields = WeatherAlertSchema.safeParse({
    location: formData.get('location'),
    temperature: formData.get('temperature'),
    condition: formData.get('condition'),
    windSpeed: formData.get('windSpeed'),
    humidity: formData.get('humidity'),
    rawData: formData.get('rawData'),
  });

  if (!validatedFields.success) {
    return { error: 'Invalid weather data received from form.' };
  }

  const { location, temperature, condition, windSpeed, humidity, rawData } = validatedFields.data;

  // --- Perform a "transaction" ---
  // We want to insert into two tables. We'll do it sequentially.

  // 1. Insert detailed data into the new 'weather_alerts' table
  const { error: weatherError } = await supabase.from('weather_alerts').insert({
    reported_by: user.id,
    location: location,
    temperature_celsius: temperature,
    weather_condition: condition,
    wind_speed_kph: windSpeed,
    humidity_percent: humidity,
    raw_api_data: JSON.parse(rawData), // Parse the string back to JSON for storage
  });

  if (weatherError) {
    console.error("Weather Alert Insert Error:", weatherError);
    return { error: 'Failed to save detailed weather data.' };
  }

  // 2. Insert a summary into the main 'incidents' table for the unified feed
  const { error: incidentError } = await supabase.from('incidents').insert({
    reported_by: user.id,
    incident_type: 'Weather',
    severity: temperature > 30 ? 'High' : 'Medium', // Example of deriving severity
    location_details: `Weather Alert for ${location}: ${condition}`,
    status: 'Reported',
  });

  if (incidentError) {
    console.error("Incident Insert Error (Weather):", incidentError);
    return { error: 'Failed to create summary incident.' };
  }

  revalidatePath('/coordinator/dashboard');
  return { message: 'Weather alert confirmed and reported!' };
}


































