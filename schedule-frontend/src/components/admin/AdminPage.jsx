import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Users, Building2, Settings } from 'lucide-react';
import UserManagement from './UserManagement';
import OrganizationManagement from './OrganizationManagement';
import SystemSettings from './SystemSettings';

const tabs = [
  { id: 'users', label: '사용자 관리', icon: Users },
  { id: 'organization', label: '조직 관리', icon: Building2 },
  { id: 'settings', label: '시스템 설정', icon: Settings },
];

export default function AdminPage() {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('users');

  const bgColor = isDarkMode ? '#0f172a' : '#f8fafc';
  const cardBg = isDarkMode ? '#283548' : '#ffffff';
  const textColor = isDarkMode ? '#e2e8f0' : '#1e293b';
  const secondaryText = isDarkMode ? '#94a3b8' : '#64748b';
  const borderColor = isDarkMode ? '#475569' : '#cbd5e1';

  return (
    <div>
      {/* 탭 네비게이션 */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '24px',
        borderBottom: `2px solid ${borderColor}`,
        paddingBottom: '0',
      }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                border: 'none',
                borderBottom: isActive ? '2px solid #3B82F6' : '2px solid transparent',
                marginBottom: '-2px',
                background: 'none',
                color: isActive ? '#3B82F6' : secondaryText,
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: isActive ? '600' : '400',
                transition: 'all 0.2s',
              }}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === 'users' && <UserManagement />}
      {activeTab === 'organization' && <OrganizationManagement />}
      {activeTab === 'settings' && <SystemSettings />}
    </div>
  );
}
