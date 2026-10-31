'use client';

import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Strikethrough,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  RotateCcw,
} from 'lucide-react';

interface TipTapEditorProps {
  content: string;
  onChange: (html: string, plainText: string) => void;
  placeholder?: string;
}

export function TipTapEditor({
  content,
  onChange,
  placeholder = 'Напишите или вставьте текст новости...',
}: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-sky-600 dark:text-sky-400 underline cursor-pointer font-medium',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          'focus:outline-none p-4 min-h-[160px] text-zinc-800 dark:text-zinc-100 text-sm leading-relaxed',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const plain = editor.getText();
      onChange(html, plain);
    },
  });

  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Введите URL ссылки:', previousUrl);

    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  if (!editor) {
    return (
      <div className="w-full h-44 rounded-2xl bg-zinc-50 dark:bg-[#1c1d23] border border-zinc-200 dark:border-[#33353e] animate-pulse" />
    );
  }

  return (
    <div className="w-full rounded-2xl border border-zinc-200 dark:border-[#33353e] bg-zinc-50/50 dark:bg-[#1c1d23] overflow-hidden focus-within:border-sky-500/50 dark:focus-within:border-sky-500/50 focus-within:ring-2 focus-within:ring-sky-500/10 transition-all shadow-2xs">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-zinc-200/80 dark:border-[#33353e] bg-zinc-100/60 dark:bg-[#22232a]">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
            editor.isActive('bold')
              ? 'bg-zinc-200 dark:bg-[#32333e] text-zinc-900 dark:text-white font-bold'
              : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-[#2c2d36]'
          }`}
          title="Жирный шрифт"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
            editor.isActive('italic')
              ? 'bg-zinc-200 dark:bg-[#32333e] text-zinc-900 dark:text-white font-bold'
              : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-[#2c2d36]'
          }`}
          title="Курсив"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
            editor.isActive('strike')
              ? 'bg-zinc-200 dark:bg-[#32333e] text-zinc-900 dark:text-white font-bold'
              : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-[#2c2d36]'
          }`}
          title="Зачеркнутый"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-zinc-200 dark:bg-[#33353e] mx-1" />

        <button
          type="button"
          onClick={setLink}
          className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
            editor.isActive('link')
              ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 font-medium'
              : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-[#2c2d36]'
          }`}
          title="Вставить ссылку"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
            editor.isActive('bulletList')
              ? 'bg-zinc-200 dark:bg-[#32333e] text-zinc-900 dark:text-white font-bold'
              : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-[#2c2d36]'
          }`}
          title="Маркированный список"
        >
          <List className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
            editor.isActive('orderedList')
              ? 'bg-zinc-200 dark:bg-[#32333e] text-zinc-900 dark:text-white font-bold'
              : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-[#2c2d36]'
          }`}
          title="Нумерованный список"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
            editor.isActive('blockquote')
              ? 'bg-zinc-200 dark:bg-[#32333e] text-zinc-900 dark:text-white font-bold'
              : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-[#2c2d36]'
          }`}
          title="Цитата"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-zinc-200 dark:bg-[#33353e] mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-[#2c2d36] transition-colors cursor-pointer"
          title="Очистить форматирование"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Editor Area */}
      <EditorContent editor={editor} />
    </div>
  );
}
