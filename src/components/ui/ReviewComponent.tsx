import React from 'react';

interface ReviewComponentProps {
  reviewText: string;
  reviewerName: string;
}

const ReviewComponent: React.FC<ReviewComponentProps> = ({ 
  reviewText, 
  reviewerName 
}) => {
  return (
    <div 
      className="review-component"
      style={{
        width: '100%',
        backgroundColor: 'var(--accent-color)',
        color: 'var(--text-color)',
        borderRadius: '10px',
        padding: '40px 20px',
        textAlign: 'center',
        fontFamily: 'var(--font-body)',
      }}
    >
      <blockquote
        style={{
          fontSize: '1.125rem',
          lineHeight: '1.6',
          margin: '0 0 20px 0',
          fontStyle: 'italic',
        }}
      >
        &ldquo;{reviewText}&rdquo;
      </blockquote>
      <cite 
        style={{
          fontSize: '1rem',
          fontWeight: '600',
          fontStyle: 'normal',
          fontFamily: 'var(--font-heading)',
        }}
      >
        — {reviewerName}
      </cite>
    </div>
  );
};

export default ReviewComponent; 