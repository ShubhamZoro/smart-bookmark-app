'use client'

import { useState } from 'react'

type Bookmark = {
    id: string
    title: string
    url: string
    created_at: string
}

type BookmarkCardProps = {
    bookmark: Bookmark
    onDelete: (id: string) => Promise<void>
}

function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

function getDomain(url: string) {
    try {
        return new URL(url).hostname.replace('www.', '')
    } catch {
        return url
    }
}

export default function BookmarkCard({ bookmark, onDelete }: BookmarkCardProps) {
    const [deleting, setDeleting] = useState(false)

    async function handleDelete() {
        setDeleting(true)
        await onDelete(bookmark.id)
        // No need to setDeleting(false) since the component will unmount
    }

    const domain = getDomain(bookmark.url)
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`

    return (
        <div className={`group flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 transition-all duration-200 ${deleting ? 'opacity-50 scale-95' : ''}`}>
            {/* Favicon */}
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={faviconUrl}
                    alt=""
                    className="w-5 h-5"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.parentElement!.innerHTML = `<svg class="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>`
                    }}
                />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white font-medium text-sm hover:text-purple-300 transition-colors truncate block"
                >
                    {bookmark.title}
                </a>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-slate-500 text-xs truncate">{domain}</span>
                    <span className="text-slate-700 text-xs">·</span>
                    <span className="text-slate-600 text-xs flex-shrink-0">{formatDate(bookmark.created_at)}</span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
                <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
                    title="Open link"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                </a>
                <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    title="Delete bookmark"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        </div>
    )
}
