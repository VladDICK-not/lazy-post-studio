'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Send,
  AtSign,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RotateCw,
  Loader2,
} from 'lucide-react';
import { Post } from '@/lib/types';

interface PostsListProps {
  posts: Post[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function PostsList({ posts, isLoading, onRefresh }: PostsListProps) {
  const [activeTab, setActiveTab] = useState<'scheduled' | 'published' | 'failed'>('scheduled');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const filteredPosts = posts.filter((p) => {
    if (activeTab === 'scheduled') return p.status === 'scheduled' || p.status === 'draft';
    if (activeTab === 'published') return p.status === 'published';
    if (activeTab === 'failed') return p.status === 'failed';
    return true;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту публикацию?')) return;
    setProcessingId(id);

    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handlePublishNow = async (id: string) => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'POST' });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Manual publish error:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const scheduledCount = posts.filter((p) => p.status === 'scheduled').length;
  const publishedCount = posts.filter((p) => p.status === 'published').length;
  const failedCount = posts.filter((p) => p.status === 'failed').length;

  return (
    <div className="rounded-3xl border border-zinc-200 dark:border-[#33353e] bg-white dark:bg-[#22232a] p-5 shadow-sm dark:shadow-md flex flex-col h-full transition-colors">
      {/* List Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-[#33353e] mb-4">
        <div>
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            <span className="p-1 rounded-lg bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
              <Clock className="w-3.5 h-3.5" />
            </span>
            Очередь публикаций
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Отслеживайте запланированные посты и статус доставки
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#2c2d36] transition-colors cursor-pointer"
          title="Обновить список"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-sky-500' : ''}`} />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-100 dark:bg-[#1c1d23] border border-zinc-200/80 dark:border-[#33353e] text-xs mb-4">
        <button
          type="button"
          onClick={() => setActiveTab('scheduled')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl font-medium transition-all cursor-pointer ${
            activeTab === 'scheduled'
              ? 'bg-white dark:bg-[#2c2d36] text-zinc-900 dark:text-white shadow-2xs'
              : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          <span>Запланировано</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-sky-500/15 text-sky-600 dark:text-sky-400 font-mono font-bold">
            {scheduledCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('published')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl font-medium transition-all cursor-pointer ${
            activeTab === 'published'
              ? 'bg-white dark:bg-[#2c2d36] text-zinc-900 dark:text-white shadow-2xs'
              : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          <span>Опубликовано</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
            {publishedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('failed')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl font-medium transition-all cursor-pointer ${
            activeTab === 'failed'
              ? 'bg-white dark:bg-[#2c2d36] text-zinc-900 dark:text-white shadow-2xs'
              : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          <span>Ошибки</span>
          {failedCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/15 text-rose-600 dark:text-rose-400 font-mono font-bold">
              {failedCount}
            </span>
          )}
        </button>
      </div>

      {/* Posts Items */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[500px]">
        {isLoading && posts.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-xs text-zinc-400">
            <Loader2 className="w-4 h-4 animate-spin mr-2 text-sky-500" />
            Загрузка постов...
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-[#1c1d23] border border-zinc-200 dark:border-[#33353e] flex items-center justify-center text-zinc-400 mb-2">
              <Calendar className="w-4 h-4" />
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">Нет постов в этой категории</p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
              {activeTab === 'scheduled'
                ? 'Создайте новость слева, чтобы запланировать публикацию'
                : 'Здесь появится история после отправки'}
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const formattedTime = new Date(post.scheduled_at).toLocaleString('ru-RU', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={post.id}
                className="p-3.5 rounded-2xl bg-zinc-50/70 dark:bg-[#1c1d23] border border-zinc-200/80 dark:border-[#33353e] hover:border-zinc-300 dark:hover:border-zinc-600 transition-all group shadow-2xs"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-white line-clamp-1 flex-1">
                    {post.title}
                  </h3>

                  {/* Status Badge */}
                  {post.status === 'scheduled' && (
                    <span className="flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 whitespace-nowrap">
                      <Clock className="w-3 h-3" />
                      {formattedTime}
                    </span>
                  )}
                  {post.status === 'published' && (
                    <span className="flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                      <CheckCircle2 className="w-3 h-3" />
                      Отправлено
                    </span>
                  )}
                  {post.status === 'failed' && (
                    <span className="flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 whitespace-nowrap">
                      <AlertCircle className="w-3 h-3" />
                      Ошибка
                    </span>
                  )}
                </div>

                {/* Text preview */}
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-3 leading-relaxed">
                  {post.content_plain || 'Без описания'}
                </p>

                {/* Card Footer: Channels & Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-200/60 dark:border-[#33353e]/60 text-[11px]">
                  {/* Channels indicator */}
                  <div className="flex items-center gap-2">
                    {post.publish_to_telegram && (
                      <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400 text-[10px] font-medium">
                        <Send className="w-3 h-3" /> TG
                      </span>
                    )}
                    {post.publish_to_threads && (
                      <span className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300 text-[10px] font-medium">
                        <AtSign className="w-3 h-3" /> Threads
                      </span>
                    )}
                    {post.media_url && (
                      <span className="text-[10px] text-zinc-400">• с фото</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    {post.status === 'failed' && (
                      <button
                        type="button"
                        onClick={() => handlePublishNow(post.id)}
                        disabled={processingId === post.id}
                        className="px-2 py-1 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-[#2c2d36] text-[10px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        title="Повторить отправку"
                      >
                        <RotateCw className="w-3 h-3" /> Повторить
                      </button>
                    )}

                    {post.status === 'scheduled' && (
                      <button
                        type="button"
                        onClick={() => handlePublishNow(post.id)}
                        disabled={processingId === post.id}
                        className="px-2 py-1 rounded-lg text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-[#2c2d36] text-[10px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        title="Опубликовать прямо сейчас"
                      >
                        <Send className="w-3 h-3" /> Отправить сейчас
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(post.id)}
                      disabled={processingId === post.id}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-[#2c2d36] transition-colors cursor-pointer"
                      title="Удалить"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Error message detail */}
                {post.error_message && (
                  <div className="mt-2 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-600 dark:text-rose-300 font-mono break-words">
                    {post.error_message}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
