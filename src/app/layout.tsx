import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'MomoVerse — A little world, a grand adventure',
  description: 'Explore Momo Village, make unusual friends, and build a place to call home.',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
