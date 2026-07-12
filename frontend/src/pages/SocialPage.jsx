import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { esgService } from '../services/esgService';
import { Card, Table, Badge, StatusBadge } from '../components/ui/DataDisplay';
import { Button, Input, Select, FileUpload } from '../components/ui/FormControls';
import { Modal, Loader } from '../components/ui/Overlays';
import { Users, Plus, Award, Briefcase, FileCheck, Check, X, ShieldAlert } from 'lucide-react';
import { formatDate } from '../utils/helpers';

const SocialPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('csr'); // csr | participations | diversity | trainings
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ csr: [], participations: [], diversity: [], trainings: [] });

  // Modals state
  const [csrModalOpen, setCsrModalOpen] = useState(false);
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [activeParticipationId, setActiveParticipationId] = useState(null);
  
  // Form states
  const [newCsr, setNewCsr] = useState({ title: '', description: '', start_date: '', end_date: '', points_awarded: 100, max_participants: '', evidence_required: true });
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchSocialData();
  }, [activeTab]);

  const fetchSocialData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'csr') {
        const res = await esgService.getCsrActivities();
        setData((prev) => ({ ...prev, csr: res.items || [] }));
      } else if (activeTab === 'participations') {
        // Employees see their own; Managers see department/all
        let res;
        if (user.role === 'employee') {
          res = await esgService.getMyParticipations();
          setData((prev) => ({ ...prev, participations: res || [] }));
        } else {
          res = await esgService.getParticipations();
          setData((prev) => ({ ...prev, participations: res.items || [] }));
        }
      } else if (activeTab === 'diversity') {
        const res = await esgService.getDiversityMetrics();
        setData((prev) => ({ ...prev, diversity: res.items || [] }));
      } else if (activeTab === 'trainings') {
        const res = await esgService.getTrainings();
        setData((prev) => ({ ...prev, trainings: res.items || [] }));
      }
    } catch (err) {
      console.warn("API fail, using mocks for " + activeTab);
      loadMocks();
    } finally {
      setLoading(false);
    }
  };

  const loadMocks = () => {
    if (activeTab === 'csr') {
      setData((prev) => ({
        ...prev,
        csr: [
          { id: '1', title: 'Local Beach Cleanup', description: 'Clean up coastal plastic waste at Ocean Beach.', start_date: '2026-07-15', end_date: '2026-07-15', points_awarded: 150, max_participants: 30, evidence_required: true, status: 'active' },
          { id: '2', title: 'Office Recycling Drive', description: 'Bring old e-waste and paper waste to main lobby.', start_date: '2026-07-18', end_date: '2026-07-22', points_awarded: 80, max_participants: null, evidence_required: false, status: 'active' },
          { id: '3', title: 'Tree Planting Day', description: 'Plant native saplings at the city reserve.', start_date: '2026-06-10', end_date: '2026-06-10', points_awarded: 200, max_participants: 50, evidence_required: true, status: 'completed' },
        ],
      }));
    } else if (activeTab === 'participations') {
      setData((prev) => ({
        ...prev,
        participations: [
          { id: 'pa1', employee_id: 'emp1', employee: { first_name: 'John', last_name: 'Doe' }, activity_id: '1', activity: { title: 'Local Beach Cleanup', points_awarded: 150 }, proof_url: 'http://example.com/proof.pdf', approval_status: 'pending', created_at: '2026-07-11' },
          { id: 'pa2', employee_id: 'emp2', employee: { first_name: 'Jane', last_name: 'Smith' }, activity_id: '2', activity: { title: 'Office Recycling Drive', points_awarded: 80 }, proof_url: null, approval_status: 'approved', created_at: '2026-07-09' },
          { id: 'pa3', employee_id: 'emp3', employee: { first_name: 'Sarah', last_name: 'Jenkins' }, activity_id: '1', activity: { title: 'Local Beach Cleanup', points_awarded: 150 }, proof_url: null, approval_status: 'pending', created_at: '2026-07-12' },
        ],
      }));
    } else if (activeTab === 'diversity') {
      setData((prev) => ({
        ...prev,
        diversity: [
          { id: 'd1', metric_type: 'Gender Balance', metric_value: 'Female / Male / Other', count: 0, period: '2026-06-30' },
          { id: 'd2', metric_type: 'Gender Balance (Corporate)', metric_value: '45% Female, 52% Male, 3% Non-binary', count: 120, period: '2026-06-30' },
          { id: 'd3', metric_type: 'Ethnicity (Global)', metric_value: 'Diverse Diversity Mix Index', count: 88, period: '2026-06-30' },
        ],
      }));
    } else if (activeTab === 'trainings') {
      setData((prev) => ({
        ...prev,
        trainings: [
          { id: 't1', title: 'ESG Code of Conduct Training', completion_rate: 94.5, due_date: '2026-08-01', status: 'active' },
          { id: 't2', title: 'Factory Floor Safety & Environment Protocols', completion_rate: 88.0, due_date: '2026-07-20', status: 'active' },
        ],
      }));
    }
  };

  const handleCreateCsr = async (e) => {
    e.preventDefault();
    try {
      await esgService.createCsrActivity({
        ...newCsr,
        max_participants: newCsr.max_participants ? parseInt(newCsr.max_participants) : null,
      });
      setCsrModalOpen(false);
      fetchSocialData();
    } catch (err) {
      alert("Demo Mode: CSR Activity posted.");
      setData((prev) => ({
        ...prev,
        csr: [
          { id: Date.now().toString(), ...newCsr, max_participants: newCsr.max_participants ? parseInt(newCsr.max_participants) : null, status: 'active' },
          ...prev.csr,
        ],
      }));
      setCsrModalOpen(false);
    }
  };

  const handleJoinActivity = async (activityId) => {
    try {
      await esgService.joinCsrActivity({ activity_id: activityId });
      alert("Successfully joined this CSR activity! Check your Participation tab to log evidence.");
    } catch (err) {
      alert("Demo Mode: Joined! Check your participations tab to submit evidence.");
      // Add mock participation
      const act = data.csr.find((c) => c.id === activityId);
      setData((prev) => ({
        ...prev,
        participations: [
          {
            id: Date.now().toString(),
            employee: { first_name: user?.first_name || 'Demo', last_name: user?.last_name || 'User' },
            activity: { title: act?.title || 'CSR Campaign', points_awarded: act?.points_awarded || 100 },
            proof_url: null,
            approval_status: 'pending',
            created_at: new Date().toISOString(),
          },
          ...prev.participations,
        ],
      }));
    }
  };

  const handleUploadEvidence = async (e) => {
    e.preventDefault();
    if (!evidenceFile) return;
    setUploading(true);
    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', evidenceFile);
      
      // Upload
      await esgService.uploadParticipationEvidence(activeParticipationId, formData);
      setEvidenceModalOpen(false);
      setEvidenceFile(null);
      fetchSocialData();
    } catch (err) {
      alert("Demo Mode: Evidence uploaded successfully!");
      setData((prev) => ({
        ...prev,
        participations: prev.participations.map((p) =>
          p.id === activeParticipationId ? { ...p, proof_url: 'http://example.com/demo_upload.pdf' } : p
        ),
      }));
      setEvidenceModalOpen(false);
      setEvidenceFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleApprove = async (id, approve) => {
    const status = approve ? 'approved' : 'rejected';
    const target = data.participations.find(p => p.id === id);
    
    // Business rule: Evidence required check
    if (approve && !target.proof_url) {
      alert("Business Rule Violation: Evidence upload is mandatory before a CSR activity can be approved!");
      return;
    }

    try {
      await esgService.approveParticipation(id, { approval_status: status });
      fetchSocialData();
    } catch (err) {
      alert("Demo Mode: Participation marked as " + status);
      setData(prev => ({
        ...prev,
        participations: prev.participations.map(p => p.id === id ? { ...p, approval_status: status } : p)
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Social Responsibility & Impact</h1>
          <p className="text-sm text-gray-500 mt-1">Manage CSR campaigns, employee actions, diversity logs, and safety trainings.</p>
        </div>
        {activeTab === 'csr' && (user?.role === 'admin' || user?.role === 'esg_manager') && (
          <Button size="sm" onClick={() => setCsrModalOpen(true)} className="gap-2 font-bold">
            <Plus className="w-4 h-4" /> Create CSR Event
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-850 gap-2">
        <button
          onClick={() => setActiveTab('csr')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2
            ${activeTab === 'csr'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-400 hover:text-gray-650'
            }`}
        >
          CSR Activity Center
        </button>
        <button
          onClick={() => setActiveTab('participations')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2
            ${activeTab === 'participations'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-400 hover:text-gray-650'
            }`}
        >
          {user?.role === 'employee' ? 'My Participations' : 'Participation Requests'}
        </button>
        <button
          onClick={() => setActiveTab('diversity')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2
            ${activeTab === 'diversity'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-400 hover:text-gray-650'
            }`}
        >
          Diversity Metrics
        </button>
        <button
          onClick={() => setActiveTab('trainings')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2
            ${activeTab === 'trainings'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-400 hover:text-gray-650'
            }`}
        >
          Safety & ESG Training
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <Loader />
      ) : (
        <div className="space-y-4">
          {activeTab === 'csr' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.csr.length === 0 ? (
                <p className="col-span-2 text-center text-xs text-gray-400 py-6">No CSR events registered</p>
              ) : (
                data.csr.map((c) => (
                  <Card key={c.id} className="flex flex-col justify-between h-48">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-gray-850 dark:text-gray-200">{c.title}</h4>
                        <StatusBadge status={c.status} />
                      </div>
                      <p className="text-xs text-gray-400 mt-2 leading-relaxed line-clamp-3">{c.description}</p>
                    </div>

                    <div className="pt-3 border-t border-gray-100 dark:border-gray-850 flex items-center justify-between mt-2">
                      <div className="flex gap-2 items-center text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                        <Award className="w-4 h-4 shrink-0" />
                        <span>+{c.points_awarded} XP</span>
                        {c.evidence_required && <Badge color="red">Evidence Req.</Badge>}
                      </div>
                      
                      {user?.role === 'employee' && c.status === 'active' && (
                        <Button size="sm" variant="outline" className="text-[11px]" onClick={() => handleJoinActivity(c.id)}>
                          Join Campaign
                        </Button>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === 'participations' && (
            <Table
              columns={[
                { header: 'Employee', key: 'employee', render: (row) => <span className="font-semibold text-xs text-gray-800 dark:text-gray-250">{row.employee.first_name} {row.employee.last_name}</span> },
                { header: 'CSR Activity', key: 'activity', render: (row) => <span className="text-xs">{row.activity.title}</span> },
                { header: 'XP Reward', key: 'xp', render: (row) => <span className="text-xs font-semibold text-green-600">+{row.activity.points_awarded} XP</span> },
                { header: 'Evidence Upload', key: 'proof', render: (row) => row.proof_url ? <a href={row.proof_url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-650 hover:underline">View File</a> : <span className="text-xs text-gray-400 font-medium">None</span> },
                { header: 'Approval Status', key: 'status', render: (row) => <StatusBadge status={row.approval_status} /> },
                { header: 'Actions', key: 'actions', render: (row) => (
                  <div className="flex items-center gap-1.5">
                    {/* Employee upload button */}
                    {user?.role === 'employee' && row.approval_status === 'pending' && !row.proof_url && (
                      <Button size="sm" variant="outline" className="text-[10px] py-1" onClick={() => {
                        setActiveParticipationId(row.id);
                        setEvidenceModalOpen(true);
                      }}>
                        Upload Proof
                      </Button>
                    )}
                    {/* Manager / DH approval buttons */}
                    {user?.role !== 'employee' && row.approval_status === 'pending' && (
                      <>
                        <button onClick={() => handleApprove(row.id, true)} className="p-1 rounded bg-green-50 hover:bg-green-100 text-green-700 transition-colors">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleApprove(row.id, false)} className="p-1 rounded bg-red-50 hover:bg-red-100 text-red-700 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              ]}
              data={data.participations}
              emptyMessage="No CSR activity participation logs logged"
            />
          )}

          {activeTab === 'diversity' && (
            <Table
              columns={[
                { header: 'Metric Type', key: 'metric_type', render: (row) => <span className="font-semibold text-xs text-gray-850 dark:text-gray-250">{row.metric_type}</span> },
                { header: 'Quota Distribution Value', key: 'metric_value', render: (row) => <span className="text-xs">{row.metric_value}</span> },
                { header: 'Count Measured', key: 'count', render: (row) => <span className="text-xs font-bold">{row.count || '-'}</span> },
                { header: 'Date Compiled', key: 'period', render: (row) => <span className="text-xs text-gray-400">{formatDate(row.period)}</span> }
              ]}
              data={data.diversity}
              emptyMessage="No diversity indices compiled"
            />
          )}

          {activeTab === 'trainings' && (
            <Table
              columns={[
                { header: 'Training Title', key: 'title', render: (row) => <span className="font-semibold text-xs text-gray-850 dark:text-gray-250">{row.title}</span> },
                { header: 'Team Completion rate', key: 'rate', render: (row) => <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{row.completion_rate}%</span> },
                { header: 'Deadline Limit', key: 'due_date', render: (row) => <span className="text-xs text-gray-400">{formatDate(row.due_date)}</span> },
                { header: 'Status', key: 'status', render: (row) => <StatusBadge status={row.status} /> }
              ]}
              data={data.trainings}
              emptyMessage="No sustainability training trackers logged"
            />
          )}
        </div>
      )}

      {/* Create CSR Activity Modal */}
      <Modal isOpen={csrModalOpen} onClose={() => setCsrModalOpen(false)} title="Create CSR Impact Event">
        <form onSubmit={handleCreateCsr} className="space-y-4">
          <Input
            label="Campaign Title"
            placeholder="e.g. Green Office Gardening Campaign"
            required
            value={newCsr.title}
            onChange={(e) => setNewCsr(prev => ({ ...prev, title: e.target.value }))}
          />
          <Input
            label="Description"
            placeholder="Detail the event goal, location, and date details..."
            required
            value={newCsr.description}
            onChange={(e) => setNewCsr(prev => ({ ...prev, description: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              required
              value={newCsr.start_date}
              onChange={(e) => setNewCsr(prev => ({ ...prev, start_date: e.target.value }))}
            />
            <Input
              label="End Date"
              type="date"
              required
              value={newCsr.end_date}
              onChange={(e) => setNewCsr(prev => ({ ...prev, end_date: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="XP Reward Value"
              type="number"
              required
              value={newCsr.points_awarded}
              onChange={(e) => setNewCsr(prev => ({ ...prev, points_awarded: parseInt(e.target.value) }))}
            />
            <Input
              label="Max Attendees (Optional)"
              type="number"
              placeholder="Unlimited"
              value={newCsr.max_participants}
              onChange={(e) => setNewCsr(prev => ({ ...prev, max_participants: e.target.value }))}
            />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="evidence_required"
              checked={newCsr.evidence_required}
              onChange={(e) => setNewCsr(prev => ({ ...prev, evidence_required: e.target.checked }))}
              className="rounded text-indigo-650 focus:ring-indigo-500"
            />
            <label htmlFor="evidence_required" className="text-xs text-gray-500 font-semibold uppercase">
              Require upload evidence before manager approval
            </label>
          </div>
          <div className="flex justify-end gap-2.5 pt-3">
            <Button variant="outline" size="sm" onClick={() => setCsrModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm">Create Event</Button>
          </div>
        </form>
      </Modal>

      {/* Upload Evidence Modal */}
      <Modal isOpen={evidenceModalOpen} onClose={() => setEvidenceModalOpen(false)} title="Submit Campaign Proof">
        <form onSubmit={handleUploadEvidence} className="space-y-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/30 rounded-lg flex items-start gap-2.5">
            <ShieldAlert className="w-4.5 h-4.5 text-indigo-650 dark:text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-indigo-755 dark:text-indigo-300 font-semibold leading-relaxed">
              Business rules mandate attaching a valid proof file (PDF, PNG, JPG) before this participation request can be approved.
            </p>
          </div>
          
          <FileUpload
            label="Select Evidence File"
            required
            value={evidenceFile}
            onChange={(file) => setEvidenceFile(file)}
          />
          <div className="flex justify-end gap-2.5 pt-3">
            <Button variant="outline" size="sm" onClick={() => setEvidenceModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm" loading={uploading}>Upload Proof</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SocialPage;
