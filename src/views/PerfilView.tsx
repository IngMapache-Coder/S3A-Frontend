import React, { useState } from 'react';
import {
  UserCircleIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  EnvelopeIcon,
  IdentificationIcon,
} from '@heroicons/react/24/outline';
import { api, type User } from '../api/client.js';

interface PerfilViewProps {
  user: User;
}

export const PerfilView: React.FC<PerfilViewProps> = ({ user }) => {
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const getRoleLabel = (tipo?: string) => {
    switch (tipo) {
      case 'SUPER_ADMIN':
        return 'Super Administrador';
      case 'DIRECTOR':
        return 'Director de Programa';
      case 'AMIGO_ACADEMICO':
        return 'Amigo Académico';
      default:
        return 'Usuario del Sistema';
    }
  };

  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setExito(null);

    if (!passwordActual) {
      setError('Por favor ingresa tu contraseña actual.');
      return;
    }

    if (passwordNueva.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (passwordNueva === passwordActual) {
      setError('La nueva contraseña no puede ser idéntica a la contraseña actual.');
      return;
    }

    if (passwordNueva !== passwordConfirm) {
      setError('Las nuevas contraseñas no coinciden. Verifica la confirmación.');
      return;
    }

    setGuardando(true);
    try {
      const res = await api.auth.cambiarPassword(passwordActual, passwordNueva);
      if (res.success) {
        setExito('¡Contraseña actualizada exitosamente! Usa tu nueva contraseña en los próximos inicios de sesión.');
        setPasswordActual('');
        setPasswordNueva('');
        setPasswordConfirm('');
      } else {
        setError(res.message || 'No fue posible actualizar la contraseña.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cambiar la contraseña');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div>
      <div className="page-breadcrumb-bar">
        <div>
          <h1 className="page-title">Mi Perfil Institucional</h1>
          <p style={{ fontSize: '0.86rem', color: '#607D8B', marginTop: '2px' }}>
            Información de la cuenta de usuario y configuración de seguridad y acceso.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginTop: '16px' }}>
        <div className="panel-card">
          <div className="panel-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCircleIcon style={{ width: '20px', height: '20px', color: '#C62828' }} />
            <h2 className="panel-title" style={{ margin: 0, fontSize: '15px' }}>Datos de la Cuenta</h2>
          </div>

          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #EEEEEE' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#FFEBEE',
                  color: '#C62828',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <UserCircleIcon style={{ width: '40px', height: '40px' }} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '17px', color: '#212121', fontWeight: 600 }}>
                  {user.nombre}
                </h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="badge-tag red">
                    {getRoleLabel(user.tipo)}
                  </span>
                  <span className="badge-tag green">
                    Cuenta Activa
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <IdentificationIcon style={{ width: '20px', height: '20px', color: '#757575', marginTop: '2px' }} />
                <div>
                  <span style={{ fontSize: '12px', color: '#757575', display: 'block' }}>Nombre Completo</span>
                  <span style={{ fontSize: '14px', color: '#212121', fontWeight: 500 }}>{user.nombre}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <EnvelopeIcon style={{ width: '20px', height: '20px', color: '#757575', marginTop: '2px' }} />
                <div>
                  <span style={{ fontSize: '12px', color: '#757575', display: 'block' }}>Correo Institucional</span>
                  <span style={{ fontSize: '14px', color: '#212121', fontWeight: 500 }}>{user.correo}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <ShieldCheckIcon style={{ width: '20px', height: '20px', color: '#757575', marginTop: '2px' }} />
                <div>
                  <span style={{ fontSize: '12px', color: '#757575', display: 'block' }}>Rol en Plataforma</span>
                  <span style={{ fontSize: '14px', color: '#212121', fontWeight: 500 }}>{getRoleLabel(user.tipo)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LockClosedIcon style={{ width: '20px', height: '20px', color: '#C62828' }} />
            <h2 className="panel-title" style={{ margin: 0, fontSize: '15px' }}>Seguridad y Contraseña</h2>
          </div>

          <div style={{ padding: '24px' }}>
            <p style={{ fontSize: '13px', color: '#616161', marginBottom: '20px', lineHeight: 1.5 }}>
              Para garantizar la seguridad de tu cuenta institucional, actualiza tu contraseña periódicamente.
              La nueva clave debe tener al menos 6 caracteres.
            </p>

            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#FFEBEE',
                  border: '1px solid #FFCDD2',
                  color: '#C62828',
                  padding: '10px 14px',
                  borderRadius: '4px',
                  fontSize: '13px',
                  marginBottom: '16px',
                }}
              >
                <ExclamationCircleIcon style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {exito && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#E8F5E9',
                  border: '1px solid #C8E6C9',
                  color: '#2E7D32',
                  padding: '10px 14px',
                  borderRadius: '4px',
                  fontSize: '13px',
                  marginBottom: '16px',
                }}
              >
                <CheckCircleIcon style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                <span>{exito}</span>
              </div>
            )}

            <form onSubmit={handleCambiarPassword}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontSize: '13px' }}>
                  Contraseña Actual *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showActual ? 'text' : 'password'}
                    className="form-input"
                    style={{ paddingRight: '40px' }}
                    placeholder="Ingresa tu contraseña actual"
                    value={passwordActual}
                    onChange={(e) => setPasswordActual(e.target.value)}
                    required
                    disabled={guardando}
                  />
                  <button
                    type="button"
                    onClick={() => setShowActual(!showActual)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#9E9E9E',
                      padding: '4px',
                      display: 'flex',
                    }}
                    title={showActual ? 'Ocultar' : 'Mostrar'}
                  >
                    {showActual ? (
                      <EyeSlashIcon style={{ width: '18px', height: '18px' }} />
                    ) : (
                      <EyeIcon style={{ width: '18px', height: '18px' }} />
                    )}
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontSize: '13px' }}>
                  Nueva Contraseña (mínimo 6 caracteres) *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNueva ? 'text' : 'password'}
                    className="form-input"
                    style={{ paddingRight: '40px' }}
                    placeholder="Mínimo 6 caracteres"
                    value={passwordNueva}
                    onChange={(e) => setPasswordNueva(e.target.value)}
                    required
                    minLength={6}
                    disabled={guardando}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNueva(!showNueva)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#9E9E9E',
                      padding: '4px',
                      display: 'flex',
                    }}
                    title={showNueva ? 'Ocultar' : 'Mostrar'}
                  >
                    {showNueva ? (
                      <EyeSlashIcon style={{ width: '18px', height: '18px' }} />
                    ) : (
                      <EyeIcon style={{ width: '18px', height: '18px' }} />
                    )}
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '22px' }}>
                <label className="form-label" style={{ fontSize: '13px' }}>
                  Confirmar Nueva Contraseña *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    className="form-input"
                    style={{ paddingRight: '40px' }}
                    placeholder="Repite la nueva contraseña"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    required
                    minLength={6}
                    disabled={guardando}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#9E9E9E',
                      padding: '4px',
                      display: 'flex',
                    }}
                    title={showConfirm ? 'Ocultar' : 'Mostrar'}
                  >
                    {showConfirm ? (
                      <EyeSlashIcon style={{ width: '18px', height: '18px' }} />
                    ) : (
                      <EyeIcon style={{ width: '18px', height: '18px' }} />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-red"
                disabled={guardando}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <LockClosedIcon style={{ width: '18px', height: '18px' }} />
                {guardando ? 'Actualizando Contraseña...' : 'Actualizar Contraseña'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
