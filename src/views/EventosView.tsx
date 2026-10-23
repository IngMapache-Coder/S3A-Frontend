import React, { useState, useEffect, useRef } from 'react';
import {
  QrCodeIcon,
  UserGroupIcon,
  UsersIcon,
  UserIcon,
  MapPinIcon,
  ArrowPathIcon,
  ClockIcon,
  EyeIcon,
  XMarkIcon,
  ArrowsPointingOutIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  CalendarDaysIcon,
  PencilSquareIcon,
  TrashIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  TagIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { QRCodeSVG } from 'qrcode.react';
import { api, type Evento, type AsistenciaEvento } from '../api/client.js';
import { formatColombiaDateTime, getColombiaHeaderDate } from '../utils/date.js';
import { exportarAsistenciasEventoExcel, type ExportProgress } from '../utils/excelExport.js';

interface EventosViewProps {
  onAbrirComoEstudiante?: (codigo: string, tipo?: string) => void;
}

export const EventosView: React.FC<EventosViewProps> = ({ onAbrirComoEstudiante }) => {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Evento actualmente seleccionado para ver su sala en vivo
  const [eventoSeleccionado, setEventoSeleccionado] = useState<Evento | null>(null);
  const [asistencias, setAsistencias] = useState<AsistenciaEvento[]>([]);

  // Modales
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [eventoAEditar, setEventoAEditar] = useState<Evento | null>(null);
  const [proyectorModo, setProyectorModo] = useState(false);
  const [firmaModalUrl, setFirmaModalUrl] = useState<string | null>(null);
  const [firmaModalEstudiante, setFirmaModalEstudiante] = useState<string | null>(null);

  // Formularios
  const [formNombre, setFormNombre] = useState('');
  const [formCodigo, setFormCodigo] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formLugar, setFormLugar] = useState('');
  const [formPonente, setFormPonente] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Acciones y feedback
  const [accionLoading, setAccionLoading] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [progresoExport, setProgresoExport] = useState<ExportProgress | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activa' | 'cerrada'>('todos');

  const pollingRef = useRef<number | null>(null);

  // Cargar lista de eventos
  const cargarEventos = async () => {
    try {
      setError(null);
      const res = await api.eventos.list();
      setEventos(res.data || []);
      if (eventoSeleccionado) {
        const actualizado = res.data.find((e) => e.id === eventoSeleccionado.id);
        if (actualizado) setEventoSeleccionado(actualizado);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar eventos');
    } finally {
      setLoading(false);
    }
  };

  // Cargar asistencias del evento seleccionado
  const cargarAsistenciasEvento = async (eventoId: string) => {
    try {
      const res = await api.eventos.listarAsistencias(eventoId);
      setAsistencias(res.data || []);
    } catch (err: unknown) {
      console.error('Error al cargar asistencias del evento:', err);
    }
  };

  useEffect(() => {
    cargarEventos();
  }, []);

  // Polling para la sala del evento seleccionado
  // Solo activo cuando hay evento seleccionado con estado 'activa' y pestana visible
  useEffect(() => {
    if (!eventoSeleccionado) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    cargarAsistenciasEvento(eventoSeleccionado.id);

    // Solo hacer polling si el evento esta activo (sala abierta)
    if (eventoSeleccionado.estado !== 'activa') return;

    pollingRef.current = window.setInterval(async () => {
      if (document.hidden) return; // No hacer peticiones en pestana oculta
      try {
        const [resEvento, resAsis] = await Promise.all([
          api.eventos.getById(eventoSeleccionado.id),
          api.eventos.listarAsistencias(eventoSeleccionado.id),
        ]);
        if (resEvento.data) {
          setEventoSeleccionado(resEvento.data);
        }
        setAsistencias(resAsis.data || []);
      } catch {}
    }, 10000);

    const handleVisibility = () => {
      if (!document.hidden && eventoSeleccionado) {
        cargarAsistenciasEvento(eventoSeleccionado.id);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [eventoSeleccionado?.id, eventoSeleccionado?.estado]);

  // Manejar creación de nuevo evento
  const handleCrearEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim()) {
      alert('El nombre del evento es obligatorio.');
      return;
    }

    try {
      setGuardando(true);
      const res = await api.eventos.create({
        nombre: formNombre.trim(),
        codigo: formCodigo.trim() || undefined,
        descripcion: formDescripcion.trim() || undefined,
        lugar: formLugar.trim() || undefined,
        ponente: formPonente.trim() || undefined,
      });

      setModalCrearAbierto(false);
      limpiarFormulario();
      await cargarEventos();
      setEventoSeleccionado(res.data);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al crear evento');
    } finally {
      setGuardando(false);
    }
  };

  // Manejar edición de evento
  const handleEditarEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventoAEditar || !formNombre.trim()) return;

    try {
      setGuardando(true);
      const res = await api.eventos.update(eventoAEditar.id, {
        nombre: formNombre.trim(),
        codigo: formCodigo.trim() || undefined,
        descripcion: formDescripcion.trim() || undefined,
        lugar: formLugar.trim() || undefined,
        ponente: formPonente.trim() || undefined,
      });

      setModalEditarAbierto(false);
      setEventoAEditar(null);
      limpiarFormulario();
      await cargarEventos();
      if (eventoSeleccionado && eventoSeleccionado.id === eventoAEditar.id) {
        setEventoSeleccionado(res.data);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al actualizar evento');
    } finally {
      setGuardando(false);
    }
  };

  const abrirModalEditar = (evt: Evento) => {
    setEventoAEditar(evt);
    setFormNombre(evt.nombre);
    setFormCodigo(evt.codigo);
    setFormDescripcion(evt.descripcion || '');
    setFormLugar(evt.lugar || '');
    setFormPonente(evt.ponente || evt.facilitador || '');
    setModalEditarAbierto(true);
  };

  const limpiarFormulario = () => {
    setFormNombre('');
    setFormCodigo('');
    setFormDescripcion('');
    setFormLugar('');
    setFormPonente('');
  };

  // Cerrar evento
  const handleCerrarEvento = async (evt: Evento) => {
    if (!window.confirm(`Deseas finalizar el registro de asistencias para "${evt.nombre}"? El codigo QR quedara desactivado.`)) {
      return;
    }

    try {
      setAccionLoading(true);
      await api.eventos.cerrar(evt.id);
      await cargarEventos();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al cerrar evento');
    } finally {
      setAccionLoading(false);
    }
  };

  // Reabrir evento
  const handleReabrirEvento = async (evt: Evento) => {
    try {
      setAccionLoading(true);
      await api.eventos.reabrir(evt.id);
      await cargarEventos();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al reactivar evento');
    } finally {
      setAccionLoading(false);
    }
  };

  // Eliminar evento
  const handleEliminarEvento = async (evt: Evento) => {
    if (!window.confirm(`Estas seguro de eliminar el evento "${evt.nombre}" y todas sus asistencias? Esta accion no se puede deshacer.`)) {
      return;
    }

    try {
      setAccionLoading(true);
      await api.eventos.delete(evt.id);
      if (eventoSeleccionado?.id === evt.id) {
        setEventoSeleccionado(null);
      }
      await cargarEventos();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar evento');
    } finally {
      setAccionLoading(false);
    }
  };

  // Exportar Excel
  const handleExportarExcel = async () => {
    if (!eventoSeleccionado) return;
    if (asistencias.length === 0) {
      alert('No hay asistencias registradas en este evento para exportar.');
      return;
    }

    try {
      setExportando(true);
      await exportarAsistenciasEventoExcel(
        eventoSeleccionado,
        asistencias,
        undefined,
        (prog) => setProgresoExport(prog)
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al exportar a Excel');
    } finally {
      setExportando(false);
      setProgresoExport(null);
    }
  };

  // Copiar URL del QR
  const copiarEnlace = (codigo: string) => {
    const url = `${window.location.origin}?codigo=${codigo}&tipo=evento&tab=estudiante`;
    navigator.clipboard.writeText(url);
    setCopiado(codigo);
    setTimeout(() => setCopiado(null), 2500);
  };

  const urlEstudiante = eventoSeleccionado
    ? `${window.location.origin}?codigo=${eventoSeleccionado.codigo}&tipo=evento&tab=estudiante`
    : '';

  const eventosFiltrados = eventos.filter((e) => {
    const q = busqueda.toLowerCase().trim();
    const ponenteTexto = (e.ponente || e.facilitador || '').toLowerCase();
    const coincideTexto =
      e.nombre.toLowerCase().includes(q) ||
      e.codigo.toLowerCase().includes(q) ||
      ponenteTexto.includes(q) ||
      (e.lugar && e.lugar.toLowerCase().includes(q));

    if (!coincideTexto) return false;
    if (filtroEstado === 'activa') return e.estado === 'activa';
    if (filtroEstado === 'cerrada') return e.estado === 'cerrada';
    return true;
  });

  const totalEventos = eventos.length;
  const eventosActivos = eventos.filter((e) => e.estado === 'activa').length;
  const eventosCerrados = eventos.filter((e) => e.estado === 'cerrada').length;
  const totalAsistencias = eventos.reduce((acc, curr) => acc + (curr.totalAsistencias || 0), 0);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
        <ArrowPathIcon className="animate-spin" style={{ width: '32px', height: '32px', margin: '0 auto 12px' }} />
        <p>Cargando modulo de eventos...</p>
      </div>
    );
  }

  // ============================================================
  // VISTA 1: SALA EN VIVO DEL EVENTO SELECCIONADO
  // ============================================================
  if (eventoSeleccionado) {
    const ponenteActual = eventoSeleccionado.ponente || eventoSeleccionado.facilitador;

    return (
      <div>
        {/* Barra superior con volver */}
        <div className="page-breadcrumb-bar">
          <div>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setEventoSeleccionado(null);
                setAsistencias([]);
                cargarEventos();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                fontSize: '0.82rem',
                marginBottom: '10px',
              }}
            >
              <ArrowLeftIcon style={{ width: '15px', height: '15px' }} />
              Volver a Todos los Eventos
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 className="page-title">{eventoSeleccionado.nombre}</h1>
              {eventoSeleccionado.estado === 'activa' ? (
                <span className="badge-tag green" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span className="live-pulse" />
                  QR Activo / En Vivo
                </span>
              ) : (
                <span className="badge-tag gray">Evento Finalizado</span>
              )}
            </div>
            <div style={{ fontSize: '0.86rem', color: '#607D8B', marginTop: '4px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              {eventoSeleccionado.lugar && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <MapPinIcon style={{ width: '14px', height: '14px' }} />
                  {eventoSeleccionado.lugar}
                </span>
              )}
              {ponenteActual && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <UserIcon style={{ width: '14px', height: '14px' }} />
                  Ponente: {ponenteActual}
                </span>
              )}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <TagIcon style={{ width: '14px', height: '14px' }} />
                Codigo: <strong>{eventoSeleccionado.codigo}</strong>
              </span>
            </div>
          </div>
          <div className="text-muted" style={{ fontSize: '0.82rem' }}>
            {getColombiaHeaderDate()}
          </div>
        </div>

        {error && (
          <div className="ufps-callout callout-danger" style={{ marginBottom: '16px' }}>
            <p>{error}</p>
          </div>
        )}

        {/* Banner de evento cerrado */}
        {eventoSeleccionado.estado === 'cerrada' && (
          <div
            style={{
              backgroundColor: '#FFF3E0',
              border: '1px solid #FFE0B2',
              borderRadius: '6px',
              padding: '12px 16px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ExclamationTriangleIcon style={{ width: '20px', height: '20px', color: '#E65100', flexShrink: 0 }} />
              <span style={{ color: '#E65100', fontSize: '0.88rem', fontWeight: 600 }}>
                Este evento se encuentra finalizado. Los estudiantes ya no pueden firmar con este codigo QR.
              </span>
            </div>
            <button
              className="btn btn-green"
              onClick={() => handleReabrirEvento(eventoSeleccionado)}
              disabled={accionLoading}
              style={{ padding: '6px 14px', fontSize: '0.82rem', flexShrink: 0 }}
            >
              Reactivar Registro
            </button>
          </div>
        )}

        {/* Layout de sala: QR a la izquierda y lista en vivo a la derecha */}
        <div className="room-layout">
          {/* Tarjeta del Codigo QR */}
          <div className="ufps-card card-red" style={{ textAlign: 'center' }}>
            <div className="card-header">
              <span className="card-title">
                <QrCodeIcon style={{ width: '18px', height: '18px', color: '#C62828' }} />
                Codigo QR del Evento
              </span>
            </div>
            <div className="card-body">
              <p style={{ fontSize: '0.84rem', color: '#555', marginBottom: '14px' }}>
                Los estudiantes deben escanear este codigo exclusivo para registrar su asistencia a{' '}
                <strong>{eventoSeleccionado.nombre}</strong>.
              </p>

              <div
                style={{
                  backgroundColor: '#F8F9FA',
                  border: '2px solid #E0E0E0',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'inline-block',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)',
                  marginBottom: '16px',
                }}
              >
                <QRCodeSVG value={urlEstudiante} size={210} level="M" includeMargin={true} />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.74rem',
                    color: '#78909C',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    letterSpacing: '1px',
                  }}
                >
                  Codigo Unico del Evento
                </span>
                <span
                  style={{
                    fontSize: '2.1rem',
                    fontWeight: 900,
                    letterSpacing: '4px',
                    color: '#C62828',
                    fontFamily: 'monospace',
                  }}
                >
                  {eventoSeleccionado.codigo}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setProyectorModo(true)}
                  style={{ width: '100%', padding: '9px' }}
                >
                  <ArrowsPointingOutIcon style={{ width: '16px', height: '16px' }} />
                  Modo Proyector (Pantalla Completa)
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={() => copiarEnlace(eventoSeleccionado.codigo)}
                  style={{ width: '100%', padding: '9px' }}
                >
                  {copiado === eventoSeleccionado.codigo ? (
                    <>
                      <ClipboardDocumentCheckIcon style={{ width: '16px', height: '16px', color: '#00A65A' }} />
                      <span style={{ color: '#00A65A', fontWeight: 600 }}>Enlace Copiado al Portapapeles</span>
                    </>
                  ) : (
                    <>
                      <ClipboardDocumentIcon style={{ width: '16px', height: '16px' }} />
                      Copiar Enlace de Asistencia
                    </>
                  )}
                </button>

                {onAbrirComoEstudiante && (
                  <button
                    className="btn btn-outline-red"
                    onClick={() => onAbrirComoEstudiante(eventoSeleccionado.codigo, 'evento')}
                    style={{ width: '100%', padding: '9px' }}
                  >
                    <AcademicCapIcon style={{ width: '16px', height: '16px' }} />
                    Abrir Formulario en este Dispositivo
                  </button>
                )}

                {eventoSeleccionado.estado === 'activa' ? (
                  <button
                    className="btn btn-red"
                    onClick={() => handleCerrarEvento(eventoSeleccionado)}
                    disabled={accionLoading}
                    style={{ width: '100%', marginTop: '6px', padding: '9px' }}
                  >
                    {accionLoading ? 'Cerrando...' : 'Finalizar Evento (Cerrar QR)'}
                  </button>
                ) : (
                  <button
                    className="btn btn-green"
                    onClick={() => handleReabrirEvento(eventoSeleccionado)}
                    disabled={accionLoading}
                    style={{ width: '100%', marginTop: '6px', padding: '9px' }}
                  >
                    {accionLoading ? 'Reactivando...' : 'Reactivar Evento (Habilitar QR)'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tarjeta de Lista de Estudiantes Registrados */}
          <div className="ufps-card card-red">
            <div
              className="card-header"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}
            >
              <span className="card-title">
                <UserGroupIcon style={{ width: '18px', height: '18px', color: '#C62828' }} />
                Asistentes Registrados ({asistencias.length})
              </span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {asistencias.length > 0 && (
                  <button
                    className="btn btn-green"
                    onClick={handleExportarExcel}
                    disabled={exportando}
                    style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                    title="Exportar a Excel con firmas incrustadas"
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
                  onClick={() => cargarAsistenciasEvento(eventoSeleccionado.id)}
                  style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                  title="Actualizar lista"
                >
                  <ArrowPathIcon style={{ width: '13px', height: '13px' }} />
                  Refrescar
                </button>
              </div>
            </div>

            <div className="card-body" style={{ padding: 0 }}>
              {asistencias.length === 0 ? (
                <div style={{ padding: '50px 20px', textAlign: 'center', color: '#90A4AE' }}>
                  <ClockIcon style={{ width: '38px', height: '38px', margin: '0 auto 10px', opacity: 0.7 }} />
                  <p style={{ fontWeight: 600, color: '#546E7A' }}>
                    Esperando que los estudiantes escaneen el codigo QR y firmen...
                  </p>
                  <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                    Los registros se actualizaran automaticamente cada 10 segundos.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="ufps-table">
                    <thead>
                      <tr>
                        <th style={{ width: '50px', textAlign: 'center' }}>N°</th>
                        <th>Nombre y Apellido Estudiante</th>
                        <th>Codigo / Documento</th>
                        <th>Correo Electronico</th>
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
                          <td style={{ fontWeight: 600, color: '#263238' }}>
                            {a.nombreEstudiante}
                          </td>
                          <td>
                            <span
                              style={{
                                fontFamily: 'monospace',
                                backgroundColor: '#ECEFF1',
                                padding: '2px 7px',
                                borderRadius: '4px',
                                fontSize: '0.82rem',
                                color: '#37474F',
                              }}
                            >
                              {a.codigoEstudiante}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.82rem', color: '#555' }}>
                            {a.correoEstudiante || '—'}
                          </td>
                          <td style={{ fontSize: '0.78rem', color: '#607D8B', whiteSpace: 'nowrap' }}>
                            {formatColombiaDateTime(a.fechaHora)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              className="btn btn-secondary"
                              onClick={() => {
                                setFirmaModalUrl(api.firmas.getUrl(a.id));
                                setFirmaModalEstudiante(a.nombreEstudiante);
                              }}
                              style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                              title="Ver firma digital"
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

        {/* Modal Pantalla Completa Proyector */}
        {proyectorModo && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: '#FFFFFF',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
            }}
          >
            <button
              onClick={() => setProyectorModo(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: '#ECEFF1',
                border: 'none',
                borderRadius: '50%',
                width: '44px',
                height: '44px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Cerrar modo proyector (ESC)"
            >
              <XMarkIcon style={{ width: '24px', height: '24px', color: '#37474F' }} />
            </button>

            <div style={{ textAlign: 'center', maxWidth: '720px' }}>
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
                  marginBottom: '12px',
                }}
              >
                <AcademicCapIcon style={{ width: '20px', height: '20px' }} />
                <span>ASISTENCIA DIGITAL A EVENTO</span>
              </div>

              <h1
                style={{
                  fontSize: '2.4rem',
                  fontWeight: 900,
                  color: '#263238',
                  lineHeight: 1.15,
                  marginBottom: '8px',
                }}
              >
                {eventoSeleccionado.nombre}
              </h1>

              {ponenteActual && (
                <p style={{ fontSize: '1.15rem', color: '#546E7A', marginBottom: '16px' }}>
                  Ponente: <strong>{ponenteActual}</strong>
                </p>
              )}

              <p style={{ fontSize: '1rem', color: '#78909C', marginBottom: '20px' }}>
                Escanea con la camara de tu celular para registrar y firmar tu asistencia:
              </p>

              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  padding: '24px',
                  borderRadius: '16px',
                  display: 'inline-block',
                  border: '4px solid #C62828',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                  marginBottom: '16px',
                }}
              >
                <QRCodeSVG value={urlEstudiante} size={320} level="M" includeMargin={true} />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    color: '#78909C',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    fontWeight: 700,
                  }}
                >
                  Codigo de Registro
                </span>
                <span
                  style={{
                    fontSize: '3.2rem',
                    fontWeight: 900,
                    letterSpacing: '6px',
                    color: '#C62828',
                    fontFamily: 'monospace',
                  }}
                >
                  {eventoSeleccionado.codigo}
                </span>
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#E8F5E9',
                  color: '#1B5E20',
                  padding: '8px 20px',
                  borderRadius: '30px',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                }}
              >
                <CheckCircleIcon style={{ width: '22px', height: '22px', color: '#00A65A' }} />
                <span>{asistencias.length} Asistentes Registrados en Vivo</span>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Firma Individual */}
        {firmaModalUrl && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
            onClick={() => setFirmaModalUrl(null)}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '22px',
                maxWidth: '440px',
                width: '100%',
                boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '14px',
                  borderBottom: '1px solid #ECEFF1',
                  paddingBottom: '8px',
                }}
              >
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#263238' }}>
                  Firma Manuscrita Digital
                </h3>
                <button
                  onClick={() => setFirmaModalUrl(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <XMarkIcon style={{ width: '20px', height: '20px', color: '#90A4AE' }} />
                </button>
              </div>

              <p style={{ fontSize: '0.85rem', color: '#546E7A', marginBottom: '12px' }}>
                Estudiante: <strong>{firmaModalEstudiante}</strong>
              </p>

              <div
                style={{
                  backgroundColor: '#FAFAFA',
                  border: '1px solid #CFD8DC',
                  borderRadius: '6px',
                  padding: '16px',
                  textAlign: 'center',
                  minHeight: '160px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={firmaModalUrl}
                  alt="Firma del estudiante"
                  style={{ maxWidth: '100%', maxHeight: '180px', objectFit: 'contain' }}
                />
              </div>

              <button
                className="btn btn-secondary"
                onClick={() => setFirmaModalUrl(null)}
                style={{ width: '100%', marginTop: '16px' }}
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // VISTA 2: LISTA GENERAL DE EVENTOS Y ADMINISTRACION
  // ============================================================
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Cabecera institucional moderna */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
          paddingBottom: '14px',
          borderBottom: '1px solid #E2E8F0',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#C62828', marginBottom: '4px' }}>
            <AcademicCapIcon style={{ width: '22px', height: '22px' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
              Modulo Institucional
            </span>
          </div>
          <h1 className="page-title" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>
            Eventos, Talleres y Cursos
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#64748B', marginTop: '4px' }}>
            Gestiona eventos simultaneos con codigos QR unicos para captura de asistencias y firmas manuscritas.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            className="btn btn-red"
            onClick={() => {
              limpiarFormulario();
              setModalCrearAbierto(true);
            }}
            style={{
              boxShadow: '0 2px 6px rgba(198, 40, 40, 0.3)',
              padding: '8px 16px',
              fontSize: '0.88rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <PlusIcon style={{ width: '18px', height: '18px' }} />
            <span>Crear Evento</span>
          </button>
          <button
            className="btn btn-secondary"
            onClick={cargarEventos}
            title="Actualizar lista de eventos"
            style={{ padding: '8px 12px' }}
          >
            <ArrowPathIcon style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
      </div>

      {error && (
        <div className="ufps-callout callout-danger" style={{ marginBottom: '16px' }}>
          <p>{error}</p>
        </div>
      )}

      {/* Tarjetas de Metricas / KPIs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '22px',
        }}
      >
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              backgroundColor: '#FFEBEE',
              color: '#C62828',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <CalendarDaysIcon style={{ width: '26px', height: '26px' }} />
          </div>
          <div>
            <span style={{ fontSize: '0.74rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
              Total Eventos
            </span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1E293B', lineHeight: 1.1, marginTop: '2px' }}>
              {totalEventos}
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              backgroundColor: '#E8F5E9',
              color: '#00A65A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <QrCodeIcon style={{ width: '26px', height: '26px' }} />
          </div>
          <div>
            <span style={{ fontSize: '0.74rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
              Eventos Activos
            </span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#00A65A', lineHeight: 1.1, marginTop: '2px' }}>
              {eventosActivos}
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              backgroundColor: '#E0F2FE',
              color: '#0284C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <UsersIcon style={{ width: '26px', height: '26px' }} />
          </div>
          <div>
            <span style={{ fontSize: '0.74rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
              Asistencias Registradas
            </span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0284C7', lineHeight: 1.1, marginTop: '2px' }}>
              {totalAsistencias}
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtro y Busqueda Estilizada */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        }}
      >
        {/* Input de Busqueda */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 280px', minWidth: '220px' }}>
          <MagnifyingGlassIcon style={{ width: '18px', height: '18px', color: '#94A3B8', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Buscar por titulo, codigo, ponente o lugar..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              width: '100%',
              fontSize: '0.9rem',
              color: '#1E293B',
              backgroundColor: 'transparent',
            }}
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              style={{
                background: '#F1F5F9',
                border: 'none',
                color: '#64748B',
                cursor: 'pointer',
                fontSize: '0.74rem',
                padding: '2px 8px',
                borderRadius: '4px',
              }}
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Filtros de Estado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FunnelIcon style={{ width: '15px', height: '15px', color: '#94A3B8', marginRight: '4px' }} />
          <button
            onClick={() => setFiltroEstado('todos')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: filtroEstado === 'todos' ? '#1E293B' : '#F1F5F9',
              color: filtroEstado === 'todos' ? '#FFFFFF' : '#64748B',
              transition: 'all 0.15s ease',
            }}
          >
            Todos ({totalEventos})
          </button>
          <button
            onClick={() => setFiltroEstado('activa')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: filtroEstado === 'activa' ? '#E8F5E9' : '#F1F5F9',
              color: filtroEstado === 'activa' ? '#166534' : '#64748B',
              transition: 'all 0.15s ease',
            }}
          >
            Activos ({eventosActivos})
          </button>
          <button
            onClick={() => setFiltroEstado('cerrada')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: filtroEstado === 'cerrada' ? '#F1F5F9' : '#F8FAFC',
              color: filtroEstado === 'cerrada' ? '#334155' : '#94A3B8',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: filtroEstado === 'cerrada' ? '#CBD5E1' : 'transparent',
              transition: 'all 0.15s ease',
            }}
          >
            Finalizados ({eventosCerrados})
          </button>
        </div>
      </div>

      {/* Grid de Eventos con Diseno Hermoso */}
      {eventosFiltrados.length === 0 ? (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '2px dashed #CBD5E1',
            borderRadius: '12px',
            textAlign: 'center',
            padding: '60px 20px',
            color: '#64748B',
          }}
        >
          <CalendarDaysIcon style={{ width: '48px', height: '48px', margin: '0 auto 12px', opacity: 0.4, color: '#94A3B8' }} />
          <h3 style={{ fontSize: '1.2rem', color: '#1E293B', fontWeight: 700 }}>
            {busqueda || filtroEstado !== 'todos'
              ? 'No se encontraron eventos con los filtros seleccionados'
              : 'No hay eventos registrados en este momento'}
          </h3>
          <p style={{ fontSize: '0.88rem', maxWidth: '440px', margin: '6px auto 20px', color: '#64748B' }}>
            Comienza creando un evento (como un curso de Python o un taller) para generar su codigo QR de asistencia independiente.
          </p>
          <button
            className="btn btn-red"
            onClick={() => {
              limpiarFormulario();
              setModalCrearAbierto(true);
            }}
            style={{ padding: '8px 18px', fontSize: '0.9rem' }}
          >
            <PlusIcon style={{ width: '16px', height: '16px' }} />
            Crear Primer Evento
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '20px',
          }}
        >
          {eventosFiltrados.map((evt) => {
            const ponenteTxt = evt.ponente || evt.facilitador;
            const esActivo = evt.estado === 'activa';

            return (
              <div
                key={evt.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: esActivo ? '1px solid #CBD5E1' : '1px solid #E2E8F0',
                  boxShadow: esActivo
                    ? '0 4px 12px rgba(0, 0, 0, 0.05)'
                    : '0 2px 4px rgba(0, 0, 0, 0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
              >
                {/* Franja superior decorativa institucional */}
                <div
                  style={{
                    height: '4px',
                    backgroundColor: esActivo ? '#C62828' : '#94A3B8',
                    width: '100%',
                  }}
                />

                <div style={{ padding: '20px 20px 14px' }}>
                  {/* Encabezado: Codigo + Estado */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px',
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        padding: '3px 8px',
                      }}
                    >
                      <TagIcon style={{ width: '13px', height: '13px', color: '#C62828' }} />
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          color: '#C62828',
                          fontSize: '0.82rem',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {evt.codigo}
                      </span>
                    </div>

                    {esActivo ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: '#DCFCE7',
                          color: '#15803D',
                          padding: '3px 10px',
                          borderRadius: '20px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                        }}
                      >
                        <span className="live-pulse" style={{ width: '6px', height: '6px' }} />
                        Activo
                      </span>
                    ) : (
                      <span
                        style={{
                          backgroundColor: '#F1F5F9',
                          color: '#64748B',
                          padding: '3px 10px',
                          borderRadius: '20px',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                        }}
                      >
                        Finalizado
                      </span>
                    )}
                  </div>

                  {/* Titulo del Evento */}
                  <h3
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      color: '#0F172A',
                      marginBottom: '8px',
                      lineHeight: 1.35,
                    }}
                  >
                    {evt.nombre}
                  </h3>

                  {/* Descripcion */}
                  {evt.descripcion && (
                    <p
                      style={{
                        fontSize: '0.84rem',
                        color: '#64748B',
                        marginBottom: '14px',
                        lineHeight: 1.45,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {evt.descripcion}
                    </p>
                  )}

                  {/* Metadatos con Iconos */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '7px',
                      fontSize: '0.82rem',
                      color: '#475569',
                      padding: '10px 12px',
                      backgroundColor: '#F8FAFC',
                      borderRadius: '8px',
                      border: '1px solid #F1F5F9',
                      marginBottom: '14px',
                    }}
                  >
                    {ponenteTxt && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UserIcon style={{ width: '15px', height: '15px', color: '#C62828', flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <strong style={{ color: '#1E293B' }}>Ponente:</strong> {ponenteTxt}
                        </span>
                      </div>
                    )}
                    {evt.lugar && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPinIcon style={{ width: '15px', height: '15px', color: '#0284C7', flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <strong style={{ color: '#1E293B' }}>Lugar:</strong> {evt.lugar}
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CalendarDaysIcon style={{ width: '15px', height: '15px', color: '#64748B', flexShrink: 0 }} />
                      <span>
                        <strong style={{ color: '#1E293B' }}>Inicio:</strong> {formatColombiaDateTime(evt.fechaInicio)}
                      </span>
                    </div>
                  </div>

                  {/* Caja de Metrica de Asistencias */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      backgroundColor: (evt.totalAsistencias || 0) > 0 ? '#F0FDF4' : '#F8FAFC',
                      border: (evt.totalAsistencias || 0) > 0 ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                      marginBottom: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <UsersIcon
                        style={{
                          width: '16px',
                          height: '16px',
                          color: (evt.totalAsistencias || 0) > 0 ? '#166534' : '#94A3B8',
                        }}
                      />
                      <span
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: (evt.totalAsistencias || 0) > 0 ? '#166534' : '#64748B',
                        }}
                      >
                        Asistentes Registrados
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '1rem',
                        fontWeight: 800,
                        color: (evt.totalAsistencias || 0) > 0 ? '#15803D' : '#64748B',
                      }}
                    >
                      {evt.totalAsistencias || 0}
                    </span>
                  </div>
                </div>

                {/* Seccion Inferior: Botones de Accion */}
                <div
                  style={{
                    padding: '12px 20px',
                    backgroundColor: '#FAFAFA',
                    borderTop: '1px solid #F1F5F9',
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <button
                      className={`btn ${esActivo ? 'btn-red' : 'btn-secondary'}`}
                      onClick={() => setEventoSeleccionado(evt)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        borderRadius: '6px',
                      }}
                    >
                      {esActivo ? (
                        <>
                          <QrCodeIcon style={{ width: '16px', height: '16px' }} />
                          <span>Abrir Sala y QR</span>
                        </>
                      ) : (
                        <>
                          <EyeIcon style={{ width: '16px', height: '16px' }} />
                          <span>Revisar Asistentes ({evt.totalAsistencias || 0})</span>
                        </>
                      )}
                    </button>

                    <button
                      className="btn btn-secondary"
                      onClick={() => copiarEnlace(evt.codigo)}
                      title="Copiar enlace de asistencia para compartir"
                      style={{ padding: '8px 12px', borderRadius: '6px' }}
                    >
                      {copiado === evt.codigo ? (
                        <ClipboardDocumentCheckIcon style={{ width: '16px', height: '16px', color: '#00A65A' }} />
                      ) : (
                        <ClipboardDocumentIcon style={{ width: '16px', height: '16px' }} />
                      )}
                    </button>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '6px',
                    }}
                  >
                    <button
                      onClick={() => abrirModalEditar(evt)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#64748B',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 4px',
                        fontWeight: 500,
                      }}
                    >
                      <PencilSquareIcon style={{ width: '14px', height: '14px' }} />
                      Editar
                    </button>

                    {esActivo ? (
                      <button
                        onClick={() => handleCerrarEvento(evt)}
                        disabled={accionLoading}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#C62828',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          fontWeight: 700,
                          padding: '2px 4px',
                        }}
                      >
                        Finalizar Evento
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReabrirEvento(evt)}
                        disabled={accionLoading}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#15803D',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          fontWeight: 700,
                          padding: '2px 4px',
                        }}
                      >
                        Reactivar QR
                      </button>
                    )}

                    <button
                      onClick={() => handleEliminarEvento(evt)}
                      disabled={accionLoading}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#94A3B8',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '2px 4px',
                      }}
                      title="Eliminar evento"
                    >
                      <TrashIcon style={{ width: '14px', height: '14px' }} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Crear Evento */}
      {modalCrearAbierto && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setModalCrearAbierto(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '26px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 10px 35px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                borderBottom: '1px solid #ECEFF1',
                paddingBottom: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AcademicCapIcon style={{ width: '22px', height: '22px', color: '#C62828' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>
                  Crear Nuevo Evento o Curso
                </h3>
              </div>
              <button
                onClick={() => setModalCrearAbierto(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <XMarkIcon style={{ width: '22px', height: '22px' }} />
              </button>
            </div>

            <form onSubmit={handleCrearEvento}>
              <div className="form-group">
                <label className="form-label">
                  <TagIcon style={{ width: '14px', height: '14px', display: 'inline', marginRight: '5px' }} />
                  Nombre del Evento o Curso *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Curso de Python: Fundamentos y Sintaxis"
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Codigo Personalizado (Opcional)
                  <span style={{ fontSize: '0.74rem', color: '#78909C', marginLeft: '6px', fontWeight: 400 }}>
                    (Si lo dejas en blanco, se genera automaticamente ej: EVT-X7K9)
                  </span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: EVT-PYTHON"
                  value={formCodigo}
                  onChange={(e) => setFormCodigo(e.target.value.toUpperCase())}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">
                    <UserIcon style={{ width: '14px', height: '14px', display: 'inline', marginRight: '5px' }} />
                    Ponente del Evento
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: Ing. Carlos Perez"
                    value={formPonente}
                    onChange={(e) => setFormPonente(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <MapPinIcon style={{ width: '14px', height: '14px', display: 'inline', marginRight: '5px' }} />
                    Lugar / Ubicacion
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: Auditorio A / Sala 3"
                    value={formLugar}
                    onChange={(e) => setFormLugar(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Descripcion o Tematica (Opcional)</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Breve resumen o contenido del evento..."
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '22px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalCrearAbierto(false)}
                  style={{ flex: 1, padding: '10px' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-red"
                  disabled={guardando || !formNombre.trim()}
                  style={{ flex: 1, padding: '10px', fontWeight: 700 }}
                >
                  {guardando ? 'Creando...' : 'Guardar y Abrir Sala'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Evento */}
      {modalEditarAbierto && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setModalEditarAbierto(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '26px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 10px 35px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                borderBottom: '1px solid #ECEFF1',
                paddingBottom: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PencilSquareIcon style={{ width: '20px', height: '20px', color: '#C62828' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>
                  Editar Evento
                </h3>
              </div>
              <button
                onClick={() => setModalEditarAbierto(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <XMarkIcon style={{ width: '22px', height: '22px' }} />
              </button>
            </div>

            <form onSubmit={handleEditarEvento}>
              <div className="form-group">
                <label className="form-label">Nombre del Evento *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Codigo del Evento</label>
                <input
                  type="text"
                  className="form-input"
                  value={formCodigo}
                  onChange={(e) => setFormCodigo(e.target.value.toUpperCase())}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Ponente</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formPonente}
                    onChange={(e) => setFormPonente(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Lugar / Ubicacion</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formLugar}
                    onChange={(e) => setFormLugar(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Descripcion</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '22px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalEditarAbierto(false)}
                  style={{ flex: 1, padding: '10px' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-red"
                  disabled={guardando || !formNombre.trim()}
                  style={{ flex: 1, padding: '10px', fontWeight: 700 }}
                >
                  {guardando ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
