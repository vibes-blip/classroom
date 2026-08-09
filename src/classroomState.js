export function createClassroomRecord({ title, teacher, subject, startsAt, duration = '60 min', description = '' }) {
  return {
    id: `class-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    teacher,
    subject,
    description,
    startsAt,
    duration,
    status: 'Live Now',
    attendees: 1,
    joinCode: Math.random().toString(36).slice(2, 6).toUpperCase(),
    isActive: true,
  };
}

export function joinClassroomRecord(classroom) {
  return {
    ...classroom,
    attendees: classroom.attendees + 1,
    status: 'Live Now',
    isActive: true,
  };
}
