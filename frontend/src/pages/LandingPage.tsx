import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { GraduationCap, Users, BookOpen, TrendingUp, Sparkles } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <div className="p-6 bg-[#F5F5F0] border border-[#0F2F24]/10 rounded-xl hover:-translate-y-1 transition-all duration-300">
      <div className="text-[#0F2F24] mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-[#0F2F24] mb-2">{title}</h3>
      <p className="text-[#52525B]">{description}</p>
    </div>
  );
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  React.useEffect(() => {
    if (user) {
      const roleRoutes: Record<string, string> = {
        super_admin: '/super-admin',
        school_admin: '/school-admin',
        teacher: '/teacher',
        student: '/student',
        parent: '/parent'
      };
      navigate(roleRoutes[user.role] || '/');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-[#0F2F24]" />
            <h1 className="text-2xl font-semibold text-[#0F2F24]">EduPro</h1>
          </div>
          <button
            data-testid="login-button"
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-[#0F2F24] text-white rounded-full font-medium hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 active:scale-95"
          >
            Sign In
          </button>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#0F2F24]/10 rounded-full text-sm text-[#52525B]">
                <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                AI-Powered School Management
              </div>
              <h1 className="text-5xl lg:text-6xl font-semibold text-[#0F2F24] leading-tight">
                Transform Your
                <br />
                <span className="text-[#52525B]">Educational Institution</span>
              </h1>
              <p className="text-lg text-[#52525B] leading-relaxed">
                A comprehensive multi-tenant SaaS platform designed for modern schools.
                Manage students, teachers, attendance, grades, and more with intelligent AI assistance.
              </p>
              <div className="flex gap-4">
                <button
                  data-testid="get-started-button"
                  onClick={() => navigate('/login')}
                  className="px-8 py-3 bg-[#0F2F24] text-white rounded-full font-medium hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 active:scale-95"
                >
                  Get Started
                </button>
                <button className="px-8 py-3 bg-white border border-[#0F2F24]/20 text-[#0F2F24] rounded-full font-medium hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 active:scale-95">
                  Learn More
                </button>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1721702754494-fdd7189f946c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBkaXZlcnNlJTIwc3R1ZGVudHMlMjBzdHVkeWluZyUyMHVuaXZlcnNpdHklMjBsaWJyYXJ5fGVufDB8fHx8MTc3MDczODM4NXww&ixlib=rb-4.1.0&q=85"
                alt="Students studying"
                className="rounded-2xl shadow-2xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-semibold text-[#0F2F24] mb-4">Everything You Need</h2>
            <p className="text-lg text-[#52525B]">Powerful features for complete school management</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Users className="w-8 h-8" />}
              title="Student Management"
              description="Comprehensive student profiles, enrollment, and tracking system"
            />
            <FeatureCard
              icon={<BookOpen className="w-8 h-8" />}
              title="Gradebook & Assignments"
              description="Digital gradebook with assignment tracking and performance analytics"
            />
            <FeatureCard
              icon={<TrendingUp className="w-8 h-8" />}
              title="Attendance Tracking"
              description="Real-time attendance monitoring with automated reports"
            />
            <FeatureCard
              icon={<Sparkles className="w-8 h-8 text-[#7C3AED]" />}
              title="AI Assistant"
              description="Intelligent chatbot for instant answers and insights"
            />
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl font-semibold text-[#0F2F24] mb-6">Ready to Get Started?</h2>
          <p className="text-lg text-[#52525B] mb-8">
            Join hundreds of schools already using EduPro to streamline their operations
          </p>
          <button
            data-testid="cta-button"
            onClick={() => navigate('/login')}
            className="px-10 py-4 bg-[#0F2F24] text-white rounded-full font-medium text-lg hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 active:scale-95"
          >
            Start Your Journey
          </button>
        </div>
      </section>

      <footer className="bg-[#0F2F24] text-white py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <GraduationCap className="w-6 h-6" />
            <span className="text-xl font-semibold">EduPro</span>
          </div>
          <p className="text-[#F5F5F0]/70">© 2026 EduPro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;