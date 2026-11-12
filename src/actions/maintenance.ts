'use server';

import { createClient } from '@/utils/supabase/server';
import { getCurrentUserProfileSlim } from '@/actions/users';
import { revalidatePath } from 'next/cache';

export interface MaintenanceStatus {
  enabled: boolean;
  message?: string;
  estimatedEndTime?: string | null;
  updatedAt?: string | null;
}

// In-memory fallback
let inMemoryMaintenanceStatus: MaintenanceStatus = {
  enabled: false,
  message: "We are currently performing scheduled maintenance and updates to improve your experience. Worker tasks and submissions are temporarily paused. We'll be back online shortly!"
};

export async function getMaintenanceModeStatus(): Promise<MaintenanceStatus> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('system_settings')
      .select('value, updated_at')
      .eq('key', 'maintenance_mode')
      .maybeSingle();

    if (error || !data) {
      return inMemoryMaintenanceStatus;
    }

    const val = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
    return {
      enabled: Boolean(val?.enabled),
      message: val?.message || inMemoryMaintenanceStatus.message,
      estimatedEndTime: val?.estimatedEndTime || null,
      updatedAt: data.updated_at
    };
  } catch (err) {
    return inMemoryMaintenanceStatus;
  }
}

export async function setMaintenanceMode(
  enabled: boolean,
  message?: string,
  estimatedEndTime?: string | null
) {
  const profile = await getCurrentUserProfileSlim();
  if (profile?.role !== 'admin') {
    return { error: 'Unauthorized: Only admins can toggle maintenance mode.' };
  }

  const payload = {
    enabled,
    message: message || "We are currently performing scheduled maintenance and updates to improve your experience. Worker tasks and submissions are temporarily paused. We'll be back online shortly!",
    estimatedEndTime: estimatedEndTime || null,
    updatedAt: new Date().toISOString()
  };

  inMemoryMaintenanceStatus = payload;

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('system_settings')
      .upsert({
        key: 'maintenance_mode',
        value: payload,
        updated_at: new Date().toISOString(),
        updated_by: profile.id
      });

    if (error) {
      console.warn('Could not persist to system_settings, using in-memory state:', error.message);
    }
  } catch (err) {
    console.warn('System settings upsert failed:', err);
  }

  revalidatePath('/', 'layout');
  revalidatePath('/dashboard', 'layout');
  revalidatePath('/worker/available-tasks');
  revalidatePath('/admin/tasks');

  return { success: true, status: payload };
}

