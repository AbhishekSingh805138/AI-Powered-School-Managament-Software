import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import axios from 'axios';
import { Building2, Users, GraduationCap, LogOut, Plus, X } from 'lucide-react';
import AIChat from '../components/AIChat';
import { School } from '@/types';

const SuperAdminDashboard: React.FC = () => {
  const { user, logout, API } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [showAddSchool, setShowAddSchool] = useState<boolean>(false);
  const [newSchool, setNewSchool] = useState({
    name: '',
    address: '',
    contact_email: '',
    contact_phone: ''
  });

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async (): Promise<void> => {
    try {
      const response = await axios.get<School[]>(`${API}/schools`);
      setSchools(response.data);
    } catch (error) {
      console.error('Failed to fetch schools:', error);
    }
  };

  const handleAddSchool = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    try {
      await axios.post(`${API}/schools`, newSchool);
      setShowAddSchool(false);
      setNewSchool({ name: '', address: '', contact_email: '', contact_phone: '' });
      fetchSchools();
    } catch (error) {
      console.error('Failed to add school:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-[#0F2F24]" />
            <div>
              <h1 className="text-2xl font-semibold text-[#0F2F24]">Super Admin</h1>
              <p className="text-sm text-[#52525B]">{user?.full_name}</p>
            </div>
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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-semibold text-[#0F2F24] mb-2">School Management</h2>
            <p className="text-[#52525B]">Manage all schools in the system</p>
          </div>
          <button
            data-testid="add-school-button"
            onClick={() => setShowAddSchool(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[#0F2F24] text-white rounded-full font-medium hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
            Add School
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schools.map((school) => (
            <div
              key={school.id}
              data-testid={`school-card-${school.id}`}
              className="bg-white border border-[#0F2F24]/10 rounded-xl p-6 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="p-3 bg-[#F5F5F0] rounded-lg">
                  <Building2 className="w-6 h-6 text-[#0F2F24]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-[#0F2F24]">{school.name}</h3>
                  <p className="text-sm text-[#52525B] font-mono">{school.tenant_id}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-[#52525B]">
                <p>{school.address}</p>
                <p>{school.contact_email}</p>
                <p>{school.contact_phone}</p>
              </div>
            </div>
          ))}
        </div>

        {schools.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-[#A1A1AA] mx-auto mb-4" />
            <p className="text-[#52525B] text-lg">No schools yet. Add your first school to get started.</p>
          </div>
        )}
      </div>

      {showAddSchool && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-[#0F2F24]">Add New School</h3>
              <button
                data-testid="close-modal-button"
                onClick={() => setShowAddSchool(false)}
                className="p-2 hover:bg-[#F5F5F0] rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSchool} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0F2F24] mb-2">School Name</label>
                <input
                  data-testid="school-name-input"
                  type="text"
                  value={newSchool.name}
                  onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-[#0F2F24]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2F24] bg-[#F5F5F0]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F2F24] mb-2">Address</label>
                <input
                  data-testid="school-address-input"
                  type="text"
                  value={newSchool.address}
                  onChange={(e) => setNewSchool({ ...newSchool, address: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-[#0F2F24]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2F24] bg-[#F5F5F0]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F2F24] mb-2">Contact Email</label>
                <input
                  data-testid="school-email-input"
                  type="email"
                  value={newSchool.contact_email}
                  onChange={(e) => setNewSchool({ ...newSchool, contact_email: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-[#0F2F24]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2F24] bg-[#F5F5F0]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F2F24] mb-2">Contact Phone</label>
                <input
                  data-testid="school-phone-input"
                  type="tel"
                  value={newSchool.contact_phone}
                  onChange={(e) => setNewSchool({ ...newSchool, contact_phone: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-[#0F2F24]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2F24] bg-[#F5F5F0]"
                />
              </div>
              <button
                data-testid="submit-school-button"
                type="submit"
                className="w-full px-6 py-3 bg-[#0F2F24] text-white rounded-full font-medium hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
              >
                Add School
              </button>
            </form>
          </div>
        </div>
      )}

      <AIChat />
    </div>
  );
};

export default SuperAdminDashboard;