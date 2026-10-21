import React from 'react';
import { Bars3Icon, PowerIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import type { User } from '../api/client.js';

interface NavbarProps {
  user: User | null;
  onToggleSidebar: () => void;
  onLogout: () => void;
  onOpenPerfil?: () => void;
  activeTab: string;
}

const roleLabel = (tipo?: string) => {
  if (tipo === 'SUPER_ADMIN') return 'Super Administrador';
  if (tipo === 'DIRECTOR') return 'Director de Programa';
  if (tipo === 'AMIGO_ACADEMICO') return 'Amigo Académico';
  return 'Portal de Asistencia';
};

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onToggleSidebar,
  onLogout,
  onOpenPerfil,
  activeTab,
}) => (
  <header className="header-navbar">
    <div className="header-left">
      <button
        className="menu-toggle-btn"
        onClick={onToggleSidebar}
        title="Alternar menú"
        aria-label="Alternar menú"
      >
        <Bars3Icon style={{ width: '24px', height: '24px' }} />
      </button>

      <div className="brand-title">
        <span className="full-title">S3A — AMIGO ACADÉMICO</span>
        {user && <span className="brand-badge">{roleLabel(user.tipo)}</span>}
      </div>
    </div>

    <div className="header-right">
      {user && (
        <>
          <div
            className="header-user-profile"
            onClick={onOpenPerfil}
            title="Ver mi perfil y seguridad"
            role="button"
            tabIndex={0}
            style={{
              cursor: 'pointer',
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: activeTab === 'perfil' ? 'rgba(0,0,0,0.18)' : 'transparent',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'perfil') e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'perfil') e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <UserCircleIcon style={{ width: '24px', height: '24px', color: 'rgba(255,255,255,0.95)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span className="header-user-name">{user.nombre}</span>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>{user.correo}</span>
            </div>
          </div>

          <button
            className="header-icon-btn"
            onClick={onLogout}
            title="Cerrar sesión"
            style={{ color: '#FFCDD2' }}
          >
            <PowerIcon style={{ width: '20px', height: '20px' }} />
          </button>
        </>
      )}
    </div>
  </header>
);
