'use client';

import React, { useState } from 'react';
import {
  Send,
  AtSign,
  Calendar,
  Clock,
  Upload,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Rocket,
  Loader2,
} from 'lucide-react';
import { TipTapEditor } from './TipTapEditor';
import { DateTimePicker } from './DateTimePicker';
import { formatForThreads, getCharacterCount } from '@/lib/text-helpers';

interface PostComposerProps {
  onPostCreated: () => void;
  onPreviewChange: (data: {
    title: string;
    contentHtml: string;
    threadsCustomText?: string;
    mediaUrl?: string | null;
  }) => void;
}

export function PostComposer({ onPostCreated, onPreviewChange }: PostComposerProps) {
  const [title, setTitle] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [contentPlain, setContentPlain] = useState('');

  // Threads specific custom text
  const [showThreadsCustom, setShowThreadsCustom] = useState(false);
  const [threadsCustomText, setThreadsCustomText] = useState('');

  // Media
  const [mediaUrl, setMediaUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Channels
  const [publishToTelegram, setPublishToTelegram] = useState(true);
  const [publishToThreads, setPublishToThreads] = useState(true);

  // Scheduling
  const getDefaultScheduledTime = () => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    d.setMinutes(0);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  const [scheduledAt, setScheduledAt] = useState(getDefaultScheduledTime);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Update live preview in parent
  const notifyPreview = (updated: {
    t?: string;
    html?: string;
    threadsText?: string;
    media?: string;
  }) => {
    onPreviewChange({
      title: updated.t !== undefined ? updated.t : title,
      contentHtml: updated.html !== undefined ? updated.html : contentHtml,
      threadsCustomText:
        updated.threadsText !== undefined ? updated.threadsText : threadsCustomText,
      mediaUrl: updated.media !== undefined ? updated.media : mediaUrl,
    });
  };

  // Image Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка загрузки файла');
      }

      setMediaUrl(data.url);
      notifyPreview({ media: data.url });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setIsUploading(false);
    }
  };

  // Quick preset dates
  const handleQuickPreset = (minutesFromNow: number, specificHour?: number) => {
    const d = new Date();
    if (specificHour !== undefined) {
      d.setDate(d.getDate() + 1);
      d.setHours(specificHour, 0, 0, 0);
    } else {
      d.setMinutes(d.getMinutes() + minutesFromNow);
    }
    const formatted = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setScheduledAt(formatted);
  };

  const handleSubmit = async (publishNow: boolean = false) => {
    if (!title.trim()) {
      setErrorMsg('Пожалуйста, укажите заголовок новости');
      return;
    }
    if (!contentHtml.trim() || contentHtml === '<p></p>') {
      setErrorMsg('Пожалуйста, введите текст новости');
      return;
    }
    if (!publishToTelegram && !publishToThreads) {
      setErrorMsg('Выберите хотя бы один канал для публикации');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        title: title.trim(),
        content_html: contentHtml,
        content_plain: contentPlain,
        threads_custom_text: showThreadsCustom ? threadsCustomText : null,
        media_url: mediaUrl.trim() || null,
        scheduled_at: new Date(scheduledAt).toISOString(),
        publish_to_telegram: publishToTelegram,
        publish_to_threads: publishToThreads,
        publish_now: publishNow,
      };

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка при сохранении поста');
      }

      // Reset form on success
      setTitle('');
      setContentHtml('');
      setContentPlain('');
      setThreadsCustomText('');
      setMediaUrl('');
      setShowThreadsCustom(false);
      setScheduledAt(getDefaultScheduledTime());
      notifyPreview({ t: '', html: '', threadsText: '', media: '' });

      onPostCreated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const effectiveThreadsText = showThreadsCustom
    ? threadsCustomText
    : formatForThreads(contentHtml);
  const threadsChars = getCharacterCount(effectiveThreadsText);

  return (
    <div className="rounded-3xl border border-zinc-200 dark:border-[#33353e] bg-white dark:bg-[#22232a] p-6 shadow-sm dark:shadow-md transition-colors">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-[#33353e] mb-5">
        <div>
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            <span className="p-1 rounded-lg bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            Создать публикацию
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Заполните новость, настройте каналы и запланируйте время выхода
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs font-medium">
          {errorMsg}
        </div>
      )}

      <div className="space-y-5">
        {/* Title Input */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Заголовок новости <span className="text-sky-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              notifyPreview({ t: e.target.value });
            }}
            placeholder="Короткий и емкий заголовок..."
            className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-[#1c1d23] border border-zinc-200 dark:border-[#33353e] text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-sm focus:outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/10 transition-all shadow-2xs"
          />
        </div>

        {/* TipTap Visual Editor */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Текст новости <span className="text-sky-500">*</span>
          </label>
          <TipTapEditor
            content={contentHtml}
            onChange={(html, plain) => {
              setContentHtml(html);
              setContentPlain(plain);
              notifyPreview({ html });
            }}
          />
        </div>

        {/* Threads Custom Text Accordion */}
        <div className="rounded-2xl border border-zinc-200 dark:border-[#33353e] bg-zinc-50/60 dark:bg-[#1c1d23] overflow-hidden transition-all shadow-2xs">
          <button
            type="button"
            onClick={() => setShowThreadsCustom(!showThreadsCustom)}
            className="w-full flex items-center justify-between p-3.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <AtSign className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              <span>Настроить отдельный текст для Threads</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                  threadsChars > 500
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold'
                    : 'bg-zinc-200/80 dark:bg-[#2c2d36] text-zinc-600 dark:text-zinc-300'
                }`}
              >
                {threadsChars}/500 знаков
              </span>
            </div>
            {showThreadsCustom ? (
              <ChevronUp className="w-4 h-4 text-zinc-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            )}
          </button>

          {showThreadsCustom && (
            <div className="p-3.5 border-t border-zinc-200 dark:border-[#33353e] bg-white dark:bg-[#22232a]">
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-2">
                Если включено, в Threads отправится этот текст вместо основного текста из редактора выше.
              </p>
              <textarea
                rows={4}
                value={threadsCustomText}
                onChange={(e) => {
                  setThreadsCustomText(e.target.value);
                  notifyPreview({ threadsText: e.target.value });
                }}
                placeholder="Сокращенная версия для Threads (до 500 символов)..."
                className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-[#1c1d23] border border-zinc-200 dark:border-[#33353e] text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-sky-500/50"
              />
            </div>
          )}
        </div>

        {/* Media / Image Attachment */}
        <div className="rounded-2xl border border-zinc-200 dark:border-[#33353e] bg-zinc-50/60 dark:bg-[#1c1d23] p-3.5 shadow-2xs">
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
            Изображение к публикации
          </label>

          {mediaUrl ? (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-[#22232a] border border-zinc-200 dark:border-[#33353e] shadow-2xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl}
                alt="Uploaded"
                className="w-12 h-12 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-800 dark:text-zinc-200 truncate">{mediaUrl}</p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Файл прикреплен</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMediaUrl('');
                  notifyPreview({ media: '' });
                }}
                className="p-1.5 text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer"
                title="Удалить картинку"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-600 bg-white dark:bg-[#22232a] hover:bg-zinc-100 dark:hover:bg-[#2c2d36] transition-all text-xs font-medium text-zinc-700 dark:text-zinc-200 shadow-2xs">
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-sky-500" />
                    ) : (
                      <Upload className="w-4 h-4 text-sky-500" />
                    )}
                    <span>{isUploading ? 'Загрузка...' : 'Загрузить с устройства'}</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              </div>

              <input
                type="url"
                placeholder="Или вставьте прямую ссылку (https://...jpg)"
                value={mediaUrl}
                onChange={(e) => {
                  setMediaUrl(e.target.value);
                  notifyPreview({ media: e.target.value });
                }}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#22232a] border border-zinc-200 dark:border-[#33353e] text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-sky-500/50"
              />
            </div>
          )}
        </div>

        {/* Target Channels Selection */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
            Каналы публикации
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={`flex items-center gap-2.5 p-3 rounded-2xl border cursor-pointer transition-all ${
                publishToTelegram
                  ? 'bg-sky-50/70 dark:bg-sky-500/10 border-sky-400 dark:border-sky-500/40 text-sky-950 dark:text-white shadow-2xs'
                  : 'bg-zinc-50/60 dark:bg-[#1c1d23] border-zinc-200 dark:border-[#33353e] text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <input
                type="checkbox"
                checked={publishToTelegram}
                onChange={(e) => setPublishToTelegram(e.target.checked)}
                className="w-4 h-4 rounded-md text-sky-500 bg-white dark:bg-[#1c1d23] border-zinc-300 dark:border-zinc-700 focus:ring-0"
              />
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-sky-500" />
                <span className="text-xs font-semibold">Telegram-канал</span>
              </div>
            </label>

            <label
              className={`flex items-center gap-2.5 p-3 rounded-2xl border cursor-pointer transition-all ${
                publishToThreads
                  ? 'bg-zinc-100/80 dark:bg-zinc-100/10 border-zinc-400 dark:border-zinc-400/40 text-zinc-900 dark:text-white shadow-2xs'
                  : 'bg-zinc-50/60 dark:bg-[#1c1d23] border-zinc-200 dark:border-[#33353e] text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <input
                type="checkbox"
                checked={publishToThreads}
                onChange={(e) => setPublishToThreads(e.target.checked)}
                className="w-4 h-4 rounded-md text-zinc-800 dark:text-zinc-200 bg-white dark:bg-[#1c1d23] border-zinc-300 dark:border-zinc-700 focus:ring-0"
              />
              <div className="flex items-center gap-2">
                <AtSign className="w-4 h-4 text-zinc-800 dark:text-zinc-200" />
                <span className="text-xs font-semibold">Threads-аккаунт</span>
              </div>
            </label>
          </div>
        </div>

        {/* Schedule Time via Interactive Popover */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-sky-500" /> Дата и время выхода
          </label>

          <DateTimePicker
            value={scheduledAt}
            onChange={(newVal) => setScheduledAt(newVal)}
            onQuickPreset={handleQuickPreset}
          />
        </div>

        {/* Submit Actions */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit(false)}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs shadow-md shadow-sky-500/20 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Calendar className="w-4 h-4" />
            )}
            <span>Запланировать</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200/80 dark:bg-[#1c1d23] dark:hover:bg-[#25262e] text-zinc-800 dark:text-zinc-200 text-xs font-semibold border border-zinc-200 dark:border-[#33353e] transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-2xs"
            title="Опубликовать в каналы прямо сейчас без ожидания"
          >
            <Rocket className="w-3.5 h-3.5 text-amber-500" />
            <span>Опубликовать сейчас</span>
          </button>
        </div>
      </div>
    </div>
  );
}
