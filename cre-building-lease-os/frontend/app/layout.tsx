import './globals.css';
import Nav from '@/components/Nav';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body>
        <Nav />
        <div className="container">{children}</div>
      </body>
    </html>
  );
}
