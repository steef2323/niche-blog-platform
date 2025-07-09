'use client';

import { useState } from 'react';

interface PrivateEventFormSectionProps {
  simplified?: boolean;
  darkMode?: boolean;
}

export default function PrivateEventFormSection({ simplified = false, darkMode = false }: PrivateEventFormSectionProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    eventDate: '',
    eventType: '',
    guestCount: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Here you would typically send the form data to your backend
      // For now, we'll just simulate a submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Private event form submitted:', formData);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <section className={simplified ? "p-4" : "py-16 px-4"} style={{ backgroundColor: darkMode ? 'transparent' : 'var(--background-color)' }}>
        <div className={simplified ? "text-center" : "max-w-2xl mx-auto text-center"}>
          <div className={`${darkMode ? 'bg-white/10 text-white' : 'bg-white'} rounded-lg shadow-lg p-8`}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent-color)' }}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : ''}`} style={{ color: darkMode ? 'white' : 'var(--text-color)' }}>
              Thank You!
            </h3>
            <p className={darkMode ? "text-white/80" : "text-gray-600"}>
              We&apos;ve received your private event inquiry. Our team will get back to you within 24 hours to discuss your event details.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (simplified) {
    return (
      <div className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent"
              placeholder="Your full name"
            />
          </div>
          
          <div>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <textarea
              name="message"
              rows={3}
              value={formData.message}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent resize-none"
              placeholder="Tell us about your event..."
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors duration-200 ${
              darkMode 
                ? 'bg-white text-[var(--primary-color)] hover:bg-gray-100' 
                : 'bg-[var(--primary-color)] text-white hover:bg-[var(--secondary-color)]'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSubmitting ? 'Sending...' : 'Send Inquiry'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <section className="py-16 px-4" style={{ backgroundColor: 'var(--background-color)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-color)' }}>
            Plan Your Private Event
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Looking to host a special event? Let us help you create an unforgettable experience. 
            Fill out the form below and we&apos;ll get back to you with personalized recommendations.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="md:flex">
            {/* Form */}
            <div className="md:w-2/3 p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent"
                      placeholder="Your full name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Event Date
                    </label>
                    <input
                      type="date"
                      id="eventDate"
                      name="eventDate"
                      value={formData.eventDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="eventType" className="block text-sm font-medium text-gray-700 mb-2">
                      Event Type
                    </label>
                    <select
                      id="eventType"
                      name="eventType"
                      value={formData.eventType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent"
                    >
                      <option value="">Select event type</option>
                      <option value="birthday">Birthday Party</option>
                      <option value="wedding">Wedding</option>
                      <option value="corporate">Corporate Event</option>
                      <option value="anniversary">Anniversary</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="guestCount" className="block text-sm font-medium text-gray-700 mb-2">
                      Expected Guest Count
                    </label>
                    <input
                      type="number"
                      id="guestCount"
                      name="guestCount"
                      value={formData.guestCount}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent"
                      placeholder="Number of guests"
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Details
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent"
                    placeholder="Tell us more about your event vision, special requirements, or any questions you have..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 rounded-lg font-medium text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: 'var(--primary-color)' }}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Event Inquiry'}
                </button>
              </form>
            </div>

            {/* Info Panel */}
            <div className="md:w-1/3 p-8" style={{ backgroundColor: 'var(--primary-color)' }}>
              <div className="text-white">
                <h3 className="text-xl font-bold mb-6">Why Choose Us?</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-6 h-6 rounded-full bg-white bg-opacity-20 flex items-center justify-center mr-3 mt-1">
                      <span className="text-xs">✓</span>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Personalized Planning</h4>
                      <p className="text-sm opacity-90">Tailored recommendations based on your unique vision</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-6 h-6 rounded-full bg-white bg-opacity-20 flex items-center justify-center mr-3 mt-1">
                      <span className="text-xs">✓</span>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Local Expertise</h4>
                      <p className="text-sm opacity-90">Deep knowledge of the best venues and vendors</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-6 h-6 rounded-full bg-white bg-opacity-20 flex items-center justify-center mr-3 mt-1">
                      <span className="text-xs">✓</span>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">24/7 Support</h4>
                      <p className="text-sm opacity-90">We&apos;re here to help throughout your planning journey</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white border-opacity-20">
                  <p className="text-sm opacity-90">
                    <strong>Quick Response:</strong> We typically respond to inquiries within 2-4 hours during business hours.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 