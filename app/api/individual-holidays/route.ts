import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function DELETE(request: NextRequest) {
  try {
    const { clinicId, date } = await request.json()

    if (!clinicId || !date) {
      return NextResponse.json(
        { error: 'clinicId and date are required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('individual_holidays')
      .delete()
      .eq('clinic_id', clinicId)
      .eq('date', date)

    if (error) {
      console.error('個別休診日削除エラー:', error)
      return NextResponse.json(
        { error: 'Failed to delete individual holiday' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API エラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
