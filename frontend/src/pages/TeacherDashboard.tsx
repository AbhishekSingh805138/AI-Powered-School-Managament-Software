import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import axios from 'axios';
import { BookOpen, Users, ClipboardCheck, LogOut, Calendar } from 'lucide-react';
import AIChat from '../components/AIChat';
import NotificationBell from '../components/NotificationBell';
import { Student, Assignment } from '@/types';

const TeacherDashboard: React.FC = () => {
  const { user, logout, API } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const fetchTeacherData = async (): Promise<void> => {
    try {
      const [studentsRes, assignmentsRes] = await Promise.all([
        axios.get<Student[]>(`${API}/students`),
        axios.get<Assignment[]>(`${API}/assignments`)
      ]);
      setStudents(studentsRes.data);
      setAssignments(assignmentsRes.data);
    } catch (error) {
      console.error('Failed to fetch teacher data:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-[#0F2F24]">Teacher Dashboard</h1>
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
          <h2 className="text-3xl font-semibold text-[#0F2F24] mb-2">Your Classroom</h2>
          <p className="text-[#52525B]">Manage students, assignments, and attendance</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-[#0F2F24]/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-[#52525B] text-sm">Total Students</p>
                <p className="text-2xl font-semibold text-[#0F2F24] font-mono">{students.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-[#0F2F24]/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-[#52525B] text-sm">Assignments</p>
                <p className="text-2xl font-semibold text-[#0F2F24] font-mono">{assignments.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-[#0F2F24]/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-50 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-[#52525B] text-sm">Classes Today</p>
                <p className="text-2xl font-semibold text-[#0F2F24] font-mono">4</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white border border-[#0F2F24]/10 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-[#0F2F24] mb-6">Recent Assignments</h3>
            <div className="space-y-3">
              {assignments.slice(0, 5).map((assignment) => (
                <div
                  key={assignment.id}
                  data-testid={`assignment-item-${assignment.id}`}
                  className="p-4 bg-[#F5F5F0] rounded-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-[#0F2F24]">{assignment.title}</h4>
                    <span className="text-xs px-2 py-1 bg-white rounded-full text-[#52525B]">
                      {assignment.subject}
                    </span>
                  </div>
                  <p className="text-sm text-[#52525B] mb-2">{assignment.description}</p>
                  <div className="flex justify-between text-xs text-[#A1A1AA]">
                    <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                    <span className="font-mono">Max: {assignment.max_score} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#0F2F24]/10 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-[#0F2F24] mb-6">Student List</h3>
            <div className="space-y-3">
              {students.slice(0, 8).map((student) => (
                <div
                  key={student.id}
                  data-testid={`student-item-${student.id}`}
                  className="flex justify-between items-center p-3 bg-[#F5F5F0] rounded-lg"
                >
                  <div>
                    <p className="font-medium text-[#0F2F24]">
                      {student.first_name} {student.last_name}
                    </p>
                    <p className="text-sm text-[#52525B]">Grade {student.grade}</p>
                  </div>
                  <button
                    className="text-sm text-[#0F2F24] hover:underline"
                  >
                    View
                  </button>
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

export default TeacherDashboard;