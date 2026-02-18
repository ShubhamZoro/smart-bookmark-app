import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BookmarkManager from '@/components/BookmarkManager'

export default async function DashboardPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
            <BookmarkManager user={user} />
        </div>
    )
}
