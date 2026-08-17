import type { Metadata } from 'next';
import { generatePrivateEventFormMetadata } from '@/lib/utils/private-event-form-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generatePrivateEventFormMetadata('/aanmeld-formulier', 'nl');
}

export default function AanmeldFormulierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
