'use client';

import React, { useState, useRef } from 'react';
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
  date: string;
  time: string;
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
      phoneLabel: 'Phone number',
      dateLabel: 'Date of the event',
      timeLabel: 'Time',
      guestsLabel: 'Number of guests',
      locationLabel: 'Event location',
      extraInfoLabel: 'Tell us about your event...',
      submitButton: 'Send Inquiry',
      submittingButton: 'Sending...',
      thankYou: 'Thank You!',
      submitAnother: 'Submit Another Request',
      requiredFieldsError: 'Please fill in all required fields.',
      invalidEmailError: 'Please enter a valid email address.',
      networkError: 'Network error. Please check your connection and try again.',
      defaultError: 'Something went wrong. Please try again.',
      defaultSuccessMessage: 'We\'ve received your private event request and will contact you soon to discuss the details.',
      optionalFieldsLabel: 'optional but very handy for us'
    },
    nl: {
      nameLabel: 'Uw volledige naam *',
      emailLabel: 'uw@email.com *',
      phoneLabel: 'Telefoonnummer',
      dateLabel: 'Datum van het evenement',
      timeLabel: 'Tijd',
      guestsLabel: 'Aantal gasten',
      locationLabel: 'Evenementlocatie',
      extraInfoLabel: 'Vertel ons over uw evenement...',
      submitButton: 'Verstuur Aanvraag',
      submittingButton: 'Versturen...',
      thankYou: 'Dank Je Wel!',
      submitAnother: 'Verstuur Nog Een Aanvraag',
      requiredFieldsError: 'Vul alle verplichte velden in.',
      invalidEmailError: 'Voer een geldig e-mailadres in.',
      networkError: 'Netwerkfout. Controleer uw verbinding en probeer opnieuw.',
      defaultError: 'Er is iets misgegaan. Probeer het opnieuw.',
      defaultSuccessMessage: 'We hebben uw privé evenement aanvraag ontvangen en zullen binnenkort contact met u opnemen om de details te bespreken.',
      optionalFieldsLabel: 'optioneel maar erg handig voor ons'
    }
  };

  const t = translations[language as keyof typeof translations] || translations.en;
  const { site, siteId: contextSiteId } = useSite();
  // Get current date in YYYY-MM-DD format for default
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Generate 30-minute time slots
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const defaultDate = getCurrentDate();
  const defaultTime = '16:00';
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    date: defaultDate, // Default to current date
    time: defaultTime, // Default to 16:00
    location: '',
    numberOfGuests: '',
    extraInformation: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);
  const [airtableRecordId, setAirtableRecordId] = useState<string | null>(null);
  const [hasCreatedRecord, setHasCreatedRecord] = useState(false);
  const [dateChanged, setDateChanged] = useState(false);
  const [timeChanged, setTimeChanged] = useState(false);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Track if date or time have been changed from defaults
    if (name === 'date') {
      setDateChanged(value !== defaultDate);
    }
    if (name === 'time') {
      setTimeChanged(value !== defaultTime);
    }

    // Check if we should show additional fields (when both name and email are filled)
    if (name === 'name' || name === 'email') {
      const updatedData = { ...formData, [name]: value };
      if (updatedData.name.trim() && updatedData.email.trim()) {
        setShowAdditionalFields(true);
      } else {
        // Hide additional fields if either name or email is cleared
        setShowAdditionalFields(false);
      }
    }
  };

  // Create record in Airtable when name and email are filled
  // Use a ref to track if we're currently creating to prevent duplicates
  const isCreatingRef = React.useRef(false);
  
  const createInitialRecord = async () => {
    // Prevent duplicate creation attempts
    if (hasCreatedRecord || isCreatingRef.current) {
      return airtableRecordId; // Return existing ID if already created or in progress
    }
    
    if (!formData.name.trim() || !formData.email.trim()) {
      return null;
    }

    isCreatingRef.current = true;
    try {
      const response = await fetch('/api/private-event-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          siteId: contextSiteId || site?.id,
          createOnly: true // Flag to indicate we only want to create, not submit full form
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAirtableRecordId(data.id);
        setHasCreatedRecord(true);
        isCreatingRef.current = false;
        return data.id;
      } else {
        console.error('Failed to create initial record');
        isCreatingRef.current = false;
        return null;
      }
    } catch (error) {
      console.error('Error creating initial record:', error);
      isCreatingRef.current = false;
      return null;
    }
  };

  // Handle focus on any additional field - create record if needed
  const handleAdditionalFieldFocus = async () => {
    await createInitialRecord();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Validation - only name and email are required
    const name = formData.name.trim();
    const email = formData.email.trim();
    
    if (!name) {
      setError('Please enter your name.');
      setIsSubmitting(false);
      return;
    }
    
    if (!email) {
      setError('Please enter your email address.');
      setIsSubmitting(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t.invalidEmailError);
      setIsSubmitting(false);
      return;
    }

    // Create initial record if it doesn't exist yet, and wait for it to complete
    let recordId = airtableRecordId;
    if (!hasCreatedRecord) {
      recordId = await createInitialRecord();
    }

    try {
      // Use date and time directly from form data
      const dateStr = formData.date || '';
      const timeStr = formData.time || '';

      // Always update the existing record if we have a record ID, otherwise create new
      const url = recordId 
        ? `/api/private-event-requests/${recordId}`
        : '/api/private-event-requests';
      
      const method = recordId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
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
          siteId: contextSiteId || site?.id
        }),
      });

      if (response.ok) {
        setShowSuccess(true);
        setFormData({
          name: '',
          email: '',
          phone: '',
          date: getCurrentDate(),
          time: '16:00',
          location: '',
          numberOfGuests: '',
          extraInformation: ''
        });
        setShowAdditionalFields(false);
        setAirtableRecordId(null);
        setHasCreatedRecord(false);
        setDateChanged(false);
        setTimeChanged(false);
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

  // Helper function to check if a field is filled
  const isFieldFilled = (fieldName: keyof FormData) => {
    const value = formData[fieldName];
    // For date and time, only consider them filled if user has changed them from defaults
    if (fieldName === 'date') {
      return dateChanged && value && value.trim().length > 0;
    }
    if (fieldName === 'time') {
      return timeChanged && value && value.trim().length > 0;
    }
    return value && value.trim().length > 0;
  };

  // Get field styling based on whether it's filled
  const getFieldClassName = (fieldName: keyof FormData) => {
    const baseClass = 'themed-input w-full transition-all duration-200';
    if (isFieldFilled(fieldName)) {
      return `${baseClass} border-0`;
    }
    return baseClass;
  };

  const getFieldStyle = (fieldName: keyof FormData) => {
    if (isFieldFilled(fieldName)) {
      return {
        backgroundColor: 'var(--accent-color)',
        border: 'none'
      };
    }
    return {};
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
        {/* Step 1: Name and Email */}
        <div className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder={t.nameLabel}
            value={formData.name}
            onChange={handleInputChange}
            className={getFieldClassName('name')}
            style={getFieldStyle('name')}
          />
          <input
            type="email"
            name="email"
            placeholder={t.emailLabel}
            value={formData.email}
            onChange={handleInputChange}
            className={getFieldClassName('email')}
            style={getFieldStyle('email')}
          />
        </div>

        {/* Step 2: Additional fields (shown when name and email are filled) */}
        {showAdditionalFields && (
          <div className="space-y-4">
            {/* Dotted line separator with text */}
            <div className="relative flex items-center my-6">
              <div className="flex-grow border-t border-dashed" style={{ borderColor: 'var(--border-color)' }}></div>
              <span className="px-4 text-sm opacity-70" style={{ color: 'var(--text-color)' }}>
                {t.optionalFieldsLabel}
              </span>
              <div className="flex-grow border-t border-dashed" style={{ borderColor: 'var(--border-color)' }}></div>
            </div>

            <input
              ref={phoneInputRef}
              type="tel"
              name="phone"
              placeholder={t.phoneLabel}
              value={formData.phone}
              onChange={handleInputChange}
              onFocus={handleAdditionalFieldFocus}
              className={getFieldClassName('phone')}
              style={getFieldStyle('phone')}
            />
            <input
              type="number"
              name="numberOfGuests"
              placeholder={t.guestsLabel}
              value={formData.numberOfGuests}
              onChange={handleInputChange}
              onFocus={handleAdditionalFieldFocus}
              min="1"
              className={getFieldClassName('numberOfGuests')}
              style={getFieldStyle('numberOfGuests')}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="date"
                name="date"
                placeholder={t.dateLabel}
                value={formData.date}
                onChange={handleInputChange}
                onFocus={handleAdditionalFieldFocus}
                min={getCurrentDate()}
                className={getFieldClassName('date')}
                style={getFieldStyle('date')}
              />
              <select
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                onFocus={handleAdditionalFieldFocus}
                className={getFieldClassName('time')}
                style={getFieldStyle('time')}
              >
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="text"
              name="location"
              placeholder={t.locationLabel}
              value={formData.location}
              onChange={handleInputChange}
              onFocus={handleAdditionalFieldFocus}
              className={getFieldClassName('location')}
              style={getFieldStyle('location')}
            />
            <textarea
              name="extraInformation"
              placeholder={t.extraInfoLabel}
              value={formData.extraInformation}
              onChange={handleInputChange}
              onFocus={handleAdditionalFieldFocus}
              rows={4}
              className={getFieldClassName('extraInformation')}
              style={getFieldStyle('extraInformation')}
            />
          </div>
        )}

        {/* Submit button - always visible */}
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