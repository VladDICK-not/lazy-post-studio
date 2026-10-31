'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Send,
  AtSign,
  LogOut,
  Layers,
  Sun,
  Moon,
  Settings2,
} from 'lucide-react';
import { PostComposer } from '@/components/PostComposer';
import { LivePreview } from '@/components/LivePreview';
import { PostsList } from '@/components/PostsList';
import { LoginModal } from '@/components/LoginModal';
import { ChannelsManagerModal } from '@/components/ChannelsManagerModal';
import { Post, Channel } from '@/lib/types';

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isChannelsModalOpen, setIsChannelsModalOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Live preview state synced with composer
  const [previewData, setPreviewData] = useState<{
    title: string;
    contentHtml: string;
    threadsCustomText?: string;
    mediaUrl?: string | null;
  }>({
    title: '',
    contentHtml: '',
    threadsCustomText: '',
    mediaUrl: null,
  });

  // Handle theme initialization and toggle
  useEffect(() => {
    const savedTheme = localStorage.getItem('cps_theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('cps_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Check auth
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth');
      const data = await res.json();
      setIsAuthenticated(data.authenticated);
    } catch {
      setIsAuthenticated(false);
    }
  }, []);

  // Fetch channels
  const fetchChannels = useCallback(async () => {
    try {
      const res = await fetch('/api/channels');
      const data = await res.json();
      if (res.ok) {
        setChannels(data.channels || []);
      }
    } catch (err) {
      console.error('Fetch channels error:', err);
    }
  }, []);

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    setIsLoadingPosts(true);
    try {
      const res = await fetch('/api/posts');
      const data = await res.json();
      if (res.ok) {
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error('Fetch posts error:', err);
    } finally {
      setIsLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPosts();
      fetchChannels();
    }
  }, [isAuthenticated, fetchPosts, fetchChannels]);

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    setIsAuthenticated(false);
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#f6f8fa] dark:bg-[#18181b] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const tgCount = channels.filter((c) => c.platform === 'telegram').length;
  const thCount = channels.filter((c) => c.platform === 'threads').length;

  return (
    <div className="min-h-screen bg-[#f6f8fa] dark:bg-[#18181b] text-zinc-800 dark:text-zinc-100 flex flex-col selection:bg-sky-500/20 selection:text-sky-600 transition-colors duration-200">
      {/* Show login modal if unauthenticated */}
      {!isAuthenticated && (
        <LoginModal
          onSuccess={() => {
            setIsAuthenticated(true);
            fetchPosts();
            fetchChannels();
          }}
        />
      )}

      {/* Channels Management Modal */}
      <ChannelsManagerModal
        isOpen={isChannelsModalOpen}
        onClose={() => setIsChannelsModalOpen(false)}
        channels={channels}
        onRefreshChannels={fetchChannels}
      />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 dark:border-[#33353e] bg-white/90 dark:bg-[#22232a]/90 backdrop-blur-xl px-4 lg:px-8 py-3.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white">
                  Lazy-Post Studio
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold border border-sky-500/20">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Мульти-постинг новостей в Telegram и Threads
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Channels Management Button */}
            <button
              type="button"
              onClick={() => setIsChannelsModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#1c1d23] dark:hover:bg-[#25262e] border border-zinc-200 dark:border-[#33353e] text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
              title="Открыть управление каналами и ключами"
            >
              <Settings2 className="w-3.5 h-3.5 text-sky-500" />
              <span>Каналы ({channels.length})</span>
            </button>

            {/* Status pills */}
            <div className="hidden md:flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-[#1c1d23] border border-zinc-200 dark:border-[#33353e] text-zinc-700 dark:text-zinc-300 text-[11px] font-medium shadow-2xs">
                <Send className="w-3 h-3 text-sky-500" /> {tgCount > 0 ? `${tgCount} TG` : 'Telegram'}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-[#1c1d23] border border-zinc-200 dark:border-[#33353e] text-zinc-700 dark:text-zinc-300 text-[11px] font-medium shadow-2xs">
                <AtSign className="w-3 h-3 text-zinc-800 dark:text-zinc-200" /> {thCount > 0 ? `${thCount} Threads` : 'Threads'}
              </span>
            </div>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-zinc-200 dark:border-[#33353e] bg-white dark:bg-[#1c1d23] text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-all shadow-2xs cursor-pointer"
              title={theme === 'dark' ? 'Переключить на светлую тему' : 'Переключить на темную тему'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-sky-600" />
              )}
            </button>

            {/* Logout button */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-[#33353e] bg-white dark:bg-[#1c1d23] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 text-xs font-medium transition-colors cursor-pointer shadow-2xs"
                title="Выйти"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Выйти</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Post Composer (7 cols) */}
          <div className="lg:col-span-7">
            <PostComposer
              channels={channels}
              onManageChannels={() => setIsChannelsModalOpen(true)}
              onPostCreated={fetchPosts}
              onPreviewChange={setPreviewData}
            />
          </div>

          {/* Right Column: Live Preview & Posts Queue (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <LivePreview
              title={previewData.title}
              contentHtml={previewData.contentHtml}
              threadsCustomText={previewData.threadsCustomText}
              mediaUrl={previewData.mediaUrl}
            />

            <PostsList
              posts={posts}
              isLoading={isLoadingPosts}
              onRefresh={fetchPosts}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-[#33353e] py-4 px-6 text-center text-xs text-zinc-500 dark:text-zinc-400 transition-colors">
        <p>Lazy-Post Studio • 100% бесплатный стек (Next.js + Supabase + Vercel)</p>
      </footer>
    </div>
  );
}
