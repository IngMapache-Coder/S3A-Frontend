import React, { useState, useEffect } from 'react';
import {
  UsersIcon,
  UserPlusIcon,
  TrashIcon,
  EnvelopeIcon,
  XMarkIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';
import { api, authStorage, type User } from '../api/client.js';

interface TutoresViewProps {
  currentUser?: User | null;
}

export const TutoresView: React.FC<TutoresViewProps> = ({ currentUser: propUser }) => {
  const currentUser = propUser || authStorage.getUser();
  const isSuperAdmin = currentUser?.tipo === 'SUPER_ADMIN';

  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');

  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [tipo, setTipo] = useState<'DIRECTOR' | 'AMIGO_ACADEMICO'>('AMIGO_ACADEMICO');
  const [creando, setCreando] = useState(false);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      setError(null);
      const tipoQuery = isSuperAdmin ? undefined : 'AMIGO_ACADEMICO';
      const res = await api.usuarios.list(tipoQuery);
      setUsuarios(res.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar usuarios';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, [isSuperAdmin]);

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreando(true);
      setError(null);

      const rolAsignado = isSuperAdmin ? tipo : 'AMIGO_ACADEMICO';

      await api.usuarios.create({
        nombre,
        correo,
        password,
        tipo: rolAsignado,
      });

      setModalAbierto(false);
      setNombre('');
      setCorreo('');
      setPassword('');
      setTipo('AMIGO_ACADEMICO');
      await cargarUsuarios();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear cuenta';
      setError(msg);
    } finally {
      setCreando(false);
    }
  };

  const handleEliminarUsuario = async (id: string, nombreUsuario: string, rolUsuario: string) => {
    const rolTexto = rolUsuario === 'DIRECTOR' ? 'del Director' : 'del Amigo Académico';
    if (!window.confirm(`¿Seguro que deseas eliminar la cuenta ${rolTexto} "${nombreUsuario}"?`)) return;
    try {
      await api.usuarios.delete(id);
      await cargarUsuarios();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar usuario';
      alert(msg);
    }
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    if (!isSuperAdmin) return u.tipo === 'AMIGO_ACADEMICO';
    if (filtroTipo === 'TODOS') return u.tipo !== 'SUPER_ADMIN';
    return u.tipo === filtroTipo;
  });

  return (
    <div>
      <div className="page-breadcrumb-bar">
        <div>
          <h1 className="page-title">
            {isSuperAdmin
              ? 'Gestión de Usuarios Académicos (Directores y Tutores)'
              : 'Gestión de Amigos Académicos'}
          </h1>
          <p style={{ fontSize: '0.86rem', color: '#607D8B', marginTop: '2px' }}>
            {isSuperAdmin
              ? 'Aprovisionamiento institucional de cuentas para Directores de Programa y Amigos Académicos.'
              : 'Administración y activación de cuentas para tutores del programa Amigo Académico.'}
          </p>
        </div>
        <button className="btn btn-red" onClick={() => setModalAbierto(true)}>
          <UserPlusIcon style={{ width: '16px', height: '16px' }} />
          {isSuperAdmin ? 'Nuevo Director / Tutor' : 'Nuevo Amigo Académico'}
        </button>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: '#FFEBEE',
            borderLeft: '4px solid #C62828',
            color: '#B71C1C',
            padding: '12px 16px',
            marginBottom: '20px',
            borderRadius: '4px',
            fontSize: '0.9rem',
          }}
        >
          {error}
        </div>
      )}

      {isSuperAdmin && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            className={`btn ${filtroTipo === 'TODOS' ? 'btn-red' : 'btn-secondary'}`}
            onClick={() => setFiltroTipo('TODOS')}
            style={{ fontSize: '0.84rem', padding: '6px 14px' }}
          >
            Todos ({usuarios.filter((u) => u.tipo !== 'SUPER_ADMIN').length})
          </button>
          <button
            className={`btn ${filtroTipo === 'DIRECTOR' ? 'btn-red' : 'btn-secondary'}`}
            onClick={() => setFiltroTipo('DIRECTOR')}
            style={{ fontSize: '0.84rem', padding: '6px 14px' }}
          >
            Directores ({usuarios.filter((u) => u.tipo === 'DIRECTOR').length})
          </button>
          <button
            className={`btn ${filtroTipo === 'AMIGO_ACADEMICO' ? 'btn-red' : 'btn-secondary'}`}
            onClick={() => setFiltroTipo('AMIGO_ACADEMICO')}
            style={{ fontSize: '0.84rem', padding: '6px 14px' }}
          >
            Amigos Académicos ({usuarios.filter((u) => u.tipo === 'AMIGO_ACADEMICO').length})
          </button>
        </div>
      )}

      <div className="ufps-card card-red">
        <div className="card-header">
          <span className="card-title">
            <UsersIcon style={{ width: '18px', height: '18px', color: '#C62828' }} />
            {isSuperAdmin ? 'Cuentas Registradas' : 'Cuentas Activas de Tutores'} ({usuariosFiltrados.length})
          </span>
          <button className="btn btn-secondary" onClick={cargarUsuarios} style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
            <ArrowPathIcon style={{ width: '13px', height: '13px' }} />
            Refrescar
          </button>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
              <ArrowPathIcon className="animate-spin" style={{ width: '24px', height: '24px', margin: '0 auto 8px' }} />
              <p>Cargando cuentas...</p>
            </div>
          ) : usuariosFiltrados.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#90A4AE' }}>
              <UsersIcon style={{ width: '36px', height: '36px', margin: '0 auto 8px', opacity: 0.6 }} />
              <p>No hay cuentas registradas con este criterio.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="ufps-table">
                <thead>
                  <tr>
                    <th>Nombre Completo</th>
                    <th>Correo Electrónico</th>
                    <th>Rol Institucional</th>
                    <th>Estado Contraseña</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.map((u: User) => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.nombre}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <EnvelopeIcon style={{ width: '14px', height: '14px', color: '#78909C' }} />
                          <span>{u.correo}</span>
                        </div>
                      </td>
                      <td>
                        {u.tipo === 'DIRECTOR' ? (
                          <span
                            className="badge-tag"
                            style={{ backgroundColor: '#E3F2FD', color: '#0D47A1', fontWeight: 600 }}
                          >
                            DIRECTOR
                          </span>
                        ) : u.tipo === 'AMIGO_ACADEMICO' ? (
                          <span className="badge-tag green">
                            AMIGO_ACADEMICO
                          </span>
                        ) : (
                          <span className="badge-tag red">
                            SUPER_ADMIN
                          </span>
                        )}
                      </td>
                      <td>
                        {u.debeCambiarPassword ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              backgroundColor: '#FFF8E1',
                              color: '#F57F17',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.76rem',
                              fontWeight: 600,
                            }}
                          >
                            <KeyIcon style={{ width: '12px', height: '12px' }} />
                            Pendiente actualizar
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              backgroundColor: '#E8F5E9',
                              color: '#2E7D32',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.76rem',
                              fontWeight: 600,
                            }}
                          >
                            <ShieldCheckIcon style={{ width: '12px', height: '12px' }} />
                            Actualizada
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleEliminarUsuario(u.id, u.nombre, u.tipo)}
                          style={{ padding: '4px 8px', color: '#C62828' }}
                          title="Eliminar cuenta"
                        >
                          <TrashIcon style={{ width: '14px', height: '14px' }} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modalAbierto && (
        <div className="modal-overlay" onClick={() => setModalAbierto(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {isSuperAdmin ? 'Registrar Nueva Cuenta Académica' : 'Registrar Nuevo Amigo Académico'}
              </h3>
              <button
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                onClick={() => setModalAbierto(false)}
              >
                <XMarkIcon style={{ width: '20px', height: '20px' }} />
              </button>
            </div>
            <form onSubmit={handleCrearUsuario}>
              <div className="modal-body">
                {isSuperAdmin && (
                  <div className="form-group">
                    <label className="form-label">Tipo de Cuenta / Rol *</label>
                    <select
                      className="form-select"
                      value={tipo}
                      onChange={(e) => setTipo(e.target.value as 'DIRECTOR' | 'AMIGO_ACADEMICO')}
                      required
                    >
                      <option value="DIRECTOR">Director de Programa (DIRECTOR)</option>
                      <option value="AMIGO_ACADEMICO">Amigo Académico / Tutor (AMIGO_ACADEMICO)</option>
                    </select>
                    <small style={{ display: 'block', color: '#78909C', fontSize: '0.78rem', marginTop: '4px' }}>
                      Al ingresar por primera vez, el usuario estará obligado a cambiar su contraseña temporal.
                    </small>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">
                    {tipo === 'DIRECTOR' ? 'Nombre Completo del Director *' : 'Nombre Completo del Tutor *'}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: Daniel Fernando Suárez"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Correo Institucional (@ufps.edu.co) *</label>
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
                  <label className="form-label">Contraseña Temporal *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contraseña inicial para su primer ingreso"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <small style={{ display: 'block', color: '#C62828', fontSize: '0.78rem', marginTop: '4px' }}>
                    * El usuario será forzado a actualizar esta clave inmediatamente inicie sesión.
                  </small>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalAbierto(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-red" disabled={creando}>
                  {creando ? 'Creando cuenta...' : 'Guardar y Habilitar Cuenta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
