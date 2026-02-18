'use client'

import { useEffect, useRef, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import BookmarkCard from './BookmarkCard'

type Bookmark = {
    id: string
    title: string
    url: string
    created_at: string
    user_id: string
}

export default function BookmarkManager({ user }: { user: User }) {
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
    const [title, setTitle] = useState('')
    const [url, setUrl] = useState('')
    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState(false)
    const [error, setError] = useState('')

    // Stable client reference — never recreated on re-render
    const supabaseRef = useRef(createClient())
    const supabase = supabaseRef.current

    async function fetchBookmarks() {
        const { data } = await supabase
            .from('bookmarks')
            .select('*')
            .order('created_at', { ascending: false })
        if (data) setBookmarks(data)
    }

    useEffect(() => {
        // Initial load
        fetchBookmarks().then(() => setLoading(false))

        // Realtime: Listen for BOTH database changes AND broadcast messages
        const channel = supabase
            .channel('public:bookmarks')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'bookmarks' },
                (payload) => {
                    console.log('[Realtime] DB event:', payload)

                    fetchBookmarks()
                }
            )
            .on(
                'broadcast',
                { event: 'bookmark-update' },
                (payload) => {
                    console.log('[Realtime] Broadcast event:', payload)

                    fetchBookmarks()
                }
            )
            .subscribe((status) => { console.log('[Realtime] status:', status) })

        return () => { supabase.removeChannel(channel) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user.id])

    async function sendBroadcast(type: 'INSERT' | 'DELETE') {
        await supabase.channel('public:bookmarks').send({
            type: 'broadcast',
            event: 'bookmark-update',
            payload: { type },
        })
    }

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault()
        setError('')

        if (!title.trim() || !url.trim()) {
            setError('Both title and URL are required.')
            return
        }

        let formattedUrl = url.trim()
        if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
            formattedUrl = 'https://' + formattedUrl
        }

        // Optimistic UI
        const optimisticId = `optimistic-${Date.now()}`
        const optimisticBookmark: Bookmark = {
            id: optimisticId,
            title: title.trim(),
            url: formattedUrl,
            user_id: user.id,
            created_at: new Date().toISOString(),
        }
        setBookmarks((prev) => [optimisticBookmark, ...prev])
        setTitle('')
        setUrl('')

        setAdding(true)
        const { data, error: insertError } = await supabase
            .from('bookmarks')
            .insert({ title: optimisticBookmark.title, url: formattedUrl, user_id: user.id })
            .select()
            .single()

        if (insertError) {
            setBookmarks((prev) => prev.filter((b) => b.id !== optimisticId))
            setError(insertError.message)
        } else if (data) {
            setBookmarks((prev) => prev.map((b) => b.id === optimisticId ? data : b))
            // Send broadcast to other tabs
            sendBroadcast('INSERT')
        }
        setAdding(false)
    }

    async function handleDelete(id: string) {
        setBookmarks((prev) => prev.filter((b) => b.id !== id))
        await supabase.from('bookmarks').delete().eq('id', id)
        // Send broadcast to other tabs
        sendBroadcast('DELETE')
    }

    async function handleSignOut() {
        await supabase.auth.signOut()
        window.location.href = '/login'
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            {/* Header */}
            <header className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white leading-tight">Smart Bookmarks</h1>
                        <p className="text-slate-500 text-xs">{user.email}</p>

                    </div>
                </div>
                <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200 text-sm border border-white/10"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign out
                </button>
            </header>

            {/* Add Bookmark Form */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8 shadow-xl">
                <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Bookmark
                </h2>
                <form onSubmit={handleAdd} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                            type="text"
                            placeholder="Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                        />
                        <input
                            type="text"
                            placeholder="URL (e.g. github.com)"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                        />
                    </div>
                    {error && (
                        <p className="text-red-400 text-xs">{error}</p>
                    )}
                    <button
                        type="submit"
                        disabled={adding}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {adding ? 'Adding...' : 'Add Bookmark'}
                    </button>
                </form>
            </div>

            {/* Bookmarks List */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white font-semibold">
                        Your Bookmarks
                        {!loading && (
                            <span className="ml-2 text-xs text-slate-500 font-normal">({bookmarks.length})</span>
                        )}
                    </h2>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                        <span className="text-slate-500 text-xs">Live</span>
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-20 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
                        ))}
                    </div>
                ) : bookmarks.length === 0 ? (
                    <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
                        <svg className="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        <p className="text-slate-500 text-sm">No bookmarks yet</p>
                        <p className="text-slate-600 text-xs mt-1">Add your first bookmark above</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {bookmarks.map((bookmark) => (
                            <BookmarkCard
                                key={bookmark.id}
                                bookmark={bookmark}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
