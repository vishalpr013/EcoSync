export const formatNumber = (num, decimals = 2) => {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatCarbon = (kg) => {
  if (kg === null || kg === undefined) return '0.00 kg CO₂e';
  if (kg >= 1000) {
    return `${formatNumber(kg / 1000, 2)} t CO₂e`;
  }
  return `${formatNumber(kg, 2)} kg CO₂e`;
};

export const formatScore = (score) => {
  if (score === null || score === undefined) return '0.0';
  return formatNumber(score, 1);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatTime = (dateTimeStr) => {
  if (!dateTimeStr) return '';
  const date = new Date(dateTimeStr);
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return '';
  return `${formatDate(dateTimeStr)} at ${formatTime(dateTimeStr)}`;
};

export const ROLES = {
  ADMIN: 'admin',
  ESG_MANAGER: 'esg_manager',
  DEPARTMENT_HEAD: 'department_head',
  EMPLOYEE: 'employee',
  AUDITOR: 'auditor',
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Admin',
  [ROLES.ESG_MANAGER]: 'ESG Manager',
  [ROLES.DEPARTMENT_HEAD]: 'Department Head',
  [ROLES.EMPLOYEE]: 'Employee',
  [ROLES.AUDITOR]: 'Auditor',
};

export const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/50',
  inactive: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700/50',
  draft: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800/50',
  completed: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50',
  cancelled: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/50',
  pending: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800/50',
  approved: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/50',
  rejected: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/50',
  open: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800/50',
  resolved: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/50',
  overdue: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/50',
};

export const getStatusBadgeClass = (status) => {
  const normalized = String(status).toLowerCase();
  return STATUS_COLORS[normalized] || 'bg-gray-100 text-gray-800 border-gray-200';
};
