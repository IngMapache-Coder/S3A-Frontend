import { useState, useEffect } from 'react';
import {
  QrCodeIcon,
  UserGroupIcon,
  ArrowPathIcon,
  ClockIcon,
  EyeIcon,
  XMarkIcon,
  ArrowsPointingOutIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { QRCodeSVG } from 'qrcode.react';
import { api, type Sesion, type Asistencia } from '../api/client.js';
import { formatColombiaDateTime, getColombiaHeaderDate } from '../utils/date.js';
import { exportarAsistenciasExcel, type ExportProgress } from '../utils/excelExport.js';
import { getPusher } from '../utils/pusher.js';

interface TutorSalaViewProps {
  onAbrirComoEstudiante?: (codigo: string) => void;
}

export const TutorSalaView = ({ onAbrirComoEstudiante: _ }: TutorSalaViewProps = {}) => {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [accionLoading, setAccionLoading] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [progresoExport, setProgresoExport] = useState<ExportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [firmaModalUrl, setFirmaModalUrl] = useState<string | null>(null);
  const [firmaModalEstudiante, setFirmaModalEstudiante] = useState<string | null>(null);
  const [proyectorModo, setProyectorModo] = useState(false);

  const cargarEstado = async () => {
    try {
      setError(null);
      const res = await api.sesiones.activa();
      setSesion(res.data);
      if (res.data) {
        const asisRes = await api.sesiones.listarAsistencias(res.data.id);
        setAsistencias(asisRes.data || []);
      } else {
        setAsistencias([]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al consultar estado de sala');
    } finally {
      setLoading(false);
    }
  };

  // Suscripcion a eventos en tiempo real via Pusher (cero polling)
  useEffect(() => {
    cargarEstado();

    const pusher = getPusher();
    const channel = pusher.subscribe('sala-asesoria');

    const handleActualizacion = () => {
      cargarEstado();
    };

    channel.bind('sesion-abierta', handleActualizacion);
    channel.bind('sesion-cerrada', handleActualizacion);
    channel.bind('asistencia-registrada', handleActualizacion);

    const handleVisibility = () => {
      if (!document.hidden) {
        cargarEstado();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      channel.unbind('sesion-abierta', handleActualizacion);
      channel.unbind('sesion-cerrada', handleActualizacion);
      channel.unbind('asistencia-registrada', handleActualizacion);
      pusher.unsubscribe('sala-asesoria');
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const handleAbrirSesion = async () => {
    try {
      setAccionLoading(true);
      setError(null);
      const res = await api.sesiones.abrir();
      setSesion(res.data);
      await cargarEstado();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al abrir sesión');
    } finally {
      setAccionLoading(false);
    }
  };

  const handleCerrarSesion = async () => {
    if (!sesion) return;
    if (!window.confirm('¿Deseas finalizar la sesión de asesorías? El código QR quedará desactivado.')) return;
    try {
      setAccionLoading(true);
      setError(null);
      await api.sesiones.cerrar(sesion.id);
      setSesion(null);
      setAsistencias([]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cerrar sesión');
    } finally {
      setAccionLoading(false);
    }
  };

  const urlEstudiante = sesion
    ? `${window.location.origin}?codigo=${sesion.codigo}&tab=estudiante`
    : '';

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
        <ArrowPathIcon className="animate-spin" style={{ width: '32px', height: '32px', margin: '0 auto 12px' }} />
        <p>Cargando estado de la sala...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-breadcrumb-bar">
        <div>
          <h1 className="page-title">Sala de Asesorías — Amigo Académico</h1>
          <p style={{ fontSize: '0.86rem', color: '#607D8B', marginTop: '2px' }}>
            Sesión compartida activa para los tutores en turno.
          </p>
        </div>
        <div className="page-date">{getColombiaHeaderDate()}</div>
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

      {!sesion ? (
        <div className="ufps-card card-red" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#FFEBEE',
              color: '#C62828',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <QrCodeIcon style={{ width: '32px', height: '32px' }} />
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#263238', marginBottom: '8px' }}>
            No hay sesión compartida activa en la sala
          </h2>
          <p style={{ maxWidth: '520px', margin: '0 auto 24px', color: '#546E7A', fontSize: '0.92rem', lineHeight: 1.5 }}>
            Al abrir la sesión se generará el <strong>código QR único</strong> que los estudiantes
            escanearán desde su celular para registrar su asistencia y firma digital.
          </p>
          <button
            className="btn btn-red"
            onClick={handleAbrirSesion}
            disabled={accionLoading}
            style={{ padding: '10px 24px', fontSize: '0.95rem' }}
          >
            {accionLoading ? (
              <>
                <ArrowPathIcon style={{ width: '18px', height: '18px' }} className="animate-spin" />
                Abriendo sala...
              </>
            ) : (
              <>
                <QrCodeIcon style={{ width: '18px', height: '18px' }} />
                Abrir Sesión de Asesorías
              </>
            )}
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: '22px' }}>
          <div className="ufps-card card-green">
            <div className="card-header">
              <span className="card-title">
                <CheckCircleIcon style={{ width: '18px', height: '18px', color: '#00A65A' }} />
                QR de Sala
              </span>
              <span className="badge-tag green">Activa</span>
            </div>

            <div className="card-body" style={{ textAlign: 'center' }}>
              <div
                style={{
                  backgroundColor: '#F8F9FA',
                  border: '2px solid #E0E0E0',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'inline-block',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)',
                  marginBottom: '14px',
                }}
              >
                <QRCodeSVG value={urlEstudiante} size={200} level="M" includeMargin={true} />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.76rem',
                    color: '#78909C',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    letterSpacing: '1px',
                  }}
                >
                  Código de Acceso
                </span>
                <span
                  style={{
                    fontSize: '2rem',
                    fontWeight: 900,
                    letterSpacing: '4px',
                    color: '#C62828',
                    fontFamily: 'monospace',
                  }}
                >
                  {sesion.codigo}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setProyectorModo(true)}
                  style={{ width: '100%' }}
                >
                  <ArrowsPointingOutIcon style={{ width: '16px', height: '16px' }} />
                  Modo Proyector (Pantalla Completa)
                </button>

                <button
                  className="btn btn-red"
                  onClick={handleCerrarSesion}
                  disabled={accionLoading}
                  style={{ width: '100%', marginTop: '6px' }}
                >
                  {accionLoading ? 'Cerrando...' : 'Cerrar Sesión de Asesorías'}
                </button>
              </div>
            </div>
          </div>

          <div className="ufps-card card-red">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <span className="card-title">
                <UserGroupIcon style={{ width: '18px', height: '18px', color: '#C62828' }} />
                Estudiantes Registrados ({asistencias.length})
              </span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {asistencias.length > 0 && (
                  <button
                    className="btn btn-green"
                    onClick={async () => {
                      try {
                        setExportando(true);
                        await exportarAsistenciasExcel(
                          asistencias,
                          `asistencias_sala_${sesion.codigo}_${new Date().toISOString().slice(0, 10)}.xlsx`,
                          (prog) => setProgresoExport(prog)
                        );
                      } catch (err: unknown) {
                        alert(err instanceof Error ? err.message : 'Error al exportar a Excel');
                      } finally {
                        setExportando(false);
                        setProgresoExport(null);
                      }
                    }}
                    disabled={exportando}
                    style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                    title="Exportar a Excel"
                  >
                    {exportando ? (
                      <>
                        <ArrowPathIcon className="animate-spin" style={{ width: '13px', height: '13px' }} />
                        {progresoExport ? `${progresoExport.actual}/${progresoExport.total}` : 'Exportando...'}
                      </>
                    ) : (
                      <>
                        <ArrowDownTrayIcon style={{ width: '13px', height: '13px' }} />
                        Exportar Excel (.xlsx)
                      </>
                    )}
                  </button>
                )}
                <button
                  className="btn btn-secondary"
                  onClick={cargarEstado}
                  style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                  title="Actualizar lista"
                >
                  <ArrowPathIcon style={{ width: '13px', height: '13px' }} />
                  Refrescar
                </button>
              </div>
            </div>

            <div className="card-body" style={{ padding: 0 }}>
              {asistencias.length === 0 ? (
                <div style={{ padding: '46px 20px', textAlign: 'center', color: '#90A4AE' }}>
                  <ClockIcon style={{ width: '36px', height: '36px', margin: '0 auto 10px', opacity: 0.7 }} />
                  <p style={{ fontWeight: 600, color: '#546E7A' }}>
                    Esperando que los estudiantes escaneen el QR y firmen...
                  </p>
                  <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                    Los registros se actualizarán automáticamente.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="ufps-table">
                    <thead>
                      <tr>
                        <th style={{ width: '50px', textAlign: 'center' }}>N°</th>
                        <th>Código Materia</th>
                        <th>Nombre Materia</th>
                        <th>Nombre y Apellido Estudiante</th>
                        <th>Código Estudiante</th>
                        <th>Temas</th>
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
                            {a.materiaNombre || 'Asesoría Académica'}
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
                          <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                              title="Ver firma"
                            >
                              <EyeIcon style={{ width: '13px', height: '13px' }} />
                              Ver Firma
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
        </div>
      )}

      {firmaModalUrl && (
        <div className="modal-overlay" onClick={() => setFirmaModalUrl(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Firma Manuscrita Digital</h3>
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
                        '<span style="color:#C62828; font-size:0.85rem;">No fue posible previsualizar la imagen.</span>';
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

      {proyectorModo && sesion && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: '#FFFFFF',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <button
            onClick={() => setProyectorModo(false)}
            className="btn btn-secondary"
            style={{ position: 'absolute', top: '24px', right: '24px' }}
          >
            <XMarkIcon style={{ width: '18px', height: '18px' }} />
            Salir de Pantalla Completa
          </button>

          <div style={{ textAlign: 'center', maxWidth: '640px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#FFEBEE',
                color: '#C62828',
                padding: '6px 16px',
                borderRadius: '20px',
                fontWeight: 700,
                fontSize: '0.9rem',
                marginBottom: '16px',
              }}
            >
              <AcademicCapIcon style={{ width: '18px', height: '18px' }} />
              ASESORÍAS AMIGO ACADÉMICO — ASISTENCIA DIGITAL
            </div>

            <h1 style={{ fontSize: '2.4rem', fontWeight: 900, color: '#212529', marginBottom: '8px' }}>
              Escanea el código QR
            </h1>
            <p style={{ color: '#555', fontSize: '1.05rem', marginBottom: '24px' }}>
              Abre la cámara de tu celular, busca tu materia y firma tu asistencia en pantalla.
            </p>

            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '4px solid #C62828',
                borderRadius: '16px',
                padding: '24px',
                display: 'inline-block',
                boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
                marginBottom: '20px',
              }}
            >
              <QRCodeSVG value={urlEstudiante} size={300} level="M" includeMargin={true} />
            </div>

            <div style={{ marginTop: '8px' }}>
              <span style={{ fontSize: '0.9rem', color: '#666', fontWeight: 600 }}>CÓDIGO DE SALA:</span>
              <div
                style={{
                  fontSize: '3.2rem',
                  fontWeight: 900,
                  letterSpacing: '6px',
                  color: '#C62828',
                  fontFamily: 'monospace',
                }}
              >
                {sesion.codigo}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
