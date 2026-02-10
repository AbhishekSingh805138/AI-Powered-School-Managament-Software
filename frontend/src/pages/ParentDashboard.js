import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import axios from 'axios';
import { Users, TrendingUp, Calendar, DollarSign, LogOut } from 'lucide-react';
import AIChat from '../components/AIChat';

const ParentDashboard = () => {
  const { user, logout, API } = useAuth();

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-[#0F2F24]">Parent Dashboard</h1>
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
          <h2 className="text-3xl font-semibold text-[#0F2F24] mb-2">My Children</h2>
          <p className="text-[#52525B]">Monitor your children's academic progress</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-[#0F2F24]/10 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-[#52525B] text-sm">Children</p>
                <p className="text-2xl font-semibold text-[#0F2F24] font-mono">2</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-[#0F2F24]/10 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-[#52525B] text-sm">Avg Performance</p>
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
                <p className="text-2xl font-semibold text-[#0F2F24] font-mono">96%</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-[#0F2F24]/10 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-[#52525B] text-sm">Pending Fees</p>
                <p className="text-2xl font-semibold text-[#0F2F24] font-mono">$0</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white border border-[#0F2F24]/10 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-[#0F2F24] mb-6">Child 1: Emma Johnson</h3>
            <div className="space-y-4">
              <div className="p-4 bg-[#F5F5F0] rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-[#0F2F24]">Grade</span>
                  <span className="text-[#52525B]">5th</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-[#0F2F24]">Average Score</span>
                  <span className="text-[#52525B] font-mono">92%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-[#0F2F24]">Attendance</span>
                  <span className="text-[#52525B] font-mono">98%</span>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-[#0F2F24] mb-3">Recent Grades</h4>
                <div className="space-y-2">
                  {['Mathematics: A', 'Science: A-', 'English: B+'].map((grade, idx) => (
                    <div key={idx} className="flex justify-between p-2 bg-[#F5F5F0] rounded">
                      <span className="text-sm text-[#52525B]">{grade}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#0F2F24]/10 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-[#0F2F24] mb-6">Child 2: Michael Johnson</h3>
            <div className="space-y-4">
              <div className="p-4 bg-[#F5F5F0] rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-[#0F2F24]">Grade</span>
                  <span className="text-[#52525B]">8th</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-[#0F2F24]">Average Score</span>
                  <span className="text-[#52525B] font-mono">88%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-[#0F2F24]">Attendance</span>
                  <span className="text-[#52525B] font-mono">94%</span>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-[#0F2F24] mb-3">Recent Grades</h4>
                <div className="space-y-2">
                  {['Physics: A', 'Chemistry: B+', 'History: A-'].map((grade, idx) => (
                    <div key={idx} className="flex justify-between p-2 bg-[#F5F5F0] rounded">
                      <span className="text-sm text-[#52525B]">{grade}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AIChat />
    </div>
  );
};

export default ParentDashboard;