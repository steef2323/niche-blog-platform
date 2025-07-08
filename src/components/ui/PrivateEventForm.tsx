'use client';

import React, { useState } from 'react';
import { useSite } from '@/contexts/site';

interface PrivateEventFormProps {
  className?: string;
  title?: string;
  subtitle?: string;
  successMessage?: string;
  language?: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  datetime: string;
  location: string;
  numberOfGuests: string;
  extraInformation: string;
}

export default function PrivateEventForm({ 
  className = '', 
  title = 'Ready to Book Your Private Event?',
  subtitle = 'Contact us to discuss your special occasion and create an unforgettable experience.',
  successMessage,
  language = 'en'
}: PrivateEventFormProps) {
  
  // Multi-language support
  const translations = {
    en: {
      nameLabel: 'Your full name *',
      emailLabel: 'your@email.com *',
      phoneLabel: 'Phone number *',
      datetimeLabel: 'Date + time of the event *',
      guestsLabel: 'Number of guests',
      locationLabel: 'Event location *',
      extraInfoLabel: 'Tell us about your event...',
      submitButton: 'Send Inquiry',
      submittingButton: 'Sending...',
      thankYou: 'Thank You!',
      submitAnother: 'Submit Another Request',
      requiredFieldsError: 'Please fill in all required fields.',
      invalidEmailError: 'Please enter a valid email address.',
      networkError: 'Network error. Please check your connection and try again.',
      defaultError: 'Something went wrong. Please try again.',
      defaultSuccessMessage: 'We\'ve received your private event request and will contact you soon to discuss the details.'
    },
    nl: {
      nameLabel: 'Uw volledige naam *',
      emailLabel: 'uw@email.com *',
      phoneLabel: 'Telefoonnummer *',
      datetimeLabel: 'Datum + tijd van het evenement *',
      guestsLabel: 'Aantal gasten',
      locationLabel: 'Evenementlocatie *',
      extraInfoLabel: 'Vertel ons over uw evenement...',
      submitButton: 'Verstuur Aanvraag',
      submittingButton: 'Versturen...',
      thankYou: 'Dank Je Wel!',
      submitAnother: 'Verstuur Nog Een Aanvraag',
      requiredFieldsError: 'Vul alle verplichte velden in.',
      invalidEmailError: 'Voer een geldig e-mailadres in.',
      networkError: 'Netwerkfout. Controleer uw verbinding en probeer opnieuw.',
      defaultError: 'Er is iets misgegaan. Probeer het opnieuw.',
      defaultSuccessMessage: 'We hebben uw privé evenement aanvraag ontvangen en zullen binnenkort contact met u opnemen om de details te bespreken.'
    }
  };

  const t = translations[language as keyof typeof translations] || translations.en;
  const { site } = useSite();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    datetime: '',
    location: '',
    numberOfGuests: '',
    extraInformation: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showDatetimePicker, setShowDatetimePicker] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Validation
    const requiredFields = ['name', 'email', 'phone', 'datetime', 'location'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof FormData]);
    
    if (missingFields.length > 0) {
      setError(t.requiredFieldsError);
      setIsSubmitting(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError(t.invalidEmailError);
      setIsSubmitting(false);
      return;
    }

    try {
      // Parse datetime into date and time parts for API
      const datetime = new Date(formData.datetime);
      const dateStr = datetime.toISOString().split('T')[0]; // YYYY-MM-DD
      const timeStr = datetime.toTimeString().split(' ')[0].slice(0, 5); // HH:MM

      const response = await fetch('/api/private-event-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          date: dateStr,
          preferredTime: timeStr,
          location: formData.location,
          numberOfGuests: formData.numberOfGuests,
          extraInformation: formData.extraInformation,
          siteId: site?.id
        }),
      });

      if (response.ok) {
        setShowSuccess(true);
        setFormData({
          name: '',
          email: '',
          phone: '',
          datetime: '',
          location: '',
          numberOfGuests: '',
          extraInformation: ''
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || t.defaultError);
      }
    } catch (error) {
      setError(t.networkError);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div 
        className={`rounded-[10px] p-8 text-center ${className}`}
        style={{
          backgroundColor: 'var(--accent-color)',
          color: 'var(--text-color)',
          fontFamily: 'var(--font-body)'
        }}
      >
        <h3 
          className="text-2xl font-bold mb-4"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {t.thankYou}
        </h3>
        <p className="text-lg mb-6">
          {successMessage || t.defaultSuccessMessage}
        </p>
        <button
          onClick={() => setShowSuccess(false)}
          className="btn-outline"
        >
          {t.submitAnother}
        </button>
      </div>
    );
  }

  return (
    <div 
      className={`rounded-[10px] p-8 ${className}`}
      style={{
        backgroundColor: 'var(--accent-color)',
        color: 'var(--text-color)',
        fontFamily: 'var(--font-body)'
      }}
    >
      <h3 
        className="text-2xl font-bold mb-4 text-center"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        {title}
      </h3>
      <p className="text-center mb-6 opacity-90">
        {subtitle}
      </p>

      {error && (
        <div 
          className="mb-6 p-4 rounded-lg border border-red-300 bg-red-50 text-red-700"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="name"
            placeholder={t.nameLabel}
            value={formData.name}
            onChange={handleInputChange}
            required
            className="themed-input w-full"
          />
          <input
            type="email"
            name="email"
            placeholder={t.emailLabel}
            value={formData.email}
            onChange={handleInputChange}
            required
            className="themed-input w-full"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="tel"
            name="phone"
            placeholder={t.phoneLabel}
            value={formData.phone}
            onChange={handleInputChange}
            required
            className="themed-input w-full"
          />
          <input
            type="number"
            name="numberOfGuests"
            placeholder={t.guestsLabel}
            value={formData.numberOfGuests}
            onChange={handleInputChange}
            min="1"
            className="themed-input w-full"
          />
        </div>

        <input
          type={formData.datetime || showDatetimePicker ? "datetime-local" : "text"}
          name="datetime"
          placeholder={formData.datetime || showDatetimePicker ? undefined : t.datetimeLabel}
          value={formData.datetime}
          onChange={handleInputChange}
          onFocus={() => setShowDatetimePicker(true)}
          onBlur={(e) => {
            // Keep datetime picker open if there's a value
            if (!e.target.value) {
              setShowDatetimePicker(false);
            }
          }}
          required
          className="themed-input w-full"
        />

        <input
          type="text"
          name="location"
          placeholder={t.locationLabel}
          value={formData.location}
          onChange={handleInputChange}
          required
          className="themed-input w-full"
        />

        <textarea
          name="extraInformation"
          placeholder={t.extraInfoLabel}
          value={formData.extraInformation}
          onChange={handleInputChange}
          rows={4}
          className="themed-input w-full resize-none"
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-outline w-full"
        >
          {isSubmitting ? t.submittingButton : t.submitButton}
        </button>
      </form>
    </div>
  );
} 