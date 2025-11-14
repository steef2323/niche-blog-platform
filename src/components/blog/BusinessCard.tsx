import Image from 'next/image';
import Link from 'next/link';
import { Business } from '@/types/airtable';

interface BusinessCardProps {
  business: Business;
  rank: number;
}

export default function BusinessCard({ business, rank }: BusinessCardProps) {
  const businessImage = business.Image?.[0];

  return (
    <div 
      className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
      style={{ 
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--border-color)'
      }}
    >
      {/* Rank Badge */}
      <div className="flex items-start gap-6">
        <div className="flex-shrink-0">
          <span 
            className="w-10 h-10 rounded-full text-lg font-bold flex items-center justify-center"
            style={{ 
              backgroundColor: 'var(--primary-color)',
              color: 'white',
              fontFamily: 'var(--font-body)'
            }}
          >
            {rank}
          </span>
        </div>

        <div className="flex-1">
          {/* Business Header */}
          <div className="mb-4">
            <h3 
              className="text-xl font-bold mb-2"
              style={{ 
                color: 'var(--text-color)',
                fontFamily: 'var(--font-heading)'
              }}
            >
              {business.Competitor}
            </h3>
            
            {/* Quick Details */}
            <div 
              className="flex flex-wrap items-center gap-4 text-sm mb-3"
              style={{ 
                color: 'var(--muted-color)',
                fontFamily: 'var(--font-body)'
              }}
            >
              {business.Price && (
                <div className="flex items-center">
                  <span className="font-medium">From €{business.Price}</span>
                </div>
              )}
              {business['Duration (minutes)'] && (
                <div className="flex items-center">
                  <span>{Math.floor(business['Duration (minutes)'] / 60)}h {business['Duration (minutes)'] % 60}m</span>
                </div>
              )}
              {business['Group size (maximum)'] && (
                <div className="flex items-center">
                  <span>Max {business['Group size (maximum)']} people</span>
                </div>
              )}
            </div>

            {/* Activity Tags */}
            {business.Activity && business.Activity.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {business.Activity.map((activity) => (
                  <span 
                    key={activity}
                    className="inline-block px-2 py-1 text-xs font-medium rounded"
                    style={{ 
                      backgroundColor: 'var(--secondary-color)', 
                      color: 'var(--text-color)',
                      fontFamily: 'var(--font-body)'
                    }}
                  >
                    {activity}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Business Image */}
          {businessImage && (
            <div className="mb-4">
              <Image
                src={businessImage.url}
                alt={business.Competitor}
                width={businessImage.width || 600}
                height={businessImage.height || 400}
                className="w-full h-64 object-cover rounded-lg"
                loading="lazy"
                quality={75}
                // Next.js automatically serves WebP/AVIF if supported
              />
            </div>
          )}

          {/* Description */}
          {business.Information && (
            <div className="mb-4">
              <p 
                className="leading-relaxed"
                style={{ 
                  color: 'var(--text-color)',
                  fontFamily: 'var(--font-body)'
                }}
              >
                {business.Information}
              </p>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Location */}
            {business.Cities && business.Cities.length > 0 && (
              <div className="flex items-start gap-2">
                <span 
                  className="font-medium text-sm"
                  style={{ 
                    color: 'var(--muted-color)',
                    fontFamily: 'var(--font-body)'
                  }}
                >
                  Location:
                </span>
                <span 
                  className="text-sm"
                  style={{ 
                    color: 'var(--text-color)',
                    fontFamily: 'var(--font-body)'
                  }}
                >
                  {business.Cities.join(', ')}
                </span>
              </div>
            )}

            {/* Languages */}
            {business['Language '] && business['Language '].length > 0 && (
              <div className="flex items-start gap-2">
                <span 
                  className="font-medium text-sm"
                  style={{ 
                    color: 'var(--muted-color)',
                    fontFamily: 'var(--font-body)'
                  }}
                >
                  Languages:
                </span>
                <span 
                  className="text-sm"
                  style={{ 
                    color: 'var(--text-color)',
                    fontFamily: 'var(--font-body)'
                  }}
                >
                  {business['Language '].join(', ')}
                </span>
              </div>
            )}

            {/* Private Events */}
            {business['Private event possible?'] && (
              <div className="flex items-start gap-2">
                <span 
                  className="font-medium text-sm"
                  style={{ 
                    color: 'var(--muted-color)',
                    fontFamily: 'var(--font-body)'
                  }}
                >
                  Private Events:
                </span>
                <span 
                  className="text-sm"
                  style={{ 
                    color: 'var(--text-color)',
                    fontFamily: 'var(--font-body)'
                  }}
                >
                  {business['Private event possible?']}
                </span>
              </div>
            )}

            {/* Art Instructor */}
            {business['Art instructor'] && (
              <div className="flex items-start gap-2">
                <span 
                  className="font-medium text-sm"
                  style={{ 
                    color: 'var(--muted-color)',
                    fontFamily: 'var(--font-body)'
                  }}
                >
                  Instructor:
                </span>
                <span 
                  className="text-sm"
                  style={{ 
                    color: 'var(--text-color)',
                    fontFamily: 'var(--font-body)'
                  }}
                >
                  {business['Art instructor']}
                </span>
              </div>
            )}

            {/* Events per week */}
            {business['Number of events per week'] && (
              <div className="flex items-start gap-2">
                <span 
                  className="font-medium text-sm"
                  style={{ 
                    color: 'var(--muted-color)',
                    fontFamily: 'var(--font-body)'
                  }}
                >
                  Events/week:
                </span>
                <span 
                  className="text-sm"
                  style={{ 
                    color: 'var(--text-color)',
                    fontFamily: 'var(--font-body)'
                  }}
                >
                  {business['Number of events per week']}
                </span>
              </div>
            )}

            {/* Around since */}
            {business['Around since'] && (
              <div className="flex items-start gap-2">
                <span 
                  className="font-medium text-sm"
                  style={{ 
                    color: 'var(--muted-color)',
                    fontFamily: 'var(--font-body)'
                  }}
                >
                  Since:
                </span>
                <span 
                  className="text-sm"
                  style={{ 
                    color: 'var(--text-color)',
                    fontFamily: 'var(--font-body)'
                  }}
                >
                  {new Date(business['Around since']).getFullYear()}
                </span>
              </div>
            )}
          </div>

          {/* What they do well / don't do well */}
          {(business['What they do well'] || business['What they don\'t do well']) && (
            <div className="mb-4 space-y-3">
              {business['What they do well'] && (
                <div 
                  className="p-3 border rounded-lg"
                  style={{ 
                    backgroundColor: 'var(--accent-color)',
                    borderColor: 'var(--border-color)'
                  }}
                >
                  <h4 
                    className="font-medium text-sm mb-1"
                    style={{ 
                      color: 'var(--text-color)',
                      fontFamily: 'var(--font-heading)'
                    }}
                  >
                    What they do well:
                  </h4>
                  <p 
                    className="text-sm"
                    style={{ 
                      color: 'var(--text-color)',
                      fontFamily: 'var(--font-body)',
                      opacity: 0.9
                    }}
                  >
                    {business['What they do well']}
                  </p>
                </div>
              )}
              {business['What they don\'t do well'] && (
                <div 
                  className="p-3 border rounded-lg"
                  style={{ 
                    backgroundColor: 'var(--secondary-color)',
                    borderColor: 'var(--border-color)'
                  }}
                >
                  <h4 
                    className="font-medium text-sm mb-1"
                    style={{ 
                      color: 'var(--text-color)',
                      fontFamily: 'var(--font-heading)'
                    }}
                  >
                    Areas for improvement:
                  </h4>
                  <p 
                    className="text-sm"
                    style={{ 
                      color: 'var(--text-color)',
                      fontFamily: 'var(--font-body)',
                      opacity: 0.9
                    }}
                  >
                    {business['What they don\'t do well']}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Call to Action */}
          <div 
            className="flex flex-wrap gap-3 pt-4 border-t"
            style={{ borderColor: 'var(--border-color)' }}
          >
            {business.Website && (
              <Link
                href={business.Website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors"
                style={{ 
                  backgroundColor: 'var(--primary-color)', 
                  color: 'white',
                  fontFamily: 'var(--font-body)'
                }}
              >
                Visit Website →
              </Link>
            )}
            
            {business['Link to good ads'] && (
              <Link
                href={business['Link to good ads']}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border rounded-lg font-medium transition-colors"
                style={{ 
                  borderColor: 'var(--primary-color)', 
                  color: 'var(--primary-color)',
                  fontFamily: 'var(--font-body)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--secondary-color)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                View Examples
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 