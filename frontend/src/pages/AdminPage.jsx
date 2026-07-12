import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { esgService } from '../services/esgService';
import { Card, Table, Badge, StatusBadge } from '../components/ui/DataDisplay';
import { Button, Input, Select } from '../components/ui/FormControls';
import { Modal, Loader } from '../components/ui/Overlays';
import { Users, Plus, ShieldCheck, Building, Key, ToggleLeft } from 'lucide-react';

const mockUsers = [
  { label: 'Sarah Jenkins (Department Head)', value: 'u3' },
  { label: 'Alice Vance (ESG Manager)', value: 'u2' },
  { label: 'Super Admin (Admin)', value: 'u1' },
];

const AdminPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users'); // users | departments | settings
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ users: [], departments: [], settings: {} });

  // Modals state
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [deptModalOpen, setDeptModalOpen] = useState(false);

  // Form states
  const [newUser, setNewUser] = useState({ email: '', password: '', first_name: '', last_name: '', role: 'employee', department_id: '' });
  const [newDept, setNewDept] = useState({ name: '', code: '', head_id: '', parent_department_id: '' });
  const [settingsForm, setSettingsForm] = useState({ env_weight: '40', social_weight: '30', governance_weight: '30', auto_emission: true, evidence_required: true });

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // To run admin CRUD endpoints on the backend if available
      // Note: we can query users/depts/configs
      if (activeTab === 'users') {
        const response = await fetch('http://localhost:8000/api/v1/users', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('ecosync_token')}` }
        });
        if (response.ok) {
          const res = await response.json();
          setData(prev => ({ ...prev, users: res.items || [] }));
        } else {
          throw new Error("API error");
        }
      } else if (activeTab === 'departments') {
        const res = await esgService.getDepartments();
        setData(prev => ({ ...prev, departments: res || [] }));
      } else {
        // Fetch configs
        const response = await fetch('http://localhost:8000/api/v1/settings', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('ecosync_token')}` }
        });
        if (response.ok) {
          const res = await response.json();
          setData(prev => ({ ...prev, settings: res || {} }));
          setSettingsForm(res);
        } else {
          throw new Error("API error");
        }
      }
    } catch (err) {
      console.warn("API fail, using mocks for admin page tab: " + activeTab);
      loadMocks();
    } finally {
      setLoading(false);
    }
  };

  const loadMocks = () => {
    if (activeTab === 'users') {
      setData((prev) => ({
        ...prev,
        users: [
          { id: 'u1', email: 'admin@ecosync.com', first_name: 'Super', last_name: 'Admin', role: 'admin', is_active: true, department: { name: 'IT Infrastructure' } },
          { id: 'u2', email: 'manager@ecosync.com', first_name: 'Alice', last_name: 'Vance', role: 'esg_manager', is_active: true, department: { name: 'ESG Compliance Board' } },
          { id: 'u3', email: 'head@ecosync.com', first_name: 'Sarah', last_name: 'Jenkins', role: 'department_head', is_active: true, department: { name: 'Manufacturing' } },
          { id: 'u4', email: 'employee@ecosync.com', first_name: 'John', last_name: 'Doe', role: 'employee', is_active: true, department: { name: 'Manufacturing' } },
          { id: 'u5', email: 'auditor@ecosync.com', first_name: 'David', last_name: 'Miller', role: 'auditor', is_active: true, department: { name: 'Risk Management' } }
        ]
      }));
    } else if (activeTab === 'departments') {
      setData((prev) => ({
        ...prev,
        departments: [
          { id: 'd1', name: 'Manufacturing', code: 'MFG', head: { first_name: 'Sarah', last_name: 'Jenkins' }, parent: null, employee_count: 14, status: 'active' },
          { id: 'd2', name: 'Logistics & Supply', code: 'LOG', head: { first_name: 'John', last_name: 'Davis' }, parent: null, employee_count: 8, status: 'active' },
          { id: 'd3', name: 'Product Engineering', code: 'ENG', head: { first_name: 'Alex', last_name: 'Wong' }, parent: { name: 'Manufacturing' }, employee_count: 6, status: 'active' }
        ]
      }));
    } else {
      setData((prev) => ({
        ...prev,
        settings: { env_weight: '40', social_weight: '30', governance_weight: '30', auto_emission: true, evidence_required: true }
      }));
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/v1/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('ecosync_token')}`
        },
        body: JSON.stringify(newUser)
      });
      if (!response.ok) throw new Error("API post fail");
      setUserModalOpen(false);
      fetchAdminData();
    } catch (err) {
      alert("Demo Mode: User account created successfully.");
      const selectedDept = data.departments.find(d => d.id === newUser.department_id) || { name: 'Manufacturing' };
      setData(prev => ({
        ...prev,
        users: [
          ...prev.users,
          { id: Date.now().toString(), email: newUser.email, first_name: newUser.first_name, last_name: newUser.last_name, role: newUser.role, is_active: true, department: { name: selectedDept.name } }
        ]
      }));
      setUserModalOpen(false);
    }
  };

  const handleCreateDept = async (e) => {
    e.preventDefault();
    try {
      await esgService.createDepartment(newDept);
      setDeptModalOpen(false);
      fetchAdminData();
    } catch (err) {
      alert("Demo Mode: Department division created.");
      const parentName = data.departments.find(d => d.id === newDept.parent_department_id) || null;
      setData(prev => ({
        ...prev,
        departments: [
          ...prev.departments,
          { id: Date.now().toString(), name: newDept.name, code: newDept.code, head: { first_name: 'Sarah', last_name: 'Jenkins' }, parent: parentName ? { name: parentName.name } : null, employee_count: 0, status: 'active' }
        ]
      }));
      setDeptModalOpen(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    const env = parseInt(settingsForm.env_weight);
    const soc = parseInt(settingsForm.social_weight);
    const gov = parseInt(settingsForm.governance_weight);

    if (env + soc + gov !== 100) {
      alert("Business Rule Violation: ESG configuration weights must exactly sum to 100%!");
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/v1/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('ecosync_token')}`
        },
        body: JSON.stringify(settingsForm)
      });
      if (!response.ok) throw new Error("API edit fail");
      alert("ESG Settings saved successfully!");
    } catch (err) {
      alert("Demo Mode: Weights updated and configuration flags saved!");
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">EcoSync Administration</h1>
          <p className="text-sm text-gray-500 mt-1">Manage corporate personnel accounts, department structures, and ESG configurations.</p>
        </div>
        {activeTab === 'users' && (
          <Button size="sm" onClick={() => setUserModalOpen(true)} className="gap-2 font-bold">
            <Plus className="w-4 h-4" /> Add User Account
          </Button>
        )}
        {activeTab === 'departments' && (
          <Button size="sm" onClick={() => setDeptModalOpen(true)} className="gap-2 font-bold">
            <Plus className="w-4 h-4" /> Add Department
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-850 gap-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2
            ${activeTab === 'users'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-400 hover:text-gray-650'
            }`}
        >
          User Accounts
        </button>
        <button
          onClick={() => setActiveTab('departments')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2
            ${activeTab === 'departments'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-400 hover:text-gray-650'
            }`}
        >
          Departments Structure
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2
            ${activeTab === 'settings'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-400 hover:text-gray-650'
            }`}
        >
          ESG Settings
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <Loader />
      ) : (
        <div className="space-y-4">
          {activeTab === 'users' && (
            <Table
              columns={[
                { header: 'Full Name', key: 'name', render: (row) => <span className="font-semibold text-xs text-gray-850 dark:text-gray-250">{row.first_name} {row.last_name}</span> },
                { header: 'Email Address', key: 'email', render: (row) => <span className="text-xs">{row.email}</span> },
                { header: 'Assigned Role', key: 'role', render: (row) => <Badge color={row.role === 'admin' ? 'indigo' : row.role === 'esg_manager' ? 'green' : 'gray'}>{row.role.replace('_', ' ')}</Badge> },
                { header: 'Department', key: 'department', render: (row) => <span className="text-xs text-gray-500 font-medium">{row.department?.name || '-'}</span> },
                { header: 'Account Status', key: 'is_active', render: (row) => <StatusBadge status={row.is_active ? 'active' : 'inactive'} /> }
              ]}
              data={data.users}
              emptyMessage="No corporate accounts registered"
            />
          )}

          {activeTab === 'departments' && (
            <Table
              columns={[
                { header: 'Department Name', key: 'name', render: (row) => <span className="font-semibold text-xs text-gray-850 dark:text-gray-250">{row.name}</span> },
                { header: 'Code', key: 'code', render: (row) => <code className="text-xs">{row.code}</code> },
                { header: 'Department Head', key: 'head', render: (row) => <span className="text-xs text-gray-500">{row.head ? `${row.head.first_name} ${row.head.last_name}` : 'Not Appointed'}</span> },
                { header: 'Parent Department', key: 'parent', render: (row) => <span className="text-xs text-gray-400">{row.parent?.name || 'Top Division'}</span> },
                { header: 'Employee Count', key: 'employees', render: (row) => <span className="text-xs font-bold text-indigo-650 dark:text-indigo-400">{row.employee_count} employees</span> },
                { header: 'Status', key: 'status', render: (row) => <StatusBadge status={row.status} /> }
              ]}
              data={data.departments}
              emptyMessage="No departments registered"
            />
          )}

          {activeTab === 'settings' && (
            <div className="max-w-xl">
              <Card>
                <form onSubmit={handleSaveSettings} className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3.5 flex items-center gap-1.5"><ShieldCheck className="w-4.5 h-4.5 text-indigo-500" /> Score Weight Coefficients</h3>
                    <p className="text-xs text-gray-400 mb-4">Select weight distributions used in generating composite scoring records. Weights must sum to 100%.</p>
                    
                    <div className="grid grid-cols-3 gap-3.5">
                      <Input
                        label="Environmental %"
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={settingsForm.env_weight}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, env_weight: e.target.value }))}
                      />
                      <Input
                        label="Social %"
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={settingsForm.social_weight}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, social_weight: e.target.value }))}
                      />
                      <Input
                        label="Governance %"
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={settingsForm.governance_weight}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, governance_weight: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t dark:border-gray-850">
                    <h3 className="text-sm font-bold text-gray-850 dark:text-gray-250 mb-3 flex items-center gap-1.5"><ToggleLeft className="w-4.5 h-4.5 text-indigo-500" /> Config Options</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">Carbon Auto-Calculation</label>
                          <span className="text-[10px] text-gray-400">Compute footprint from ERP quantities instantly</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={settingsForm.auto_emission}
                          onChange={(e) => setSettingsForm(prev => ({ ...prev, auto_emission: e.target.checked }))}
                          className="rounded text-indigo-650 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">Require Evidence uploads</label>
                          <span className="text-[10px] text-gray-400">Enforce upload evidence check before CSR approval</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={settingsForm.evidence_required}
                          onChange={(e) => setSettingsForm(prev => ({ ...prev, evidence_required: e.target.checked }))}
                          className="rounded text-indigo-650 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t dark:border-gray-850">
                    <Button type="submit" variant="primary" size="sm" className="px-6 font-bold">Save Settings</Button>
                  </div>
                </form>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Add User Account Modal */}
      <Modal isOpen={userModalOpen} onClose={() => setUserModalOpen(false)} title="Add Personnel Account">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              placeholder="e.g. Sarah"
              required
              value={newUser.first_name}
              onChange={(e) => setNewUser(prev => ({ ...prev, first_name: e.target.value }))}
            />
            <Input
              label="Last Name"
              placeholder="e.g. Jenkins"
              required
              value={newUser.last_name}
              onChange={(e) => setNewUser(prev => ({ ...prev, last_name: e.target.value }))}
            />
          </div>
          <Input
            label="Email Address"
            type="email"
            placeholder="name@ecosync.com"
            required
            value={newUser.email}
            onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
          />
          <Input
            label="Account Password"
            type="password"
            placeholder="••••••••"
            required
            value={newUser.password}
            onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="System Role"
              options={[
                { label: 'Admin', value: 'admin' },
                { label: 'ESG Manager', value: 'esg_manager' },
                { label: 'Department Head', value: 'department_head' },
                { label: 'Employee', value: 'employee' },
                { label: 'Auditor', value: 'auditor' }
              ]}
              value={newUser.role}
              onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
            />
            <Select
              label="Department Association"
              options={data.departments.map(d => ({ label: d.name, value: d.id }))}
              value={newUser.department_id}
              onChange={(e) => setNewUser(prev => ({ ...prev, department_id: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-3">
            <Button variant="outline" size="sm" onClick={() => setUserModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm">Create Account</Button>
          </div>
        </form>
      </Modal>

      {/* Add Department Modal */}
      <Modal isOpen={deptModalOpen} onClose={() => setDeptModalOpen(false)} title="Create Department Division">
        <form onSubmit={handleCreateDept} className="space-y-4">
          <Input
            label="Department Name"
            placeholder="e.g. Logistics & Transport"
            required
            value={newDept.name}
            onChange={(e) => setNewDept(prev => ({ ...prev, name: e.target.value }))}
          />
          <Input
            label="Department Code"
            placeholder="e.g. LOG"
            required
            value={newDept.code}
            onChange={(e) => setNewDept(prev => ({ ...prev, code: e.target.value }))}
          />
          <Select
            label="Department Head"
            options={mockUsers}
            value={newDept.head_id}
            onChange={(e) => setNewDept(prev => ({ ...prev, head_id: e.target.value }))}
          />
          <Select
            label="Parent Department (Hierarchy)"
            placeholder="Top Level"
            options={data.departments.map(d => ({ label: d.name, value: d.id }))}
            value={newDept.parent_department_id}
            onChange={(e) => setNewDept(prev => ({ ...prev, parent_department_id: e.target.value }))}
          />
          <div className="flex justify-end gap-2.5 pt-3">
            <Button variant="outline" size="sm" onClick={() => setDeptModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm">Add Division</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminPage;
