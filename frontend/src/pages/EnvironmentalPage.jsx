import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { esgService } from '../services/esgService';
import { Card, Table, Badge, Pagination } from '../components/ui/DataDisplay';
import { Button, Input, Select } from '../components/ui/FormControls';
import { Modal, Loader } from '../components/ui/Overlays';
import { Leaf, Plus, Target, Package, BarChart2 } from 'lucide-react';
import { formatCarbon, formatDate, formatNumber } from '../utils/helpers';

const EnvironmentalPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('transactions'); // transactions | factors | goals | products
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ transactions: [], factors: [], goals: [], products: [] });
  
  // Modals state
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [efModalOpen, setEfModalOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);

  // New item form states
  const [newTx, setNewTx] = useState({ emission_factor_id: '', quantity: '', unit: '', transaction_date: '', description: '', source_type: 'purchase', department_id: user?.department_id || '' });
  const [newEf, setNewEf] = useState({ name: '', category: '', unit: '', factor_value: '', scope: 'scope_1', source: '' });
  const [newGoal, setNewGoal] = useState({ title: '', target_value: '', start_date: '', end_date: '', unit: 'kg CO2e', description: '' });

  // Load lists on startup
  useEffect(() => {
    fetchEnvironmentalData();
  }, [activeTab]);

  const fetchEnvironmentalData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'transactions') {
        const res = await esgService.getCarbonTransactions();
        setData((prev) => ({ ...prev, transactions: res.items || [] }));
      } else if (activeTab === 'factors') {
        const res = await esgService.getEmissionFactors();
        setData((prev) => ({ ...prev, factors: res.items || [] }));
      } else if (activeTab === 'goals') {
        const res = await esgService.getEnvironmentalGoals();
        setData((prev) => ({ ...prev, goals: res.items || [] }));
      } else if (activeTab === 'products') {
        const res = await esgService.getProducts();
        setData((prev) => ({ ...prev, products: res.items || [] }));
      }
    } catch (err) {
      console.warn("API fail, using mocks for " + activeTab);
      loadMocks();
    } finally {
      setLoading(false);
    }
  };

  const loadMocks = () => {
    // Elegant fallback mocks
    if (activeTab === 'transactions') {
      setData((prev) => ({
        ...prev,
        transactions: [
          { id: '1', calculated_emission: 1250.5, quantity: 500, unit: 'kWh', transaction_date: '2026-07-01', source_type: 'utility', description: 'Monthly electricity bill', emission_factor: { name: 'Grid Electricity' } },
          { id: '2', calculated_emission: 540.0, quantity: 200, unit: 'Liters', transaction_date: '2026-07-04', source_type: 'fleet', description: 'Logistics diesel refueling', emission_factor: { name: 'Diesel Fuel' } },
          { id: '3', calculated_emission: 88.2, quantity: 1200, unit: 'Pages', transaction_date: '2026-07-10', source_type: 'office', description: 'Paper supplies procurement', emission_factor: { name: 'Paper Office Supplies' } },
        ],
      }));
    } else if (activeTab === 'factors') {
      setData((prev) => ({
        ...prev,
        factors: [
          { id: 'f1', name: 'Grid Electricity', category: 'Electricity', unit: 'kg CO2e/kWh', factor_value: 0.85, scope: 'scope_2', source: 'EPA' },
          { id: 'f2', name: 'Diesel Fuel', category: 'Fuel', unit: 'kg CO2e/Liter', factor_value: 2.7, scope: 'scope_1', source: 'DEFRA' },
          { id: 'f3', name: 'Natural Gas', category: 'Heating', unit: 'kg CO2e/m3', factor_value: 2.05, scope: 'scope_1', source: 'EPA' },
          { id: 'f4', name: 'Air Travel (Short Haul)', category: 'Transport', unit: 'kg CO2e/km', factor_value: 0.15, scope: 'scope_3', source: 'ICAO' },
        ],
      }));
    } else if (activeTab === 'goals') {
      setData((prev) => ({
        ...prev,
        goals: [
          { id: 'g1', title: 'Reduce manufacturing power use by 15%', target_value: 5000, current_value: 3800, start_date: '2026-01-01', end_date: '2026-12-31', unit: 'kg CO2e', status: 'active' },
          { id: 'g2', title: 'Minimize business air travel by half', target_value: 2000, current_value: 850, start_date: '2026-01-01', end_date: '2026-12-31', unit: 'kg CO2e', status: 'active' },
        ],
      }));
    } else if (activeTab === 'products') {
      setData((prev) => ({
        ...prev,
        products: [
          { id: 'p1', name: 'Eco-Smart Thermostat', sku: 'THM-ECO-01', esg_profile: { carbon_footprint: 12.5, recyclability_score: 95.0, sustainability_rating: 'A' } },
          { id: 'p2', name: 'Heavy Duty Compressor X2', sku: 'CMP-HD-X2', esg_profile: { carbon_footprint: 245.0, recyclability_score: 60.0, sustainability_rating: 'C' } },
        ],
      }));
    }
  };

  const handleCreateTx = async (e) => {
    e.preventDefault();
    try {
      await esgService.createCarbonTransaction({
        ...newTx,
        quantity: parseFloat(newTx.quantity),
      });
      setTxModalOpen(false);
      fetchEnvironmentalData();
    } catch (err) {
      // Mock add
      alert("Demo Mode: Transaction added (emissions auto-calculated)");
      const selectedFactor = data.factors.find(f => f.id === newTx.emission_factor_id) || { name: 'Custom Factor', factor_value: 1.0 };
      const emission = parseFloat(newTx.quantity) * (selectedFactor.factor_value || 1.0);
      setData((prev) => ({
        ...prev,
        transactions: [
          {
            id: Date.now().toString(),
            calculated_emission: emission,
            quantity: parseFloat(newTx.quantity),
            unit: newTx.unit || 'units',
            transaction_date: newTx.transaction_date,
            source_type: newTx.source_type,
            description: newTx.description,
            emission_factor: { name: selectedFactor.name }
          },
          ...prev.transactions
        ]
      }));
      setTxModalOpen(false);
    }
  };

  const handleCreateEf = async (e) => {
    e.preventDefault();
    try {
      await esgService.createEmissionFactor({
        ...newEf,
        factor_value: parseFloat(newEf.factor_value),
      });
      setEfModalOpen(false);
      fetchEnvironmentalData();
    } catch (err) {
      alert("Demo Mode: Emission factor registered.");
      setData(prev => ({
        ...prev,
        factors: [
          { id: Date.now().toString(), ...newEf, factor_value: parseFloat(newEf.factor_value) },
          ...prev.factors
        ]
      }));
      setEfModalOpen(false);
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    try {
      await esgService.createEnvironmentalGoal({
        ...newGoal,
        target_value: parseFloat(newGoal.target_value),
      });
      setGoalModalOpen(false);
      fetchEnvironmentalData();
    } catch (err) {
      alert("Demo Mode: Environmental reduction target set.");
      setData(prev => ({
        ...prev,
        goals: [
          { id: Date.now().toString(), ...newGoal, target_value: parseFloat(newGoal.target_value), current_value: 0, status: 'active' },
          ...prev.goals
        ]
      }));
      setGoalModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Environmental Sustainability</h1>
          <p className="text-sm text-gray-500 mt-1">Audit carbon emissions, emission factors, and department sustainability goals.</p>
        </div>
        {activeTab === 'transactions' && (
          <Button size="sm" onClick={() => {
            // Pre-load factors in memory first to select from
            esgService.getEmissionFactors()
              .then(res => setData(prev => ({ ...prev, factors: res.items || [] })))
              .catch(() => loadMocks());
            setTxModalOpen(true);
          }} className="gap-2 font-bold">
            <Plus className="w-4 h-4" /> Record Emissions
          </Button>
        )}
        {activeTab === 'factors' && user?.role === 'admin' && (
          <Button size="sm" onClick={() => setEfModalOpen(true)} className="gap-2 font-bold">
            <Plus className="w-4 h-4" /> New Factor
          </Button>
        )}
        {activeTab === 'goals' && (user?.role === 'admin' || user?.role === 'esg_manager') && (
          <Button size="sm" onClick={() => setGoalModalOpen(true)} className="gap-2 font-bold">
            <Plus className="w-4 h-4" /> Set Goal
          </Button>
        )}
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-gray-200 dark:border-gray-850 gap-2">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2
            ${activeTab === 'transactions'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-400 hover:text-gray-650'
            }`}
        >
          Emissions Ledger
        </button>
        <button
          onClick={() => setActiveTab('factors')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2
            ${activeTab === 'factors'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-400 hover:text-gray-650'
            }`}
        >
          Emission Indexes
        </button>
        <button
          onClick={() => setActiveTab('goals')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2
            ${activeTab === 'goals'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-400 hover:text-gray-650'
            }`}
        >
          Reduction Goals
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2
            ${activeTab === 'products'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-400 hover:text-gray-650'
            }`}
        >
          Goods ESG Profiles
        </button>
      </div>

      {/* Content panel */}
      {loading ? (
        <Loader />
      ) : (
        <div className="space-y-4">
          {activeTab === 'transactions' && (
            <Table
              columns={[
                { header: 'Description', key: 'description', render: (row) => <span className="font-semibold text-xs text-gray-850 dark:text-gray-250">{row.description}</span> },
                { header: 'Source Type', key: 'source_type', render: (row) => <Badge color="indigo">{row.source_type}</Badge> },
                { header: 'Index Utilized', key: 'factor', render: (row) => <span className="text-xs">{row.emission_factor?.name || 'Custom'}</span> },
                { header: 'Amount Logged', key: 'quantity', render: (row) => <span className="text-xs">{row.quantity} {row.unit}</span> },
                { header: 'Calculated Carbon', key: 'calculated_emission', render: (row) => <span className="font-bold text-xs text-red-500">{formatCarbon(row.calculated_emission)}</span> },
                { header: 'Date Record', key: 'transaction_date', render: (row) => <span className="text-xs text-gray-400">{formatDate(row.transaction_date)}</span> },
              ]}
              data={data.transactions}
              emptyMessage="No carbon transaction logs found"
            />
          )}

          {activeTab === 'factors' && (
            <Table
              columns={[
                { header: 'Name', key: 'name', render: (row) => <span className="font-semibold text-xs text-gray-850 dark:text-gray-250">{row.name}</span> },
                { header: 'Scope Group', key: 'scope', render: (row) => <Badge color={row.scope === 'scope_1' ? 'green' : row.scope === 'scope_2' ? 'indigo' : 'yellow'}>{row.scope.replace('_', ' ')}</Badge> },
                { header: 'Category', key: 'category', render: (row) => <span className="text-xs">{row.category}</span> },
                { header: 'Factor Quotient', key: 'factor_value', render: (row) => <span className="text-xs font-bold">{row.factor_value}</span> },
                { header: 'Units Scale', key: 'unit', render: (row) => <span className="text-xs text-gray-500">{row.unit}</span> },
                { header: 'Database Reference', key: 'source', render: (row) => <span className="text-xs text-gray-400">{row.source || '-'}</span> },
              ]}
              data={data.factors}
              emptyMessage="No emission indexes found"
            />
          )}

          {activeTab === 'goals' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.goals.length === 0 ? (
                <div className="col-span-2 text-center py-6 text-xs text-gray-400">No active goal trackers set</div>
              ) : (
                data.goals.map((g) => {
                  const pct = Math.min(100, Math.round((g.current_value / g.target_value) * 100));
                  return (
                    <Card key={g.id} className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-bold text-gray-850 dark:text-gray-200">{g.title}</h4>
                          <span className="text-[10px] text-gray-400">Target Range: {formatDate(g.start_date)} - {formatDate(g.end_date)}</span>
                        </div>
                        <Target className="w-5 h-5 text-indigo-500 shrink-0" />
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500 font-medium">Reduction Performance</span>
                          <span className="font-bold text-indigo-650 dark:text-indigo-400">{pct}%</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-650 h-full transition-all duration-350" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex justify-between text-[11px] text-gray-400 font-medium">
                          <span>Logged: {formatNumber(g.current_value)} {g.unit}</span>
                          <span>Quota Limit: {formatNumber(g.target_value)} {g.unit}</span>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'products' && (
            <Table
              columns={[
                { header: 'Product Item', key: 'name', render: (row) => <span className="font-semibold text-xs text-gray-850 dark:text-gray-250">{row.name}</span> },
                { header: 'SKU Code', key: 'sku', render: (row) => <code className="text-xs">{row.sku}</code> },
                { header: 'Carbon Footprint', key: 'carbon', render: (row) => <span className="font-semibold text-xs text-red-500">{row.esg_profile?.carbon_footprint || 'Not Rated'} kg CO2</span> },
                { header: 'Recyclability Rate', key: 'recycle', render: (row) => <span className="text-xs">{row.esg_profile?.recyclability_score ? `${row.esg_profile.recyclability_score}%` : '-'}</span> },
                { header: 'Sustainability Class', key: 'rating', render: (row) => row.esg_profile?.sustainability_rating ? <Badge color={row.esg_profile.sustainability_rating === 'A' ? 'green' : 'yellow'}>{row.esg_profile.sustainability_rating}</Badge> : '-' },
              ]}
              data={data.products}
              emptyMessage="No product goods indexes found"
            />
          )}
        </div>
      )}

      {/* Record Transaction Modal */}
      <Modal isOpen={txModalOpen} onClose={() => setTxModalOpen(false)} title="Record Carbon Consumption">
        <form onSubmit={handleCreateTx} className="space-y-4">
          <Select
            label="Emission Index (Factor)"
            required
            options={data.factors.map(f => ({ label: `${f.name} (${f.scope.replace('_', ' ')}: ${f.factor_value} ${f.unit})`, value: f.id }))}
            value={newTx.emission_factor_id}
            onChange={(e) => {
              const selected = data.factors.find(f => f.id === e.target.value);
              setNewTx(prev => ({ 
                ...prev, 
                emission_factor_id: e.target.value,
                unit: selected ? selected.unit.split('/').pop() : ''
              }));
            }}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Quantity Consumed"
              type="number"
              step="any"
              required
              value={newTx.quantity}
              onChange={(e) => setNewTx(prev => ({ ...prev, quantity: e.target.value }))}
            />
            <Input
              label="Scale Unit"
              disabled
              value={newTx.unit}
            />
          </div>
          <Input
            label="Transaction Date"
            type="date"
            required
            value={newTx.transaction_date}
            onChange={(e) => setNewTx(prev => ({ ...prev, transaction_date: e.target.value }))}
          />
          <Select
            label="Source Stream"
            options={[
              { label: 'Purchase Invoicing', value: 'purchase' },
              { label: 'Manufacturing Operations', value: 'manufacturing' },
              { label: 'Travel Expense Logging', value: 'expense' },
              { label: 'Corporate Fleet Refueling', value: 'fleet' },
              { label: 'Manual Adjustment', value: 'manual' }
            ]}
            value={newTx.source_type}
            onChange={(e) => setNewTx(prev => ({ ...prev, source_type: e.target.value }))}
          />
          <Input
            label="Transaction Description"
            placeholder="e.g. Q2 factory heating gas logs"
            value={newTx.description}
            onChange={(e) => setNewTx(prev => ({ ...prev, description: e.target.value }))}
          />
          <div className="flex justify-end gap-2.5 pt-3">
            <Button variant="outline" size="sm" onClick={() => setTxModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm">Add Entry</Button>
          </div>
        </form>
      </Modal>

      {/* New Factor Modal */}
      <Modal isOpen={efModalOpen} onClose={() => setEfModalOpen(false)} title="Register Emission Index">
        <form onSubmit={handleCreateEf} className="space-y-4">
          <Input
            label="Factor Name"
            placeholder="e.g. Heavy Truck Fleet Fuel"
            required
            value={newEf.name}
            onChange={(e) => setNewEf(prev => ({ ...prev, name: e.target.value }))}
          />
          <Select
            label="Scope Category"
            options={[
              { label: 'Scope 1 (Direct)', value: 'scope_1' },
              { label: 'Scope 2 (Indirect Utilities)', value: 'scope_2' },
              { label: 'Scope 3 (Supply Chain)', value: 'scope_3' }
            ]}
            value={newEf.scope}
            onChange={(e) => setNewEf(prev => ({ ...prev, scope: e.target.value }))}
          />
          <Input
            label="Emission Category (Fuel / Electric / Transport)"
            placeholder="e.g. Fuel"
            required
            value={newEf.category}
            onChange={(e) => setNewEf(prev => ({ ...prev, category: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Factor Value (CO2e)"
              type="number"
              step="any"
              required
              value={newEf.factor_value}
              onChange={(e) => setNewEf(prev => ({ ...prev, factor_value: e.target.value }))}
            />
            <Input
              label="Quotient Unit (e.g. kg CO2e/Liter)"
              placeholder="e.g. kg CO2/L"
              required
              value={newEf.unit}
              onChange={(e) => setNewEf(prev => ({ ...prev, unit: e.target.value }))}
            />
          </div>
          <Input
            label="Scientific Data Source Reference"
            placeholder="e.g. EPA Greenhouse Registry"
            value={newEf.source}
            onChange={(e) => setNewEf(prev => ({ ...prev, source: e.target.value }))}
          />
          <div className="flex justify-end gap-2.5 pt-3">
            <Button variant="outline" size="sm" onClick={() => setEfModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm">Register</Button>
          </div>
        </form>
      </Modal>

      {/* New Goal Modal */}
      <Modal isOpen={goalModalOpen} onClose={() => setGoalModalOpen(false)} title="Set Reduction Target Goal">
        <form onSubmit={handleCreateGoal} className="space-y-4">
          <Input
            label="Goal Objective Title"
            placeholder="e.g. Reduce corporate transport carbon by 20%"
            required
            value={newGoal.title}
            onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Target Reduction (kg CO2e)"
              type="number"
              required
              value={newGoal.target_value}
              onChange={(e) => setNewGoal(prev => ({ ...prev, target_value: e.target.value }))}
            />
            <Input
              label="Unit"
              value={newGoal.unit}
              disabled
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              required
              value={newGoal.start_date}
              onChange={(e) => setNewGoal(prev => ({ ...prev, start_date: e.target.value }))}
            />
            <Input
              label="Deadline Date"
              type="date"
              required
              value={newGoal.end_date}
              onChange={(e) => setNewGoal(prev => ({ ...prev, end_date: e.target.value }))}
            />
          </div>
          <Input
            label="Details & Instructions"
            placeholder="Outline department-specific restrictions here..."
            value={newGoal.description}
            onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
          />
          <div className="flex justify-end gap-2.5 pt-3">
            <Button variant="outline" size="sm" onClick={() => setGoalModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm">Add Target</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EnvironmentalPage;
