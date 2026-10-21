import React, { useState, useEffect } from 'react';
import {
  BookOpenIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { api, type Materia } from '../api/client.js';

export const MateriasView: React.FC = () => {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [materiaEditando, setMateriaEditando] = useState<Materia | null>(null);
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarMaterias = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.materias.list();
      setMaterias(res.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar materias';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMaterias();
  }, []);

  const handleAbrirCrear = () => {
    setMateriaEditando(null);
    setCodigo('');
    setNombre('');
    setModalAbierto(true);
  };

  const handleAbrirEditar = (m: Materia) => {
    setMateriaEditando(m);
    setCodigo(m.codigo);
    setNombre(m.nombre);
    setModalAbierto(true);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGuardando(true);
      setError(null);
      if (materiaEditando) {
        await api.materias.update(materiaEditando.id, { codigo, nombre });
      } else {
        await api.materias.create({ codigo, nombre });
      }
      setModalAbierto(false);
      await cargarMaterias();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar materia';
      setError(msg);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id: string, nombreMat: string) => {
    if (!window.confirm(`¿Seguro que deseas eliminar la materia "${nombreMat}"?`)) return;
    try {
      await api.materias.delete(id);
      await cargarMaterias();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar materia';
      alert(msg);
    }
  };

  const filtradas = materias.filter(
    (m) =>
      m.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      m.codigo.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div>
      <div className="page-breadcrumb-bar">
        <div>
          <h1 className="page-title">Catálogo Institucional de Materias</h1>
          <p style={{ fontSize: '0.86rem', color: '#607D8B', marginTop: '2px' }}>
            Materias ofertadas para el programa de asesorías del Amigo Académico.
          </p>
        </div>
        <button className="btn btn-red" onClick={handleAbrirCrear}>
          <PlusIcon style={{ width: '16px', height: '16px' }} />
          Nueva Materia
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

      <div className="ufps-card card-red">
        <div className="card-header">
          <div style={{ position: 'relative', width: '320px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Buscar materia por código o nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ paddingRight: '32px', fontSize: '0.85rem' }}
            />
            <MagnifyingGlassIcon
              style={{ position: 'absolute', right: '10px', top: '10px', width: '15px', height: '15px', color: '#999' }}
            />
          </div>

          <button
            className="btn btn-secondary"
            onClick={cargarMaterias}
            style={{ padding: '4px 10px', fontSize: '0.78rem' }}
          >
            <ArrowPathIcon style={{ width: '13px', height: '13px' }} />
            Refrescar
          </button>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
              <ArrowPathIcon className="animate-spin" style={{ width: '24px', height: '24px', margin: '0 auto 8px' }} />
              <p>Cargando catálogo...</p>
            </div>
          ) : filtradas.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#90A4AE' }}>
              <BookOpenIcon style={{ width: '36px', height: '36px', margin: '0 auto 8px', opacity: 0.6 }} />
              <p>No se encontraron materias que coincidan con la búsqueda.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="ufps-table">
                <thead>
                  <tr>
                    <th style={{ width: '150px' }}>Código</th>
                    <th>Nombre de la Asignatura</th>
                    <th style={{ textAlign: 'right', width: '140px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            color: '#C62828',
                            backgroundColor: '#FFEBEE',
                            padding: '3px 8px',
                            borderRadius: '3px',
                          }}
                        >
                          {m.codigo}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{m.nombre}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleAbrirEditar(m)}
                            style={{ padding: '4px 8px' }}
                            title="Editar materia"
                          >
                            <PencilIcon style={{ width: '13px', height: '13px' }} />
                          </button>
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleEliminar(m.id, m.nombre)}
                            style={{ padding: '4px 8px', color: '#C62828' }}
                            title="Eliminar materia"
                          >
                            <TrashIcon style={{ width: '13px', height: '13px' }} />
                          </button>
                        </div>
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
                {materiaEditando ? 'Modificar Materia' : 'Nueva Materia del Catálogo'}
              </h3>
              <button
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                onClick={() => setModalAbierto(false)}
              >
                <XMarkIcon style={{ width: '20px', height: '20px' }} />
              </button>
            </div>
            <form onSubmit={handleGuardar}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Código de la Materia *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: MAT-101"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nombre de la Materia *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: Cálculo Diferencial"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
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
                <button type="submit" className="btn btn-red" disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Guardar Materia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
