import { Outlet } from 'react-router';
import { Toaster } from '@/components/ui/sonner';

export default function RootLayout() {
  return (
    <main className="p-6">
      <Outlet />
      <Toaster closeButton />
    </main>
  );
}
