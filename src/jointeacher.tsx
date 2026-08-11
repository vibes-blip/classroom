import React, { useState } from 'react';

interface ApplicationFormData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  primarySubject: string;
  experienceYears: string;
  educationLevel: string;
  bio: string;
  portfolioUrl: string;
  teachingFormat: string[];
  availability: string;
  expectedRate: string;
}

export default function TeacherApplicationApp() {
  const [formData, setFormData] = useState<ApplicationFormData>({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    primarySubject: 'Mathematics & STEM',
    experienceYears: '3-5 years',
    educationLevel: "Master's Degree",
    bio: '',
    portfolioUrl: '',
    teachingFormat: ['Live Online Classroom'],
    availability: 'Part-Time (10-20 hrs/week)',
    expectedRate: '$35 - $50 / hr',
  });

  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (format: string) => {
    setFormData(prev => {
      const exists = prev.teachingFormat.includes(format);
      if (exists) {
        return { ...prev, teachingFormat: prev.teachingFormat.filter(f => f !== format) };
      } else {
        return { ...prev, teachingFormat: [...prev.teachingFormat, format] };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      location: '',
      primarySubject: 'Mathematics & STEM',
      experienceYears: '3-5 years',
      educationLevel: "Master's Degree",
      bio: '',
      portfolioUrl: '',
      teachingFormat: ['Live Online Classroom'],
      availability: 'Part-Time (10-20 hrs/week)',
      expectedRate: '$35 - $50 / hr',
    });
  };

  return (
    <div className="bg-gradient-to-br from-teal-50 via-sky-50 to-indigo-50 min-h-screen py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Banner */}
        <div className="text-center mb-8">
          <span className="inline-block bg-teal-100 text-teal-800 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
            Educator Portal (React TSX)
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Apply to Become an Instructor
          </h1>
          <p className="text-slate-600 mt-2 max-w-xl mx-auto text-sm sm:text-base">
            Join our global faculty network. Share your expertise, mentor ambitious students, and conduct public or premium 1-on-1 classes.
          </p>
        </div>

        {/* Main Application Card */}
        <div className="bg-white/90 backdrop-blur-md shadow-xl rounded-2xl border border-slate-100 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-8">

            {/* Section 1: Personal & Contact Information */}
            <div>
              <h2 className="text-base font-semibold text-slate-800 mb-3">
                1. Personal & Contact Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Full Legal Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition text-sm text-slate-900"
                    placeholder="e.g. Dr. Arthur Pendelton"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition text-sm text-slate-900"
                    placeholder="e.g. arthur@faculty.edu"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Phone / WhatsApp</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition text-sm text-slate-900"
                    placeholder="+1 (555) 234-5678"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Current City / Country</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition text-sm text-slate-900"
                    placeholder="e.g. Boston, MA, USA"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Professional Expertise & Education */}
            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-base font-semibold text-slate-800 mb-3">
                2. Professional Expertise & Education
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Primary Subject</label>
                  <select
                    name="primarySubject"
                    value={formData.primarySubject}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition text-sm text-slate-900"
                  >
                    <option>Mathematics & STEM</option>
                    <option>Computer Science & AI</option>
                    <option>Languages & Literature</option>
                    <option>Physics & Natural Sciences</option>
                    <option>Business & Economics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Teaching Experience</label>
                  <select
                    name="experienceYears"
                    value={formData.experienceYears}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition text-sm text-slate-900"
                  >
                    <option>1-2 years</option>
                    <option>3-5 years</option>
                    <option>6-10 years</option>
                    <option>10+ years (Senior Faculty)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Highest Degree</label>
                  <select
                    name="educationLevel"
                    value={formData.educationLevel}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition text-sm text-slate-900"
                  >
                    <option>Bachelor's Degree</option>
                    <option>Master's Degree</option>
                    <option>Ph.D. / Doctorate</option>
                    <option>Industry Certification</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Teaching Preferences & Formats */}
            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-base font-semibold text-slate-800 mb-3">
                3. Teaching Formats & Availability
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                    Accepted Class Formats (Check all that apply)
                  </label>
                  <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    {['Live Online Classroom', 'Premium 1-on-1 (Exclusive)', 'Public Group Workshops', 'In-Person Learning Center'].map((fmt) => {
                      const checked = formData.teachingFormat.includes(fmt);
                      return (
                        <label key={fmt} className="flex items-center space-x-3 text-sm text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleCheckboxChange(fmt)}
                            className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                          />
                          <span>{fmt}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Availability Commitment</label>
                    <select
                      name="availability"
                      value={formData.availability}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition text-sm text-slate-900"
                    >
                      <option>Part-Time (10-20 hrs/week)</option>
                      <option>Full-Time (30+ hrs/week)</option>
                      <option>Weekend Only Sessions</option>
                      <option>Flexible / As-Needed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Expected Hourly Compensation</label>
                    <select
                      name="expectedRate"
                      value={formData.expectedRate}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition text-sm text-slate-900"
                    >
                      <option>$25 - $35 / hr</option>
                      <option>$35 - $50 / hr</option>
                      <option>$50 - $75 / hr</option>
                      <option>$75+ / hr (Master Expert)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Biography & Portfolio */}
            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-base font-semibold text-slate-800 mb-3">
                4. Professional Bio & Portfolio
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Educator Bio / Teaching Philosophy</label>
                  <textarea
                    name="bio"
                    rows={3}
                    value={formData.bio}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition text-sm text-slate-900"
                    placeholder="Summarize your teaching methodology, achievements, and student success stories..."
                  ></textarea>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">LinkedIn Profile or Professional Website (Optional)</label>
                  <input
                    type="url"
                    name="portfolioUrl"
                    value={formData.portfolioUrl}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition text-sm text-slate-900"
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-semibold py-3.5 rounded-xl shadow-lg hover:from-teal-700 hover:to-emerald-700 focus:outline-none focus:ring-4 focus:ring-teal-300 transition duration-200 text-base"
              >
                Submit Educator Application
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* Success Modal */}
      {isSubmitted && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl transform transition-all text-center">
            <div className="w-16 h-16 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              ✓
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Application Submitted!</h3>
            <p className="text-slate-600 text-sm mb-6">
              Thank you for applying to join our faculty network. Our academic committee will review your credentials and get back to you within 2 business days.
            </p>
            
            <div className="bg-slate-50 rounded-xl p-4 text-left text-xs text-slate-700 space-y-2 mb-6 border border-slate-200">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Applicant:</span>
                <span className="font-bold text-slate-900">{formData.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Subject:</span>
                <span className="font-bold text-teal-700">{formData.primarySubject}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Education:</span>
                <span className="font-bold text-slate-900">{formData.educationLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Commitment:</span>
                <span className="font-bold text-slate-900">{formData.availability}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Formats:</span>
                <span className="font-bold text-slate-900">{formData.teachingFormat.join(', ')}</span>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full bg-slate-900 text-white font-medium py-2.5 rounded-xl hover:bg-slate-800 transition"
            >
              Done / Submit Another Application
            </button>
          </div>
        </div>
      )}
    </div>
  );
}