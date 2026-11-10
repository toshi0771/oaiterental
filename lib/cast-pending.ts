import { supabaseAdmin } from '@/lib/supabase'
import type { Me } from '@/lib/me'

/** キャスト向け: 自分のエントリーへの「承認待ち」申込み件数。キャストでなければ 0 */
export async function getPendingApplicationCount(me: Me): Promise<number> {
  const { data: castProfile } = await supabaseAdmin
    .from('cast_profiles')
    .select('id')
    .eq('user_id', me.id)
    .maybeSingle()

  if (!castProfile) return 0

  const { count } = await supabaseAdmin
    .from('applications')
    .select('id, entries!inner(cast_id)', { count: 'exact', head: true })
    .eq('entries.cast_id', castProfile.id)
    .eq('status', 'pending')

  return count ?? 0
}
