import React, { useState } from 'react';
import {
  LockClosedIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { api, authStorage, type User } from '../api/client.js';

interface CambioPasswordObligatorioProps {
  user: User;
  onSuccess: (updatedUser: User) => void;
  onLogout: () => void;
}

export const CambioPasswordObligatorio: React.FC<CambioPasswordObligatorioProps> = ({
  user,
  onSuccess,
  onLogout,
}) => {
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!passwordActual.trim()) {
      setError('Por favor ingresa tu contraseña actual o temporal.');
      return;
    }

    if (passwordNueva.length < 6) {
      setError('La nueva contraseña debe contener al menos 6 caracteres.');
      return;
    }

    if (passwordNueva === passwordActual) {
      setError('La nueva contraseña no puede ser idéntica a tu contraseña temporal.');
      return;
    }

    if (passwordNueva !== passwordConfirm) {
      setError('La confirmación no coincide con la nueva contraseña.');
      return;
    }

    try {
      setGuardando(true);
      const res = await api.auth.cambiarPassword(passwordActual, passwordNueva);
      if (res.success) {
        setExito(true);
        const updatedUser: User = {
          ...user,
          debeCambiarPassword: false,
        };
        authStorage.setUser(updatedUser);
        setTimeout(() => {
          onSuccess(updatedUser);
        }, 1200);
      } else {
        setError(res.message || 'No fue posible actualizar la contraseña.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cambiar la contraseña.');
    } finally {
      setGuardando(false);
    }
  };

  const rolNombre =
    user.tipo === 'SUPER_ADMIN'
      ? 'Super Administrador'
      : user.tipo === 'DIRECTOR'
      ? 'Director de Programa'
      : 'Amigo Académico';

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F5F5F5',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#FFFFFF',
          borderRadius: '8px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          border: '1px solid #E0E0E0',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            backgroundColor: '#C62828',
            color: '#FFFFFF',
            padding: '22px 24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
            }}
          >
            <LockClosedIcon style={{ width: '28px', height: '28px', color: '#FFFFFF' }} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>
            Actualización Obligatoria de Contraseña
          </h2>
          <p style={{ fontSize: '0.84rem', opacity: 0.9, marginTop: '6px', lineHeight: 1.4 }}>
            Seguridad institucional para tu cuenta de <strong>{rolNombre}</strong>
          </p>
        </div>

        <div style={{ padding: '24px' }}>
          {exito ? (
            <div style={{ textAlign: 'center', padding: '24px 8px' }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: '#E8F5E9',
                  color: '#2E7D32',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <CheckCircleIcon style={{ width: '40px', height: '40px' }} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1B5E20', marginBottom: '8px' }}>
                ¡Contraseña Actualizada con Éxito!
              </h3>
              <p style={{ color: '#555', fontSize: '0.9rem' }}>
                Ingresando al sistema con tu nueva credencial de seguridad...
              </p>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  backgroundColor: '#FFF8E1',
                  border: '1px solid #FFE082',
                  color: '#795548',
                  padding: '12px 14px',
                  borderRadius: '6px',
                  fontSize: '0.84rem',
                  lineHeight: 1.45,
                  marginBottom: '20px',
                }}
              >
                <ShieldCheckIcon style={{ width: '20px', height: '20px', color: '#F57F17', flexShrink: 0, marginTop: '1px' }} />
                <span>
                  Por políticas de seguridad universitaria, al ingresar por primera vez debes
                  sustituir tu contraseña temporal por una nueva clave personal.
                </span>
              </div>

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
                    fontSize: '0.86rem',
                    marginBottom: '16px',
                  }}
                >
                  <ExclamationCircleIcon style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Contraseña Actual / Temporal *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showActual ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Ingresa la contraseña con la que iniciaste sesión"
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
                        display: 'flex',
                        padding: '4px',
                      }}
                    >
                      {showActual ? <EyeSlashIcon style={{ width: '18px', height: '18px' }} /> : <EyeIcon style={{ width: '18px', height: '18px' }} />}
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Nueva Contraseña (mínimo 6 caracteres) *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNueva ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Nueva contraseña privada"
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
                        display: 'flex',
                        padding: '4px',
                      }}
                    >
                      {showNueva ? <EyeSlashIcon style={{ width: '18px', height: '18px' }} /> : <EyeIcon style={{ width: '18px', height: '18px' }} />}
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '22px' }}>
                  <label className="form-label">Confirmar Nueva Contraseña *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      className="form-input"
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
                        display: 'flex',
                        padding: '4px',
                      }}
                    >
                      {showConfirm ? <EyeSlashIcon style={{ width: '18px', height: '18px' }} /> : <EyeIcon style={{ width: '18px', height: '18px' }} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-red"
                  disabled={guardando}
                  style={{ width: '100%', padding: '12px', fontSize: '0.96rem', fontWeight: 700 }}
                >
                  {guardando ? 'Actualizando contraseña...' : 'Actualizar Contraseña y Continuar'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #EEEEEE' }}>
                <button
                  onClick={onLogout}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#757575',
                    cursor: 'pointer',
                    fontSize: '0.84rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <ArrowRightOnRectangleIcon style={{ width: '15px', height: '15px' }} />
                  Cerrar sesión y salir
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
