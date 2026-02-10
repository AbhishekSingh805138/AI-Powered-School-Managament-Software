import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import axios from 'axios';
import { BookOpen, Calendar, TrendingUp, LogOut, FileText } from 'lucide-react';
import AIChat from '../components/AIChat';
import NotificationBell from '../components/NotificationBell';
import { Assignment } from '@/types';

const StudentDashboard: React.FC = () => {
  const { user, logout, API } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async (): Promise<void> => {
    try {
      const [assignmentsRes] = await Promise.all([
        axios.get<Assignment[]>(`${API}/assignments`)
      ]);
      setAssignments(assignmentsRes.data);
    } catch (error) {
      console.error('Failed to fetch student data:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-[#0F2F24]">Student Dashboard</h1>
            <p className="text-sm text-[#52525B]">{user?.full_name}</p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <button
              data-testid="logout-button"
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-[#52525B] hover:text-[#0F2F24] transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold text-[#0F2F24] mb-2">My Learning</h2>
          <p className="text-[#52525B]">Track your progress and assignments</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-[#0F2F24]/10 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-[#52525B] text-sm">Total Assignments</p>
                <p className="text-2xl font-semibold text-[#0F2F24] font-mono">{assignments.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-[#0F2F24]/10 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-[#52525B] text-sm">Average Grade</p>
                <p className="text-2xl font-semibold text-[#0F2F24] font-mono">A-</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-[#0F2F24]/10 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-50 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-[#52525B] text-sm">Attendance</p>
                <p className="text-2xl font-semibold text-[#0F2F24] font-mono">95%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#0F2F24]/10 rounded-xl p-6 mb-8">
          <h3 className="text-xl font-semibold text-[#0F2F24] mb-6">Upcoming Assignments</h3>
          <div className="space-y-4">
            {assignments.slice(0, 5).map((assignment) => (
              <div
                key={assignment.id}
                data-testid={`assignment-item-${assignment.id}`}
                className="p-4 bg-[#F5F5F0] rounded-lg border-l-4 border-[#0F2F24]"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-[#0F2F24] text-lg">{assignment.title}</h4>
                    <p className="text-sm text-[#52525B] mt-1">{assignment.description}</p>
                  </div>
                  <span className="px-3 py-1 bg-white rounded-full text-sm font-medium text-[#0F2F24]">
                    {assignment.subject}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-sm text-[#52525B]">
                    Due: {new Date(assignment.due_date).toLocaleDateString()}
                  </span>
                  <span className="text-sm font-mono text-[#A1A1AA]">Max: {assignment.max_score} points</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white border border-[#0F2F24]/10 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-[#0F2F24] mb-6">Today's Schedule</h3>
            <div className="space-y-3">
              {['Mathematics', 'Physics', 'English Literature', 'Chemistry'].map((subject, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-[#F5F5F0] rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#0F2F24] rounded-full"></div>
                    <span className="font-medium text-[#0F2F24]">{subject}</span>
                  </div>
                  <span className="text-sm text-[#52525B] font-mono">{9 + idx}:00 AM</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#0F2F24]/10 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-[#0F2F24] mb-6">Recent Grades</h3>
            <div className="space-y-3">
              {[
                { subject: 'Mathematics', grade: 'A', score: 95 },
                { subject: 'Physics', grade: 'A-', score: 88 },
                { subject: 'English', grade: 'B+', score: 85 },
                { subject: 'Chemistry', grade: 'A', score: 92 }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-[#F5F5F0] rounded-lg">
                  <span className="font-medium text-[#0F2F24]">{item.subject}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-[#52525B]">{item.score}/100</span>
                    <span className="px-3 py-1 bg-[#0F2F24] text-white rounded-full text-sm font-semibold">
                      {item.grade}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AIChat />
    </div>
  );
};

export default StudentDashboard;