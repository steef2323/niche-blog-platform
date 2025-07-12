import Image from 'next/image';
import { SEOImage } from '@/types/airtable';

interface InfoComponent1Props {
  title: string;
  text: string;
  image: SEOImage;
  className?: string;
}

// Helper function to convert text with dashes to proper HTML lists
function formatTextWithBullets(text: string): string {
  const lines = text.split('\n');
  let result = '';
  let inList = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('- ')) {
      // Start a list if we're not already in one
      if (!inList) {
        result += '<ul>';
        inList = true;
      }
      // Add list item (remove the dash and space)
      result += `<li>${line.substring(2)}</li>`;
    } else {
      // Close list if we were in one
      if (inList) {
        result += '</ul>';
        inList = false;
      }
      // Add regular paragraph (if not empty line)
      if (line) {
        result += `<p>${line}</p>`;
      }
    }
  }
  
  // Close list if we end while in a list
  if (inList) {
    result += '</ul>';
  }
  
  return result;
}

export default function InfoComponent1({ title, text, image, className = '' }: InfoComponent1Props) {
  const formattedText = formatTextWithBullets(text);

  return (
    <div 
      className={`rounded-[10px] overflow-hidden w-full ${className}`}
      style={{ 
        border: '1px solid var(--accent-color)',
        fontFamily: 'var(--font-body)'
      }}
    >
      {/* Mobile Layout: Image first, then title, then text */}
      <div className="block md:hidden">
        {/* Image - no padding from border */}
        <div className="w-full">
          <Image
            src={image.src}
            alt={image.alt}
            title={image.title}
            width={image.width || 800}
            height={image.height || 500}
            className="w-full h-auto object-cover"
            loading="lazy"
            quality={75}
            sizes="(max-width: 768px) 100vw, 50vw"
            // Next.js automatically serves WebP/AVIF if supported
          />
          {/* Image Caption for SEO */}
          {image.caption && (
            <div className="p-[20px] pt-2 border-t border-gray-100">
              <p 
                className="text-sm italic text-center"
                style={{ color: 'var(--muted-color)' }}
              >
                {image.caption}
              </p>
            </div>
          )}
        </div>
        
        {/* Title and Text with 20px padding */}
        <div className="p-[20px]">
          <h2 
            className="text-xl font-bold mb-3 text-left"
            style={{ 
              color: 'var(--text-color)',
              fontFamily: 'var(--font-heading)'
            }}
          >
            {title}
          </h2>
          <div 
            className="text-left leading-relaxed content-formatting"
            style={{ color: 'var(--text-color)' }}
            dangerouslySetInnerHTML={{ __html: formattedText }}
          />
        </div>
      </div>

      {/* Desktop Layout: 50% columns - Title + text on left, image on right */}
      <div className="hidden md:grid md:grid-cols-2 md:h-full">
        {/* Left Column: Title and Text with 20px padding */}
        <div className="p-[40px] flex flex-col justify-center">
          <h2 
            className="text-xl font-bold mb-3 text-left"
            style={{ 
              color: 'var(--text-color)',
              fontFamily: 'var(--font-heading)'
            }}
          >
            {title}
          </h2>
          <div 
            className="text-left leading-relaxed content-formatting"
            style={{ color: 'var(--text-color)' }}
            dangerouslySetInnerHTML={{ __html: formattedText }}
          />
        </div>
        
        {/* Right Column: Image - no padding from border */}
        <div className="w-full h-full flex flex-col">
          <div className="flex-1">
            <Image
              src={image.src}
              alt={image.alt}
              title={image.title}
              width={image.width || 800}
              height={image.height || 500}
              className="w-full h-full object-cover"
              loading="lazy"
              quality={75}
              sizes="(max-width: 768px) 100vw, 50vw"
              // Next.js automatically serves WebP/AVIF if supported
            />
          </div>
          {/* Image Caption for SEO */}
          {image.caption && (
            <div className="p-[20px] py-2 border-t border-gray-100">
              <p 
                className="text-sm italic text-center"
                style={{ color: 'var(--muted-color)' }}
              >
                {image.caption}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced styles for prominent bullet points */}
      <style jsx>{`
        .content-formatting :global(ul) {
          list-style: none;
          padding-left: 0;
          margin: 1em 0;
        }
        
        .content-formatting :global(li) {
          margin: 0.75em 0;
          line-height: 1.6;
        }
        
        .content-formatting :global(li::before) {
          content: "• ";
          font-weight: bold;
          font-size: 1.2em;
          color: var(--text-color);
        }
        
        .content-formatting :global(p) {
          margin: 0.75em 0;
          line-height: 1.6;
        }
        
        .content-formatting :global(p:first-child) {
          margin-top: 0;
        }
        
        .content-formatting :global(p:last-child) {
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
} 