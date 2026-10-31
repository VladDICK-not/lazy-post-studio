'use client';

import React, { useState } from 'react';
import {
  X,
  Plus,
  Send,
  AtSign,
  Trash2,
  Check,
  Loader2,
  Settings,
} from 'lucide-react';
import { Channel, PlatformType } from '@/lib/types';

interface ChannelsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  channels: Channel[];
  onRefreshChannels: () => void;
}

export function ChannelsManagerModal({
  isOpen,
  onClose,
  channels,
  onRefreshChannels,
}: ChannelsManagerModalProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [platform, setPlatform] = useState<PlatformType>('telegram');

  // Form state
  const [name, setName] = useState('');
  const [telegramChannelId, setTelegramChannelId] = useState('');
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [threadsUserId, setThreadsUserId] = useState('');
  const [threadsAccessToken, setThreadsAccessToken] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Укажите название канала или профиля');
      return;
    }

    if (platform === 'telegram' && !telegramChannelId.trim()) {
      setErrorMsg('Укажите ID или логин Telegram-канала (например: @my_channel)');
      return;
    }

    if (platform === 'threads' && (!threadsUserId.trim() || !threadsAccessToken.trim())) {
      setErrorMsg('Укажите Threads User ID и Access Token');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          platform,
          telegram_channel_id: telegramChannelId.trim(),
          telegram_bot_token: telegramBotToken.trim(),
          threads_user_id: threadsUserId.trim(),
          threads_access_token: threadsAccessToken.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Не удалось сохранить канал');
      }

      // Reset
      setName('');
      setTelegramChannelId('');
      setTelegramBotToken('');
      setThreadsUserId('');
      setThreadsAccessToken('');
      setIsAdding(false);
      onRefreshChannels();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить этот канал из списка?')) return;
    try {
      const res = await fetch(`/api/channels/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onRefreshChannels();
      }
    } catch (err) {
      console.error('Delete channel error:', err);
    }
  };

  const handleToggleActive = async (channel: Channel) => {
    try {
      const res = await fetch(`/api/channels/${channel.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !channel.is_active }),
      });
      if (res.ok) {
        onRefreshChannels();
      }
    } catch (err) {
      console.error('Toggle active error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 dark:bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-xl rounded-3xl border border-zinc-200 dark:border-[#33353e] bg-white dark:bg-[#22232a] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-[#33353e] mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                Подключенные каналы и ключи
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Добавляйте Telegram-каналы и Threads-аккаунты для мульти-постинга
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#2c2d36] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Add Channel Button / Form Toggle */}
          {!isAdding ? (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-dashed border-zinc-300 dark:border-[#33353e] bg-zinc-50/70 hover:bg-zinc-100 dark:bg-[#1c1d23] dark:hover:bg-[#25262e] text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4 text-sky-500" />
              <span>Добавить новый канал или аккаунт</span>
            </button>
          ) : (
            /* Add Channel Card */
            <form onSubmit={handleCreate} className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#1c1d23] border border-zinc-200 dark:border-[#33353e] space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60 dark:border-[#33353e]/60">
                <span className="text-xs font-bold text-zinc-900 dark:text-white">
                  Новый канал
                </span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  Отмена
                </button>
              </div>

              {/* Platform Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Платформа
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPlatform('telegram')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      platform === 'telegram'
                        ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                        : 'bg-white dark:bg-[#22232a] border-zinc-200 dark:border-[#33353e] text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    Telegram
                  </button>

                  <button
                    type="button"
                    onClick={() => setPlatform('threads')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      platform === 'threads'
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-xs'
                        : 'bg-white dark:bg-[#22232a] border-zinc-200 dark:border-[#33353e] text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <AtSign className="w-3.5 h-3.5" />
                    Threads
                  </button>
                </div>
              </div>

              {/* Friendly Name */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Название канала / профиля <span className="text-sky-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={platform === 'telegram' ? 'Например: IT Новости или Личный блог' : 'Например: @vlad_daily или @crypto_feed'}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#22232a] border border-zinc-200 dark:border-[#33353e] text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-sky-500/50"
                />
              </div>

              {/* Telegram Fields */}
              {platform === 'telegram' && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                      ID или логин канала (@channel_name) <span className="text-sky-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={telegramChannelId}
                      onChange={(e) => setTelegramChannelId(e.target.value)}
                      placeholder="@my_channel или -100123456789"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#22232a] border border-zinc-200 dark:border-[#33353e] text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-sky-500/50 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1 flex items-center justify-between">
                      <span>Токен бота Telegram</span>
                      <span className="text-[10px] text-zinc-400">(опционально)</span>
                    </label>
                    <input
                      type="password"
                      value={telegramBotToken}
                      onChange={(e) => setTelegramBotToken(e.target.value)}
                      placeholder="Оставьте пустым, чтобы использовать дефолтный бот из .env"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#22232a] border border-zinc-200 dark:border-[#33353e] text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-sky-500/50 font-mono"
                    />
                  </div>
                </>
              )}

              {/* Threads Fields */}
              {platform === 'threads' && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                      Threads User ID <span className="text-sky-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={threadsUserId}
                      onChange={(e) => setThreadsUserId(e.target.value)}
                      placeholder="Числовой или буквенный ID из Meta Developers"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#22232a] border border-zinc-200 dark:border-[#33353e] text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-sky-500/50 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                      Threads Access Token <span className="text-sky-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={threadsAccessToken}
                      onChange={(e) => setThreadsAccessToken(e.target.value)}
                      placeholder="THQW..."
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#22232a] border border-zinc-200 dark:border-[#33353e] text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-sky-500/50 font-mono"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs shadow-md shadow-sky-500/20 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Сохранить канал</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* List of Connected Channels */}
          <div className="space-y-2.5 pt-1">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Ваши каналы ({channels.length})
            </span>

            {channels.length === 0 ? (
              <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-[#1c1d23] border border-zinc-200 dark:border-[#33353e] text-center">
                <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                  Пока не добавлено ни одного канала
                </p>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
                  Нажмите кнопку выше, чтобы привязать свои Telegram-каналы или аккаунты Threads.
                </p>
              </div>
            ) : (
              channels.map((ch) => (
                <div
                  key={ch.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#1c1d23] border border-zinc-200 dark:border-[#33353e] shadow-2xs group transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        ch.platform === 'telegram'
                          ? 'bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400'
                          : 'bg-zinc-200 text-zinc-800 dark:bg-white/10 dark:text-white'
                      }`}
                    >
                      {ch.platform === 'telegram' ? (
                        <Send className="w-4 h-4" />
                      ) : (
                        <AtSign className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                          {ch.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-200/80 dark:bg-[#2c2d36] text-zinc-600 dark:text-zinc-300">
                          {ch.platform}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate font-mono mt-0.5">
                        {ch.platform === 'telegram'
                          ? ch.telegram_channel_id || 'Дефолтный канал'
                          : `ID: ${ch.threads_user_id || 'Не указан'}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(ch)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                        ch.is_active
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-zinc-200 dark:bg-[#2c2d36] text-zinc-500'
                      }`}
                    >
                      {ch.is_active ? 'Активен' : 'Отключен'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(ch.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-[#2c2d36] transition-colors cursor-pointer"
                      title="Удалить канал"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-zinc-100 dark:border-[#33353e] text-center">
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
            Каналы сохраняются в вашей базе данных Supabase и доступны для выбора при создании каждого поста.
          </p>
        </div>
      </div>
    </div>
  );
}
