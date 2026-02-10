import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import axios from 'axios';
import { Users, BookOpen, Calendar, DollarSign, LogOut, TrendingUp, UserPlus, Upload, FileDown, FileSpreadsheet } from 'lucide-react';
import AIChat from '../components/AIChat';
import NotificationBell from '../components/NotificationBell';
import { DashboardStats, Student, Teacher } from '@/types';

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, color }) => {
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

const SchoolAdminDashboard: React.FC = () => {
  const { user, logout, API } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importType, setImportType] = useState<'students' | 'teachers'>('students');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState<boolean>(false);
  const [importMessage, setImportMessage] = useState<string>('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async (): Promise<void> => {
    try {
      const [statsRes, studentsRes, teachersRes] = await Promise.all([
        axios.get<DashboardStats>(`${API}/dashboard/stats`),
        axios.get<Student[]>(`${API}/students`),
        axios.get<Teacher[]>(`${API}/teachers`)
      ]);
      setStats(statsRes.data);
      setStudents(studentsRes.data);
      setTeachers(teachersRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const handleImport = async (): Promise<void> => {
    if (!importFile) return;
    
    setImporting(true);
    setImportMessage('');
    
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      
      const endpoint = importType === 'students' ? '/students/bulk-import' : '/teachers/bulk-import';
      const response = await axios.post(`${API}${endpoint}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setImportMessage(response.data.message);
      setImportFile(null);
      fetchDashboardData();
      setTimeout(() => setShowImportModal(false), 2000);
    } catch (error: any) {
      setImportMessage(error.response?.data?.detail || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const downloadReport = async (reportType: 'attendance' | 'grades' | 'students'): Promise<void> => {
    try {
      const endpoints = {
        attendance: '/reports/attendance',
        grades: '/reports/grades',
        students: '/reports/students'
      };
      
      const response = await axios.get(`${API}${endpoints[reportType]}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_report.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download report:', error);
    }
  };

  const downloadSampleCSV = (type: 'students' | 'teachers'): void => {
    let csvContent = '';
    if (type === 'students') {
      csvContent = 'first_name,last_name,email,grade,date_of_birth,parent_email\\nJohn,Doe,john@example.com,5,2015-01-15,parent@example.com\\n';
    } else {
      csvContent = 'first_name,last_name,email,qualification,subjects\\nJane,Smith,jane@example.com,MSc Physics,Physics;Chemistry\\n';
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${type}_sample.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-[#0F2F24]">School Admin Dashboard</h1>
            <p className="text-sm text-[#52525B]">{user?.full_name}</p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <button
              data-testid="import-button"
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#0F2F24] text-white rounded-full font-medium hover:-translate-y-0.5 transition-all duration-300"
            >
              <Upload className="w-4 h-4" />
              Import
            </button>
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

        <div className="mb-8 bg-white border border-[#0F2F24]/10 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-[#0F2F24]">Download Reports</h3>
            <FileDown className="w-5 h-5 text-[#52525B]" />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <button
              data-testid="download-attendance-report"
              onClick={() => downloadReport('attendance')}
              className="flex items-center justify-center gap-2 p-4 bg-[#F5F5F0] border border-[#0F2F24]/10 rounded-lg hover:-translate-y-1 transition-all duration-300"
            >
              <FileSpreadsheet className="w-5 h-5 text-[#0F2F24]" />
              <span className="font-medium text-[#0F2F24]">Attendance Report</span>
            </button>
            <button
              data-testid="download-grades-report"
              onClick={() => downloadReport('grades')}
              className="flex items-center justify-center gap-2 p-4 bg-[#F5F5F0] border border-[#0F2F24]/10 rounded-lg hover:-translate-y-1 transition-all duration-300"
            >
              <FileSpreadsheet className="w-5 h-5 text-[#0F2F24]" />
              <span className="font-medium text-[#0F2F24]">Grades Report</span>
            </button>
            <button
              data-testid="download-students-report"
              onClick={() => downloadReport('students')}
              className="flex items-center justify-center gap-2 p-4 bg-[#F5F5F0] border border-[#0F2F24]/10 rounded-lg hover:-translate-y-1 transition-all duration-300"
            >
              <FileSpreadsheet className="w-5 h-5 text-[#0F2F24]" />
              <span className="font-medium text-[#0F2F24]">Students Report</span>
            </button>
          </div>
        </div>

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

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-semibold text-[#0F2F24] mb-6">Bulk Import</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#0F2F24] mb-2">Import Type</label>
              <select
                data-testid="import-type-select"
                value={importType}
                onChange={(e) => setImportType(e.target.value)}
                className="w-full px-4 py-3 border border-[#0F2F24]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2F24] bg-[#F5F5F0]"
              >
                <option value="students">Students</option>
                <option value="teachers">Teachers</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-[#0F2F24] mb-2">Upload CSV File</label>
              <input
                data-testid="import-file-input"
                type="file"
                accept=".csv"
                onChange={(e) => setImportFile(e.target.files[0])}
                className="w-full px-4 py-3 border border-[#0F2F24]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2F24] bg-[#F5F5F0]"
              />
            </div>

            <button
              onClick={() => downloadSampleCSV(importType)}
              className="w-full mb-4 px-4 py-2 text-sm text-[#0F2F24] border border-[#0F2F24]/20 rounded-lg hover:bg-[#F5F5F0] transition-colors"
            >
              Download Sample CSV
            </button>

            {importMessage && (
              <div className={`mb-4 p-3 rounded-lg ${importMessage.includes('Successfully') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {importMessage}
              </div>
            )}

            <div className="flex gap-3">
              <button
                data-testid="cancel-import-button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setImportMessage('');
                }}
                className="flex-1 px-6 py-3 border border-[#0F2F24]/20 text-[#0F2F24] rounded-full font-medium hover:-translate-y-0.5 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                data-testid="submit-import-button"
                onClick={handleImport}
                disabled={!importFile || importing}
                className="flex-1 px-6 py-3 bg-[#0F2F24] text-white rounded-full font-medium hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AIChat />
    </div>
  );
};

export default SchoolAdminDashboard;