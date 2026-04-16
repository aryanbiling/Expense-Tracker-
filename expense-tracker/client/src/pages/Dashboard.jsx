import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ExpenseForm from "../components/ExpenseForm.jsx";
import ExpenseList from "../components/ExpenseList.jsx";
import { clearSession, getUser } from "../services/auth.js";
import { fetchDashboardState, saveDashboardState } from "../services/dashboard.js";
import { createExpense, deleteExpense, fetchExpenses } from "../services/expenses.js";
import { formatCurrency } from "../utils/currency.js";

const initialGroups = [];
const initialBudgetConfig = {
  monthlyBudget: 50000,
  goalTarget: 80000
};

const NavItem = ({ active, label, onClick }) => (
  <button className={`nav-item ${active ? "active" : ""}`} type="button" onClick={onClick}>
    <span className="dot" />
    {label}
  </button>
);

const StatPill = ({ label, value, trend, tone }) => (
  <div className={`stat-pill ${tone}`}>
    <div>
      <p>{label}</p>
      <h3>{value}</h3>
    </div>
    <span className="trend">{trend}</span>
  </div>
);

const Insight = ({ text }) => (
  <div className="insight">
    <span className="spark" />
    <p>{text}</p>
  </div>
);

const OverviewCard = ({ title, value, subtitle }) => (
  <div className="overview-card">
    <p>{title}</p>
    <h3>{value}</h3>
    <span>{subtitle}</span>
  </div>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getUser();
  const [expenses, setExpenses] = useState([]);
  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState(initialGroups);
  const [goals, setGoals] = useState([]);
  const [budgetConfig, setBudgetConfig] = useState(initialBudgetConfig);
  const [budgetForm, setBudgetForm] = useState({
    monthlyBudget: "50000",
    goalTarget: "80000"
  });
  const [goalForm, setGoalForm] = useState({
    name: "",
    saved: "",
    target: ""
  });
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showFriendForm, setShowFriendForm] = useState(false);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [friendForm, setFriendForm] = useState({ name: "", amount: "", type: "owed" });
  const [groupForm, setGroupForm] = useState({ name: "", members: "", total: "" });
  const [groupMemberForm, setGroupMemberForm] = useState({ name: "", amount: "", type: "owed" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const getItemId = (item) => item?._id || item?.id;

  const applyDashboardState = (state) => {
    const nextBudget = state?.budgetConfig || initialBudgetConfig;
    setFriends(state?.friends || []);
    setGroups(state?.groups || []);
    setGoals(state?.goals || []);
    setBudgetConfig(nextBudget);
    setBudgetForm({
      monthlyBudget: String(nextBudget.monthlyBudget ?? initialBudgetConfig.monthlyBudget),
      goalTarget: String(nextBudget.goalTarget ?? initialBudgetConfig.goalTarget)
    });
  };

  const persistDashboard = async (nextState) => {
    const saved = await saveDashboardState(nextState);
    applyDashboardState(saved);
    return saved;
  };

  const totals = useMemo(() => {
    const month = new Date().getMonth();
    const year = new Date().getFullYear();

    const monthExpenses = expenses.filter((item) => {
      const date = new Date(item.date);
      return date.getMonth() === month && date.getFullYear() === year;
    });

    const total = monthExpenses.reduce((sum, item) => sum + item.amount, 0);
    const last7 = expenses.filter((item) => {
      const date = new Date(item.date);
      const diff = Date.now() - date.getTime();
      return diff <= 7 * 24 * 60 * 60 * 1000;
    });
    const weekly = last7.reduce((sum, item) => sum + item.amount, 0);

    const categories = monthExpenses.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.amount;
      return acc;
    }, {});
    const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];

    return {
      total,
      weekly,
      topCategory: topCategory ? `${topCategory[0]} (${formatCurrency(topCategory[1])})` : "-"
    };
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return expenses;

    return expenses.filter((item) =>
      [item.title, item.category, item.note]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [expenses, searchQuery]);

  const filteredFriends = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return friends;
    return friends.filter((friend) => friend.name.toLowerCase().includes(query));
  }, [friends, searchQuery]);

  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return groups;
    return groups.filter((group) => group.name.toLowerCase().includes(query));
  }, [groups, searchQuery]);

  const selectedGroup = useMemo(
    () => groups.find((group) => getItemId(group) === selectedGroupId) || null,
    [groups, selectedGroupId]
  );

  const filteredGoals = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return goals;
    return goals.filter((goal) => goal.label.toLowerCase().includes(query));
  }, [goals, searchQuery]);

  const categoryTotals = useMemo(() => {
    return expenses.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.amount;
      return acc;
    }, {});
  }, [expenses]);

  const totalBudget = useMemo(() => budgetConfig.monthlyBudget, [budgetConfig.monthlyBudget]);
  const budgetLeft = useMemo(() => Math.max(totalBudget - totals.total, 0), [totalBudget, totals.total]);
  const monthlyGoal = budgetConfig.goalTarget;
  const goalProgress = Math.min((budgetLeft / monthlyGoal) * 100, 100);
  const searchLabel = searchQuery.trim() ? `Results for "${searchQuery}"` : "Overview";
  const leadingGoal = useMemo(() => {
    if (!goals.length) return null;
    return [...goals].sort((a, b) => (b.saved / Math.max(b.target, 1)) - (a.saved / Math.max(a.target, 1)))[0];
  }, [goals]);
  const dashboardInsights = useMemo(() => {
    const items = [];
    const topCategoryEntry = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    const friendsNet = friends.reduce((sum, friend) => sum + friend.balance, 0);
    const totalGroupSpend = groups.reduce((sum, group) => sum + group.total, 0);

    if (expenses.length) {
      items.push(`You have logged ${expenses.length} expense${expenses.length > 1 ? "s" : ""} worth ${formatCurrency(expenses.reduce((sum, item) => sum + item.amount, 0))}.`);
    } else {
      items.push("Add your first expense to unlock smarter insights on spending patterns.");
    }

    if (topCategoryEntry) {
      items.push(`${topCategoryEntry[0]} is your top category at ${formatCurrency(topCategoryEntry[1])}.`);
    } else {
      items.push("No category trend yet. Once expenses are added, your top spending bucket will show here.");
    }

    if (friends.length) {
      items.push(
        friendsNet >= 0
          ? `Your net friend balance is positive at ${formatCurrency(friendsNet)}.`
          : `You currently owe friends ${formatCurrency(Math.abs(friendsNet))} overall.`
      );
    } else {
      items.push("No friend balances yet. Add a friend entry to start tracking shared dues.");
    }

    if (groups.length) {
      items.push(`You are tracking ${groups.length} group${groups.length > 1 ? "s" : ""} with ${formatCurrency(totalGroupSpend)} in total grouped spend.`);
    } else {
      items.push("No groups created yet. Groups can help separate flat, trip, or event spending.");
    }

    if (goals.length) {
      items.push(`You have ${goals.length} active goal${goals.length > 1 ? "s" : ""}, and the strongest one is ${leadingGoal.label} at ${Math.min((leadingGoal.saved / Math.max(leadingGoal.target, 1)) * 100, 100).toFixed(0)}% complete.`);
    } else {
      items.push("No active goals yet. Add a goal to see savings progress here.");
    }

    if (totalBudget) {
      items.push(`Your monthly budget is ${formatCurrency(totalBudget)}, with ${formatCurrency(budgetLeft)} still available.`);
    }

    return items.slice(0, 5);
  }, [budgetLeft, categoryTotals, expenses, friends, goals, groups, leadingGoal, totalBudget]);

  const hasSearchResults = Boolean(searchQuery.trim()) && (
    filteredExpenses.length ||
    filteredFriends.length ||
    filteredGroups.length ||
    filteredGoals.length
  );

  const notifications = useMemo(() => {
    const items = [];

    if (totals.total > totalBudget) {
      items.push({
        id: "budget-over",
        title: "Budget exceeded",
        body: `You are over budget by ${formatCurrency(totals.total - totalBudget)} this month.`,
        action: () => setActiveNav("Budgets")
      });
    } else {
      items.push({
        id: "budget-left",
        title: "Budget available",
        body: `${formatCurrency(budgetLeft)} is still available in this month's budget.`,
        action: () => setActiveNav("Budgets")
      });
    }

    if (goalProgress < 40) {
      items.push({
        id: "goal-progress",
        title: "Goal progress is behind",
        body: `Your current goal progress is ${goalProgress.toFixed(0)}%. Review goals for adjustments.`,
        action: () => setActiveNav("Goals")
      });
    }

    if (searchQuery.trim()) {
      items.push({
        id: "search-active",
        title: "Search filter active",
        body: `Showing filtered results for "${searchQuery}". Tap to clear it.`,
        action: () => setSearchQuery("")
      });
    }

    if (!friends.length) {
      items.push({
        id: "friends-empty",
        title: "Friends list is empty",
        body: "Add a friend to start tracking balances.",
        action: () => {
          setActiveNav("Dashboard");
          setShowFriendForm(true);
        }
      });
    }

    if (!groups.length) {
      items.push({
        id: "groups-empty",
        title: "No groups yet",
        body: "Create a group to organize shared expenses.",
        action: () => {
          setActiveNav("Dashboard");
          setShowGroupForm(true);
        }
      });
    }

    if (!expenses.length) {
      items.push({
        id: "expenses-empty",
        title: "No expenses added",
        body: "Add your first expense to unlock analytics and budgets.",
        action: () => setActiveNav("Dashboard")
      });
    }

    return items;
  }, [budgetLeft, expenses.length, friends.length, goalProgress, groups.length, searchQuery, totals.total, totalBudget]);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const [expenseData, dashboardData] = await Promise.all([
        fetchExpenses(),
        fetchDashboardState()
      ]);
      setExpenses(expenseData);
      applyDashboardState(dashboardData);
    } catch (err) {
      setError(err.message || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleAdd = async (payload) => {
    setError("");
    try {
      const newExpense = await createExpense(payload);
      setExpenses((prev) => [newExpense, ...prev]);
    } catch (err) {
      setError(err.message || "Failed to create expense");
    }
  };

  const handleDelete = async (id) => {
    setError("");
    try {
      await deleteExpense(id);
      setExpenses((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      setError(err.message || "Failed to delete expense");
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate("/auth");
  };

  const handleNotificationClick = (notification) => {
    notification.action?.();
    setShowNotifications(false);
  };

  const handleFriendInput = (e) => {
    const { name, value } = e.target;
    setFriendForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGroupInput = (e) => {
    const { name, value } = e.target;
    setGroupForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBudgetInput = (e) => {
    const { name, value } = e.target;
    setBudgetForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGoalInput = (e) => {
    const { name, value } = e.target;
    setGoalForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGroupMemberInput = (e) => {
    const { name, value } = e.target;
    setGroupMemberForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddFriend = (e) => {
    e.preventDefault();
    if (!friendForm.name || !friendForm.amount) return;

    const amount = Number(friendForm.amount);
    const signedAmount = friendForm.type === "owed" ? amount : -amount;
    const nextFriends = [{ name: friendForm.name, balance: signedAmount }, ...friends];

    persistDashboard({
      budgetConfig,
      friends: nextFriends,
      groups,
      goals
    })
      .then(() => {
        setFriendForm({ name: "", amount: "", type: "owed" });
        setShowFriendForm(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to save friend");
      });
  };

  const handleDeleteFriend = (id) => {
    const nextFriends = friends.filter((friend) => getItemId(friend) !== id);
    persistDashboard({
      budgetConfig,
      friends: nextFriends,
      groups,
      goals
    }).catch((err) => {
      setError(err.message || "Failed to update friend list");
    });
  };

  const handleAddGroup = (e) => {
    e.preventDefault();
    if (!groupForm.name || !groupForm.members || !groupForm.total) return;

    const newGroup = {
      name: groupForm.name,
      members: Number(groupForm.members),
      total: Number(groupForm.total),
      balances: []
    };
    const nextGroups = [newGroup, ...groups];

    persistDashboard({
      budgetConfig,
      friends,
      groups: nextGroups,
      goals
    })
      .then((saved) => {
        const savedGroup = saved.groups[0];
        setGroupForm({ name: "", members: "", total: "" });
        setSearchQuery("");
        setShowGroupForm(false);
        setActiveNav("Dashboard");
        setSelectedGroupId(getItemId(savedGroup) || null);
      })
      .catch((err) => {
        setError(err.message || "Failed to save group");
      });
  };

  const handleAddGroupMember = (e) => {
    e.preventDefault();
    if (!selectedGroupId || !groupMemberForm.name || !groupMemberForm.amount) return;

    const amount = Number(groupMemberForm.amount);
    const signedAmount = groupMemberForm.type === "owed" ? amount : -amount;

    const nextGroups = groups.map((group) => {
      if (getItemId(group) !== selectedGroupId) return group;

      const balances = group.balances || [];
      return {
        ...group,
        balances: [...balances, { name: groupMemberForm.name, balance: signedAmount }]
      };
    });

    persistDashboard({
      budgetConfig,
      friends,
      groups: nextGroups,
      goals
    })
      .then(() => {
        setGroupMemberForm({ name: "", amount: "", type: "owed" });
      })
      .catch((err) => {
        setError(err.message || "Failed to save group balance");
      });
  };

  const handleDeleteGroupMember = (memberId) => {
    if (!selectedGroupId) return;

    const nextGroups = groups.map((group) => {
      if (getItemId(group) !== selectedGroupId) return group;
      return {
        ...group,
        balances: (group.balances || []).filter((member) => getItemId(member) !== memberId)
      };
    });

    persistDashboard({
      budgetConfig,
      friends,
      groups: nextGroups,
      goals
    }).catch((err) => {
      setError(err.message || "Failed to update group balance");
    });
  };

  const handleSaveBudget = (e) => {
    e.preventDefault();
    if (!budgetForm.monthlyBudget || !budgetForm.goalTarget) return;

    const nextBudget = {
      monthlyBudget: Number(budgetForm.monthlyBudget),
      goalTarget: Number(budgetForm.goalTarget)
    };

    persistDashboard({
      budgetConfig: nextBudget,
      friends,
      groups,
      goals
    }).catch((err) => {
      setError(err.message || "Failed to save budget");
    });
  };

  const handleAddGoal = (e) => {
    e.preventDefault();
    if (!goalForm.name || !goalForm.saved || !goalForm.target) return;

    const nextGoal = {
      _id: editingGoalId || undefined,
      label: goalForm.name,
      saved: Number(goalForm.saved),
      target: Number(goalForm.target)
    };

    const nextGoals = editingGoalId
      ? goals.map((goal) => (getItemId(goal) === editingGoalId ? nextGoal : goal))
      : [nextGoal, ...goals];

    persistDashboard({
      budgetConfig,
      friends,
      groups,
      goals: nextGoals
    })
      .then(() => {
        setGoalForm({ name: "", saved: "", target: "" });
        setEditingGoalId(null);
        setShowGoalForm(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to save goal");
      });
  };

  const handleEditGoal = (goal) => {
    setGoalForm({
      name: goal.label,
      saved: String(goal.saved),
      target: String(goal.target)
    });
    setEditingGoalId(getItemId(goal));
    setShowGoalForm(true);
  };

  const handleDeleteGoal = (id) => {
    const nextGoals = goals.filter((goal) => getItemId(goal) !== id);
    persistDashboard({
      budgetConfig,
      friends,
      groups,
      goals: nextGoals
    })
      .then(() => {
        if (editingGoalId === id) {
          setGoalForm({ name: "", saved: "", target: "" });
          setEditingGoalId(null);
          setShowGoalForm(false);
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to delete goal");
      });
  };

  const renderDashboardTab = () => (
    <>
      <section className="stat-grid">
        <StatPill label="This month" value={formatCurrency(totals.total)} trend="+4.2%" tone="purple" />
        <StatPill label="Last 7 days" value={formatCurrency(totals.weekly)} trend="-1.3%" tone="teal" />
        <StatPill label="Top category" value={totals.topCategory} trend="Food" tone="amber" />
        <div className="savings-card">
          <h4>Savings goal</h4>
          <p>{leadingGoal ? leadingGoal.label : "No goal added yet"}</p>
          <div className="progress">
            <div style={{ width: `${leadingGoal ? Math.min((leadingGoal.saved / Math.max(leadingGoal.target, 1)) * 100, 100) : 0}%` }} />
          </div>
          <span>
            {leadingGoal
              ? `${Math.min((leadingGoal.saved / Math.max(leadingGoal.target, 1)) * 100, 100).toFixed(0)}% complete`
              : "Add a goal in the Goals tab"}
          </span>
        </div>
      </section>

      <section className="content-grid">
          <div className="panel wide">
            <div className="panel-header">
              <div>
                <h2>Add an expense</h2>
              <p>Keep entries clean so you can spot trends later.</p>
            </div>
          </div>
          <ExpenseForm onSubmit={handleAdd} />
        </div>

          <div className="panel insights">
            <h3>Smart insights</h3>
            {dashboardInsights.map((item) => (
              <Insight key={item} text={item} />
            ))}
          </div>
        </section>

        <section className="content-grid">
          <div className="panel wide">
            <div className="panel-header">
              <div>
                <h2>Groups</h2>
                <p>Track shared buckets and quick totals.</p>
              </div>
              <div className="panel-actions">
                <span className="muted">{filteredGroups.length} visible</span>
                <button
                  className="ghost small-button"
                  type="button"
                  onClick={() => setShowGroupForm(true)}
                >
                  Add Group
                </button>
              </div>
            </div>
            {showGroupForm ? (
              <form className="mini-form inline-form" onSubmit={handleAddGroup}>
                <input
                  name="name"
                  placeholder="Group name"
                  value={groupForm.name}
                  onChange={handleGroupInput}
                />
                <input
                  name="members"
                  type="number"
                  min="1"
                  placeholder="Members"
                  value={groupForm.members}
                  onChange={handleGroupInput}
                />
                <input
                  name="total"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Total amount"
                  value={groupForm.total}
                  onChange={handleGroupInput}
                />
                <button className="ghost small-button" type="submit">Save Group</button>
              </form>
            ) : null}
            <div className="group-grid">
              {filteredGroups.length ? filteredGroups.map((group) => (
                <button
                  className={`group-card ${selectedGroupId === getItemId(group) ? "selected" : ""}`}
                  key={getItemId(group)}
                  type="button"
                  onClick={() => setSelectedGroupId(getItemId(group))}
                >
                  <h4>{group.name}</h4>
                  <p>{group.members} members</p>
                  <strong>{formatCurrency(group.total)}</strong>
                  <span className="group-card-link">Open details</span>
                </button>
              )) : <div className="empty">No groups yet. Use Add Group to create your first one.</div>}
            </div>
            {selectedGroup ? (
              <div className="group-detail-panel">
                <div className="panel-header">
                  <div>
                    <h3>{selectedGroup.name}</h3>
                    <p>
                      {selectedGroup.members} members • {formatCurrency(selectedGroup.total)} total
                    </p>
                  </div>
                  <button className="ghost small-button" type="button" onClick={() => setSelectedGroupId(null)}>
                    Close
                  </button>
                </div>
                <form className="mini-form inline-form" onSubmit={handleAddGroupMember}>
                  <input
                    name="name"
                    placeholder="Friend name"
                    value={groupMemberForm.name}
                    onChange={handleGroupMemberInput}
                  />
                  <input
                    name="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Amount"
                    value={groupMemberForm.amount}
                    onChange={handleGroupMemberInput}
                  />
                  <select name="type" value={groupMemberForm.type} onChange={handleGroupMemberInput}>
                    <option value="owed">They owe you</option>
                    <option value="owe">You owe them</option>
                  </select>
                  <button className="ghost small-button" type="submit">Add Member Balance</button>
                </form>
                <div className="stack-list">
                  {(selectedGroup.balances || []).length ? selectedGroup.balances.map((member) => (
                    <div className="group-balance-row" key={getItemId(member)}>
                      <div>
                        <h4>{member.name}</h4>
                        <span>
                          {member.balance >= 0
                            ? `Owes you ${formatCurrency(member.balance)}`
                            : `You owe ${formatCurrency(Math.abs(member.balance))}`}
                        </span>
                      </div>
                      <div className="group-balance-actions">
                        <strong className={member.balance >= 0 ? "pos" : "neg"}>
                          {member.balance >= 0 ? "+" : "-"}{formatCurrency(Math.abs(member.balance))}
                        </strong>
                        <button
                          className="ghost small-button"
                          type="button"
                          onClick={() => handleDeleteGroupMember(getItemId(member))}
                        >
                          Mark Settled
                        </button>
                      </div>
                    </div>
                  )) : <div className="empty">No balances added yet. Add who owes whom for this group.</div>}
                </div>
              </div>
            ) : null}
          </div>

        <div className="panel insights">
          <h3>Quick actions</h3>
          <div className="action-chip" onClick={() => setShowGroupForm(true)} role="button" tabIndex={0}>
            Create a new group
          </div>
          <div className="action-chip" onClick={() => setShowFriendForm(true)} role="button" tabIndex={0}>
            Add a friend balance
          </div>
          <div className="action-chip" onClick={() => setSearchQuery("")} role="button" tabIndex={0}>
            Clear search
          </div>
          </div>
      </section>

      <section className="content-grid">
        <div className="panel wide">
          <div className="panel-header">
            <div>
              <h2>Recent expenses</h2>
              <p>Your latest activity appears here.</p>
            </div>
            <span className="muted">
              {loading ? "Loading..." : `${filteredExpenses.length} visible`}
            </span>
          </div>
          {error ? <div className="error">{error}</div> : null}
          <ExpenseList items={filteredExpenses} onDelete={handleDelete} />
        </div>

          <div className="panel friends">
            <h3>Friends list</h3>
            {showFriendForm ? (
            <form className="mini-form" onSubmit={handleAddFriend}>
              <input
                name="name"
                placeholder="Friend name"
                value={friendForm.name}
                onChange={handleFriendInput}
              />
              <input
                name="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount"
                value={friendForm.amount}
                onChange={handleFriendInput}
              />
              <select name="type" value={friendForm.type} onChange={handleFriendInput}>
                <option value="owed">They owe you</option>
                <option value="owe">You owe them</option>
              </select>
              <button className="ghost small-button" type="submit">Save Friend</button>
            </form>
          ) : null}
            {filteredFriends.length ? filteredFriends.map((friend) => (
              <div className="friend" key={getItemId(friend)}>
                <div className="avatar small">{friend.name[0]}</div>
                <div>
                  <p>{friend.name}</p>
                <span>
                  {friend.balance >= 0
                    ? `Owes you ${formatCurrency(friend.balance)}`
                    : `You owe ${formatCurrency(Math.abs(friend.balance))}`}
                </span>
                </div>
                <strong className={friend.balance >= 0 ? "pos" : "neg"}>
                  {friend.balance >= 0 ? "+" : "-"}{formatCurrency(Math.abs(friend.balance))}
                </strong>
                <button
                  className="ghost settle-button"
                  type="button"
                  onClick={() => handleDeleteFriend(getItemId(friend))}
                >
                  Mark Paid
                </button>
              </div>
            )) : <div className="empty">No friends match your search.</div>}
            <button className="primary" type="button" onClick={() => setShowFriendForm((prev) => !prev)}>
              {showFriendForm ? "Close Friend Form" : "Add Friend"}
            </button>
        </div>
      </section>
    </>
  );

  const renderAnalyticsTab = () => (
    <>
      <section className="stat-grid">
        <OverviewCard title="Spending trend" value={formatCurrency(totals.total)} subtitle="Current month spend" />
        <OverviewCard title="Average expense" value={formatCurrency(filteredExpenses.length ? totals.total / filteredExpenses.length : 0)} subtitle="Per visible transaction" />
        <OverviewCard title="Budget left" value={formatCurrency(budgetLeft)} subtitle="Available this month" />
        <OverviewCard title="Search view" value={searchLabel} subtitle={`${filteredExpenses.length} matching expenses`} />
      </section>

      <section className="content-grid analytics-grid">
        <div className="panel wide">
          <div className="panel-header">
            <div>
              <h2>Category breakdown</h2>
              <p>Visible expenses grouped by category.</p>
            </div>
          </div>
          <div className="stack-list">
            {filteredExpenses.length ? Object.entries(
              filteredExpenses.reduce((acc, item) => {
                acc[item.category] = (acc[item.category] || 0) + item.amount;
                return acc;
              }, {})
            ).sort((a, b) => b[1] - a[1]).map(([category, amount]) => (
              <div className="stack-row" key={category}>
                <div>
                  <h4>{category}</h4>
                  <span>{((amount / Math.max(totals.total || amount, 1)) * 100).toFixed(0)}% of monthly total</span>
                </div>
                <strong>{formatCurrency(amount)}</strong>
              </div>
            )) : <div className="empty">Add expenses to view analytics.</div>}
          </div>
        </div>

        <div className="panel insights">
          <h3>Insights summary</h3>
          <Insight text={`Your visible transactions total ${formatCurrency(filteredExpenses.reduce((sum, item) => sum + item.amount, 0))}.`} />
          <Insight text={`You have ${filteredGroups.length} active groups in view.`} />
          <Insight text={`Friends net position is ${formatCurrency(filteredFriends.reduce((sum, friend) => sum + friend.balance, 0))}.`} />
        </div>
      </section>
    </>
  );

  const renderTransactionsTab = () => (
    <>
      <section className="stat-grid">
        <OverviewCard title="All transactions" value={String(filteredExpenses.length)} subtitle="Visible after search" />
        <OverviewCard title="Highest expense" value={formatCurrency(filteredExpenses.reduce((max, item) => Math.max(max, item.amount), 0))} subtitle="Largest visible amount" />
        <OverviewCard title="Latest category" value={filteredExpenses[0]?.category || "-"} subtitle="Most recent entry" />
        <OverviewCard title="Search state" value={searchQuery || "None"} subtitle="Active transaction filter" />
      </section>

      <section className="content-grid">
        <div className="panel wide">
          <div className="panel-header">
            <div>
              <h2>Transaction history</h2>
              <p>Use search to narrow by title, category, or note.</p>
            </div>
          </div>
          {error ? <div className="error">{error}</div> : null}
          <ExpenseList items={filteredExpenses} onDelete={handleDelete} />
        </div>

        <div className="panel insights">
          <h3>Transaction tools</h3>
          <div className="action-chip" onClick={() => setSearchQuery("food")} role="button" tabIndex={0}>
            Filter food
          </div>
          <div className="action-chip" onClick={() => setSearchQuery("travel")} role="button" tabIndex={0}>
            Filter travel
          </div>
          <div className="action-chip" onClick={() => setSearchQuery("")} role="button" tabIndex={0}>
            Show all transactions
          </div>
        </div>
      </section>
    </>
  );

  const renderBudgetsTab = () => (
    <>
      <section className="stat-grid">
        <OverviewCard title="Planned budget" value={formatCurrency(totalBudget)} subtitle="Working monthly budget" />
        <OverviewCard title="Spent so far" value={formatCurrency(totals.total)} subtitle="Current month actuals" />
        <OverviewCard title="Left to spend" value={formatCurrency(budgetLeft)} subtitle="Before hitting budget" />
        <OverviewCard title="Usage" value={`${Math.min((totals.total / Math.max(totalBudget, 1)) * 100, 100).toFixed(0)}%`} subtitle="Budget consumed" />
      </section>

      <section className="content-grid">
        <div className="panel wide">
          <div className="panel-header">
            <div>
              <h2>Budget lanes</h2>
              <p>Simple planning buckets based on your current spending.</p>
            </div>
          </div>
          <div className="stack-list">
            {[
              { label: "Needs", spent: totals.total * 0.45, cap: totalBudget * 0.5 },
              { label: "Lifestyle", spent: totals.total * 0.3, cap: totalBudget * 0.25 },
              { label: "Savings", spent: totals.total * 0.1, cap: totalBudget * 0.15 },
              { label: "Buffer", spent: totals.total * 0.15, cap: totalBudget * 0.1 }
            ].map((bucket) => (
              <div className="budget-card" key={bucket.label}>
                <div className="panel-header">
                  <h4>{bucket.label}</h4>
                  <strong>{formatCurrency(bucket.spent)}</strong>
                </div>
                <div className="progress">
                  <div style={{ width: `${Math.min((bucket.spent / Math.max(bucket.cap, 1)) * 100, 100)}%` }} />
                </div>
                <span>Cap {formatCurrency(bucket.cap)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel insights">
          <h3>Budget settings</h3>
          <form className="mini-form" onSubmit={handleSaveBudget}>
            <input
              name="monthlyBudget"
              type="number"
              min="0"
              step="0.01"
              placeholder="Monthly budget"
              value={budgetForm.monthlyBudget}
              onChange={handleBudgetInput}
            />
            <input
              name="goalTarget"
              type="number"
              min="0"
              step="0.01"
              placeholder="Goal target"
              value={budgetForm.goalTarget}
              onChange={handleBudgetInput}
            />
            <button className="primary" type="submit">Save Budget</button>
          </form>
          <Insight text={`You can still allocate ${formatCurrency(budgetLeft)} this month.`} />
          <Insight text="Lifestyle spend is the first category to watch if you need to trim." />
        </div>
      </section>
    </>
  );

  const renderGoalsTab = () => (
    <>
      <section className="stat-grid">
        <OverviewCard title="Goal target" value={formatCurrency(monthlyGoal)} subtitle="Primary savings target" />
        <OverviewCard title="Current progress" value={`${goalProgress.toFixed(0)}%`} subtitle="Based on remaining budget" />
        <OverviewCard title="Available to move" value={formatCurrency(budgetLeft)} subtitle="Can be moved into goals" />
        <OverviewCard title="Active goals" value={String(goals.length)} subtitle={goals.length ? goals.map((goal) => goal.label).join(", ") : "Add your first goal"} />
      </section>

      <section className="content-grid">
        <div className="panel wide">
          <div className="panel-header">
            <div>
              <h2>Goal tracker</h2>
              <p>Each goal has its own progress line and status.</p>
            </div>
            <button
              className="primary"
              type="button"
              onClick={() => {
                if (showGoalForm) {
                  setShowGoalForm(false);
                  setEditingGoalId(null);
                  setGoalForm({ name: "", saved: "", target: "" });
                } else {
                  setShowGoalForm(true);
                }
              }}
            >
              {showGoalForm ? "Close Goal Form" : "Add Goal"}
            </button>
          </div>
          {showGoalForm ? (
            <form className="mini-form goal-form" onSubmit={handleAddGoal}>
              <input
                name="name"
                placeholder="Goal name"
                value={goalForm.name}
                onChange={handleGoalInput}
              />
              <input
                name="saved"
                type="number"
                min="0"
                step="0.01"
                placeholder="Already saved"
                value={goalForm.saved}
                onChange={handleGoalInput}
              />
              <input
                name="target"
                type="number"
                min="0"
                step="0.01"
                placeholder="Target amount"
                value={goalForm.target}
                onChange={handleGoalInput}
              />
              <button className="ghost small-button" type="submit">
                {editingGoalId ? "Update Goal" : "Save Goal"}
              </button>
            </form>
          ) : null}
          <div className="stack-list">
            {goals.length ? goals.map((goal) => (
              <div className="goal-card" key={goal.label}>
                <div className="panel-header">
                  <div>
                    <h4>{goal.label}</h4>
                    <span>{formatCurrency(goal.saved)} saved</span>
                  </div>
                  <strong>{Math.min((goal.saved / goal.target) * 100, 100).toFixed(0)}%</strong>
                </div>
                <div className="progress">
                  <div style={{ width: `${Math.min((goal.saved / goal.target) * 100, 100)}%` }} />
                </div>
                <span>Target {formatCurrency(goal.target)}</span>
                <div className="goal-actions">
                  <button className="ghost small-button" type="button" onClick={() => handleEditGoal(goal)}>
                    Edit
                  </button>
                  <button className="ghost small-button" type="button" onClick={() => handleDeleteGoal(getItemId(goal))}>
                    Delete
                  </button>
                </div>
              </div>
            )) : <div className="empty">No goals yet. Add a goal to start tracking progress.</div>}
          </div>
        </div>

        <div className="panel insights">
          <h3>Goal actions</h3>
          <div className="action-chip" onClick={() => setShowGoalForm(true)} role="button" tabIndex={0}>
            Add a new goal
          </div>
          <div className="action-chip" onClick={() => setActiveNav("Budgets")} role="button" tabIndex={0}>
            Review budgets first
          </div>
          <div className="action-chip" onClick={() => setSearchQuery("")} role="button" tabIndex={0}>
            Reset search context
          </div>
          <Insight text="Once recurring savings are added, this section can become fully dynamic." />
        </div>
      </section>
    </>
  );

  const renderActiveTab = () => {
    if (activeNav === "Analytics") return renderAnalyticsTab();
    if (activeNav === "Transactions") return renderTransactionsTab();
    if (activeNav === "Budgets") return renderBudgetsTab();
    if (activeNav === "Goals") return renderGoalsTab();
    return renderDashboardTab();
  };

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">ET</div>
          <div>
            <h2>Expense Tracker</h2>
            <p>Manage, split, simplify</p>
          </div>
        </div>
        <nav className="nav">
          {["Dashboard", "Analytics", "Transactions", "Budgets", "Goals"].map((label) => (
            <NavItem
              key={label}
              active={activeNav === label}
              label={label}
              onClick={() => setActiveNav(label)}
            />
          ))}
        </nav>
        <div className="sidebar-card">
          <p>Welcome back,</p>
          <h3>{user?.name || "there"}</h3>
          <button className="primary" type="button" onClick={() => setShowGroupForm((prev) => !prev)}>
            {showGroupForm ? "Close Group Form" : "Add Group"}
          </button>
          {showGroupForm ? (
            <form className="mini-form" onSubmit={handleAddGroup}>
              <input
                name="name"
                placeholder="Group name"
                value={groupForm.name}
                onChange={handleGroupInput}
              />
              <input
                name="members"
                type="number"
                min="1"
                placeholder="Members"
                value={groupForm.members}
                onChange={handleGroupInput}
              />
              <input
                name="total"
                type="number"
                min="0"
                step="0.01"
                placeholder="Total amount"
                value={groupForm.total}
                onChange={handleGroupInput}
              />
              <button className="ghost small-button" type="submit">Save Group</button>
            </form>
          ) : null}
        </div>
        <button className="ghost" onClick={handleLogout}>Log out</button>
      </aside>

      <main className="dashboard-main">
        <header className="topbar">
          <div>
            <h1>{activeNav}</h1>
            <p>
              {activeNav === "Dashboard" ? "Track, plan, and stay in control." : `Manage your ${activeNav.toLowerCase()} with the same dashboard-style layout.`}
            </p>
          </div>
          <div className="topbar-actions">
            <div className="search">
              <input
                placeholder="Search expenses, friends, groups"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="notification-wrap">
              <button
                className="icon notification-button"
                type="button"
                onClick={() => setShowNotifications((prev) => !prev)}
              >
                🔔
                {notifications.length ? <span className="notification-badge">{notifications.length}</span> : null}
              </button>
              {showNotifications ? (
                <div className="notification-panel">
                  <div className="panel-header">
                    <div>
                      <h3>Notifications</h3>
                      <p>{notifications.length ? "App updates and actions" : "Nothing new right now."}</p>
                    </div>
                  </div>
                  <div className="notification-list">
                    {notifications.length ? notifications.map((notification) => (
                      <button
                        key={notification.id}
                        className="notification-item"
                        type="button"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <strong>{notification.title}</strong>
                        <span>{notification.body}</span>
                      </button>
                    )) : <div className="empty">No notifications at the moment.</div>}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="avatar">{user?.name?.[0] || "U"}</div>
          </div>
        </header>

        {searchQuery.trim() ? (
          <section className="panel search-results-panel">
            <div className="panel-header">
              <div>
                <h2>Search results</h2>
                <p>Showing matches across expenses, friends, groups, and goals.</p>
              </div>
              <button className="ghost small-button" type="button" onClick={() => setSearchQuery("")}>
                Clear Search
              </button>
            </div>
            {hasSearchResults ? (
              <div className="search-results-grid">
                <div className="search-result-card">
                  <h4>Friends</h4>
                    {filteredFriends.length ? filteredFriends.map((friend) => (
                    <div className="search-result-row" key={getItemId(friend)}>
                      <span>{friend.name}</span>
                      <strong>{friend.balance >= 0 ? "+" : "-"}{formatCurrency(Math.abs(friend.balance))}</strong>
                    </div>
                  )) : <p>No matching friends</p>}
                </div>
                <div className="search-result-card">
                  <h4>Groups</h4>
                    {filteredGroups.length ? filteredGroups.map((group) => (
                    <div className="search-result-row" key={getItemId(group)}>
                      <span>{group.name}</span>
                      <strong>{formatCurrency(group.total)}</strong>
                    </div>
                  )) : <p>No matching groups</p>}
                </div>
                <div className="search-result-card">
                  <h4>Goals</h4>
                    {filteredGoals.length ? filteredGoals.map((goal) => (
                    <div className="search-result-row" key={getItemId(goal)}>
                      <span>{goal.label}</span>
                      <strong>{Math.min((goal.saved / Math.max(goal.target, 1)) * 100, 100).toFixed(0)}%</strong>
                    </div>
                  )) : <p>No matching goals</p>}
                </div>
                <div className="search-result-card">
                  <h4>Expenses</h4>
                  {filteredExpenses.length ? filteredExpenses.slice(0, 5).map((expense) => (
                    <div className="search-result-row" key={expense._id}>
                      <span>{expense.title}</span>
                      <strong>{formatCurrency(expense.amount)}</strong>
                    </div>
                  )) : <p>No matching expenses</p>}
                </div>
              </div>
            ) : (
              <div className="empty">No results found for "{searchQuery}".</div>
            )}
          </section>
        ) : null}
        {renderActiveTab()}
      </main>
    </div>
  );
}
