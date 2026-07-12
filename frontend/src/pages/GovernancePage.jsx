import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { esgService } from '../services/esgService';
import { Card, Table, Badge, StatusBadge } from '../components/ui/DataDisplay';
import { Button, Input, Select } from '../components/ui/FormControls';
import { Modal, Loader } from '../components/ui/Overlays';
import { ShieldCheck, Plus, CheckCircle, AlertOctagon, Scale, Calendar, Eye } from 'lucide-react';
import { formatDate } from '../utils/helpers';

const GovernancePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('policies'); // policies | audits | compliance
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ policies: [], audits: [], compliance: [] });
  
  // Modals state
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [viewPolicyOpen, setViewPolicyOpen] = useState(false);

  // New item form states
  const [newPolicy, setNewPolicy] = useState({ title: '', description: '', content: '', version: '1.0', effective_date: '' });
  const [newAudit, setNewAudit] = useState({ title: '', description: '', department_id: '', auditor_id: user?.id || '', audit_date: '' });
  const [newIssue, setNewIssue] = useState({ audit_id: '', title: '', description: '', severity: 'medium', owner_id: '', due_date: '' });

  // Mock list of departments/users for selects
  const mockDepts = [
    { label: 'Manufacturing', value: 'dept1' },
    { label: 'Logistics', value: 'dept2' },
    { label: 'Corporate Office', value: 'dept3' }
  ];
  const mockUsers = [
    { label: 'Sarah Jenkins (Manufacturing DH)', value: 'usr1' },
    { label: 'John Davis (Logistics Head)', value: 'usr2' },
    { label: 'Emma Watson (Corporate Manager)', value: 'usr3' }
  ];

  useEffect(() => {
    fetchGovernanceData();
  }, [activeTab]);

  const fetchGovernanceData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'policies') {
        const res = await esgService.getPolicies();
        setData((prev) => ({ ...prev, policies: res.items || [] }));
      } else if (activeTab === 'audits') {
        const res = await esgService.getAudits();
        setData((prev) => ({ ...prev, audits: res.items || [] }));
      } else if (activeTab === 'compliance') {
        const res = await esgService.getComplianceIssues();
        setData((prev) => ({ ...prev, compliance: res.items || [] }));
      }
    } catch (err) {
      console.warn("API fail, using mocks for " + activeTab);
      loadMocks();
    } finally {
      setLoading(false);
    }
  };

  const loadMocks = () => {
    if (activeTab === 'policies') {
      setData((prev) => ({
        ...prev,
        policies: [
          { id: 'po1', title: 'Carbon Neutral Operations Policy 2026', description: 'Mandates target scope reduction quotas for transport fleets.', content: 'All departments must reduce direct fuel utility use by 15% using optimized logistics streams. Monthly metrics must be logged in the emissions registry.', version: '2.1', effective_date: '2026-06-01', acknowledged: false },
          { id: 'po2', title: 'Corporate ESG Ethics Guidelines', description: 'Core code of social and environmental guidelines.', content: 'EcoSync mandates strict ethical checks. Waste chemicals logs must be updated, employee health safety trainings completed by the set deadlines.', version: '1.0', effective_date: '2026-01-01', acknowledged: true }
        ]
      }));
    } else if (activeTab === 'audits') {
      setData((prev) => ({
        ...prev,
        audits: [
          { id: 'au1', title: 'Q2 Manufacturing Site Audit', description: 'Full checklist safety and emissions review.', department: { name: 'Manufacturing' }, auditor: { first_name: 'David', last_name: 'Miller' }, audit_date: '2026-06-15', score: 85.0, status: 'completed' },
          { id: 'au2', title: 'Logistics Center Air Quota Audit', description: 'Reviewing vehicle tailpipe emissions logs.', department: { name: 'Logistics' }, auditor: { first_name: 'David', last_name: 'Miller' }, audit_date: '2026-07-10', score: null, status: 'in_progress' }
        ]
      }));
    } else if (activeTab === 'compliance') {
      const todayStr = new Date().toISOString().split('T')[0];
      setData((prev) => ({
        ...prev,
        compliance: [
          { id: 'is1', title: 'Waste chemical logs incomplete', description: 'Q2 factory waste discharge notes missing detail logs.', severity: 'high', owner: { first_name: 'Sarah', last_name: 'Jenkins' }, due_date: '2026-07-28', status: 'open' },
          { id: 'is2', title: 'Employee health checks overdue', description: 'Mandatory health diagnostics not recorded.', severity: 'critical', owner: { first_name: 'Sarah', last_name: 'Jenkins' }, due_date: '2026-07-05', status: 'open' }, // Past date, triggers overdue logic
          { id: 'is3', title: 'Vehicle emissions verification pending', description: 'Truck logs not verified.', severity: 'low', owner: { first_name: 'John', last_name: 'Davis' }, due_date: '2026-07-30', status: 'resolved' }
        ]
      }));
    }
  };

  const handleCreatePolicy = async (e) => {
    e.preventDefault();
    try {
      await esgService.createPolicy(newPolicy);
      setPolicyModalOpen(false);
      fetchGovernanceData();
    } catch (err) {
      alert("Demo Mode: ESG Policy created.");
      setData(prev => ({
        ...prev,
        policies: [
          { id: Date.now().toString(), ...newPolicy, acknowledged: false },
          ...prev.policies
        ]
      }));
      setPolicyModalOpen(false);
    }
  };

  const handleCreateAudit = async (e) => {
    e.preventDefault();
    try {
      await esgService.createAudit(newAudit);
      setAuditModalOpen(false);
      fetchGovernanceData();
    } catch (err) {
      alert("Demo Mode: Corporate audit scheduled.");
      setData(prev => ({
        ...prev,
        audits: [
          { id: Date.now().toString(), ...newAudit, department: { name: 'Manufacturing' }, auditor: { first_name: user?.first_name || 'Demo', last_name: user?.last_name || 'Auditor' }, status: 'planned', score: null },
          ...prev.audits
        ]
      }));
      setAuditModalOpen(false);
    }
  };

  const handleCreateIssue = async (e) => {
    e.preventDefault();
    try {
      await esgService.createComplianceIssue(newIssue);
      setIssueModalOpen(false);
      fetchGovernanceData();
    } catch (err) {
      alert("Demo Mode: Compliance issue logged.");
      const selectedOwner = mockUsers.find(u => u.value === newIssue.owner_id) || { label: 'Sarah Jenkins' };
      setData(prev => ({
        ...prev,
        compliance: [
          { id: Date.now().toString(), ...newIssue, owner: { first_name: selectedOwner.label.split(' ')[0], last_name: selectedOwner.label.split(' ')[1] }, status: 'open' },
          ...prev.compliance
        ]
      }));
      setIssueModalOpen(false);
    }
  };

  const handleAcknowledge = async (policyId) => {
    try {
      await esgService.acknowledgePolicy(policyId, '127.0.0.1');
      alert("Policy acknowledged successfully! Logged IP: 127.0.0.1.");
      setViewPolicyOpen(false);
      fetchGovernanceData();
    } catch (err) {
      alert("Demo Mode: Policy acknowledged. Timestamp registered.");
      setData(prev => ({
        ...prev,
        policies: prev.policies.map(p => p.id === policyId ? { ...p, acknowledged: true } : p)
      }));
      setViewPolicyOpen(false);
    }
  };

  const isIssueOverdue = (dueDate, status) => {
    if (status !== 'open') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return today > due;
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Governance & Compliance</h1>
          <p className="text-sm text-gray-500 mt-1">Review organizational policies, schedule compliance audits, and log risk issues.</p>
        </div>
        {activeTab === 'policies' && (user?.role === 'admin' || user?.role === 'esg_manager') && (
          <Button size="sm" onClick={() => setPolicyModalOpen(true)} className="gap-2 font-bold">
            <Plus className="w-4 h-4" /> Publish Policy
          </Button>
        )}
        {activeTab === 'audits' && user?.role === 'auditor' && (
          <Button size="sm" onClick={() => setAuditModalOpen(true)} className="gap-2 font-bold">
            <Plus className="w-4 h-4" /> Schedule Audit
          </Button>
        )}
        {activeTab === 'compliance' && user?.role === 'auditor' && (
          <Button size="sm" onClick={() => {
            // Fetch audits to associate with compliance logs if needed
            setIssueModalOpen(true);
          }} className="gap-2 font-bold">
            <Plus className="w-4 h-4" /> Raise Issue
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-850 gap-2">
        <button
          onClick={() => setActiveTab('policies')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2
            ${activeTab === 'policies'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-400 hover:text-gray-650'
            }`}
        >
          ESG Policies
        </button>
        <button
          onClick={() => setActiveTab('audits')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2
            ${activeTab === 'audits'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-400 hover:text-gray-650'
            }`}
        >
          Audits Directory
        </button>
        <button
          onClick={() => setActiveTab('compliance')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2
            ${activeTab === 'compliance'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-400 hover:text-gray-650'
            }`}
        >
          Compliance Logs
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <Loader />
      ) : (
        <div className="space-y-4">
          {activeTab === 'policies' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.policies.length === 0 ? (
                <p className="col-span-2 text-center text-xs text-gray-400 py-6">No organizational policies published</p>
              ) : (
                data.policies.map((p) => (
                  <Card key={p.id} className="flex flex-col justify-between h-44">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-gray-855 dark:text-gray-200">{p.title}</h4>
                        <Badge color="gray">v{p.version}</Badge>
                      </div>
                      <p className="text-xs text-gray-400 mt-2 leading-relaxed line-clamp-3">{p.description}</p>
                    </div>

                    <div className="pt-3 border-t border-gray-100 dark:border-gray-850 flex items-center justify-between mt-2">
                      <span className="text-[10px] text-gray-400 font-semibold uppercase">Effective: {formatDate(p.effective_date)}</span>
                      <div className="flex items-center gap-2">
                        {p.acknowledged ? (
                          <span className="text-xs text-green-600 font-semibold flex items-center gap-1.5">
                            <CheckCircle className="w-4.5 h-4.5" /> Acknowledged
                          </span>
                        ) : (
                          <Button size="sm" variant="outline" className="text-[11px] py-1 px-2.5 flex items-center gap-1.5" onClick={() => {
                            setSelectedPolicy(p);
                            setViewPolicyOpen(true);
                          }}>
                            <Eye className="w-3.5 h-3.5" /> Read & Sign
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === 'audits' && (
            <Table
              columns={[
                { header: 'Audit Title', key: 'title', render: (row) => <span className="font-semibold text-xs text-gray-850 dark:text-gray-250">{row.title}</span> },
                { header: 'Auditee Dept', key: 'department', render: (row) => <span className="text-xs">{row.department?.name || 'Department'}</span> },
                { header: 'Auditor Owner', key: 'auditor', render: (row) => <span className="text-xs text-gray-500 font-medium">{row.auditor?.first_name} {row.auditor?.last_name}</span> },
                { header: 'Scheduled Date', key: 'audit_date', render: (row) => <span className="text-xs text-gray-400">{formatDate(row.audit_date)}</span> },
                { header: 'Assessment Score', key: 'score', render: (row) => row.score ? <Badge color="green">{row.score}</Badge> : '-' },
                { header: 'Lifecycle Status', key: 'status', render: (row) => <StatusBadge status={row.status} /> }
              ]}
              data={data.audits}
              emptyMessage="No organizational audits logged"
            />
          )}

          {activeTab === 'compliance' && (
            <Table
              columns={[
                { header: 'Compliance Issue', key: 'title', render: (row) => <span className="font-semibold text-xs text-gray-850 dark:text-gray-250">{row.title}</span> },
                { header: 'Severity Weight', key: 'severity', render: (row) => <Badge color={row.severity === 'critical' ? 'red' : row.severity === 'high' ? 'red' : 'yellow'}>{row.severity}</Badge> },
                { header: 'Owner Assigned', key: 'owner', render: (row) => <span className="text-xs font-semibold text-gray-655 dark:text-gray-400">{row.owner?.first_name} {row.owner?.last_name}</span> },
                { header: 'Due Date Check', key: 'due_date', render: (row) => <span className="text-xs">{formatDate(row.due_date)}</span> },
                { header: 'Overdue Flag', key: 'overdue', render: (row) => (
                  isIssueOverdue(row.due_date, row.status) ? (
                    <span className="text-xs text-red-500 font-extrabold flex items-center gap-1">
                      <AlertOctagon className="w-4 h-4 animate-bounce" /> Overdue
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 font-medium">On Track</span>
                  )
                )},
                { header: 'Status', key: 'status', render: (row) => <StatusBadge status={row.status} /> }
              ]}
              data={data.compliance}
              emptyMessage="No compliance logs raised"
            />
          )}
        </div>
      )}

      {/* Publish ESG Policy Modal */}
      <Modal isOpen={policyModalOpen} onClose={() => setPolicyModalOpen(false)} title="Publish Corporate ESG Policy">
        <form onSubmit={handleCreatePolicy} className="space-y-4">
          <Input
            label="Policy Title"
            placeholder="e.g. Energy Utility Conservation Mandates"
            required
            value={newPolicy.title}
            onChange={(e) => setNewPolicy(prev => ({ ...prev, title: e.target.value }))}
          />
          <Input
            label="Brief Summary"
            placeholder="e.g. Quota updates for waste management..."
            required
            value={newPolicy.description}
            onChange={(e) => setNewPolicy(prev => ({ ...prev, description: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Policy Version Code"
              value={newPolicy.version}
              onChange={(e) => setNewPolicy(prev => ({ ...prev, version: e.target.value }))}
            />
            <Input
              label="Effective Date"
              type="date"
              required
              value={newPolicy.effective_date}
              onChange={(e) => setNewPolicy(prev => ({ ...prev, effective_date: e.target.value }))}
            />
          </div>
          <div className="w-full">
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
              Policy Content
            </label>
            <textarea
              required
              rows={4}
              value={newPolicy.content}
              onChange={(e) => setNewPolicy(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Paste actual legal/ethical guidelines here..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-indigo-500 dark:bg-gray-950 dark:border-gray-800 dark:text-gray-100"
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-3">
            <Button variant="outline" size="sm" onClick={() => setPolicyModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm">Publish Policy</Button>
          </div>
        </form>
      </Modal>

      {/* Schedule Audit Modal */}
      <Modal isOpen={auditModalOpen} onClose={() => setAuditModalOpen(false)} title="Schedule ESG Assessment Audit">
        <form onSubmit={handleCreateAudit} className="space-y-4">
          <Input
            label="Audit Title"
            placeholder="e.g. Q3 Carbon Audit"
            required
            value={newAudit.title}
            onChange={(e) => setNewAudit(prev => ({ ...prev, title: e.target.value }))}
          />
          <Select
            label="Target Auditee Department"
            required
            options={mockDepts}
            value={newAudit.department_id}
            onChange={(e) => setNewAudit(prev => ({ ...prev, department_id: e.target.value }))}
          />
          <Input
            label="Audit Scheduled Date"
            type="date"
            required
            value={newAudit.audit_date}
            onChange={(e) => setNewAudit(prev => ({ ...prev, audit_date: e.target.value }))}
          />
          <Input
            label="Audit Scope Description"
            placeholder="Outline physical facilities and records to inspect..."
            value={newAudit.description}
            onChange={(e) => setNewAudit(prev => ({ ...prev, description: e.target.value }))}
          />
          <div className="flex justify-end gap-2.5 pt-3">
            <Button variant="outline" size="sm" onClick={() => setAuditModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm">Schedule Audit</Button>
          </div>
        </form>
      </Modal>

      {/* Raise Issue Modal */}
      <Modal isOpen={issueModalOpen} onClose={() => setIssueModalOpen(false)} title="Raise Compliance issue">
        <form onSubmit={handleCreateIssue} className="space-y-4">
          <Input
            label="Issue Title"
            placeholder="e.g. Warehouse bin segregation failing"
            required
            value={newIssue.title}
            onChange={(e) => setNewIssue(prev => ({ ...prev, title: e.target.value }))}
          />
          <Select
            label="Assign Issue Owner (Department Head)"
            required
            options={mockUsers}
            value={newIssue.owner_id}
            onChange={(e) => setNewIssue(prev => ({ ...prev, owner_id: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Severity"
              options={[
                { label: 'Low Risk', value: 'low' },
                { label: 'Medium Risk', value: 'medium' },
                { label: 'High Risk', value: 'high' },
                { label: 'Critical Violation', value: 'critical' }
              ]}
              value={newIssue.severity}
              onChange={(e) => setNewIssue(prev => ({ ...prev, severity: e.target.value }))}
            />
            <Input
              label="Resolution Due Date"
              type="date"
              required
              value={newIssue.due_date}
              onChange={(e) => setNewIssue(prev => ({ ...prev, due_date: e.target.value }))}
            />
          </div>
          <Input
            label="Detailed Description"
            placeholder="Detail visual checks or missing reports..."
            value={newIssue.description}
            onChange={(e) => setNewIssue(prev => ({ ...prev, description: e.target.value }))}
          />
          <div className="flex justify-end gap-2.5 pt-3">
            <Button variant="outline" size="sm" onClick={() => setIssueModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm">Raise Issue</Button>
          </div>
        </form>
      </Modal>

      {/* Read and Sign Policy Modal */}
      <Modal isOpen={viewPolicyOpen} onClose={() => setViewPolicyOpen(false)} title={selectedPolicy?.title}>
        <div className="space-y-4">
          <p className="text-xs text-gray-500 font-semibold uppercase">Published: {formatDate(selectedPolicy?.effective_date)} (Version {selectedPolicy?.version})</p>
          <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg max-h-60 overflow-y-auto">
            <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300">{selectedPolicy?.content}</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/20 p-3.5 border border-amber-200 dark:border-amber-900/30 rounded-lg flex items-start gap-2.5">
            <Scale className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold leading-relaxed uppercase">
              By clicking "Sign & Acknowledge", you legally certify that your department has read and will integrate these mandates into active work operations.
            </p>
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="outline" size="sm" onClick={() => setViewPolicyOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={() => handleAcknowledge(selectedPolicy.id)}>Sign & Acknowledge</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GovernancePage;
