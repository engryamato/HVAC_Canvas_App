import { AuthGuard } from '@/core/components/AuthGuard';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
