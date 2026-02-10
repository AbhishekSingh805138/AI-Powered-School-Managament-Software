import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import axios from 'axios';
import { Users, BookOpen, Calendar, DollarSign, LogOut, TrendingUp, UserPlus } from 'lucide-react';
import AIChat from '../components/AIChat';

const SchoolAdminDashboard = () => {
  const { user, logout, API } = useAuth();
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, studentsRes, teachersRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/students`),
        axios.get(`${API}/teachers`)
      ]);
      setStats(statsRes.data);
      setStudents(studentsRes.data);
      setTeachers(teachersRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-[#0F2F24]">School Admin Dashboard</h1>
            <p className="text-sm text-[#52525B]">{user?.full_name}</p>
          </div>
          <button
            data-testid="logout-button"
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-[#52525B] hover:text-[#0F2F24] transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold text-[#0F2F24] mb-2">Overview</h2>
          <p className="text-[#52525B]">Your school at a glance</p>
        </div>

        {stats && (
          <div className="bento-grid mb-8">
            <StatCard
              icon={<Users className="w-8 h-8" />}
              title="Total Students"
              value={stats.total_students}
              color="bg-blue-50 text-blue-600"
            />
            <StatCard
              icon={<BookOpen className="w-8 h-8" />}
              title="Total Teachers"
              value={stats.total_teachers}
              color="bg-green-50 text-green-600"
            />
            <StatCard
              icon={<Calendar className="w-8 h-8" />}
              title="Present Today"
              value={stats.present_today}
              color="bg-purple-50 text-purple-600"
            />
            <StatCard
              icon={<TrendingUp className="w-8 h-8" />}
              title="Active Assignments"
              value={stats.total_assignments}
              color="bg-orange-50 text-orange-600"
            />
            <StatCard
              icon={<DollarSign className="w-8 h-8" />}
              title="Pending Fees"
              value={stats.pending_fees}
              color="bg-red-50 text-red-600"
            />
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white border border-[#0F2F24]/10 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-[#0F2F24]">Recent Students</h3>
              <UserPlus className="w-5 h-5 text-[#52525B]" />
            </div>
            <div className="space-y-3">
              {students.slice(0, 5).map((student) => (
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
                  <span className="text-xs font-mono text-[#A1A1AA]">{student.email}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#0F2F24]/10 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-[#0F2F24]">Teaching Staff</h3>
              <BookOpen className="w-5 h-5 text-[#52525B]" />
            </div>
            <div className="space-y-3">
              {teachers.slice(0, 5).map((teacher) => (
                <div
                  key={teacher.id}
                  data-testid={`teacher-item-${teacher.id}`}
                  className="flex justify-between items-center p-3 bg-[#F5F5F0] rounded-lg"
                >
                  <div>
                    <p className="font-medium text-[#0F2F24]">
                      {teacher.first_name} {teacher.last_name}
                    </p>
                    <p className="text-sm text-[#52525B]">{teacher.subjects.join(', ')}</p>
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

const StatCard = ({ icon, title, value, color }) => {
  return (
    <div className="bg-white border border-[#0F2F24]/10 rounded-xl p-6 hover:-translate-y-1 transition-all duration-300">
      <div className={`inline-flex p-3 rounded-lg ${color} mb-4`}>
        {icon}
      </div>
      <h3 className="text-[#52525B] text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-semibold text-[#0F2F24] font-mono">{value}</p>
    </div>
  );
};

export default SchoolAdminDashboard;