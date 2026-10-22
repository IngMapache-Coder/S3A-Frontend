import React, { useState, useEffect } from 'react';
import {
  DocumentChartBarIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  EyeIcon,
  XMarkIcon,
  ArrowPathIcon,
  ClockIcon,
  BookOpenIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import { exportarAsistenciasExcel, exportarAsistenciasEventoExcel, type ExportProgress } from '../utils/excelExport.js';
import { api, type Asistencia, type AsistenciaEvento, type Materia, type Evento } from '../api/client.js';
import { formatColombiaDateTime } from '../utils/date.js';

export const ReportesView: React.FC = () => {
  const [tipoReporte, setTipoReporte] = useState<'asesorias' | 'eventos'>('asesorias');

  // Datos
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [asistenciasEventos, setAsistenciasEventos] = useState<AsistenciaEvento[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);

  // Estados de carga
  const [loading, setLoading] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [progresoExport, setProgresoExport] = useState<ExportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [materiaId, setMateriaId] = useState('');
  const [eventoId, setEventoId] = useState('');
  const [codigoEstudiante, setCodigoEstudiante] = useState('');
  const [nombreEstudiante, setNombreEstudiante] = useState('');

  // Modal de firma
  const [firmaModalUrl, setFirmaModalUrl] = useState<string | null>(null);
  const [firmaModalEstudiante, setFirmaModalEstudiante] = useState<string | null>(null);

  const cargarCatalogos = async () => {
    try {
      const [resMat, resEvt] = await Promise.all([
        api.materias.list().catch(() => ({ data: [] })),
        api.eventos.list().catch(() => ({ data: [] })),
      ]);
      setMaterias(resMat.data || []);
      setEventos(resEvt.data || []);
    } catch {}
  };

  const consultarAsesorias = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.reportes.consultar({
        desde: desde || undefined,
        hasta: hasta || undefined,
        materiaId: materiaId || undefined,
        codigoEstudiante: codigoEstudiante || undefined,
        nombreEstudiante: nombreEstudiante || undefined,
      });
      setAsistencias(res.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al consultar asistencias de asesorias');
    } finally {
      setLoading(false);
    }
  };

  const consultarEventos = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.reportes.consultarEventos({
        desde: desde || undefined,
        hasta: hasta || undefined,
        eventoId: eventoId || undefined,
        codigoEstudiante: codigoEstudiante || undefined,
        nombreEstudiante: nombreEstudiante || undefined,
      });
      setAsistenciasEventos(res.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al consultar asistencias de eventos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCatalogos();
  }, []);

  useEffect(() => {
    if (tipoReporte === 'asesorias') {
      consultarAsesorias();
    } else {
      consultarEventos();
    }
  }, [tipoReporte]);

  const handleDescargarExcel = async () => {
    if (tipoReporte === 'asesorias') {
      if (asistencias.length === 0) {
        alert('No hay asistencias de asesorias registradas para exportar.');
        return;
      }
      try {
        setExportando(true);
        await exportarAsistenciasExcel(
          asistencias,
          `asistencias_asesorias_${new Date().toISOString().slice(0, 10)}.xlsx`,
          (prog) => setProgresoExport(prog)
        );
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Error al generar archivo Excel.');
      } finally {
        setExportando(false);
        setProgresoExport(null);
      }
    } else {
      if (asistenciasEventos.length === 0) {
        alert('No hay asistencias de eventos registradas para exportar.');
        return;
      }
      try {
        setExportando(true);
        // Si hay un evento seleccionado, usar su metadata; sino crear metadata consolidada
        const eventoActual = eventos.find((e) => e.id === eventoId) || {
          id: 'reporte-eventos',
          codigo: 'HISTORIAL',
          nombre: 'Historial Consolidado de Eventos',
          creadaPorId: '',
          estado: 'activa' as const,
          fechaInicio: new Date().toISOString(),
        };

        await exportarAsistenciasEventoExcel(
          eventoActual,
          asistenciasEventos,
          `asistencias_eventos_${new Date().toISOString().slice(0, 10)}.xlsx`,
          (prog) => setProgresoExport(prog)
        );
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Error al generar archivo Excel.');
      } finally {
        setExportando(false);
        setProgresoExport(null);
      }
    }
  };

  const ejecutarConsulta = () => {
    if (tipoReporte === 'asesorias') {
      consultarAsesorias();
    } else {
      consultarEventos();
    }
  };

  const limpiarFiltros = () => {
    setDesde('');
    setHasta('');
    setMateriaId('');
    setEventoId('');
    setCodigoEstudiante('');
    setNombreEstudiante('');
    setTimeout(ejecutarConsulta, 50);
  };

  const totalRegistros = tipoReporte === 'asesorias' ? asistencias.length : asistenciasEventos.length;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Cabecera de la pagina */}
      <div className="page-breadcrumb-bar">
        <div>
          <h1 className="page-title">Historial y Auditoria de Asistencias</h1>
          <p style={{ fontSize: '0.86rem', color: '#607D8B', marginTop: '2px' }}>
            Revisa y audita los asistentes de asesorias y eventos pasados con verificacion de firma manuscrita y exportacion a Excel.
          </p>
        </div>
        <button
          className="btn btn-green"
          onClick={handleDescargarExcel}
          disabled={exportando || loading || totalRegistros === 0}
        >
          {exportando ? (
            <>
              <ArrowPathIcon className="animate-spin" style={{ width: '16px', height: '16px' }} />
              {progresoExport ? `${progresoExport.actual}/${progresoExport.total}` : 'Exportando firmas...'}
            </>
          ) : (
            <>
              <ArrowDownTrayIcon style={{ width: '16px', height: '16px' }} />
              Descargar en Excel (.xlsx)
            </>
          )}
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

      {/* Selector de Tipo de Asistencia: Asesorias vs Eventos */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '18px',
          borderBottom: '2px solid #E2E8F0',
          paddingBottom: '10px',
        }}
      >
        <button
          onClick={() => setTipoReporte('asesorias')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            backgroundColor: tipoReporte === 'asesorias' ? '#C62828' : '#F1F5F9',
            color: tipoReporte === 'asesorias' ? '#FFFFFF' : '#475569',
            transition: 'all 0.15s ease',
          }}
        >
          <BookOpenIcon style={{ width: '18px', height: '18px' }} />
          <span>Asesorias de Sala ({asistencias.length})</span>
        </button>

        <button
          onClick={() => setTipoReporte('eventos')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            backgroundColor: tipoReporte === 'eventos' ? '#C62828' : '#F1F5F9',
            color: tipoReporte === 'eventos' ? '#FFFFFF' : '#475569',
            transition: 'all 0.15s ease',
          }}
        >
          <AcademicCapIcon style={{ width: '18px', height: '18px' }} />
          <span>Eventos y Cursos ({asistenciasEventos.length})</span>
        </button>
      </div>

      {/* Tarjeta de Filtros de Busqueda */}
      <div className="ufps-card" style={{ borderTopColor: '#C62828', marginBottom: '20px' }}>
        <div className="card-header">
          <span className="card-title">
            <FunnelIcon style={{ width: '18px', height: '18px', color: '#C62828' }} />
            Filtros para {tipoReporte === 'asesorias' ? 'Asesorias de Sala' : 'Eventos y Cursos'}
          </span>
        </div>
        <div className="card-body">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px',
              alignItems: 'flex-end',
            }}
          >
            <div>
              <label className="form-label">Desde</label>
              <input type="date" className="form-input" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </div>

            <div>
              <label className="form-label">Hasta</label>
              <input type="date" className="form-input" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </div>

            {tipoReporte === 'asesorias' ? (
              <div>
                <label className="form-label">Materia</label>
                <select className="form-select" value={materiaId} onChange={(e) => setMateriaId(e.target.value)}>
                  <option value="">Todas las materias</option>
                  {materias.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.codigo} - {m.nombre}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="form-label">Evento</label>
                <select className="form-select" value={eventoId} onChange={(e) => setEventoId(e.target.value)}>
                  <option value="">Todos los eventos</option>
                  {eventos.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      {evt.codigo} - {evt.nombre} {evt.estado === 'cerrada' ? '(Finalizado)' : '(Activo)'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="form-label">Codigo Estudiante</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: 1152..."
                value={codigoEstudiante}
                onChange={(e) => setCodigoEstudiante(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">Nombre Estudiante</label>
              <input
                type="text"
                className="form-input"
                placeholder="Nombre o apellido..."
                value={nombreEstudiante}
                onChange={(e) => setNombreEstudiante(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-red" onClick={ejecutarConsulta} style={{ flex: 1 }}>
                <MagnifyingGlassIcon style={{ width: '15px', height: '15px' }} />
                Filtrar
              </button>
              <button
                className="btn btn-secondary"
                onClick={limpiarFiltros}
                title="Limpiar filtros"
              >
                <ArrowPathIcon style={{ width: '15px', height: '15px' }} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Resultados de la Consulta */}
      <div className="ufps-card card-red">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-title">
            <DocumentChartBarIcon style={{ width: '18px', height: '18px', color: '#C62828' }} />
            {tipoReporte === 'asesorias'
              ? `Historial de Asistencias a Asesorias (${asistencias.length})`
              : `Historial de Asistentes a Eventos (${asistenciasEventos.length})`}
          </span>
          <span className="badge-tag green">
            {totalRegistros} Registros
          </span>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
              <ArrowPathIcon className="animate-spin" style={{ width: '24px', height: '24px', margin: '0 auto 8px' }} />
              <p>Consultando registros historicos...</p>
            </div>
          ) : totalRegistros === 0 ? (
            <div style={{ padding: '50px 20px', textAlign: 'center', color: '#90A4AE' }}>
              <ClockIcon style={{ width: '38px', height: '38px', margin: '0 auto 10px', opacity: 0.6 }} />
              <p style={{ fontWeight: 600, color: '#475569' }}>
                No se encontraron registros con los filtros seleccionados.
              </p>
              <p style={{ fontSize: '0.82rem', marginTop: '4px' }}>
                Prueba cambiando las fechas o limpiando los campos de busqueda.
              </p>
            </div>
          ) : tipoReporte === 'asesorias' ? (
            /* TABLA DE ASISTENCIAS A ASESORIAS */
            <div className="table-responsive">
              <table className="ufps-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px', textAlign: 'center' }}>N°</th>
                    <th>Codigo Materia</th>
                    <th>Nombre Materia</th>
                    <th>Nombre y Apellido Estudiante</th>
                    <th>Codigo Estudiante</th>
                    <th>Temas / Motivo</th>
                    <th>Fecha y Hora</th>
                    <th style={{ textAlign: 'center', width: '110px' }}>Firma</th>
                  </tr>
                </thead>
                <tbody>
                  {asistencias.map((a, idx) => (
                    <tr key={a.id}>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#78909C' }}>
                        {idx + 1}
                      </td>
                      <td>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            backgroundColor: '#E8EAF6',
                            color: '#1A237E',
                            padding: '2px 7px',
                            borderRadius: '3px',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                          }}
                        >
                          {a.materiaCodigo || 'N/A'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: '#263238' }}>
                        {a.materiaNombre || 'Asesoria Academica'}
                      </td>
                      <td style={{ fontWeight: 600 }}>{a.nombreEstudiante}</td>
                      <td>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            backgroundColor: '#ECEFF1',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontSize: '0.82rem',
                          }}
                        >
                          {a.codigoEstudiante}
                        </span>
                      </td>
                      <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {a.motivo}
                      </td>
                      <td style={{ fontSize: '0.82rem', color: '#555', whiteSpace: 'nowrap' }}>
                        {formatColombiaDateTime(a.fechaHora)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            setFirmaModalUrl(api.firmas.getUrl(a.id));
                            setFirmaModalEstudiante(a.nombreEstudiante);
                          }}
                          style={{ padding: '3px 8px', fontSize: '0.76rem' }}
                        >
                          <EyeIcon style={{ width: '13px', height: '13px' }} />
                          Auditar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* TABLA DE ASISTENCIAS A EVENTOS Y CURSOS */
            <div className="table-responsive">
              <table className="ufps-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px', textAlign: 'center' }}>N°</th>
                    <th>Codigo Evento</th>
                    <th>Nombre del Evento</th>
                    <th>Nombre y Apellido Estudiante</th>
                    <th>Codigo / Documento</th>
                    <th>Correo Electronico</th>
                    <th>Fecha y Hora</th>
                    <th style={{ textAlign: 'center', width: '110px' }}>Firma</th>
                  </tr>
                </thead>
                <tbody>
                  {asistenciasEventos.map((ae, idx) => (
                    <tr key={ae.id}>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#78909C' }}>
                        {idx + 1}
                      </td>
                      <td>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            backgroundColor: '#FFEBEE',
                            color: '#C62828',
                            padding: '2px 7px',
                            borderRadius: '3px',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                          }}
                        >
                          {ae.eventoCodigo || 'EVT'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: '#1E293B' }}>
                        {ae.eventoNombre || 'Evento'}
                      </td>
                      <td style={{ fontWeight: 600 }}>{ae.nombreEstudiante}</td>
                      <td>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            backgroundColor: '#ECEFF1',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontSize: '0.82rem',
                          }}
                        >
                          {ae.codigoEstudiante}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: '#555' }}>
                        {ae.correoEstudiante || '—'}
                      </td>
                      <td style={{ fontSize: '0.78rem', color: '#607D8B', whiteSpace: 'nowrap' }}>
                        {formatColombiaDateTime(ae.fechaHora)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            setFirmaModalUrl(api.firmas.getUrl(ae.id));
                            setFirmaModalEstudiante(ae.nombreEstudiante);
                          }}
                          style={{ padding: '3px 8px', fontSize: '0.76rem' }}
                        >
                          <EyeIcon style={{ width: '13px', height: '13px' }} />
                          Auditar
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

      {/* Modal de Auditoria Visual de Firma */}
      {firmaModalUrl && (
        <div className="modal-overlay" onClick={() => setFirmaModalUrl(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Auditoria Visual de Firma</h3>
              <button
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                onClick={() => setFirmaModalUrl(null)}
              >
                <XMarkIcon style={{ width: '20px', height: '20px' }} />
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.88rem', color: '#555', marginBottom: '14px' }}>
                Estudiante: <strong>{firmaModalEstudiante}</strong>
              </p>
              <div
                style={{
                  backgroundColor: '#FAFAFA',
                  border: '1px solid #E0E0E0',
                  borderRadius: '6px',
                  padding: '16px',
                  minHeight: '160px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={firmaModalUrl}
                  alt="Firma manuscrita"
                  style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                  onError={(e) => {
                    const el = e.target as HTMLElement;
                    el.style.display = 'none';
                    if (el.parentElement) {
                      el.parentElement.innerHTML =
                        '<span style="color:#C62828; font-size:0.85rem;">No fue posible cargar la firma desde Cloudflare R2.</span>';
                    }
                  }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setFirmaModalUrl(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
