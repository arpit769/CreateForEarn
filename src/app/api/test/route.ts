import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Call assign_tags_to_account
    const { data: assignRes, error: assignError } = await supabase.rpc('assign_tags_to_account', {
      target_account_id: '00000000-0000-0000-0000-000000000000',
      tag_ids: []
    });

    return NextResponse.json({
      success: true,
      assignRes,
      assignError
    });
  } catch (e: any) {
    return NextResponse.json({
      success: false,
      exception: e.message,
      stack: e.stack
    }, { status: 500 });
  }
}
