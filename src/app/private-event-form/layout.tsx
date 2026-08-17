import type { Metadata } from 'next';
import { generatePrivateEventFormMetadata } from '@/lib/utils/private-event-form-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generatePrivateEventFormMetadata('/private-event-form', 'en');
}

export default function PrivateEventFormLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
