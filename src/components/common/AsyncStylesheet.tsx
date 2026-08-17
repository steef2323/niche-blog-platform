'use client';

interface AsyncStylesheetProps {
  href: string;
}

export default function AsyncStylesheet({ href }: AsyncStylesheetProps) {
  return (
    <link
      rel="stylesheet"
      href={href}
      media="print"
      crossOrigin="anonymous"
      onLoad={(event) => {
        event.currentTarget.media = 'all';
      }}
    />
  );
}
