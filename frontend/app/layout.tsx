import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PwaRegister } from '@/components/PwaRegister';

export const viewport: Viewport = {
  themeColor: '#DC2626',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Hệ Thống SOS Khẩn Cấp Nội Bộ',
  description: 'Ứng dụng gọi và gửi tin báo sự cố khẩn cấp tức thời qua mã QR - Không cần cài đặt ứng dụng',
  manifest: '/manifest.json',
  applicationName: 'SOS Nội Bộ',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SOS Nội Bộ',
  },
  formatDetection: {
    telephone: true,
  },
  icons: {
    icon: '/icons/icon.svg',
    shortcut: '/icons/icon.svg',
    apple: '/icons/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark h-full">
      <head>
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="h-full bg-slate-950 text-slate-100 antialiased selection:bg-red-500 selection:text-white">
        <PwaRegister />
        <main className="min-h-full flex flex-col justify-between">
          {children}
        </main>
      </body>
    </html>
  );
}
