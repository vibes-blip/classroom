import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";

interface Teacher {
  name: string;
  subject: string;
  description: string;
  rating: string;
  reviews: string;
  image: string;
}

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  academicLevel: string;
  sessionDate: string;
  timeSlot: string;
  format: string;
  notes: string;
}

const teachers: Teacher[] = [
  {
    name: "Dr. Sarah Jenkins",
    subject: "Mathematics & Physics",
    description:
      "Ph.D. in Applied Mathematics with 8+ years teaching experience.",
    rating: "4.9",
    reviews: "120+",
    image: "https://placehold.co/100x100/indigo/white?text=SJ",
  },
  {
    name: "Prof. Marcus Vance",
    subject: "Computer Science & AI",
    description:
      "Senior Software Architect and university lecturer in algorithms.",
    rating: "5.0",
    reviews: "95+",
    image: "https://placehold.co/100x100/teal/white?text=MV",
  },
  {
    name: "Elena Rostova",
    subject: "Languages & Literature",
    description:
      "Polyglot and certified IELTS/TOEFL instructor.",
    rating: "4.8",
    reviews: "150+",
    image: "https://placehold.co/100x100/amber/white?text=ER",
  },
];

const timeSlots: string[] = [
  "09:00 AM – 10:30 AM",
  "11:00 AM – 12:30 PM",
  "02:00 PM – 03:30 PM",
  "04:00 PM – 05:30 PM",
  "06:00 PM – 07:30 PM",
];

