import React, { useState } from 'react';
import {
  LockClosedIcon,
  EnvelopeIcon,
  AcademicCapIcon,
  PencilSquareIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { api, authStorage, type User } from '../api/client.js';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
  onIrComoEstudiante: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onIrComoEstudiante }) => {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await api.auth.login(correo, password);
      authStorage.setToken(res.token);
      authStorage.setUser(res.user);
      onLoginSuccess(res.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F4F6F9',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '430px',
          backgroundColor: '#FFFFFF',
          borderRadius: '4px',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
          border: '1px solid #D2D6DE',
          borderTop: '4px solid #C62828',
        }}
      >
        <div
          style={{
            backgroundColor: '#C62828',
            color: '#FFFFFF',
            padding: '24px 20px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 10px',
            }}
          >
            <AcademicCapIcon style={{ width: '28px', height: '28px' }} />
          </div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '0.5px' }}>
            S3A — AMIGO ACADÉMICO
          </h1>
          <p style={{ fontSize: '0.82rem', opacity: 0.9, marginTop: '3px' }}>
            Sistema de Asistencia Digital y Auditoría Universitaria
          </p>
        </div>

        <div style={{ padding: '26px 24px' }}>
          {error && (
            <div
              style={{
                backgroundColor: '#FFEBEE',
                color: '#C62828',
                padding: '10px 14px',
                borderRadius: '4px',
                fontSize: '0.86rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '18px',
              }}
            >
              <ExclamationCircleIcon style={{ width: '18px', height: '18px', flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">
                <EnvelopeIcon style={{ width: '14px', height: '14px', display: 'inline', marginRight: '6px' }} />
                Correo Institucional
              </label>
              <input
                type="email"
                className="form-input"
                placeholder="usuario@ufps.edu.co"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <LockClosedIcon style={{ width: '14px', height: '14px', display: 'inline', marginRight: '6px' }} />
                Contraseña
              </label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-red"
              disabled={loading}
              style={{ width: '100%', padding: '11px', fontSize: '0.96rem', marginTop: '6px' }}
            >
              {loading ? 'Validando...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div
            style={{
              marginTop: '22px',
              paddingTop: '16px',
              borderTop: '1px solid #ECEFF1',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '0.82rem', color: '#607D8B', marginBottom: '8px' }}>
              ¿Eres estudiante y vas a registrar tu asistencia?
            </p>
            <button
              type="button"
              className="btn btn-outline-red"
              onClick={onIrComoEstudiante}
              style={{ width: '100%', fontSize: '0.86rem' }}
            >
              <PencilSquareIcon style={{ width: '16px', height: '16px' }} />
              Ir a Firmar Asistencia (Sin Cuenta)
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '16px', fontSize: '0.76rem', color: '#78909C', textAlign: 'center' }}>
        Universidad Francisco de Paula Santander · Amigo Académico
      </div>
    </div>
  );
};
