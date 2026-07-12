import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { gamificationService } from '../services/gamificationService';
import { Card, Table, Badge, StatusBadge } from '../components/ui/DataDisplay';
import { Button, Input, Select } from '../components/ui/FormControls';
import { Modal, Loader } from '../components/ui/Overlays';
import { Award, Plus, Sparkles, TrendingUp, Trophy, Zap } from 'lucide-react';
import { formatDate } from '../utils/helpers';

const GamificationPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('challenges'); // challenges | badges | rewards | leaderboard
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ challenges: [], badges: [], rewards: [], leaderboards: { employees: [], departments: [] } });

  // Modals state
  const [challengeModalOpen, setChallengeModalOpen] = useState(false);
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [rewardModalOpen, setRewardModalOpen] = useState(false);

  // Form states
  const [newChallenge, setNewChallenge] = useState({ title: '', description: '', category_id: '', xp_reward: 100, difficulty: 'medium', deadline: '', max_participants: '' });
  const [newBadge, setNewBadge] = useState({ name: '', description: '', icon: 'Award', unlock_rule_type: 'xp_threshold', unlock_rule_value: 500 });
  const [newReward, setNewReward] = useState({ name: '', description: '', points_required: 150, stock: 10 });

  useEffect(() => {
    fetchGamificationData();
  }, [activeTab]);

  const fetchGamificationData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'challenges') {
        const res = await gamificationService.getChallenges();
        setData((prev) => ({ ...prev, challenges: res.items || [] }));
      } else if (activeTab === 'badges') {
        // Employee sees earned vs locked; Admin sees lists
        const res = await gamificationService.getBadges();
        setData((prev) => ({ ...prev, badges: res.items || [] }));
      } else if (activeTab === 'rewards') {
        const res = await gamificationService.getRewards();
        setData((prev) => ({ ...prev, rewards: res.items || [] }));
      } else if (activeTab === 'leaderboard') {
        const res = await gamificationService.getLeaderboard();
        setData((prev) => ({ ...prev, leaderboards: res || { employees: [], departments: [] } }));
      }
    } catch (err) {
      console.warn("API fail, using mocks for " + activeTab);
      loadMocks();
    } finally {
      setLoading(false);
    }
  };

  const loadMocks = () => {
    if (activeTab === 'challenges') {
      setData((prev) => ({
        ...prev,
        challenges: [
          { id: 'c1', title: 'Zero Waste Week', description: 'Avoid single-use plastics for 7 days and log daily packaging counts.', xp_reward: 100, difficulty: 'medium', deadline: '2026-07-20', status: 'active' },
          { id: 'c2', title: 'Eco-commuter Challenge', description: 'Walk, cycle, or use public transport to commute for a fortnight.', xp_reward: 250, difficulty: 'hard', deadline: '2026-07-25', status: 'active' },
          { id: 'c3', title: 'Paperless Office Campaign', description: 'Verify zero document prints for consecutive 10 workdays.', xp_reward: 80, difficulty: 'easy', deadline: '2026-06-30', status: 'completed' }
        ]
      }));
    } else if (activeTab === 'badges') {
      setData((prev) => ({
        ...prev,
        badges: [
          { id: 'b1', name: 'Carbon Saver I', description: 'Log first carbon transaction in emissions ledger.', icon: 'Leaf', unlocked: true },
          { id: 'b2', name: 'Community Pioneer', description: 'Participated in first CSR activity.', icon: 'Users', unlocked: true },
          { id: 'b3', name: 'Compliance Enforcer', description: 'Acknowledge all core ESG policies.', icon: 'ShieldCheck', unlocked: false },
          { id: 'b4', name: 'Green Elite', description: 'Accumulated over 1,000 XP points.', icon: 'Trophy', unlocked: false }
        ]
      }));
    } else if (activeTab === 'rewards') {
      setData((prev) => ({
        ...prev,
        rewards: [
          { id: 'r1', name: 'Sustainable Coffee Mug', description: 'Reusable stainless steel double-walled travel cup.', points_required: 200, stock: 12 },
          { id: 'r2', name: 'Plant a Tree in Your Name', description: 'We will plant a native tree and send you a certificate map.', points_required: 300, stock: 95 },
          { id: 'r3', name: 'Extra Half-Day Off', description: 'Deduct points to request half-day holiday allowance.', points_required: 1000, stock: 4 }
        ]
      }));
    } else if (activeTab === 'leaderboard') {
      setData((prev) => ({
        ...prev,
        leaderboards: {
          employees: [
            { name: 'Sarah Jenkins', department: 'Manufacturing', xp: 950 },
            { name: 'John Davis', department: 'Logistics', xp: 820 },
            { name: 'Alex Wong', department: 'Product Design', xp: 740 },
            { name: 'David Lee', department: 'Manufacturing', xp: 620 }
          ],
          departments: [
            { name: 'Manufacturing', score: 85.2, rank: 1 },
            { name: 'Logistics', score: 79.8, rank: 2 },
            { name: 'Product Design', score: 74.0, rank: 3 }
          ]
        }
      }));
    }
  };

  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    try {
      await gamificationService.createChallenge(newChallenge);
      setChallengeModalOpen(false);
      fetchGamificationData();
    } catch (err) {
      alert("Demo Mode: Sustainability challenge created.");
      setData(prev => ({
        ...prev,
        challenges: [
          { id: Date.now().toString(), ...newChallenge, status: 'active' },
          ...prev.challenges
        ]
      }));
      setChallengeModalOpen(false);
    }
  };

  const handleCreateBadge = async (e) => {
    e.preventDefault();
    try {
      await gamificationService.createBadge(newBadge);
      setBadgeModalOpen(false);
      fetchGamificationData();
    } catch (err) {
      alert("Demo Mode: Badge unlocked rules set.");
      setData(prev => ({
        ...prev,
        badges: [
          { id: Date.now().toString(), ...newBadge, unlocked: false },
          ...prev.badges
        ]
      }));
      setBadgeModalOpen(false);
    }
  };

  const handleCreateReward = async (e) => {
    e.preventDefault();
    try {
      await gamificationService.createReward(newReward);
      setRewardModalOpen(false);
      fetchGamificationData();
    } catch (err) {
      alert("Demo Mode: Reward uploaded to catalog.");
      setData(prev => ({
        ...prev,
        rewards: [
          { id: Date.now().toString(), ...newReward },
          ...prev.rewards
        ]
      }));
      setRewardModalOpen(false);
    }
  };

  const handleJoinChallenge = async (challengeId) => {
    try {
      await gamificationService.joinChallenge(challengeId);
      alert("Joined challenge successfully!");
    } catch (err) {
      alert("Demo Mode: Joined! Complete task milestones to claim points.");
    }
  };

  const handleRedeem = async (rewardId, cost) => {
    try {
      await gamificationService.redeemReward(rewardId);
      alert("Reward redeemed successfully! Deducted " + cost + " XP.");
    } catch (err) {
      alert("Demo Mode: Redeemed! Deducted " + cost + " XP.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Gamification Hub</h1>
          <p className="text-sm text-gray-500 mt-1">Participate in challenges, unlock badges, redeem rewards, and review rankings.</p>
        </div>
        {activeTab === 'challenges' && (user?.role === 'admin' || user?.role === 'esg_manager') && (
          <Button size="sm" onClick={() => setChallengeModalOpen(true)} className="gap-2 font-bold">
            <Plus className="w-4 h-4" /> Create Challenge
          </Button>
        )}
        {activeTab === 'badges' && user?.role === 'admin' && (
          <Button size="sm" onClick={() => setBadgeModalOpen(true)} className="gap-2 font-bold">
            <Plus className="w-4 h-4" /> Add Badge
          </Button>
        )}
        {activeTab === 'rewards' && user?.role === 'admin' && (
          <Button size="sm" onClick={() => setRewardModalOpen(true)} className="gap-2 font-bold">
            <Plus className="w-4 h-4" /> Add Reward
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-850 gap-2">
        <button
          onClick={() => setActiveTab('challenges')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2
            ${activeTab === 'challenges'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-400 hover:text-gray-650'
            }`}
        >
          Green Challenges
        </button>
        <button
          onClick={() => setActiveTab('badges')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2
            ${activeTab === 'badges'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-400 hover:text-gray-650'
            }`}
        >
          Badges Collection
        </button>
        <button
          onClick={() => setActiveTab('rewards')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2
            ${activeTab === 'rewards'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-400 hover:text-gray-650'
            }`}
        >
          Redeem Rewards
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2
            ${activeTab === 'leaderboard'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-400 hover:text-gray-650'
            }`}
        >
          Global Leaderboard
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <Loader />
      ) : (
        <div className="space-y-4">
          {activeTab === 'challenges' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.challenges.length === 0 ? (
                <p className="col-span-2 text-center text-xs text-gray-400 py-6">No green challenges available</p>
              ) : (
                data.challenges.map((c) => (
                  <Card key={c.id} className="flex flex-col justify-between h-48">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-gray-855 dark:text-gray-200">{c.title}</h4>
                        <StatusBadge status={c.status} />
                      </div>
                      <p className="text-xs text-gray-400 mt-2 leading-relaxed line-clamp-3">{c.description}</p>
                    </div>

                    <div className="pt-3 border-t border-gray-100 dark:border-gray-850 flex items-center justify-between mt-2">
                      <div className="flex gap-2.5 items-center text-xs font-bold text-indigo-650 dark:text-indigo-400">
                        <Zap className="w-4 h-4 text-indigo-500 shrink-0 animate-pulse" />
                        <span>+{c.xp_reward} XP</span>
                        <Badge color={c.difficulty === 'hard' ? 'red' : 'green'}>{c.difficulty}</Badge>
                      </div>
                      
                      {user?.role === 'employee' && c.status === 'active' && (
                        <Button size="sm" variant="outline" className="text-[11px]" onClick={() => handleJoinChallenge(c.id)}>
                          Join Challenge
                        </Button>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === 'badges' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {data.badges.map((b) => (
                <Card key={b.id} className={`flex flex-col items-center justify-center text-center p-6 border ${b.unlocked ? 'border-amber-250 bg-amber-50/5' : 'opacity-65 dark:border-gray-800'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-md
                    ${b.unlocked ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400 dark:bg-gray-900'}`}>
                    <Award className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-gray-850 dark:text-gray-200">{b.name}</h4>
                  <p className="text-[10px] text-gray-400 mt-1 leading-normal max-w-[150px]">{b.description}</p>
                  <div className="mt-3.5">
                    {b.unlocked ? (
                      <Badge color="green">UNLOCKED</Badge>
                    ) : (
                      <Badge color="gray">LOCKED</Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'rewards' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {data.rewards.length === 0 ? (
                <p className="col-span-3 text-center text-xs text-gray-400 py-6">No rewards registered</p>
              ) : (
                data.rewards.map((r) => (
                  <Card key={r.id} className="flex flex-col justify-between h-40">
                    <div>
                      <h4 className="text-sm font-bold text-gray-855 dark:text-gray-200">{r.name}</h4>
                      <p className="text-xs text-gray-400 mt-1.5 leading-relaxed line-clamp-2">{r.description}</p>
                    </div>

                    <div className="pt-3 border-t border-gray-100 dark:border-gray-850 flex items-center justify-between mt-2">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-indigo-650 dark:text-indigo-400">{r.points_required} XP</span>
                        <span className="text-[9px] text-gray-400 mt-0.5">Stock: {r.stock} available</span>
                      </div>
                      
                      {user?.role === 'employee' && (
                        <Button size="sm" variant="primary" className="text-[11px] py-1 px-3" onClick={() => handleRedeem(r.id, r.points_required)}>
                          Redeem
                        </Button>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Card>
                <h3 className="text-sm font-bold text-gray-850 dark:text-gray-200 mb-3.5 flex items-center gap-2">
                  <Trophy className="w-4.5 h-4.5 text-amber-500" /> Individual XP Leaderboard
                </h3>
                <Table
                  columns={[
                    { header: 'Rank', key: 'rank', render: (row, idx) => <span className="font-extrabold text-gray-400">#{idx+1}</span> },
                    { header: 'Employee', key: 'name', render: (row) => <span className="font-bold text-xs text-gray-850 dark:text-gray-250">{row.name}</span> },
                    { header: 'Department', key: 'department', render: (row) => <span className="text-xs">{row.department}</span> },
                    { header: 'Total Score', key: 'xp', render: (row) => <span className="font-bold text-xs text-indigo-600">{row.xp} XP</span> }
                  ]}
                  data={data.leaderboards.employees}
                />
              </Card>

              <Card>
                <h3 className="text-sm font-bold text-gray-855 dark:text-gray-200 mb-3.5 flex items-center gap-2">
                  <Trophy className="w-4.5 h-4.5 text-indigo-500 animate-pulse" /> Department Score Leaderboard
                </h3>
                <Table
                  columns={[
                    { header: 'Rank', key: 'rank', render: (row) => <span className="font-extrabold text-gray-400">#{row.rank}</span> },
                    { header: 'Department', key: 'name', render: (row) => <span className="font-bold text-xs text-gray-850 dark:text-gray-250">{row.name}</span> },
                    { header: 'ESG Weighted Score', key: 'score', render: (row) => <Badge color="green">{row.score} PTS</Badge> }
                  ]}
                  data={data.leaderboards.departments}
                />
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Create Challenge Modal */}
      <Modal isOpen={challengeModalOpen} onClose={() => setChallengeModalOpen(false)} title="Create Green Challenge">
        <form onSubmit={handleCreateChallenge} className="space-y-4">
          <Input
            label="Challenge Title"
            placeholder="e.g. Ride Bike to Work"
            required
            value={newChallenge.title}
            onChange={(e) => setNewChallenge(prev => ({ ...prev, title: e.target.value }))}
          />
          <Input
            label="Details & Milestones"
            placeholder="Outline daily checkins or upload instructions..."
            required
            value={newChallenge.description}
            onChange={(e) => setNewChallenge(prev => ({ ...prev, description: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="XP Reward"
              type="number"
              required
              value={newChallenge.xp_reward}
              onChange={(e) => setNewChallenge(prev => ({ ...prev, xp_reward: parseInt(e.target.value) }))}
            />
            <Select
              label="Difficulty"
              options={[
                { label: 'Easy', value: 'easy' },
                { label: 'Medium', value: 'medium' },
                { label: 'Hard', value: 'hard' },
                { label: 'Expert', value: 'expert' }
              ]}
              value={newChallenge.difficulty}
              onChange={(e) => setNewChallenge(prev => ({ ...prev, difficulty: e.target.value }))}
            />
          </div>
          <Input
            label="Deadline Date"
            type="date"
            required
            value={newChallenge.deadline}
            onChange={(e) => setNewChallenge(prev => ({ ...prev, deadline: e.target.value }))}
          />
          <div className="flex justify-end gap-2.5 pt-3">
            <Button variant="outline" size="sm" onClick={() => setChallengeModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm">Create Challenge</Button>
          </div>
        </form>
      </Modal>

      {/* Create Badge Modal */}
      <Modal isOpen={badgeModalOpen} onClose={() => setBadgeModalOpen(false)} title="Add Sustainability Badge">
        <form onSubmit={handleCreateBadge} className="space-y-4">
          <Input
            label="Badge Name"
            placeholder="e.g. Zero Printer Elite"
            required
            value={newBadge.name}
            onChange={(e) => setNewBadge(prev => ({ ...prev, name: e.target.value }))}
          />
          <Input
            label="Description"
            placeholder="Condition: Complete all print checklists..."
            required
            value={newBadge.description}
            onChange={(e) => setNewBadge(prev => ({ ...prev, description: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Unlock Rule Trigger"
              options={[
                { label: 'XP Point Threshold', value: 'xp_threshold' },
                { label: 'Challenges Completed Count', value: 'challenge_count' },
                { label: 'Manual Award by ESG Board', value: 'custom' }
              ]}
              value={newBadge.unlock_rule_type}
              onChange={(e) => setNewBadge(prev => ({ ...prev, unlock_rule_type: e.target.value }))}
            />
            <Input
              label="Unlock Target Value"
              type="number"
              required
              value={newBadge.unlock_rule_value}
              onChange={(e) => setNewBadge(prev => ({ ...prev, unlock_rule_value: parseInt(e.target.value) }))}
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-3">
            <Button variant="outline" size="sm" onClick={() => setBadgeModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm">Add Badge</Button>
          </div>
        </form>
      </Modal>

      {/* Add Reward Modal */}
      <Modal isOpen={rewardModalOpen} onClose={() => setRewardModalOpen(false)} title="Upload Reward to Catalog">
        <form onSubmit={handleCreateReward} className="space-y-4">
          <Input
            label="Reward Item Name"
            placeholder="e.g. Solarglasses Gift Voucher"
            required
            value={newReward.name}
            onChange={(e) => setNewReward(prev => ({ ...prev, name: e.target.value }))}
          />
          <Input
            label="Description Details"
            placeholder="Condition for delivery and specifications..."
            required
            value={newReward.description}
            onChange={(e) => setNewReward(prev => ({ ...prev, description: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="XP Cost"
              type="number"
              required
              value={newReward.points_required}
              onChange={(e) => setNewReward(prev => ({ ...prev, points_required: parseInt(e.target.value) }))}
            />
            <Input
              label="Initial Inventory Stock"
              type="number"
              required
              value={newReward.stock}
              onChange={(e) => setNewReward(prev => ({ ...prev, stock: parseInt(e.target.value) }))}
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-3">
            <Button variant="outline" size="sm" onClick={() => setRewardModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm">Upload Item</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default GamificationPage;
