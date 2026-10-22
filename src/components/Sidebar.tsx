import React from 'react';
import {
  QrCodeIcon,
  UsersIcon,
  BookOpenIcon,
  DocumentChartBarIcon,
  PencilSquareIcon,
  ChevronRightIcon,
  UserCircleIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import type { User } from '../api/client.js';

interface SidebarProps {
  user: User | null;
  isOpen: boolean;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  sesionActivaCodigo?: string | null;
}

const roleLabel = (tipo?: string) => {
  if (tipo === 'AMIGO_ACADEMICO') return 'Amigo Académico';
  if (tipo === 'DIRECTOR') return 'Director de Programa';
  return 'Super Administrador';
};

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  isOpen,
  activeTab,
  onSelectTab,
  sesionActivaCodigo,
}) => {
  const isDirectorOrAdmin = user?.tipo === 'DIRECTOR' || user?.tipo === 'SUPER_ADMIN';

  return (
    <aside className={`sidebar ${isOpen ? 'mobile-open' : 'collapsed'}`}>
      {user && (
        <div
          className="sidebar-user-panel"
          onClick={() => onSelectTab('perfil')}
          role="button"
          tabIndex={0}
          title="Ver mi perfil y seguridad"
          style={{
            cursor: 'pointer',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: '6px',
            backgroundColor: activeTab === 'perfil' ? '#FFEBEE' : '#F5F5F5',
            borderRadius: '6px',
            padding: '12px',
            border: activeTab === 'perfil' ? '1px solid #FFCDD2' : '1px solid transparent',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '6px',
                backgroundColor: activeTab === 'perfil' ? '#C62828' : '#FFCDD2',
                color: activeTab === 'perfil' ? '#FFFFFF' : '#C62828',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <UserCircleIcon style={{ width: '28px', height: '28px' }} />
            </div>
            <div className="sidebar-user-info" style={{ overflow: 'hidden' }}>
              <span className="sidebar-user-name" style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user.nombre}
              </span>
              <span className="sidebar-user-role" style={{ display: 'block', marginBottom: '2px' }}>
                {roleLabel(user.tipo)}
              </span>
              <span style={{ fontSize: '11px', color: '#757575', wordBreak: 'break-all' }}>
                {user.correo}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            <span style={{ fontSize: '11px', color: '#C62828', fontWeight: 500 }}>
              {activeTab === 'perfil' ? 'Perfil seleccionado' : 'Ver perfil y seguridad'}
            </span>
            <ChevronRightIcon style={{ width: '12px', height: '12px', color: '#C62828' }} />
          </div>
        </div>
      )}

      <div className="sidebar-nav-header">Navegación Principal</div>

      <ul className="sidebar-menu">
        <li className="sidebar-item">
          <div
            className={`sidebar-link ${activeTab === 'sala' ? 'active' : ''}`}
            onClick={() => onSelectTab('sala')}
          >
            <div className="sidebar-link-content">
              <QrCodeIcon className="sidebar-icon" style={{ width: '18px', height: '18px' }} />
              <span>Sala de Asesorías</span>
            </div>
            {sesionActivaCodigo ? (
              <span className="badge-tag green">En Vivo</span>
            ) : (
              <span className="badge-tag gray">QR</span>
            )}
          </div>
        </li>

        <li className="sidebar-item">
          <div
            className={`sidebar-link ${activeTab === 'eventos' ? 'active' : ''}`}
            onClick={() => onSelectTab('eventos')}
          >
            <div className="sidebar-link-content">
              <CalendarDaysIcon className="sidebar-icon" style={{ width: '18px', height: '18px' }} />
              <span>Eventos y Cursos</span>
            </div>
            <span className="badge-tag green">QR Único</span>
          </div>
        </li>

        <li className="sidebar-item">
          <div
            className={`sidebar-link ${activeTab === 'reportes' ? 'active' : ''}`}
            onClick={() => onSelectTab('reportes')}
          >
            <div className="sidebar-link-content">
              <DocumentChartBarIcon className="sidebar-icon" style={{ width: '18px', height: '18px' }} />
              <span>Historial de Asistencias</span>
            </div>
            <span className="badge-tag green">Historial</span>
          </div>
        </li>

        {isDirectorOrAdmin && (
          <>
            <li className="sidebar-item">
              <div
                className={`sidebar-link ${activeTab === 'tutores' ? 'active' : ''}`}
                onClick={() => onSelectTab('tutores')}
              >
                <div className="sidebar-link-content">
                  <UsersIcon className="sidebar-icon" style={{ width: '18px', height: '18px' }} />
                  <span>{user?.tipo === 'SUPER_ADMIN' ? 'Directores y Tutores' : 'Amigos Académicos'}</span>
                </div>
                <span className="badge-tag gray">Cuentas</span>
              </div>
            </li>

            <li className="sidebar-item">
              <div
                className={`sidebar-link ${activeTab === 'materias' ? 'active' : ''}`}
                onClick={() => onSelectTab('materias')}
              >
                <div className="sidebar-link-content">
                  <BookOpenIcon className="sidebar-icon" style={{ width: '18px', height: '18px' }} />
                  <span>Catálogo de Materias</span>
                </div>
                <span className="badge-tag gray">Pensum</span>
              </div>
            </li>
          </>
        )}

        <div className="sidebar-nav-header" style={{ marginTop: '16px' }}>Portal Estudiante</div>

        <li className="sidebar-item">
          <div
            className={`sidebar-link ${activeTab === 'estudiante' ? 'active' : ''}`}
            onClick={() => onSelectTab('estudiante')}
          >
            <div className="sidebar-link-content">
              <PencilSquareIcon className="sidebar-icon" style={{ width: '18px', height: '18px' }} />
              <span>Firmar Asistencia</span>
            </div>
            <span className="badge-tag green">QR</span>
          </div>
        </li>
      </ul>
    </aside>
  );
};