function BookTeacher() {
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);

  const today = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phone: "",
    academicLevel: "High School (Grades 9-12)",
    sessionDate: today,
    timeSlot: timeSlots[0],
    format: "Live Online Classroom",
    notes: "",
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      sessionDate: today,
    }));
  }, [today]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedTeacher) {
      alert("Please select a teacher.");
      return;
    }

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTeacher("");

    setFormData({
      fullName: "",
      email: "",
      phone: "",
      academicLevel: "High School (Grades 9-12)",
      sessionDate: today,
      timeSlot: timeSlots[0],
      format: "Live Online Classroom",
      notes: "",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-emerald-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-8 text-center">
          <span className="mb-2 inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700">
            Expert Tutoring Platform
          </span>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Book a Private Teacher
          </h1>

          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600 sm:text-base">
            Choose your expert instructor, select your ideal date and time,
            and fast-track your learning journey today.
          </p>
        </div>

        {/* Main Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white/90 shadow-xl backdrop-blur-md">
          <form
            onSubmit={handleSubmit}
            className="space-y-8 p-6 sm:p-10"
          >

            {/* Teacher Selection */}
            <div>
              <label className="mb-3 block text-base font-semibold text-slate-800">
                1. Select Your Instructor
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {teachers.map((teacher) => {
                  const selected = selectedTeacher === teacher.name;

                  return (
                    <label
                      key={teacher.name}
                      className={`relative flex cursor-pointer flex-col rounded-xl border-2 bg-white p-4 shadow-sm transition ${
                        selected
                          ? "border-indigo-600 ring-2 ring-indigo-200"
                          : "border-slate-200 hover:border-indigo-500"
                      }`}
                    >
                      <input
                        type="radio"
                        name="teacher"
                        value={teacher.name}
                        checked={selected}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setSelectedTeacher(e.target.value)
                        }
                        className="sr-only"
                      />

                      <div className="mb-2 flex items-center space-x-3">
                        <img
                          src={teacher.image}
                          alt={teacher.name}
                          className="h-12 w-12 rounded-full object-cover"
                        />

                        <div>
                          <h3 className="text-sm font-bold text-slate-900">
                            {teacher.name}
                          </h3>

                          <span className="text-xs font-medium text-indigo-600">
                            {teacher.subject}
                          </span>
                        </div>
                      </div>

                      <p className="mb-2 text-xs text-slate-500">
                        {teacher.description}
                      </p>

                      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-2 text-xs font-medium text-slate-600">
                        <span>
                          ⭐ {teacher.rating} ({teacher.reviews} reviews)
                        </span>

                        {selected && (
                          <span className="font-bold text-indigo-600">
                            Selected ✓
                          </span>
                        )}
                      </div>

                      {selected && (
                        <div className="pointer-events-none absolute inset-0 rounded-xl border-2 border-indigo-600" />
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Student Information */}
            <div className="border-t border-slate-200 pt-6">
              <label className="mb-3 block text-base font-semibold text-slate-800">
                2. Student Information
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                {/* Full Name */}
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Alex Morgan"
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Email Address
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="e.g. alex@example.com"
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Phone / WhatsApp
                  </label>

                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="+1 (555) 000-0000"
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Academic Level */}
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Academic Level
                  </label>

                  <select
                    name="academicLevel"
                    value={formData.academicLevel}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option>High School (Grades 9-12)</option>
                    <option>Undergraduate / College</option>
                    <option>Graduate / Professional</option>
                    <option>Self-Learner / Hobbyist</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="border-t border-slate-200 pt-6">
              <label className="mb-3 block text-base font-semibold text-slate-800">
                3. Choose Session Schedule
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                {/* Date */}
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Preferred Date
                  </label>

                  <input
                    type="date"
                    name="sessionDate"
                    value={formData.sessionDate}
                    min={today}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Time */}
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Time Slot
                  </label>

                  <select
                    name="timeSlot"
                    value={formData.timeSlot}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    {timeSlots.map((slot) => (
                      <option key={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Format */}
              <div className="mt-4">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Session Format
                </label>

                <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:space-x-6">
                  <label className="flex cursor-pointer items-center space-x-2 text-sm text-slate-700">
                    <input
                      type="radio"
                      name="format"
                      value="Live Online Classroom"
                      checked={formData.format === "Live Online Classroom"}
                      onChange={handleChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                    />

                    <span>Online Video Room (Zoom / Meet)</span>
                  </label>

                  <label className="flex cursor-pointer items-center space-x-2 text-sm text-slate-700">
                    <input
                      type="radio"
                      name="format"
                      value="In-Person Tutoring"
                      checked={formData.format === "In-Person Tutoring"}
                      onChange={handleChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                    />

                    <span>In-Person Learning Center</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Learning Goals */}
            <div className="border-t border-slate-200 pt-6">
              <label className="mb-3 block text-base font-semibold text-slate-800">
                4. Learning Focus & Goals
              </label>

              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Describe the specific topics, homework questions, or exam prep you want to tackle during the session..."
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3.5 text-base font-semibold text-white shadow-lg transition duration-200 hover:from-indigo-700 hover:to-violet-700 focus:outline-none focus:ring-4 focus:ring-indigo-300"
              >
                Confirm & Book Teacher Session
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl sm:p-8">

            {/* Success Icon */}
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl font-bold text-emerald-600">
              ✓
            </div>

            <h3 className="mb-2 text-2xl font-bold text-slate-900">
              Booking Confirmed!
            </h3>

            <p className="mb-6 text-sm text-slate-600">
              Your session request has been successfully submitted.
              We have emailed the calendar invite and login link to
              your inbox.
            </p>

            {/* Booking Details */}
            <div className="mb-6 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-xs text-slate-700">

              <div className="flex justify-between gap-4">
                <span className="font-semibold text-slate-500">
                  Teacher:
                </span>

                <span className="font-bold text-slate-900">
                  {selectedTeacher}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="font-semibold text-slate-500">
                  Student:
                </span>

                <span className="font-bold text-slate-900">
                  {formData.fullName}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="font-semibold text-slate-500">
                  Date & Time:
                </span>

                <span className="font-bold text-slate-900">
                  {formData.sessionDate} ({formData.timeSlot})
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="font-semibold text-slate-500">
                  Format:
                </span>

                <span className="font-bold text-slate-900">
                  {formData.format}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={closeModal}
              className="w-full rounded-xl bg-slate-900 py-2.5 font-medium text-white transition hover:bg-slate-800"
            >
              Done / Book Another Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookTeacher;