'use client';

import React, { useState } from 'react';
import { Send, AtSign, Heart, MessageCircle, Repeat2, Share, AlertTriangle } from 'lucide-react';
import { formatForTelegram, formatForThreads, getCharacterCount } from '@/lib/text-helpers';

interface LivePreviewProps {
  title: string;
  contentHtml: string;
  threadsCustomText?: string;
  mediaUrl?: string | null;
}

export function LivePreview({
  title,
  contentHtml,
  threadsCustomText,
  mediaUrl,
}: LivePreviewProps) {
  const [platform, setPlatform] = useState<'telegram' | 'threads'>('telegram');

  const tgHtml = formatForTelegram(contentHtml);
  const threadsText = threadsCustomText?.trim()
    ? threadsCustomText.trim()
    : formatForThreads(contentHtml);

  const threadsCharCount = getCharacterCount(threadsText);
  const isOverThreadsLimit = threadsCharCount > 500;

  return (
    <div className="flex flex-col h-full rounded-3xl border border-zinc-200 dark:border-[#33353e] bg-white dark:bg-[#22232a] p-5 shadow-sm dark:shadow-md transition-colors">
      {/* Platform Switcher Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-[#33353e] mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Предпросмотр поста
        </span>
        <div className="flex p-1 rounded-xl bg-zinc-100 dark:bg-[#1c1d23] border border-zinc-200/80 dark:border-[#33353e] text-xs">
          <button
            type="button"
            onClick={() => setPlatform('telegram')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all font-medium cursor-pointer ${
              platform === 'telegram'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            Telegram
          </button>
          <button
            type="button"
            onClick={() => setPlatform('threads')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all font-medium cursor-pointer ${
              platform === 'threads'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <AtSign className="w-3.5 h-3.5" />
            Threads
          </button>
        </div>
      </div>

      {/* Telegram Live View */}
      {platform === 'telegram' && (
        <div className="flex-1 flex flex-col justify-start">
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#1c1d23] border border-zinc-200/80 dark:border-[#33353e] shadow-2xs max-w-md w-full mx-auto">
            {/* Telegram Channel Info */}
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 font-bold flex items-center justify-center text-xs border border-sky-500/30">
                TG
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                  Ваш Telegram-канал
                </p>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500">публичный канал</p>
              </div>
            </div>

            {/* Media Image */}
            {mediaUrl && (
              <div className="mb-3 rounded-xl overflow-hidden border border-zinc-200 dark:border-[#33353e] bg-zinc-100 dark:bg-zinc-900 aspect-video max-h-52 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mediaUrl}
                  alt="Post attachment"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Content Body */}
            {title && (
              <p className="text-sm font-bold text-zinc-900 dark:text-white mb-2 leading-snug">
                {title}
              </p>
            )}

            {tgHtml ? (
              <div
                className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed space-y-2 whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{ __html: tgHtml }}
              />
            ) : (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">
                Текст появится здесь по мере ввода...
              </p>
            )}

            <div className="flex justify-end items-center gap-1 mt-3 pt-2 text-[10px] text-zinc-400 dark:text-zinc-500 border-t border-zinc-200/60 dark:border-[#33353e]/60">
              <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="text-sky-500 font-semibold">✓✓</span>
            </div>
          </div>
        </div>
      )}

      {/* Threads Live View */}
      {platform === 'threads' && (
        <div className="flex-1 flex flex-col justify-start">
          {/* Threads Character Counter Alert */}
          <div className="mb-3 flex items-center justify-between text-xs px-1">
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">Лимит Threads:</span>
            <div className="flex items-center gap-1.5">
              {isOverThreadsLimit && (
                <span className="flex items-center gap-1 text-rose-500 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" /> Превышен лимит!
                </span>
              )}
              <span
                className={`font-mono text-xs px-2.5 py-0.5 rounded-full ${
                  isOverThreadsLimit
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                    : threadsCharCount > 450
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                    : 'bg-zinc-100 dark:bg-[#1c1d23] text-zinc-600 dark:text-zinc-300 font-medium border border-zinc-200/80 dark:border-[#33353e]'
                }`}
              >
                {threadsCharCount} / 500
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#1c1d23] border border-zinc-200/90 dark:border-[#33353e] shadow-2xs max-w-md w-full mx-auto">
            {/* Threads User Header */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-[#2c2d36] text-zinc-800 dark:text-zinc-200 flex items-center justify-center font-bold text-xs ring-1 ring-zinc-300 dark:ring-[#33353e]">
                TH
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-zinc-900 dark:text-white tracking-tight">
                      your_threads_profile
                    </span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">• 1m</span>
                  </div>
                </div>

                {/* Post Content */}
                <div className="mt-2 text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap break-words">
                  {threadsText || (
                    <span className="text-zinc-400 dark:text-zinc-500 italic">
                      Текст поста для Threads...
                    </span>
                  )}
                </div>

                {/* Media Image */}
                {mediaUrl && (
                  <div className="mt-3 rounded-2xl overflow-hidden border border-zinc-200 dark:border-[#33353e] bg-zinc-100 dark:bg-zinc-900 max-h-56">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={mediaUrl}
                      alt="Post media"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Action Icons */}
                <div className="flex items-center gap-4 mt-4 text-zinc-400 dark:text-zinc-500 text-xs">
                  <button type="button" className="hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer">
                    <Heart className="w-4 h-4" />
                  </button>
                  <button type="button" className="hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer">
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  <button type="button" className="hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer">
                    <Repeat2 className="w-4 h-4" />
                  </button>
                  <button type="button" className="hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer">
                    <Share className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
