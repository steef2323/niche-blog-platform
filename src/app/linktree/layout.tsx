import type { Metadata } from 'next';

// Linktree uses a minimal layout (no header/footer) and must not be indexed.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function LinktreeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
