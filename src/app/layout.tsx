import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lazy-Post Studio • Telegram & Threads',
  description: 'Профессиональная веб-студия отложенного автопостинга новостей в Telegram и Threads',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark">
      <body className="bg-[#f6f8fa] dark:bg-[#18181b] text-zinc-800 dark:text-zinc-100 antialiased min-h-screen transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
