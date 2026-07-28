import { Outlet } from 'react-router';

export default function RootLayout() {
  return (
    <main className="p-6">
      <Outlet />
    </main>
  );
}
