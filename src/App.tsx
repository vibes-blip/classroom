import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { createClassroomRecord, joinClassroomRecord } from './classroomState';
import { connectLiveKit, getLiveKitToken } from './livekitClient';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:4000';
import {
  BookOpen, Users, Award, Calendar, DollarSign, Settings, Bell, MessageSquare,
  Video, FileText, CheckCircle, Shield, Search, Menu, X, Play, ArrowRight,
  Star, ChevronRight, User, LogOut, Upload, Plus, Check, AlertCircle,
  HelpCircle, Globe, Sparkles, Send, Mic, MicOff, Camera, CameraOff,
  Monitor, Hand, MessageCircle, BarChart2, PieChart, TrendingUp, ShieldAlert,
  Layers, Home as HomeIcon, Book, CreditCard, Bookmark, RefreshCw,
  UserPlus, Edit3, Clock, Download, Filter, GraduationCap, Brain, Smile
} from 'lucide-react';

const INITIAL_STATE = {
  currentUser: null,
  activeTab: 'home',
  selectedCourse: null,
  activeClassroom: null,
  aiChatOpen: false,
  classrooms: [],
  aiMessages: [],
  notifications: [],
};

export default function App() {
  const [state, setState] = useState(INITIAL_STATE);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  const socketRef = useRef(null);

  const logout = () => {
    setState(prev => ({ ...prev, currentUser: null, activeTab: 'home', activeClassroom: null }));
  };

  const navigateTo = (tab) => {
    const requiresLogin = ['student-dash', 'teacher-dash', 'admin-dash', 'classroom'];
    if (requiresLogin.includes(tab) && !state.currentUser) {
      setState(prev => ({ ...prev, activeTab: 'login' }));
      return;
    }

    if (tab === 'teacher-dash' && state.currentUser?.role !== 'teacher') {
      setState(prev => ({ ...prev, activeTab: 'login' }));
      return;
    }

    if (tab === 'student-dash' && state.currentUser?.role !== 'student') {
      setState(prev => ({ ...prev, activeTab: 'login' }));
      return;
    }

    if (tab === 'admin-dash' && state.currentUser?.role !== 'admin') {
      setState(prev => ({ ...prev, activeTab: 'login' }));
      return;
    }

    setState(prev => ({ ...prev, activeTab: tab }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    Promise.all([
      fetch('/api/classrooms').then(res => res.json()),
      fetch('/api/analytics/dashboard').then(res => res.json()),
    ]).then(([classrooms, metrics]) => {
      setState(prev => ({ ...prev, classrooms }));
      setDashboardMetrics(metrics);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL);
      socketRef.current.on('connect', () => {
        console.log('Socket connected', socketRef.current.id);
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigateTo('home')}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-black bg-gradient-to-r from-indigo-400 via-violet-300 to-pink-400 bg-clip-text text-transparent">
              EduVerse
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            {['home', 'courses', 'teachers', 'permissions', 'pricing', 'about', 'contact'].map(tab => (
              <button
                key={tab}
                onClick={() => navigateTo(tab)}
                className={`transition hover:text-indigo-400 capitalize ${state.activeTab === tab ? 'text-indigo-400 font-semibold' : ''}`}
              >
                {tab}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            {state.currentUser ? (
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigateTo(state.currentUser.role === 'student' ? 'student-dash' : state.currentUser.role === 'teacher' ? 'teacher-dash' : 'admin-dash')}
                  className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Open dashboard"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 h-2 w-2 bg-pink-500 rounded-full animate-pulse"></span>
                </button>

                <div
                  className="flex items-center space-x-2 pl-2 border-l border-slate-800 cursor-pointer"
                  onClick={() => navigateTo(state.currentUser.role === 'student' ? 'student-dash' : state.currentUser.role === 'teacher' ? 'teacher-dash' : 'admin-dash')}
                >
                  <img src={state.currentUser.photo} alt={state.currentUser.name} className="h-9 w-9 rounded-full object-cover border-2 border-indigo-500/50" />
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-200">{state.currentUser.name}</div>
                    <div className="text-[10px] text-indigo-400 uppercase tracking-wider font-semibold">{state.currentUser.role}</div>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button onClick={() => navigateTo('login')} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition">Login</button>
                <button onClick={() => navigateTo('register')} className="px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/30 transition">Get Started</button>
              </div>
            )}
          </div>

          <div className="md:hidden">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-300">
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-6 space-y-3">
            {['home', 'courses', 'teachers', 'permissions', 'pricing', 'student-dash'].map(tab => (
              <button key={tab} onClick={() => navigateTo(tab)} className="block w-full text-left py-2 text-slate-300 hover:text-indigo-400 capitalize">
                {tab.replace('-', ' ')}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main Router */}
      <main className="flex-grow">
        {state.activeTab === 'home' && <HomeView navigateTo={navigateTo} classrooms={state.classrooms} setState={setState} state={state} dashboardMetrics={dashboardMetrics} />}
      {state.activeTab === 'courses' && <CoursesView navigateTo={navigateTo} classrooms={state.classrooms} setState={setState} state={state} />}
      {state.activeTab === 'teachers' && <TeachersView navigateTo={navigateTo} />}
        {state.activeTab === 'permissions' && <PermissionsView />}
        {state.activeTab === 'pricing' && <PricingView navigateTo={navigateTo} />}
        {state.activeTab === 'about' && <AboutView />}
        {state.activeTab === 'contact' && <ContactView />}
        {state.activeTab === 'login' && <AuthView type="login" navigateTo={navigateTo} setState={setState} />}
        {state.activeTab === 'register' && <AuthView type="register" navigateTo={navigateTo} setState={setState} />}
        {state.activeTab === 'student-dash' && <StudentDashboard navigateTo={navigateTo} state={state} setState={setState} />}
        {state.activeTab === 'teacher-dash' && <TeacherDashboard navigateTo={navigateTo} state={state} setState={setState} />}
        {state.activeTab === 'admin-dash' && <AdminDashboard metrics={dashboardMetrics} />}
        {state.activeTab === 'classroom' && <VirtualClassroom navigateTo={navigateTo} state={state} setState={setState} socketRef={socketRef} />}
      </main>

      {/* AI Tutor Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        {state.aiChatOpen ? (
          <div className="w-80 sm:w-96 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[500px]">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4 flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-yellow-300 animate-spin" />
                <span className="font-bold text-sm">Gemini AI Study Assistant</span>
              </div>
              <button onClick={() => setState(prev => ({ ...prev, aiChatOpen: false }))} className="text-white/80 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-3 text-sm">
              {state.aiMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 bg-slate-900 border-t border-slate-700 flex items-center space-x-2">
              <input
                type="text"
                placeholder="Ask anything about English, Math, or AI..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    const text = e.target.value;
                    setState(prev => ({
                      ...prev,
                      aiMessages: [
                        ...prev.aiMessages,
                        { sender: 'user', text },
                        { sender: 'ai', text: `Here’s a clear breakdown of “${text}”: Based on the curriculum and Mr Abu’s latest notes, this topic centres on key principles. Would you like a short practice quiz?` }
                      ]
                    }));
                    e.target.value = '';
                  }
                }}
              />
              <button
                onClick={(e) => {
                  const input = e.currentTarget.previousSibling;
                  if (input.value.trim()) {
                    const text = input.value;
                    setState(prev => ({
                      ...prev,
                      aiMessages: [
                        ...prev.aiMessages,
                        { sender: 'user', text },
                        { sender: 'ai', text: `Analyzing “${text}” with Gemini… This concept is essential for your next assessment with Mr Abu.` }
                      ]
                    }));
                    input.value = '';
                  }
                }}
                className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setState(prev => ({ ...prev, aiChatOpen: true }))}
            className="group flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white px-5 py-3 rounded-full shadow-xl shadow-indigo-600/40 transition transform hover:scale-105"
          >
            <Sparkles className="h-5 w-5 text-yellow-300 animate-bounce" />
            <span className="font-bold text-sm">Ask AI Tutor</span>
          </button>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-black text-white">EduVerse</span>
            </div>
            <p className="text-xs text-slate-400">
              Next-generation virtual academy with live classrooms, AI tutoring, and accredited certificates.
            </p>
          </div>
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => navigateTo('courses')} className="hover:text-white transition">Browse Courses</button></li>
              <li><button onClick={() => navigateTo('teachers')} className="hover:text-white transition">Expert Faculty (Mr Abu)</button></li>
              <li><button onClick={() => navigateTo('pricing')} className="hover:text-white transition">Pricing & Plans</button></li>
              <li><button onClick={() => navigateTo('classroom')} className="hover:text-white transition text-indigo-400 font-medium">Virtual Classroom</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">Dashboards</h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => navigateTo('student-dash')} className="hover:text-white transition">Student Portal</button></li>
              <li><button onClick={() => navigateTo('teacher-dash')} className="hover:text-white transition">Teacher Portal</button></li>
              <li><button onClick={() => navigateTo('admin-dash')} className="hover:text-white transition">Admin Panel</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">Stay Updated</h4>
            <p className="text-xs mb-3">Free courses and AI study tips.</p>
            <div className="flex space-x-2">
              <input type="email" placeholder="Your email" className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 flex-1" />
              <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold">Join</button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-8 border-t border-slate-900 text-center text-xs text-slate-500">
          © 2026 EduVerse LMS · React · Tailwind · LiveKit · Laravel API
        </div>
      </footer>
    </div>
  );
}

/* ==================== VIEWS ==================== */

function HomeView({ navigateTo, classrooms, setState, state, dashboardMetrics }) {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [requestTopic, setRequestTopic] = useState('');
  const [requestTime, setRequestTime] = useState('');
  const [requestDetails, setRequestDetails] = useState('');
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  const liveRoom = classrooms.find(room => room.live && room.status.toLowerCase().includes('live'));
  const upcomingRoom = classrooms.find(room => !room.live || room.status.toLowerCase().includes('scheduled'));
  const featuredRoom = liveRoom || upcomingRoom || null;
  const hasLiveRoom = Boolean(liveRoom);
  const hasUpcomingRoom = Boolean(upcomingRoom);
  const noSchedule = !hasLiveRoom && !hasUpcomingRoom;

  const stats = [
    { value: dashboardMetrics?.students ? dashboardMetrics.students.toLocaleString() : null, label: 'Active Students' },
    { value: dashboardMetrics?.teachers ? dashboardMetrics.teachers.toLocaleString() : null, label: 'Certified Teachers' },
    { value: classrooms.length ? classrooms.length.toString() : null, label: 'Interactive Courses' },
    { value: hasLiveRoom ? 'Live Now' : hasUpcomingRoom ? 'Scheduled Soon' : null, label: 'Class availability' },
  ].filter(stat => stat.value);

  const joinRoom = async (room, joinCode = '') => {
    if (!state.currentUser) {
      navigateTo('login');
      return;
    }

    if (room.accessMode === 'link' && !joinCode.trim()) {
      alert('This classroom is join-by-link only. Please enter the join code or use the invitation link.');
      return;
    }

    try {
      const response = await fetch(`/api/classrooms/${room.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joinCode: joinCode.trim() }),
      });
      const updatedRoom = await response.json();
      if (!response.ok) {
        alert(updatedRoom.error || 'Unable to join room.');
        return;
      }
      setState(prev => ({
        ...prev,
        activeClassroom: updatedRoom.id,
        classrooms: prev.classrooms.map(item => item.id === updatedRoom.id ? updatedRoom : item),
      }));
      navigateTo('classroom');
    } catch (error) {
      alert('Unable to join room. Please try again.');
    }
  };

  const requestTeacher = async () => {
    if (!requestTopic.trim()) return;
    const payload = {
      title: requestTopic.trim(),
      teacher: 'Requested Teacher',
      subject: 'Custom Session',
      startsAt: requestTime.trim() || 'Scheduled soon',
      description: requestDetails.trim() || 'Student requested a custom live teaching session.',
      attendees: 1,
      joinCode: `REQ-${Date.now()}`,
      status: 'Scheduled',
      live: false,
    };

    try {
      const response = await fetch('/api/classrooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const newRoom = response.ok ? await response.json() : createClassroomRecord(payload);
      setState(prev => ({ ...prev, classrooms: [newRoom, ...prev.classrooms] }));
      setRequestSubmitted(true);
      setBookingOpen(false);
      navigateTo('home');
    } catch {
      const newRoom = createClassroomRecord(payload);
      setState(prev => ({ ...prev, classrooms: [newRoom, ...prev.classrooms] }));
      setRequestSubmitted(true);
      setBookingOpen(false);
      navigateTo('home');
    }
  };

  return (
    <div className="space-y-20 pb-16">
      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-28 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(79,70,229,0.15),transparent_50%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Next-Gen AI Powered Virtual Academy</span>
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight max-w-4xl mx-auto leading-tight">
            Learn Anywhere, Anytime with <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">Expert Instructors</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
            HD live virtual classrooms, interactive whiteboards, instant AI tutoring, and accredited certificates — all in one platform.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={() => navigateTo('courses')} className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold shadow-xl shadow-indigo-600/30 flex items-center space-x-2 transition transform hover:-translate-y-0.5 group">
              <span>Start Learning Now</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => {
                if (noSchedule) {
                  setBookingOpen(true);
                } else if (featuredRoom) {
                  if (featuredRoom.accessMode === 'link') {
                    const code = prompt('Enter the classroom join code:');
                    if (code) joinRoom(featuredRoom, code.trim());
                  } else {
                    joinRoom(featuredRoom);
                  }
                }
              }}
              className="px-8 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold border border-slate-700 flex items-center space-x-2 transition"
            >
              <Video className="h-5 w-5 text-pink-400" />
              <span>{noSchedule ? 'Book a Teacher' : featuredRoom ? `Join ${featuredRoom.teacher}'s Live Room` : 'Join Class'}</span>
            </button>
          </div>

          {stats.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 max-w-4xl mx-auto">
              {stats.map((stat, i) => (
                <div key={i} className="bg-slate-800/50 border border-slate-800 p-6 rounded-2xl">
                  <div className="text-3xl font-black text-white">{stat.value}</div>
                  <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {noSchedule && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-indigo-500/20 bg-slate-900/80 p-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] items-start">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-4 py-2 text-xs uppercase tracking-[0.25em] text-indigo-300">
                <GraduationCap className="h-4 w-4" />
                <span>No live classes available</span>
              </div>
              <h2 className="text-3xl font-black text-white">Teacher not available right now</h2>
              <p className="text-sm text-slate-400 max-w-xl">Fill in the learning goal and preferred time, and we’ll schedule a live session with an expert teacher as soon as possible.</p>
              <button onClick={() => setBookingOpen(true)} className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500">
                <Brain className="h-4 w-4" />
                Request a Live Teacher
              </button>
            </div>
            <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-6">
              <div className="rounded-3xl bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.25),transparent_35%)] p-6">
                <p className="text-sm text-slate-300 uppercase tracking-[0.2em] mb-4">Let us know what you want</p>
                <div className="space-y-4">
                  <div className="rounded-3xl bg-slate-900/80 p-4 text-sm text-slate-300">
                    <div className="font-semibold text-white">Topic</div>
                    <div>English grammar, AI fundamentals, or live coding Q&A</div>
                  </div>
                  <div className="rounded-3xl bg-slate-900/80 p-4 text-sm text-slate-300">
                    <div className="font-semibold text-white">Preferred time</div>
                    <div>Schedule based on your learning pace</div>
                  </div>
                  <div className="rounded-3xl bg-slate-900/80 p-4 text-sm text-slate-300">
                    <div className="font-semibold text-white">Teacher request</div>
                    <div>We’ll match you with an expert educator</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {bookingOpen && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-indigo-500/20 bg-slate-900/80 p-8 shadow-2xl">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white">Request a Teacher</h3>
                <p className="text-sm text-slate-400">Submit your topic and preferred schedule, and we’ll route a teacher to you.</p>
              </div>
              <button onClick={() => setBookingOpen(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-300">
                <span>Learning Topic</span>
                <input value={requestTopic} onChange={e => setRequestTopic(e.target.value)} placeholder="E.g. advanced English grammar" className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500" />
              </label>
              <label className="space-y-2 text-sm text-slate-300">
                <span>Preferred Time</span>
                <input value={requestTime} onChange={e => setRequestTime(e.target.value)} placeholder="E.g. Tomorrow 2:00 PM" className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500" />
              </label>
            </div>
            <label className="mt-4 block space-y-2 text-sm text-slate-300">
              <span>Details for the teacher</span>
              <textarea value={requestDetails} onChange={e => setRequestDetails(e.target.value)} placeholder="What do you want to learn? What should the teacher prepare?" className="w-full min-h-[140px] rounded-3xl border border-slate-700 bg-slate-950 px-4 py-4 text-sm text-white focus:outline-none focus:border-indigo-500" />
            </label>
            <div className="mt-6 flex flex-wrap gap-3 items-center">
              <button onClick={requestTeacher} className="rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition">Submit Request</button>
              <span className="text-sm text-slate-400">We’ll push your request into the live schedule and notify you when the teacher is ready.</span>
            </div>
          </div>
        </section>
      )}

      {/* Popular Courses */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Popular Featured Courses</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">Hand-picked expert-led programs with live mentorship</p>
          </div>
          <button onClick={() => navigateTo('courses')} className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold flex items-center space-x-1">
            <span>View All</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: 'English Language & Advanced Grammar', category: 'Languages', rating: '4.9', students: '5,210', price: '$49', teacher: 'Mr Abu', img: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=600' },
            { title: 'Advanced React & Next.js Masterclass', category: 'Web Development', rating: '4.9', students: '4,210', price: '$89', teacher: 'Dr. Sarah Lin', img: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600' },
            { title: 'Full-Stack Python & AI Engineering', category: 'Artificial Intelligence', rating: '4.8', students: '3,890', price: '$99', teacher: 'Prof. Alan Turing', img: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600' },
          ].map((course, idx) => (
            <div key={idx} className="bg-slate-800/60 border border-slate-700/60 rounded-3xl overflow-hidden hover:border-indigo-500/50 transition duration-300 flex flex-col group">
              <div className="relative h-48 overflow-hidden">
                <img src={course.img} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-indigo-300 text-[10px] font-bold px-3 py-1 rounded-full border border-slate-700">
                  {course.category}
                </span>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>By {course.teacher}</span>
                    <div className="flex items-center space-x-1 text-yellow-400">
                      <Star className="h-3.5 w-3.5 fill-yellow-400" />
                      <span className="font-bold text-white">{course.rating}</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition">{course.title}</h3>
                </div>
                <div className="pt-4 border-t border-slate-700/60 flex items-center justify-between">
                  <span className="text-xl font-black text-white">{course.price}</span>
                  <button onClick={() => navigateTo('courses')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition">
                    Enroll Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Live Classroom Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-indigo-900/60 via-violet-900/60 to-slate-900 border border-indigo-500/30 rounded-3xl p-8 sm:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <span className="px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 text-xs font-bold border border-pink-500/30">Live Virtual Classrooms</span>
            <h2 className="text-3xl font-black text-white">Experience HD Live Lessons with Mr Abu</h2>
            <p className="text-sm text-slate-300">
              Real-time interactive whiteboards, breakout rooms, screen sharing, live polls and student video overlays.
            </p>
            <button onClick={() => featuredRoom && joinRoom(featuredRoom)} className="px-6 py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-sm shadow-lg shadow-pink-600/30 flex items-center space-x-2 transition">
              <Video className="h-4 w-4" />
              <span>{featuredRoom ? `Enter ${featuredRoom.teacher}'s Virtual Classroom` : `Enter Virtual Classroom`}</span>
            </button>
          </div>
          <div className="w-full md:w-96 h-64 rounded-2xl bg-slate-950 border border-slate-800 p-4 flex flex-col justify-between shadow-2xl relative">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span className="flex items-center space-x-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                <span className="text-red-400 font-bold">LIVE</span>
              </span>
              <span>English Language · Mr Abu</span>
            </div>
            <div className="flex-1 my-3 bg-slate-900 rounded-xl flex items-center justify-center relative overflow-hidden">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500" alt="Mr Abu" className="w-full h-full object-cover opacity-85" />
              <div className="absolute top-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] text-white font-bold">Teacher: Mr Abu</div>
            </div>
            <div className="flex justify-center space-x-3">
              <div className="p-2 bg-slate-800 rounded-lg text-white"><Mic className="h-4 w-4" /></div>
              <div className="p-2 bg-slate-800 rounded-lg text-white"><Camera className="h-4 w-4" /></div>
              <div className="p-2 bg-slate-800 rounded-lg text-white"><Monitor className="h-4 w-4" /></div>
              <div className="p-2 bg-pink-600 rounded-lg text-white"><Hand className="h-4 w-4" /></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function CoursesView({ navigateTo, classrooms, setState, state }) {
  const [category, setCategory] = useState('All');
  const joinRoom = async (room, joinCode = '') => {
    if (!state.currentUser) {
      navigateTo('login');
      return;
    }

    if (room.accessMode === 'link' && !joinCode.trim()) {
      alert('This classroom is join-by-link only. Please enter the join code or use the invitation link.');
      return;
    }

    try {
      const response = await fetch(`/api/classrooms/${room.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joinCode: joinCode.trim() }),
      });
      const updatedRoom = await response.json();
      if (!response.ok) {
        alert(updatedRoom.error || 'Unable to join room.');
        return;
      }
      setState(prev => ({
        ...prev,
        activeClassroom: updatedRoom.id,
        classrooms: prev.classrooms.map(item => item.id === updatedRoom.id ? updatedRoom : item),
      }));
      navigateTo('classroom');
    } catch (error) {
      alert('Unable to join room. Please try again.');
    }
  };
  const courses = [
    { id: 1, title: 'English Language & Advanced Grammar', category: 'Languages', rating: '4.9', students: '5,210', price: '$49', teacher: 'Mr Abu', img: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=600' },
    { id: 2, title: 'Advanced React & Next.js Masterclass', category: 'Web Development', rating: '4.9', students: '4,210', price: '$89', teacher: 'Dr. Sarah Lin', img: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600' },
    { id: 3, title: 'Full-Stack Python & AI Engineering', category: 'AI', rating: '4.8', students: '3,890', price: '$99', teacher: 'Prof. Alan Turing', img: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600' },
    { id: 4, title: 'UI/UX Design Systems & Figma Pro', category: 'Design', rating: '5.0', students: '2,450', price: '$75', teacher: 'Elena Rostova', img: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=600' },
    { id: 5, title: 'Financial Modeling & Quantitative Trading', category: 'Finance', rating: '4.7', students: '1,980', price: '$120', teacher: 'Marcus Sterling', img: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600' },
    { id: 6, title: 'Data Structures & Algorithms in C++', category: 'Computer Science', rating: '4.9', students: '6,120', price: '$65', teacher: 'Dr. John Nash', img: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=600' },
  ];
  const filtered = category === 'All' ? courses : courses.filter(c => c.category === category);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Explore Professional Courses</h1>
          <p className="text-sm text-slate-400 mt-1">Advance your career with certified courses and live virtual classes</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['All', 'Languages', 'Web Development', 'AI', 'Design', 'Finance', 'Computer Science'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${category === cat ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {filtered.map(course => (
          <div key={course.id} className="bg-slate-800/60 border border-slate-700/60 rounded-3xl overflow-hidden hover:border-indigo-500/50 transition duration-300 flex flex-col group">
            <div className="relative h-48 overflow-hidden">
              <img src={course.img} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-indigo-300 text-[10px] font-bold px-3 py-1 rounded-full border border-slate-700">
                {course.category}
              </span>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>By {course.teacher}</span>
                  <div className="flex items-center space-x-1 text-yellow-400">
                    <Star className="h-3.5 w-3.5 fill-yellow-400" />
                    <span className="font-bold text-white">{course.rating}</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition">{course.title}</h3>
              </div>
              <div className="pt-4 border-t border-slate-700/60 flex items-center justify-between">
                <span className="text-xl font-black text-white">{course.price}</span>
                <button onClick={() => {
                  const room = classrooms.find(item => item.title.includes(course.teacher === 'Mr Abu' ? 'English' : course.title.split(' ')[0])) || classrooms[0];
                  if (!room) {
                    navigateTo('student-dash');
                    return;
                  }
                  if (room.accessMode === 'link') {
                    const code = prompt('This class is link-only. Enter the join code:');
                    if (!code) return;
                    joinRoom(room, code.trim());
                  } else {
                    joinRoom(room);
                  }
                }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition">
                  Join Live Class
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PermissionsView() {
  const rows = [
    { feature: 'Dashboard', teacher: 'Teaching analytics', student: 'Learning progress' },
    { feature: 'Create Courses', teacher: '✅', student: '❌' },
    { feature: 'Edit Courses', teacher: '✅', student: '❌' },
    { feature: 'Publish Courses', teacher: '✅', student: '❌' },
    { feature: 'Join Courses', teacher: '❌', student: '✅' },
    { feature: 'Create Live Class', teacher: '✅', student: '❌' },
    { feature: 'Join Live Class', teacher: '✅ (Host)', student: '✅ (Participant)' },
    { feature: 'Start Recording', teacher: '✅', student: '❌' },
    { feature: 'Screen Share', teacher: '✅', student: 'Limited (if permitted)' },
    { feature: 'Whiteboard', teacher: '✅', student: 'View/Annotate (if permitted)' },
    { feature: 'Upload Notes', teacher: '✅', student: '❌' },
    { feature: 'Download Notes', teacher: '❌', student: '✅' },
    { feature: 'Create Assignments', teacher: '✅', student: '❌' },
    { feature: 'Submit Assignments', teacher: '❌', student: '✅' },
    { feature: 'Grade Assignments', teacher: '✅', student: '❌' },
    { feature: 'Create Quizzes', teacher: '✅', student: '❌' },
    { feature: 'Take Quizzes', teacher: '❌', student: '✅' },
    { feature: 'View Student Progress', teacher: '✅', student: '❌' },
    { feature: 'View Own Progress', teacher: '❌', student: '✅' },
    { feature: 'Attendance Management', teacher: '✅', student: 'View only' },
    { feature: 'Messaging', teacher: 'Students & Admin', student: 'Teachers & Classmates' },
    { feature: 'Notifications', teacher: 'Class management', student: 'Learning reminders' },
    { feature: 'AI Tools', teacher: 'Lesson planning, quiz generation', student: 'Homework help, explanations' },
    { feature: 'Certificates', teacher: 'Issue/Approve', student: 'View & Download' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-3xl font-black text-white">Role-Based Permissions</h1>
        <p className="text-sm text-slate-400 mt-2">Teachers manage the learning environment, while students participate, submit work, and track their own progress.</p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-700 bg-slate-800/60">
        <div className="grid grid-cols-[1.6fr_1fr_1fr] bg-slate-900/80 px-4 py-3 text-sm font-semibold text-slate-200">
          <div>Feature</div>
          <div>Teacher</div>
          <div>Student</div>
        </div>
        <div className="divide-y divide-slate-700/70">
          {rows.map((row) => (
            <div key={row.feature} className="grid grid-cols-[1.6fr_1fr_1fr] px-4 py-3 text-sm text-slate-300">
              <div className="font-medium text-white">{row.feature}</div>
              <div>{row.teacher}</div>
              <div>{row.student}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TeachersView({ navigateTo }) {
  const teachers = [
    { name: 'Mr Abu', role: 'Principal English Language & Literature Instructor', rating: '4.99', courses: '15', students: '22,400', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600' },
    { name: 'Dr. Sarah Lin', role: 'Principal AI & React Instructor', rating: '4.95', courses: '12', students: '15,200', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600' },
    { name: 'Prof. Alan Turing', role: 'Chief Data Scientist', rating: '4.90', courses: '8', students: '12,400', img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600' },
    { name: 'Elena Rostova', role: 'Lead UI/UX Design Mentor', rating: '4.98', courses: '10', students: '9,800', img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">Our Certified Expert Faculty</h1>
        <p className="text-sm text-slate-400 mt-1">Featuring Mr Abu and world-class industry mentors</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {teachers.map((t, idx) => (
          <div key={idx} className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-6 text-center space-y-4 hover:border-indigo-500/50 transition">
            <img src={t.img} alt={t.name} className="w-24 h-24 rounded-full object-cover mx-auto border-2 border-indigo-500 shadow-xl" />
            <div>
              <h3 className="font-bold text-white text-lg">{t.name}</h3>
              <p className="text-xs text-indigo-300 mt-1">{t.role}</p>
            </div>
            <div className="flex justify-center space-x-4 text-xs text-slate-400">
              <span>{t.rating} ★</span>
              <span>{t.courses} courses</span>
              <span>{t.students} students</span>
            </div>
            <button onClick={() => navigateTo('teacher-dash')} className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 rounded-xl text-xs font-semibold transition">
              View Profile
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function PricingView({ navigateTo }) {
  const plans = [
    { name: 'Starter', price: '$19', desc: 'For independent learners', features: ['Core classes', 'Basic attendance', 'Weekly summaries'], cta: 'Subscribe' },
    { name: 'Pro Scholar', price: '$49', desc: 'Most popular · Live + AI', featured: true, features: ['Live classes', 'AI Tutor 24/7', 'Assignments + grading', 'Priority feedback'], cta: 'Choose Pro' },
    { name: 'Institution', price: 'Custom', desc: 'For schools & academies', features: ['Team dashboards', 'Compliance reports', 'Advanced analytics'], cta: 'Contact Sales' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-black text-white">Simple, transparent pricing</h1>
        <p className="text-sm text-slate-400 mt-2">Choose the plan that matches your learning goals</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map(plan => (
          <div key={plan.name} className={`rounded-3xl p-8 border ${plan.featured ? 'bg-gradient-to-br from-indigo-600 via-violet-600 to-pink-600 border-transparent shadow-2xl shadow-indigo-600/30' : 'bg-slate-800/60 border-slate-700/60'}`}>
            {plan.featured && <div className="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase mb-4">Most Popular</div>}
            <h3 className="text-xl font-bold text-white">{plan.name}</h3>
            <p className={`text-sm mt-1 ${plan.featured ? 'text-indigo-100' : 'text-slate-400'}`}>{plan.desc}</p>
            <div className="mt-6 text-4xl font-black text-white">{plan.price}<span className="text-base font-medium opacity-70">{plan.price !== 'Custom' ? '/mo' : ''}</span></div>
            <ul className="mt-6 space-y-3 text-sm">
              {plan.features.map(f => (
                <li key={f} className={`flex items-center space-x-2 ${plan.featured ? 'text-white' : 'text-slate-300'}`}>
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => plan.name === 'Institution' ? navigateTo('contact') : navigateTo('student-dash')}
              className={`mt-8 w-full py-3 rounded-xl font-bold text-sm transition ${plan.featured ? 'bg-white text-indigo-700 hover:bg-slate-100' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AboutView() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-10 max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-black text-white">About EduVerse</h1>
        <p className="text-slate-300 leading-relaxed">
          EduVerse is a next-generation learning platform that combines live interactive classrooms (powered by LiveKit), AI tutoring (Gemini), assignments, certificates and real-time collaboration — all designed to feel as polished as Google Classroom, Zoom and Udemy combined.
        </p>
        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="bg-slate-900/80 rounded-2xl p-4">
            <div className="text-2xl font-black text-white">99.8%</div>
            <div className="text-xs text-slate-400">Session reliability</div>
          </div>
          <div className="bg-slate-900/80 rounded-2xl p-4">
            <div className="text-2xl font-black text-white">24/7</div>
            <div className="text-xs text-slate-400">AI assistance</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactView() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-10 max-w-xl mx-auto space-y-6">
        <h1 className="text-3xl font-black text-white">Contact Us</h1>
        <p className="text-sm text-slate-400">Questions about institutional plans or partnerships? Reach out.</p>
        <div className="space-y-4">
          <input type="text" placeholder="Your name" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500" />
          <input type="email" placeholder="Email" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500" />
          <textarea rows={4} placeholder="Message" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500" />
          <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm">Send Message</button>
        </div>
      </div>
    </div>
  );
}

function AuthView({ type, navigateTo, setState }) {
  const [role, setRole] = useState('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    if (!email.trim() || !password.trim()) {
      alert('Please enter both email and password.');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const selectedRole = role === 'teacher' ? 'teacher' : 'student';
    const userName = name.trim() || normalizedEmail.split('@')[0] || (selectedRole === 'teacher' ? 'Instructor' : 'Student');
    const userPhoto = selectedRole === 'teacher'
      ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
      : 'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=150';

    setState(prev => ({
      ...prev,
      currentUser: {
        id: Date.now(),
        name: userName,
        email: normalizedEmail,
        role: selectedRole,
        photo: userPhoto,
      },
      activeTab: selectedRole === 'teacher' ? 'teacher-dash' : 'student-dash',
    }));
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black text-white">{type === 'login' ? 'Choose your portal' : 'Create your account'}</h1>
          <p className="text-sm text-slate-400">Sign in as a teacher to manage learning, or as a student to join classes and track progress.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole('student')}
            className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${role === 'student' ? 'border-indigo-500 bg-indigo-600/20 text-indigo-200' : 'border-slate-700 bg-slate-900 text-slate-300'}`}
          >
            Login as Student
          </button>
          <button
            type="button"
            onClick={() => setRole('teacher')}
            className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${role === 'teacher' ? 'border-violet-500 bg-violet-600/20 text-violet-200' : 'border-slate-700 bg-slate-900 text-slate-300'}`}
          >
            Login as Teacher
          </button>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleSubmit}
            className={`w-full py-3 rounded-xl font-bold text-sm shadow-lg ${role === 'teacher' ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white' : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white'}`}
          >
            {type === 'login' ? `Sign in as ${role === 'teacher' ? 'Teacher' : 'Student'}` : 'Create Account'}
          </button>
        </div>

        <p className="text-center text-xs text-slate-400">
          {type === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button onClick={() => navigateTo(type === 'login' ? 'register' : 'login')} className="text-indigo-400 font-semibold">
            {type === 'login' ? 'Register' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}

/* ==================== STUDENT DASHBOARD ==================== */
function StudentDashboard({ navigateTo, state, setState }) {
  const [subTab, setSubTab] = useState('overview');
  const [assignments, setAssignments] = useState([
    { id: 1, title: 'Grammar Practice Quiz', course: 'English Language', due: 'Tomorrow', status: 'Pending', score: '-' },
    { id: 2, title: 'Essay Draft', course: 'React Masterclass', due: 'Friday', status: 'Submitted', score: 'Pending Review' },
  ]);

  useEffect(() => {
    fetch('/api/assignments')
      .then(res => res.json())
      .then(data => setAssignments(data.map(item => ({ score: item.score ?? '-', ...item })) ))
      .catch(() => {});
  }, []);

  const sidebarItems = [
    { key: 'overview', label: 'Overview' },
    { key: 'courses', label: 'Courses' },
    { key: 'live', label: 'Live Classes' },
    { key: 'assignments', label: 'Assignments' },
    { key: 'quizzes', label: 'Quizzes' },
    { key: 'ai', label: 'AI Tutor' },
    { key: 'progress', label: 'Progress' },
  ];

  const pendingAssignments = assignments.filter(a => a.status === 'Pending');
  const liveClasses = state.classrooms.filter(room => room.live || room.status.toLowerCase().includes('live'));

  const quickStats = [
    { label: 'Active Classes', value: state.classrooms.length.toString() },
    { label: 'Pending Assignments', value: pendingAssignments.length.toString() },
    { label: 'Average Score', value: '89%' },
    { label: 'AI Sessions', value: '12' },
  ];

  const upcomingWork = assignments.slice(0, 3);

  const studentCourses = state.classrooms.map((course) => ({
    title: course.title,
    progress: `${Math.min(100, 40 + (course.attendees || 0) % 60)}%`,
    next: course.startsAt || 'Upcoming session',
    teacher: course.teacher,
    status: course.status,
  }));

  const aiOptions = [
    { title: 'Homework Help', desc: 'Ask for explanations and step-by-step guidance.' },
    { title: 'Practice Questions', desc: 'Generate custom drills for your current course.' },
    { title: 'Concept Explainer', desc: 'Simplify complex topics with examples.' },
    { title: 'Study Summary', desc: 'Turn lessons into revision notes.' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="bg-gradient-to-r from-indigo-950/70 to-slate-900 border border-indigo-500/30 p-8 rounded-3xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold">Student Portal</span>
          <h1 className="mt-4 text-3xl font-black text-white">Good afternoon, {state.currentUser.name}</h1>
          <p className="mt-2 text-sm text-slate-400 max-w-2xl">Track your courses, join live sessions, submit assignments, and see your progress in one learner-focused dashboard.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={() => navigateTo('classroom')} className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500">
            <Video className="h-4 w-4" />
            Join Live Class
          </button>
          <button onClick={() => setState(prev => ({ ...prev, aiChatOpen: true }))} className="rounded-2xl border border-slate-700 bg-slate-800 px-5 py-3 text-xs font-semibold text-white transition hover:border-indigo-500 hover:bg-slate-700">
            Open AI Tutor
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[240px_minmax(0,1fr)] gap-6">
        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-700/70 bg-slate-900/70 p-4 shadow-inner">
            {sidebarItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setSubTab(item.key)}
                className={`w-full text-left rounded-2xl px-4 py-3 text-sm font-medium transition ${subTab === item.key ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="rounded-3xl border border-slate-700/60 bg-slate-800/70 p-5 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Your Role</h3>
            <p className="text-sm text-slate-300">You are enrolled as a student. Your access includes course content, live sessions, assignments, quizzes, and progress analytics.</p>
            <div className="rounded-2xl bg-slate-900 p-3 text-xs text-slate-400">Teacher features are locked to preserve learning flow.</div>
          </div>
        </aside>

        <main className="space-y-6">
          {subTab === 'overview' && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickStats.map((stat, idx) => (
                  <div key={idx} className="rounded-3xl border border-slate-700/60 bg-slate-900/70 p-5">
                    <div className="text-3xl font-black text-white">{stat.value}</div>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
                <section className="rounded-3xl border border-slate-700/60 bg-slate-900/70 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-white">Upcoming Deadlines</h2>
                      <p className="mt-1 text-sm text-slate-400">Stay ahead of every task and submission.</p>
                    </div>
                    <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">2 due soon</span>
                  </div>

                  <div className="mt-6 space-y-4">
                    {upcomingWork.map((item, idx) => (
                      <div key={idx} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4 md:flex md:items-center md:justify-between md:gap-4">
                        <div>
                          <h3 className="font-semibold text-white">{item.title}</h3>
                          <p className="mt-1 text-xs text-slate-500">{item.course}</p>
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-4 md:mt-0">
                          <span className="rounded-full bg-slate-800 px-3 py-1 text-[11px] font-semibold text-slate-300">Due {item.due}</span>
                          <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${item.status === 'Pending' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-700/60 bg-slate-900/70 p-6">
                  <h2 className="text-lg font-bold text-white">AI Study Assistant</h2>
                  <div className="mt-5 rounded-3xl bg-slate-950/80 p-5 text-slate-300">
                    <p className="text-sm leading-6">Use the AI Tutor for quick concept summaries, practice drills, and assignment support tailored to your current courses.</p>
                  </div>
                  <button onClick={() => setState(prev => ({ ...prev, aiChatOpen: true }))} className="mt-5 w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500">Open AI Tutor</button>
                </section>
              </div>
            </>
          )}

          {subTab === 'courses' && (
            <div className="grid gap-6 lg:grid-cols-2">
              {studentCourses.map((course) => (
                <article key={course.title} className="rounded-3xl border border-slate-700/60 bg-slate-900/70 p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white">{course.title}</h2>
                      <p className="mt-1 text-sm text-slate-400">Teacher: {course.teacher}</p>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">{course.status}</span>
                  </div>

                  <div className="mt-6 rounded-full bg-slate-950/80 h-3 overflow-hidden">
                    <div className="h-full rounded-full bg-indigo-500" style={{ width: course.progress }} />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3 items-center">
                    <button onClick={() => {
                      const classroom = state.classrooms.find(item => item.title === course.title);
                      if (!classroom) return;
                      setState(prev => ({
                        ...prev,
                        activeClassroom: classroom.id,
                        classrooms: prev.classrooms.map(item => item.id === classroom.id ? { ...item, attendees: item.attendees + 1 } : item),
                      }));
                      navigateTo('classroom');
                    }} className="rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-indigo-500">Enter Class</button>
                    <span className="text-xs text-slate-400">Starts: {course.next}</span>
                  </div>
                </article>
              ))}
            </div>
          )}

          {subTab === 'live' && (
            <div className="grid gap-6 lg:grid-cols-2">
              {liveClasses.map((room) => (
                <div key={room.id} className="rounded-3xl border border-slate-700/60 bg-slate-900/70 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{room.title}</h3>
                      <p className="mt-1 text-xs text-slate-400">Teacher: {room.teacher}</p>
                    </div>
                    <span className="rounded-full bg-red-500/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-red-300">Live now</span>
                  </div>
                  <p className="mt-4 text-sm text-slate-400">{room.description}</p>
                  <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
                    <button onClick={() => {
                      setState(prev => ({
                        ...prev,
                        activeClassroom: room.id,
                        classrooms: prev.classrooms.map(item => item.id === room.id ? { ...item, attendees: item.attendees + 1 } : item),
                      }));
                      navigateTo('classroom');
                    }} className="rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-indigo-500">Join Live Room</button>
                    {room.attendees > 0 && <span className="text-xs text-slate-400">{room.attendees} learners here</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {subTab === 'assignments' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Assignments</h2>
                  <p className="mt-1 text-sm text-slate-400">Review recent submissions and upcoming work.</p>
                </div>
                <button className="rounded-2xl bg-slate-800 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-200 transition hover:bg-slate-700">Submit Assignment</button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="rounded-3xl border border-slate-700/60 bg-slate-900/70 p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{assignment.title}</h3>
                        <p className="mt-1 text-sm text-slate-400">Course: {assignment.course}</p>
                        <p className="mt-1 text-sm text-slate-400">Due: {assignment.due}</p>
                      </div>
                      <span className={`rounded-full px-3 py-2 text-xs font-semibold ${assignment.status === 'Graded' ? 'bg-emerald-500/20 text-emerald-300' : assignment.status === 'Submitted' ? 'bg-sky-500/20 text-sky-300' : 'bg-amber-500/20 text-amber-300'}`}>
                        {assignment.status}
                      </span>
                    </div>
                    <div className="mt-4 text-sm text-slate-300">Score: <span className="text-white">{assignment.score}</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {subTab === 'quizzes' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <section className="rounded-3xl border border-slate-700/60 bg-slate-900/70 p-6">
                <h2 className="text-lg font-bold text-white">Ready to start</h2>
                <div className="mt-5 space-y-4 text-sm text-slate-300">
                  <div className="rounded-2xl bg-slate-950/70 p-4">Grammar Fundamentals Quiz</div>
                  <div className="rounded-2xl bg-slate-950/70 p-4">React Hooks Review</div>
                  <div className="rounded-2xl bg-slate-950/70 p-4">AI Ethics Reflection</div>
                </div>
              </section>
              <section className="rounded-3xl border border-slate-700/60 bg-slate-900/70 p-6">
                <h2 className="text-lg font-bold text-white">Recent results</h2>
                <div className="mt-5 space-y-4 text-sm text-slate-300">
                  <div className="rounded-2xl bg-slate-950/70 p-4">Last quiz: 86%</div>
                  <div className="rounded-2xl bg-slate-950/70 p-4">Trend: +12% from last week</div>
                  <div className="rounded-2xl bg-slate-950/70 p-4">Recommended revision: grammar exercises</div>
                </div>
              </section>
            </div>
          )}

          {subTab === 'ai' && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {aiOptions.map((option, idx) => (
                <div key={idx} className="rounded-3xl border border-slate-700/60 bg-slate-900/70 p-6">
                  <h3 className="text-lg font-semibold text-white">{option.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{option.desc}</p>
                  <button onClick={() => setState(prev => ({ ...prev, aiChatOpen: true }))} className="mt-5 rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-indigo-500">Ask the Tutor</button>
                </div>
              ))}
            </div>
          )}

          {subTab === 'progress' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <section className="rounded-3xl border border-slate-700/60 bg-slate-900/70 p-6">
                <h2 className="text-lg font-bold text-white">Progress Overview</h2>
                <div className="mt-6 space-y-5">
                  {[
                    { label: 'Lessons completed', value: '24 / 32', width: '75%' },
                    { label: 'Hours studied', value: '18.4 hrs', width: '60%' },
                    { label: 'Streak', value: '7 days', width: '85%' },
                  ].map((item, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between text-sm text-slate-300">
                        <span>{item.label}</span>
                        <span className="text-white">{item.value}</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-slate-950/80">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: item.width }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl border border-slate-700/60 bg-slate-900/70 p-6 space-y-4">
                <h2 className="text-lg font-bold text-white">Certificates & Badges</h2>
                <div className="space-y-3 text-sm text-slate-300">
                  <div className="rounded-2xl bg-slate-950/70 p-4">English Language Certificate · earned on Jan 15</div>
                  <div className="rounded-2xl bg-slate-950/70 p-4">Consistency Badge · 7-day streak</div>
                  <div className="rounded-2xl bg-slate-950/70 p-4">Collaborator Badge · group project contributor</div>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/* ==================== TEACHER DASHBOARD ==================== */
function TeacherDashboard({ navigateTo, state, setState }) {
  const [tab, setTab] = useState('overview');
  const [form, setForm] = useState({ title: '', subject: '', startsAt: 'Now', description: '', accessMode: 'public' });

  const createCourse = async () => {
    if (!form.title.trim()) return;
    const payload = {
      title: form.title.trim(),
      teacher: state.currentUser?.name || 'Instructor',
      subject: form.subject.trim() || 'Live Class',
      startsAt: form.startsAt.trim() || 'Now',
      description: form.description.trim(),
      accessMode: form.accessMode,
      joinCode: form.accessMode === 'link' ? `LINK-${Math.random().toString(36).slice(2, 6).toUpperCase()}` : '',
    };

    try {
      const response = await fetch('/api/classrooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const newClassroom = response.ok ? await response.json() : createClassroomRecord(payload);
      setState(prev => ({ ...prev, classrooms: [newClassroom, ...prev.classrooms], activeClassroom: newClassroom.id }));
    } catch (error) {
      const newClassroom = createClassroomRecord(payload);
      setState(prev => ({ ...prev, classrooms: [newClassroom, ...prev.classrooms], activeClassroom: newClassroom.id }));
    }

    setForm({ title: '', subject: '', startsAt: 'Now', description: '', accessMode: 'public' });
    setTab('courses');
    navigateTo('classroom');
  };

  const navItems = [
    { key: 'overview', label: 'Dashboard' },
    { key: 'courses', label: 'My Courses' },
    { key: 'live', label: 'Live Classes' },
    { key: 'students', label: 'Students' },
    { key: 'assessments', label: 'Assessments' },
    { key: 'analytics', label: 'Analytics' },
  ];

  const teacherCourses = state.classrooms;
  const teacherStudentRooms = state.classrooms.filter(room => room.attendees && room.attendees > 0);
  const totalStudents = state.classrooms.reduce((sum, room) => sum + (room.attendees || 0), 0);
  const liveToday = state.classrooms.filter(room => room.live || room.status?.toLowerCase().includes('live')).length;
  const pendingReviews = state.classrooms.reduce((sum, room) => sum + (room.pendingReviews || 0), 0);
  const metrics = [
    { value: totalStudents.toString(), label: 'Total Students' },
    { value: state.classrooms.length.toString(), label: 'Active Courses' },
    { value: liveToday.toString(), label: 'Live Today' },
    { value: pendingReviews.toString(), label: 'Pending Reviews' },
  ];
  const assessments = [
    { title: 'English Literature Essay', due: 'Aug 13', status: 'Pending' },
    { title: 'React Hooks Sprint', due: 'Aug 15', status: 'Review' },
    { title: 'AI Engineering Quiz', due: 'Aug 18', status: 'Draft' },
  ];
  const analytics = [
    { label: 'Engagement', value: '92%' },
    { label: 'Completion', value: '81%' },
    { label: 'Attendance', value: '+6%' },
    { label: 'Revenue', value: '$12.4k' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="bg-gradient-to-r from-violet-950/60 to-slate-900 border border-violet-500/30 p-8 rounded-3xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold">Teacher Portal</span>
          <h1 className="text-3xl font-black text-white mt-3">Teaching Workspace</h1>
          <p className="text-sm text-slate-400 mt-2">Manage courses, live sessions, assessments, and student outcomes from a single professional dashboard.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setTab('courses')} className="px-5 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold">Create Course</button>
          <button onClick={() => setTab('live')} className="px-5 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold">Start Live Class</button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)] gap-6">
        <aside className="space-y-4">
          <div className="bg-slate-800/70 border border-slate-700/70 rounded-3xl p-4 space-y-3">
            {navItems.map(item => (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold transition ${tab === item.key ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' : 'bg-slate-900 text-slate-300 hover:bg-slate-700'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="bg-slate-800/70 border border-slate-700/70 rounded-3xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white">Permissions</h3>
            <p className="text-xs text-slate-400">Teachers can create content, launch live sessions, grade students, and access analytics.</p>
            <div className="grid gap-2 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" />Create/Edit/Publish Courses</span>
              <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" />Live session controls</span>
              <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" />Assessments & grading</span>
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          {tab === 'overview' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                {metrics.map((item) => (
                  <div key={item.label} className="bg-slate-800/70 border border-slate-700/70 p-6 rounded-3xl">
                    <div className="text-3xl font-black text-white">{item.value}</div>
                    <div className="text-xs text-slate-400 mt-1">{item.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-6">
                <div className="bg-slate-800/70 border border-slate-700/70 rounded-3xl p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-white">Course Operations</h2>
                      <p className="text-sm text-slate-400 mt-1">Quick access to course creation, editing, and publishing workflows.</p>
                    </div>
                    <button onClick={() => setTab('courses')} className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold">Go to Courses</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-3xl bg-slate-900 p-4 border border-slate-800">
                      <div className="text-sm text-slate-400">Active Courses</div>
                      <div className="mt-3 text-2xl font-black text-white">15</div>
                    </div>
                    <div className="rounded-3xl bg-slate-900 p-4 border border-slate-800">
                      <div className="text-sm text-slate-400">Courses Pending Approval</div>
                      <div className="mt-3 text-2xl font-black text-white">3</div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/70 border border-slate-700/70 rounded-3xl p-6 space-y-4">
                  <h2 className="text-xl font-bold text-white">Live Class Snapshot</h2>
                  <div className="text-sm text-slate-400">Manage upcoming sessions, recordings, and attendance from here.</div>
                  <div className="grid gap-3">
                    <button onClick={() => setTab('live')} className="w-full py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-bold">View Live Sessions</button>
                    <button className="w-full py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-bold">Open Recording Manager</button>
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === 'courses' && (
            <div className="bg-slate-800/70 border border-slate-700/70 p-8 rounded-3xl space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Course Management</h2>
                  <p className="text-sm text-slate-400 mt-1">Build and publish your curriculum with rich materials and live sessions.</p>
                </div>
                <button onClick={() => setTab('overview')} className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold">Return to Overview</button>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input value={form.title} onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))} placeholder="Course title" className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white" />
                    <input value={form.subject} onChange={(e) => setForm(prev => ({ ...prev, subject: e.target.value }))} placeholder="Subject" className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white" />
                    <input value={form.startsAt} onChange={(e) => setForm(prev => ({ ...prev, startsAt: e.target.value }))} placeholder="Starts at" className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white" />
                    <textarea value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Course description" rows={4} className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white" />
                  </div>
                  <div className="space-y-3">
                    <div className="text-sm font-semibold text-white">Class access</div>
                    <div className="grid grid-cols-2 gap-3">
                      {['public', 'link'].map(mode => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, accessMode: mode }))}
                          className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${form.accessMode === mode ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'}`}
                        >
                          {mode === 'public' ? 'Public access' : 'Link-only access'}
                        </button>
                      ))}
                    </div>
                    {form.accessMode === 'link' && (
                      <p className="text-xs text-slate-400">Students must enter the join code or use the invitation link to access this class.</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 justify-end">
                    <button onClick={createCourse} className="px-6 py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold">Create Course</button>
                    <button className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold">Publish Course</button>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                  <h3 className="text-white font-bold">Live course list</h3>
                  <div className="space-y-3">
                    {teacherCourses.map(course => (
                      <div key={course.id} className="rounded-3xl border border-slate-700 p-4 bg-slate-950/50">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="text-white font-bold">{course.title}</h4>
                            <p className="text-[11px] text-slate-400 mt-1">{course.subject} · {course.startsAt}</p>
                          </div>
                          <span className="text-[10px] text-slate-300">{course.status}</span>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button onClick={() => { setState(prev => ({ ...prev, activeClassroom: course.id })); navigateTo('classroom'); }} className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold">Open Room</button>
                          <button className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-bold">Edit</button>
                          <button className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-bold">Publish</button>
                        </div>
                        {course.accessMode === 'link' && course.joinCode && (
                          <div className="mt-3 text-xs text-slate-300">Join code: <span className="font-bold text-white">{course.joinCode}</span></div>
                        )}
                        {course.attendees > 0 && (
                          <div className="mt-2 text-xs text-slate-300">{course.attendees} student{course.attendees === 1 ? '' : 's'} joined</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'live' && (
            <div className="bg-slate-800/70 border border-slate-700/70 p-8 rounded-3xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Live Class Management</h2>
                  <p className="text-sm text-slate-400 mt-1">Start sessions, record classes, and monitor attendee engagement.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold">Schedule Session</button>
                  <button className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold">Start Recording</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {teacherCourses.map((course) => (
                  <div key={course.id} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span>{course.subject}</span>
                      <span>{course.attendees} students</span>
                    </div>
                    <h3 className="text-lg font-bold text-white">{course.title}</h3>
                    <p className="text-sm text-slate-400">{course.description}</p>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => { setState(prev => ({ ...prev, activeClassroom: course.id })); navigateTo('classroom'); }} className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold">Open Room</button>
                      <button className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold">Invite</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'students' && (
            <div className="bg-slate-800/70 border border-slate-700/70 p-8 rounded-3xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Student Progress</h2>
                  <p className="text-sm text-slate-400 mt-1">Monitor class participation and attendance once students join your sessions.</p>
                </div>
                <button className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold">Export Report</button>
              </div>
              {teacherStudentRooms.length > 0 ? (
                <div className="space-y-4">
                  {teacherStudentRooms.map((room, i) => (
                    <div key={room.id || i} className="bg-slate-900 border border-slate-800 p-4 rounded-3xl">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="text-white font-bold">{room.title}</h3>
                          <p className="text-[11px] text-slate-400">{room.attendees} student{room.attendees === 1 ? '' : 's'} joined · {room.startsAt || 'Scheduled session'}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-800 px-3 py-1 text-[10px] font-semibold text-slate-300">Live</span>
                          <button className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold">Open Room</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-slate-700 bg-slate-900 p-6 text-slate-300">
                  <p className="text-sm text-slate-400">No students have joined a live class yet. Student progress and attendance data appear here once learners participate.</p>
                </div>
              )}
            </div>
          )}

          {tab === 'assessments' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-800/70 border border-slate-700/70 p-8 rounded-3xl space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">Assignments</h2>
                    <p className="text-sm text-slate-400 mt-1">Build, publish, and grade assignments with feedback workflows.</p>
                  </div>
                  <button className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold">Create Assignment</button>
                </div>
                <div className="space-y-3">
                  {assessments.map((item, i) => (
                    <div key={i} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-white text-sm">{item.title}</div>
                        <div className="text-[11px] text-slate-400">Due {item.due}</div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-slate-800 text-[10px] text-slate-300">{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-800/70 border border-slate-700/70 p-8 rounded-3xl space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">Quizzes</h2>
                    <p className="text-sm text-slate-400 mt-1">Generate AI quizzes and review quiz analytics in one place.</p>
                  </div>
                  <button className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold">Create Quiz</button>
                </div>
                <div className="rounded-3xl bg-slate-900 border border-slate-800 p-4 text-sm text-slate-300">
                  <p>Last quiz created: AI Engineering Quiz</p>
                  <p className="mt-2">Auto-grade rate: 96% · Feedback delivered: 75%</p>
                </div>
              </div>
            </div>
          )}

          {tab === 'analytics' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {analytics.map((item) => (
                <div key={item.label} className="bg-slate-800/70 border border-slate-700/70 p-8 rounded-3xl">
                  <div className="text-3xl font-black text-white">{item.value}</div>
                  <div className="text-xs text-slate-400 mt-1">{item.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ==================== ADMIN DASHBOARD ==================== */
function AdminDashboard({ metrics }) {
  const cards = [
    { label: 'Total Students', value: metrics?.students != null ? metrics.students.toLocaleString() : '-' },
    { label: 'Active Teachers', value: metrics?.teachers != null ? metrics.teachers.toLocaleString() : '-' },
    { label: 'Revenue', value: metrics?.revenue != null ? `$${metrics.revenue.toLocaleString()}` : '-' },
    { label: 'Active Live Classes', value: metrics?.liveClasses != null ? metrics.liveClasses.toLocaleString() : '-' },
    { label: 'Pending Approvals', value: metrics?.pendingApprovals != null ? metrics.pendingApprovals.toLocaleString() : '-' },
    { label: 'Attendance', value: metrics?.attendance != null ? `${metrics.attendance}%` : '-' },
    { label: 'Payments', value: metrics?.payments != null ? metrics.payments.toLocaleString() : '-' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="bg-gradient-to-r from-pink-900/60 to-slate-900 border border-pink-500/30 p-8 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 text-xs font-bold">System Administration</span>
          <h1 className="text-2xl font-black text-white mt-2">Admin Control Center</h1>
          <p className="text-xs text-slate-300">Manage users, faculty (including Mr Abu), courses, payouts and system health</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700">System Logs</button>
          <button className="px-4 py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-pink-600/30">Security Settings</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {cards.map((s, i) => (
          <div key={i} className="bg-slate-800/60 border border-slate-700/60 p-6 rounded-3xl">
            <div className="text-3xl font-black text-white">{s.value}</div>
            <div className="text-xs text-slate-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-slate-800/60 border border-slate-700/60 p-8 rounded-3xl space-y-6">
        <h3 className="font-bold text-white text-lg">Recent System Transactions</h3>
        <div className="space-y-3">
          {[
            { user: 'Alex Johnson', action: 'Purchased Pro Scholar Subscription', amount: '$29.00', time: '12m ago', status: 'Success' },
            { user: 'Mr Abu', action: 'Teacher Payout Requested', amount: '$2,450.00', time: '2h ago', status: 'Approved' },
            { user: 'David Miller', action: 'New Course Published', amount: '-', time: '5h ago', status: 'Active' },
          ].map((tx, idx) => (
            <div key={idx} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-white">{tx.user} · <span className="text-indigo-400">{tx.action}</span></div>
                <div className="text-[10px] text-slate-400">{tx.time}</div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="font-bold text-white">{tx.amount}</span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-500/20 text-green-300">{tx.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ==================== VIRTUAL CLASSROOM ==================== */
function VirtualClassroom({ navigateTo, state, setState, socketRef }) {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(false);
  const [teacherFlowStep, setTeacherFlowStep] = useState('idle');
  const [studentFlowStep, setStudentFlowStep] = useState('idle');
  const [screenShare, setScreenShare] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [waitingApproval, setWaitingApproval] = useState(false);
  const [addParticipantOpen, setAddParticipantOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const peerConnectionsRef = useRef(new Map());
  const [liveKitRoom, setLiveKitRoom] = useState(null);
  const [liveKitConnected, setLiveKitConnected] = useState(false);
  const [connectingLiveKit, setConnectingLiveKit] = useState(false);
  const [liveKitError, setLiveKitError] = useState('');
  const [liveKitVideoTrack, setLiveKitVideoTrack] = useState(null);
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);
  const [whiteboardTool, setWhiteboardTool] = useState('pen');
  const [whiteboardShape, setWhiteboardShape] = useState('rectangle');
  const [whiteboardColor, setWhiteboardColor] = useState('#ffffff');
  const [whiteboardSize, setWhiteboardSize] = useState(4);
  const [whiteboardActions, setWhiteboardActions] = useState([]);
  const [currentAction, setCurrentAction] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [whiteboardText, setWhiteboardText] = useState('');
  const [streamSource, setStreamSource] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const recorderRef = useRef(null);
  const videoRef = useRef(null);
  const liveKitVideoRef = useRef(null);
  const canvasRef = useRef(null);

  const handleConnectLiveKit = async (publishLocalTracks = true) => {
    if (!classroom || !state.currentUser) return;
    setConnectingLiveKit(true);
    setLiveKitError('');

    try {
      const room = await connectLiveKit(classroom.id, state.currentUser.name || `user-${Date.now()}`, publishLocalTracks);
      setLiveKitRoom(room);
      setLiveKitConnected(true);

      room.on('disconnected', () => {
        setLiveKitConnected(false);
        setLiveKitRoom(null);
      });

      room.on('trackSubscribed', (track) => {
        if (track.kind === 'video' && liveKitVideoRef.current) {
          track.attach(liveKitVideoRef.current);
        }
      });

      room.on('trackUnsubscribed', (track) => {
        if (track.kind === 'video') {
          track.detach().forEach(el => el.remove());
        }
      });
    } catch (err) {
      setLiveKitError(err?.message || 'LiveKit connection failed.');
      console.error('LiveKit connect error', err);
    } finally {
      setConnectingLiveKit(false);
    }
  };

  const startTeacherFlow = async () => {
    setTeacherFlowStep('camera-permission');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCamOn(true);
      setTeacherFlowStep('microphone-permission');
      stream.getAudioTracks().forEach(track => track.stop());
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicOn(true);
      setTeacherFlowStep('livekit-connection');
      await handleConnectLiveKit(true);
      setTeacherFlowStep('teacher-live');
    } catch (err) {
      console.error('Teacher flow error', err);
      setLiveKitError(err?.message || 'Permission denied or LiveKit connect failed.');
      setTeacherFlowStep('idle');
    }
  };

  const startStudentFlow = async () => {
    setStudentFlowStep('authenticate');
    if (!state.currentUser) {
      navigateTo('login');
      return;
    }

    try {
      const tokenRes = await getLiveKitToken(state.currentUser.name || `user-${Date.now()}`, classroom.id);
      if (tokenRes.error) throw new Error(tokenRes.error);
      setStudentFlowStep('connect-room');
      const { connect } = await import('livekit-client');
      const room = await connect(tokenRes.url, tokenRes.token, { autoSubscribe: true });
      setLiveKitRoom(room);
      setLiveKitConnected(true);
      room.on('trackSubscribed', (track) => {
        if (track.kind === 'video' && liveKitVideoRef.current) {
          track.attach(liveKitVideoRef.current);
        }
      });
      room.on('trackUnsubscribed', (track) => {
        if (track.kind === 'video') {
          track.detach().forEach(el => el.remove());
        }
      });
      setStudentFlowStep('see-teacher');
    } catch (err) {
      console.error('Student flow error', err);
      setLiveKitError(err?.message || 'Student authentication or LiveKit connection failed.');
      setStudentFlowStep('idle');
    }
  };

  const getCanvasContext = () => canvasRef.current?.getContext('2d');
  const resizeWhiteboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    redrawWhiteboard();
  };

  const drawAction = (ctx, action) => {
    if (!ctx || !action) return;
    ctx.save();
    ctx.strokeStyle = action.color || '#ffffff';
    ctx.fillStyle = action.color || '#ffffff';
    ctx.lineWidth = action.size || 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (action.type === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    }
    if (action.type === 'pen' || action.type === 'eraser' || action.type === 'ruler') {
      const points = action.points || [];
      if (!points.length) return;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach(pt => ctx.lineTo(pt.x, pt.y));
      ctx.stroke();
      if (action.type === 'ruler' && points.length >= 2) {
        const start = points[0];
        const end = points[points.length - 1];
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        ctx.font = '12px Inter';
        ctx.fillStyle = action.color || '#ffffff';
        ctx.fillText(`${Math.round(dist)}px`, end.x + 8, end.y + 8);
      }
    } else if (action.type === 'shape') {
      const x = action.x;
      const y = action.y;
      const x2 = action.x2 || x;
      const y2 = action.y2 || y;
      const width = x2 - x;
      const height = y2 - y;
      if (action.shape === 'rectangle') {
        ctx.strokeRect(x, y, width, height);
      } else if (action.shape === 'circle') {
        const radius = Math.hypot(width, height) / 2;
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height / 2, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (action.shape === 'arrow') {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        const angle = Math.atan2(y2 - y, x2 - x);
        const headlen = 12;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      }
    } else if (action.type === 'text') {
      ctx.font = `${action.size * 4}px Inter`;
      ctx.fillText(action.text || '', action.x, action.y);
    }
    ctx.restore();
  };

  const redrawWhiteboard = () => {
    const canvas = canvasRef.current;
    const ctx = getCanvasContext();
    if (!canvas || !ctx) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const style = getComputedStyle(parent);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const ratio = window.devicePixelRatio || 1;
    ctx.save();
    ctx.scale(ratio, ratio);
    ctx.clearRect(0, 0, parent.clientWidth, parent.clientHeight);
    whiteboardActions.forEach(action => drawAction(ctx, action));
    if (currentAction) drawAction(ctx, currentAction);
    ctx.restore();
  };

  const screenPoint = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const commitCurrentAction = () => {
    if (!currentAction) return;
    const actionToCommit = { ...currentAction, id: Date.now(), user: state.currentUser?.name || socketRef.current?.id };
    setWhiteboardActions(prev => [...prev, actionToCommit]);
    setCurrentAction(null);
    // Emit action to server if teacher (teacher annotations are authoritative)
    try {
      if (socketRef.current && classroom && state.currentUser?.role === 'teacher') {
        socketRef.current.emit('whiteboardAction', { roomId: classroom.id, action: actionToCommit });
      }
    } catch (err) {
      console.warn('emit whiteboardAction error', err);
    }
  };

  const handleWhiteboardDown = (event) => {
    const pos = screenPoint(event);
    if (whiteboardTool === 'text') {
      const text = prompt('Enter text to place on the board:', whiteboardText || '');
      if (text && text.trim()) {
        setWhiteboardActions(prev => [...prev, { type: 'text', text: text.trim(), x: pos.x, y: pos.y, color: whiteboardColor, size: whiteboardSize }]);
      }
      return;
    }

    const base = {
      type: whiteboardTool,
      color: whiteboardTool === 'eraser' ? '#000000' : whiteboardColor,
      size: whiteboardSize,
      points: [{ x: pos.x, y: pos.y }],
      shape: whiteboardShape,
      x: pos.x,
      y: pos.y,
      x2: pos.x,
      y2: pos.y,
    };
    setCurrentAction(base);
    setIsDrawing(true);
  };

  const handleWhiteboardMove = (event) => {
    if (!isDrawing || !currentAction) return;
    const pos = screenPoint(event);
    setCurrentAction(prev => {
      if (!prev) return null;
      if (prev.type === 'pen' || prev.type === 'eraser' || prev.type === 'ruler') {
        return { ...prev, points: [...prev.points, pos] };
      }
      return { ...prev, x2: pos.x, y2: pos.y };
    });
  };

  const handleWhiteboardUp = () => {
    if (!isDrawing) return;
    commitCurrentAction();
    setIsDrawing(false);
  };

  const clearWhiteboard = () => {
    setWhiteboardActions([]);
    setCurrentAction(null);
    const ctx = getCanvasContext();
    if (ctx && canvasRef.current) {
      const width = canvasRef.current.width;
      const height = canvasRef.current.height;
      ctx.clearRect(0, 0, width, height);
    }
    try {
      if (socketRef.current && classroom && state.currentUser?.role === 'teacher') {
        socketRef.current.emit('whiteboardClear', { roomId: classroom.id });
      }
    } catch (err) {
      console.warn('emit whiteboardClear error', err);
    }
  };

  useEffect(() => {
    redrawWhiteboard();
  }, [whiteboardActions, currentAction]);

  useEffect(() => {
    resizeWhiteboard();
    window.addEventListener('resize', resizeWhiteboard);
    return () => window.removeEventListener('resize', resizeWhiteboard);
  }, []);

  const classroom = state.classrooms.find(room => room.id === state.activeClassroom) || state.classrooms[0];
  const classroomRecordings = classroom?.recordings || recordings;

  useEffect(() => {
    fetch('/api/messages')
      .then(res => res.json())
      .then(data => setMessages(data))
      .catch(() => setMessages([]));
  }, []);

  useEffect(() => {
    if (!socketRef?.current || !classroom) return;

    // join with user name so server can broadcast participant info
    const joinPayload = { roomId: classroom.id, user: state.currentUser?.name || 'Guest' };
    socketRef.current.emit('joinRoom', joinPayload);

    // add self to participants list
    const selfId = socketRef.current.id;
    setParticipants(prev => {
      const existing = prev.find(p => p.id === selfId);
      if (existing) return prev;
      return [...prev, { id: selfId, user: state.currentUser?.name || 'You' }];
    });

    socketRef.current.on('receiveMessage', (message) => {
      setMessages(prev => [...prev, message]);
    });

    socketRef.current.on('participantJoined', async (p) => {
      if (!p) return;
      setParticipants(prev => prev.find(x => x.id === p.id) ? prev : [...prev, { id: p.id, user: p.user || 'Anonymous' }]);

      // Create a peer connection and initiate offer to the new participant
      try {
        const peerId = p.id;
        if (!peerId || peerConnectionsRef.current.has(peerId)) return;
        const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });

        pc.onicecandidate = (e) => {
          if (e.candidate) {
            socketRef.current.emit('signal', { to: peerId, roomId: classroom.id, data: { type: 'ice', candidate: e.candidate } });
          }
        };

        pc.ontrack = (ev) => {
          const remoteStream = ev.streams && ev.streams[0];
          if (remoteStream) setRemoteStreams(prev => ({ ...prev, [peerId]: remoteStream }));
        };

        // attach local tracks if available
        if (localStream) {
          try {
            localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
          } catch {}
        }

        peerConnectionsRef.current.set(peerId, pc);

        // create offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketRef.current.emit('signal', { to: peerId, roomId: classroom.id, data: { type: 'offer', sdp: pc.localDescription } });
      } catch (err) {
        console.warn('Error creating offer to new participant', err);
      }
    });

    socketRef.current.on('participantLeft', (p) => {
      if (!p) return;
      setParticipants(prev => prev.filter(x => x.id !== p.id));
      // cleanup peer connection and remote stream
      const pc = peerConnectionsRef.current.get(p.id);
      if (pc) {
        try { pc.close(); } catch {};
        peerConnectionsRef.current.delete(p.id);
      }
      setRemoteStreams(prev => {
        const copy = { ...prev };
        delete copy[p.id];
        return copy;
      });
    });

    socketRef.current.on('participantUpdated', (p) => {
      if (!p) return;
      setParticipants(prev => prev.map(x => x.id === p.id ? { ...x, user: p.user } : x));
    });

    socketRef.current.on('mediaRequest', (payload) => {
      // Notify teacher of a pending media request
      if (!payload) return;
      const from = payload.from;
      const user = payload.user;
      const type = payload.type || 'camera';
      // If current user is teacher, prompt to accept
      if (state.currentUser?.role === 'teacher') {
        const accept = confirm(`${user} requests permission to enable ${type}. Accept?`);
        if (accept) {
          socketRef.current.emit('approveMedia', { to: from, type, roomId: classroom.id });
        }
      }
    });

    socketRef.current.on('mediaApproved', async (payload) => {
      if (!payload) return;
      const type = payload.type || 'camera';
      if (!state.currentUser) return;
      setWaitingApproval(false);
      try {
        await handleConnectLiveKit();
      } catch (err) {
        console.warn('LiveKit connect failed after approval', err);
      }
    });

    // Whiteboard realtime events
    socketRef.current.on('whiteboardInit', (board) => {
      if (!board) return;
      setWhiteboardActions(board || []);
    });

    socketRef.current.on('whiteboardAction', (action) => {
      if (!action) return;
      setWhiteboardActions(prev => [...prev, action]);
    });

    socketRef.current.on('whiteboardClear', () => {
      setWhiteboardActions([]);
    });

    // WebRTC signaling
    socketRef.current.on('signal', async (payload) => {
      const from = payload?.from;
      const data = payload?.data;
      if (!from || !data) return;
      try {
        let pc = peerConnectionsRef.current.get(from);
        if (!pc) {
          pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });

          pc.onicecandidate = (e) => {
            if (e.candidate) {
              socketRef.current.emit('signal', { to: from, roomId: classroom.id, data: { type: 'ice', candidate: e.candidate } });
            }
          };

          pc.ontrack = (ev) => {
            const remoteStream = ev.streams && ev.streams[0];
            if (remoteStream) setRemoteStreams(prev => ({ ...prev, [from]: remoteStream }));
          };

          // add local tracks if available
          if (localStream) {
            try { localStream.getTracks().forEach(track => pc.addTrack(track, localStream)); } catch {}
          }

          peerConnectionsRef.current.set(from, pc);
        }

        if (data.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socketRef.current.emit('signal', { to: from, roomId: classroom.id, data: { type: 'answer', sdp: pc.localDescription } });
        } else if (data.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        } else if (data.type === 'ice') {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (e) { }
        }
      } catch (err) {
        console.warn('Signal handling error', err);
      }
    });

    return () => {
      socketRef.current?.emit('leaveRoom', { roomId: classroom.id });
      socketRef.current?.off('receiveMessage');
      socketRef.current?.off('participantJoined');
      socketRef.current?.off('participantLeft');
      socketRef.current?.off('participantUpdated');
      socketRef.current?.off('mediaRequest');
      socketRef.current?.off('mediaApproved');
      socketRef.current?.off('whiteboardInit');
      socketRef.current?.off('whiteboardAction');
      socketRef.current?.off('whiteboardClear');
      socketRef.current?.off('signal');
    };
  }, [socketRef, classroom]);

  useEffect(() => {
    let active = true;

    const stopStream = (stream) => {
      if (!stream) return;
      stream.getTracks().forEach(track => track.stop());
    };

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!active) {
          stopStream(stream);
          return;
        }
        stream.getAudioTracks().forEach(track => { track.enabled = micOn; });
        setStreamSource('camera');
        setLocalStream(stream);
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (error) {
        setCamOn(false);
      }
    };

    const startScreenShare = async () => {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        if (!active) {
          stopStream(stream);
          return;
        }
        const track = stream.getVideoTracks()[0];
        if (track) {
          track.addEventListener('ended', () => {
            setScreenShare(false);
          });
        }
        setStreamSource('display');
        setLocalStream(stream);
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (error) {
        setScreenShare(false);
      }
    };

    if (screenShare) {
      if (streamSource !== 'display') {
        if (localStream) {
          stopStream(localStream);
          setLocalStream(null);
        }
        startScreenShare();
      }
    } else if (camOn) {
      if (streamSource !== 'camera') {
        if (localStream) {
          stopStream(localStream);
          setLocalStream(null);
        }
        startCamera();
      }
    } else {
      if (localStream) {
        stopStream(localStream);
        setLocalStream(null);
        setStreamSource(null);
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      active = false;
      if (localStream) {
        stopStream(localStream);
      }
    };
  }, [camOn, screenShare, streamSource]);

  useEffect(() => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach(track => {
      track.enabled = micOn;
    });
  }, [micOn, localStream]);

  // When localStream changes, ensure tracks are published to existing peer connections
  useEffect(() => {
    if (!localStream) return;
    for (const [peerId, pc] of peerConnectionsRef.current.entries()) {
      try {
        const senders = pc.getSenders ? pc.getSenders() : [];
        const tracks = localStream.getTracks();
        tracks.forEach(track => {
          const sender = senders.find(s => s.track && s.track.kind === track.kind);
          if (sender && sender.replaceTrack) {
            sender.replaceTrack(track);
          } else {
            try { pc.addTrack(track, localStream); } catch {}
          }
        });
      } catch (err) {
        // ignore
      }
    }
  }, [localStream]);

  const sendChatMessage = async (text) => {
    if (!text.trim()) return;
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: state.currentUser.name, text }),
      });
      const newMessage = response.ok ? await response.json() : { id: Date.now(), user: state.currentUser.name, text, time: 'Now' };
      setMessages(prev => [...prev, newMessage]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now(), user: state.currentUser.name, text, time: 'Now' }]);
    }
  };

  const joinRoom = async () => {
    if (!classroom) return;

    if (!state.currentUser) {
      // Require login before joining
      navigateTo('login');
      return;
    }

    // If the class is link-only, prompt for a join code
    let providedCode = '';
    if (classroom.accessMode === 'link') {
      const code = prompt('This classroom requires a join code. Enter the join code to join:');
      if (!code || !code.trim()) {
        alert('Join code is required to enter this classroom.');
        return;
      }
      providedCode = code.trim();
    }

    try {
      const response = await fetch(`/api/classrooms/${classroom.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joinCode: providedCode }),
      });
      const updatedRoom = await response.json();
      if (!response.ok) {
        alert(updatedRoom.error || 'Unable to join room.');
        return;
      }
      setState(prev => ({
        ...prev,
        activeClassroom: updatedRoom.id,
        classrooms: prev.classrooms.map(room => room.id === updatedRoom.id ? updatedRoom : room),
        notifications: [{ id: Date.now(), text: `You joined ${updatedRoom.title} hosted by ${updatedRoom.teacher}.`, time: 'Just now', unread: true }, ...prev.notifications],
      }));
    } catch (error) {
      const updatedRoom = joinClassroomRecord(classroom);
      setState(prev => ({
        ...prev,
        activeClassroom: updatedRoom.id,
        classrooms: prev.classrooms.map(room => room.id === updatedRoom.id ? updatedRoom : room),
        notifications: [{ id: Date.now(), text: `You joined ${updatedRoom.title} hosted by ${updatedRoom.teacher}.`, time: 'Just now', unread: true }, ...prev.notifications],
      }));
    }
  };

  const startRecording = () => {
    if (!localStream) {
      alert('Enable your camera first to record the class.');
      return;
    }
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      return;
    }

    const options = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
    let recorder = null;
    for (const type of options) {
      if (MediaRecorder.isTypeSupported(type)) {
        try {
          recorder = new MediaRecorder(localStream, { mimeType: type });
          break;
        } catch (err) {
          continue;
        }
      }
    }
    if (!recorder) {
      try {
        recorder = new MediaRecorder(localStream);
      } catch (err) {
        alert('Recording is not supported by this browser.');
        return;
      }
    }

    const chunks = [];
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: recorder.mimeType || 'video/webm' });
      const url = URL.createObjectURL(blob);
      const newRecording = { id: Date.now(), url, blob, time: new Date().toLocaleString() };
      setRecordings(prev => [...prev, newRecording]);
      setState(prev => ({
        ...prev,
        classrooms: prev.classrooms.map(room =>
          room.id === classroom?.id
            ? { ...room, recordings: [...(room.recordings || []), newRecording] }
            : room
        ),
      }));
      setRecordedChunks(chunks);
      recorderRef.current = null;
    };
    recorder.start();
    recorderRef.current = recorder;
    setRecordedChunks([]);
    setIsRecording(true);
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state === 'recording') {
      recorder.stop();
    }
    setIsRecording(false);
  };

  const requestCameraOn = () => {
    if (!classroom || !socketRef.current) return;
    socketRef.current.emit('requestMedia', { roomId: classroom.id, type: 'camera' });
    setWaitingApproval(true);
  };

  return (
    <div className="h-[calc(100vh-80px)] bg-slate-950 flex flex-col overflow-hidden relative">
      {/* Top Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between relative z-20">
        <div>
          <h2 className="text-white font-bold text-base">{classroom ? classroom.teacher : 'Live Classroom'}</h2>
          <div className="text-xs text-sky-400 font-semibold flex items-center space-x-2">
            <span>{classroom ? classroom.title : 'No active classroom'}</span>
            <span className="text-[10px] text-slate-400 font-normal">· {classroom ? classroom.subject : 'Join a room'}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-slate-950/80 px-4 py-2 rounded-2xl border border-slate-800">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setNotificationsOpen(!notificationsOpen); setAddParticipantOpen(false); setFeaturesOpen(false); }}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition relative"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-pink-500 rounded-full animate-ping" />
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 mt-3 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 z-50 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-white border-b border-slate-800 pb-2">
                  <span>Classroom Alerts</span>
                  <button onClick={() => setNotificationsOpen(false)} className="text-slate-400 hover:text-white"><X className="h-3.5 w-3.5" /></button>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="bg-slate-800 p-2.5 rounded-xl text-slate-300">
                    <span className="font-bold text-indigo-400 block">Mr Abu uploaded Notes</span>
                    English_Grammar_Ch4.pdf added to resources.
                  </div>
                  <div className="bg-slate-800 p-2.5 rounded-xl text-slate-300">
                    <span className="font-bold text-yellow-400 block">Poll Started</span>
                    "Do you understand subjunctive mood?"
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Add Student */}
          <div className="relative">
            <button
              onClick={() => { setAddParticipantOpen(!addParticipantOpen); setNotificationsOpen(false); setFeaturesOpen(false); }}
              className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition flex items-center space-x-1.5 text-xs font-semibold px-3"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Student</span>
            </button>
            {addParticipantOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 z-50 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-white border-b border-slate-800 pb-2">
                  <span>Invite Student to Live Room</span>
                  <button onClick={() => setAddParticipantOpen(false)} className="text-slate-400 hover:text-white"><X className="h-3.5 w-3.5" /></button>
                </div>
                <input
                  type="text"
                  value={newStudentEmail}
                  onChange={e => setNewStudentEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={() => {
                    if (newStudentEmail.trim()) {
                      alert(`Invitation link sent to ${newStudentEmail}`);
                      setNewStudentEmail('');
                      setAddParticipantOpen(false);
                    }
                  }}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
                >
                  Send Invitation Link
                </button>
              </div>
            )}
          </div>

          {/* Features */}
          <div className="relative">
            <button
              onClick={() => { setFeaturesOpen(!featuresOpen); setNotificationsOpen(false); setAddParticipantOpen(false); }}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition flex items-center space-x-1 text-xs font-semibold px-3"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Features</span>
            </button>
            {featuresOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 z-50 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-white border-b border-slate-800 pb-2">
                  <span>Classroom Features</span>
                  <button onClick={() => setFeaturesOpen(false)} className="text-slate-400 hover:text-white"><X className="h-3.5 w-3.5" /></button>
                </div>
                <button onClick={() => { setWhiteboardOpen(true); setFeaturesOpen(false); }} className="w-full text-left px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center space-x-2 text-xs">
                  <Edit3 className="h-4 w-4 text-indigo-400" />
                  <span>Open Whiteboard</span>
                </button>
                <button onClick={() => { alert('Live Poll launched'); setFeaturesOpen(false); }} className="w-full text-left px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center space-x-2 text-xs">
                  <BarChart2 className="h-4 w-4 text-pink-400" />
                  <span>Launch Live Poll</span>
                </button>
                <button onClick={() => { alert('Breakout rooms created'); setFeaturesOpen(false); }} className="w-full text-left px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center space-x-2 text-xs">
                  <Layers className="h-4 w-4 text-violet-400" />
                  <span>Breakout Rooms</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {classroom?.attendees > 0 && (
            <div className="flex items-center space-x-1.5 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="font-bold text-white">{classroom.attendees}</span>
            </div>
          )}
          <button
            onClick={() => navigateTo('student-dash')}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 hover:bg-red-500 text-white transition"
            aria-label="Leave room"
            title="Leave room"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Teacher Stage */}
        <div className="flex-1 relative bg-slate-950 flex items-center justify-center overflow-hidden">
          {liveKitConnected ? (
            <video ref={liveKitVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          ) : localStream ? (
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-300 px-6 text-center">
              <div className="mb-4 text-sm text-slate-400">Camera is not active yet.</div>
              {state.currentUser?.role === 'teacher' ? (
                <button
                  onClick={() => setCamOn(true)}
                  className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition"
                >
                  Enable Live Camera
                </button>
              ) : (
                <button
                  onClick={requestCameraOn}
                  className="rounded-2xl bg-amber-600 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-500 transition"
                >
                  Request Camera Permission
                </button>
              )}
              <p className="mt-4 text-xs text-slate-500 max-w-md">
                {state.currentUser?.role === 'teacher'
                  ? 'Allow access to your webcam so the class can see your live video feed.'
                  : 'Ask your teacher to allow camera access for your participant video.'}
              </p>
            </div>
          )}
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-md px-6 py-2 rounded-2xl text-2xl sm:text-4xl font-black text-amber-200 uppercase tracking-widest border border-amber-500/30 shadow-2xl">
            {classroom?.teacher || 'Teacher'}
          </div>

          {/* Student overlays driven by real participants (excluding teacher) */}
          <div className="absolute left-6 top-6 bottom-6 flex flex-col space-y-4 w-44 z-10">
            {participants.filter(p => p.user && p.user !== classroom?.teacher).map((p, idx) => (
              <div key={p.id || idx} className="flex-1 bg-slate-900 border-2 border-slate-700/80 rounded-2xl overflow-hidden relative shadow-2xl flex flex-col justify-end">
                <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-transparent to-black/30" />
                <div className="absolute inset-0 flex items-center justify-center z-0">
                  {/* remote video */}
                  <video
                    autoPlay
                    playsInline
                    muted={p.id !== socketRef.current?.id}
                    ref={(el) => {
                      if (el && remoteStreams[p.id]) {
                        try { el.srcObject = remoteStreams[p.id]; } catch {}
                      }
                    }}
                    className="w-full h-full object-cover opacity-80"
                  />
                </div>
                <div className="absolute top-2 left-2 z-10 flex items-center space-x-2">
                  <span className="bg-sky-500 text-white font-bold text-xs px-2.5 py-1 rounded-full shadow-lg">{p.user}</span>
                  {p.id === socketRef.current?.id && (
                    <button
                      onClick={() => {
                        const newName = prompt('Edit your display name:', p.user || state.currentUser?.name || '');
                        if (newName && newName.trim()) {
                          socketRef.current.emit('updateName', { roomId: classroom.id, name: newName.trim() });
                          setParticipants(prev => prev.map(x => x.id === p.id ? { ...x, user: newName.trim() } : x));
                          setState(prev => ({ ...prev, currentUser: { ...prev.currentUser, name: newName.trim() } }));
                        }
                      }}
                      className="text-[10px] px-2 py-1 rounded bg-slate-800 text-slate-200"
                    >
                      Edit
                    </button>
                  )}
                </div>
                <div className="h-10 bg-slate-800/90 backdrop-blur-sm relative z-10" />
              </div>
            ))}
          </div>
        </div>

        {/* Classroom Recording Panel */}
        <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-white text-xs uppercase tracking-wider">Saved Class Recordings</h3>
              <div className="text-[10px] text-slate-500">{classroomRecordings.length} saved session{classroomRecordings.length === 1 ? '' : 's'}</div>
            </div>
            <button onClick={() => setChatOpen(true)} className="text-slate-400 hover:text-white text-xs">Chat</button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            {classroomRecordings.length ? classroomRecordings.map((recording, index) => (
              <div key={recording.id || index} className="bg-slate-800 border border-slate-700 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between text-slate-300">
                  <div>
                    <div className="font-semibold text-slate-100">Recorded session</div>
                    <div className="text-[11px] text-slate-500">{recording.time}</div>
                  </div>
                  <a href={recording.url} download={`classroom-recording-${recording.id}.webm`} className="text-indigo-300 hover:text-indigo-200 text-[11px] font-semibold">Download</a>
                </div>
                <video src={recording.url} controls className="w-full rounded-2xl bg-black" />
              </div>
            )) : (
              <div className="text-slate-500">No recordings yet. Start a live session and press Record Class to save one.</div>
            )}
          </div>
        </div>

        {/* Chat Sidebar */}
        {chatOpen && (
          <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white text-xs uppercase tracking-wider">Classroom Live Chat</h3>
                <div className="text-[10px] text-slate-500">Live conversation · {messages.length} messages</div>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
              {messages.map((m, i) => {
                const isMine = m.user === state.currentUser.name;
                const userName = m.user === 'Mr Abu' ? 'Teacher' : m.user === state.currentUser.name ? 'You' : m.user;
                const userAvatar = m.user === 'Mr Abu'
                  ? 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?fm=webp&q=80'
                  : m.user === 'Alex Johnson'
                    ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?fm=webp&q=80'
                    : 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?fm=webp&q=80';

                return (
                  <div key={`${m.id || i}-${m.user}`} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    {!isMine && (
                      <div className="flex-shrink-0">
                        <img src={userAvatar} alt={userName} className="h-10 w-10 rounded-full object-cover border border-slate-700" />
                      </div>
                    )}
                    <div className={`max-w-[80%] space-y-1 ${isMine ? 'text-right' : ''}`}>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="font-semibold text-white">{userName}</span>
                        <span className="text-slate-500">{m.time || 'Now'}</span>
                        {isMine && <span className="text-emerald-400">✔ Seen</span>}
                      </div>
                      <div className={`inline-block rounded-3xl px-4 py-3 text-sm ${isMine ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-200'}`}>
                        {m.text}
                      </div>
                    </div>
                    {isMine && (
                      <div className="flex-shrink-0">
                        <img src={state.currentUser.photo} alt="You" className="h-10 w-10 rounded-full object-cover border border-slate-700" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="p-3 border-t border-slate-800 flex items-center gap-2">
              <button className="rounded-2xl bg-slate-800 border border-slate-700 p-3 text-slate-300 hover:bg-slate-700 transition" aria-label="Send emoji">
                <Smile className="h-4 w-4" />
              </button>
              <input
                type="text"
                value={inputMsg}
                onChange={e => setInputMsg(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && inputMsg.trim()) {
                    sendChatMessage(inputMsg);
                    setInputMsg('');
                  }
                }}
                placeholder="Send message..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => {
                  if (inputMsg.trim()) {
                    sendChatMessage(inputMsg);
                    setInputMsg('');
                  }
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white hover:bg-indigo-500 transition"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="bg-slate-900 border-t border-slate-800 py-3 px-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
        {state.currentUser ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
            <button
              onClick={() => {
                if (state.currentUser.role === 'student') {
                  startStudentFlow();
                } else {
                  startTeacherFlow();
                }
              }}
              className="p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center space-x-2 text-xs font-semibold transition"
            >
              <Video className="h-5 w-5" />
              <span className="hidden sm:inline">{state.currentUser.role === 'student' ? 'Join Class' : 'Start Class'}</span>
            </button>
            <div className="rounded-2xl bg-slate-800 border border-slate-700 px-3 py-2 text-[10px] text-slate-300">
              {state.currentUser.role === 'student' ? (
                <>
                  Student flow: <span className="text-indigo-200 font-semibold">{studentFlowStep.replace(/-/g, ' ')}</span>
                </>
              ) : (
                <>
                  Teacher flow: <span className="text-indigo-200 font-semibold">{teacherFlowStep.replace(/-/g, ' ')}</span>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400">Sign in to join this classroom</div>
        )}
        <button
          onClick={() => setMicOn(!micOn)}
          className={`p-3 rounded-2xl transition ${micOn ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-red-600 text-white'}`}
        >
          {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </button>
        <button
          onClick={handleConnectLiveKit}
          disabled={connectingLiveKit || liveKitConnected}
          className={`p-3 rounded-2xl flex items-center space-x-2 text-xs font-semibold transition ${liveKitConnected ? 'bg-green-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
          title="Connect to LiveKit for camera and mic"
        >
          <Video className="h-5 w-5" />
          <span className="hidden sm:inline">{connectingLiveKit ? 'Connecting...' : liveKitConnected ? 'LiveKit Connected' : 'Connect LiveKit'}</span>
        </button>
        {state.currentUser?.role === 'teacher' && (
          <button
            onClick={() => {
              if (isRecording) {
                stopRecording();
              } else {
                startRecording();
              }
            }}
            className={`p-3 rounded-2xl flex items-center space-x-2 text-xs font-semibold transition ${isRecording ? 'bg-red-600 text-white' : 'bg-violet-600 hover:bg-violet-500 text-white'}`}
            title={isRecording ? 'Stop class recording' : 'Record this class'}
          >
            <Play className="h-5 w-5" />
            <span className="hidden sm:inline">{isRecording ? 'Stop Recording' : 'Record Class'}</span>
          </button>
        )}
        {/* Students can request permission to enable camera/screen; teachers receive approval prompts */}
        {state.currentUser?.role !== 'teacher' && (
          <>
            <button
              onClick={() => {
                requestCameraOn();
              }}
              className={`p-3 rounded-2xl transition ${waitingApproval ? 'bg-yellow-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
              title="Request camera permission from teacher"
            >
              <Camera className="h-5 w-5" />
              <span className="hidden sm:inline">Request Camera</span>
            </button>
            <button
              onClick={() => {
                if (!classroom) return;
                socketRef.current.emit('requestMedia', { roomId: classroom.id, type: 'screen' });
                setWaitingApproval(true);
              }}
              className={`p-3 rounded-2xl transition ${waitingApproval ? 'bg-yellow-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
              title="Request screen share permission from teacher"
            >
              <Monitor className="h-5 w-5" />
              <span className="hidden sm:inline">Request Screen</span>
            </button>
          </>
        )}
        <button
          onClick={() => {
            if (screenShare) {
              setScreenShare(false);
              setCamOn(true);
            } else {
              setCamOn(prev => !prev);
            }
          }}
          className={`p-3 rounded-2xl transition ${camOn ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-red-600 text-white'}`}
          title="Toggle teacher camera"
        >
          {camOn ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
          <span className="hidden sm:inline">{camOn ? 'Live Camera' : 'Camera Off'}</span>
        </button>
        <button
          onClick={() => {
            if (screenShare) {
              setScreenShare(false);
              setCamOn(true);
            } else {
              setScreenShare(true);
              setCamOn(false);
            }
          }}
          className={`p-3 rounded-2xl flex items-center space-x-2 text-xs font-semibold transition ${screenShare ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
          title="Start or stop screen sharing"
        >
          <Monitor className="h-5 w-5" />
          <span className="hidden sm:inline">{screenShare ? 'Sharing' : 'Share Screen'}</span>
        </button>
        <button
          onClick={() => setHandRaised(!handRaised)}
          className={`p-3 rounded-2xl flex items-center space-x-2 text-xs font-semibold transition ${handRaised ? 'bg-yellow-600 text-white animate-bounce' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
        >
          <Hand className="h-5 w-5" />
          <span className="hidden sm:inline">{handRaised ? 'Hand Raised' : 'Raise Hand'}</span>
        </button>
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl flex items-center space-x-2 text-xs font-semibold transition"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="hidden sm:inline">Chat</span>
        </button>
      </div>

      {whiteboardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-6xl h-[85vh] bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Whiteboard</span>
                {['pen', 'shape', 'text', 'ruler', 'eraser'].map(tool => (
                  <button
                    key={tool}
                    onClick={() => setWhiteboardTool(tool)}
                    className={`px-3 py-1 rounded-xl text-xs ${whiteboardTool === tool ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                  >
                    {tool.charAt(0).toUpperCase() + tool.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={clearWhiteboard} className="px-3 py-1 rounded-xl bg-red-600 text-white text-xs">Clear</button>
                <button onClick={() => setWhiteboardOpen(false)} className="px-3 py-1 rounded-xl bg-slate-800 text-slate-200 text-xs">Close</button>
              </div>
            </div>
            <div className="flex h-full">
              <div className="w-72 bg-slate-950 border-r border-slate-800 p-4 overflow-y-auto">
                <div className="mb-4">
                  <label className="block text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">Color</label>
                  <input
                    type="color"
                    value={whiteboardColor}
                    onChange={(e) => setWhiteboardColor(e.target.value)}
                    className="w-full h-10 rounded-2xl border border-slate-800 bg-slate-900"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">Thickness</label>
                  <input
                    type="range"
                    min="1"
                    max="24"
                    value={whiteboardSize}
                    onChange={(e) => setWhiteboardSize(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-slate-400 mt-2">{whiteboardSize}px</div>
                </div>
                {whiteboardTool === 'shape' && (
                  <div className="mb-4">
                    <label className="block text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">Shape</label>
                    <select
                      value={whiteboardShape}
                      onChange={(e) => setWhiteboardShape(e.target.value)}
                      className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                    >
                      <option value="rectangle">Rectangle</option>
                      <option value="circle">Circle</option>
                      <option value="arrow">Arrow</option>
                    </select>
                  </div>
                )}
                <div className="text-[11px] text-slate-300 space-y-2">
                  <div>• Pen: freehand drawing.</div>
                  <div>• Shape: draw rectangle, circle, or arrow.</div>
                  <div>• Text: click to place text.</div>
                  <div>• Ruler: draw a straight measurement line.</div>
                  <div>• Eraser: remove strokes.</div>
                </div>
              </div>
              <div className="relative flex-1 bg-slate-950">
                <canvas
                  ref={canvasRef}
                  className="w-full h-full bg-slate-950 touch-none"
                  onPointerDown={handleWhiteboardDown}
                  onPointerMove={handleWhiteboardMove}
                  onPointerUp={handleWhiteboardUp}
                  onPointerLeave={handleWhiteboardUp}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
