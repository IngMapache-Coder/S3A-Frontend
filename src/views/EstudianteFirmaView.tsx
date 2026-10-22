import React, { useState, useEffect, useRef } from 'react';
import {
  PencilSquareIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  BookOpenIcon,
  UserIcon,
  IdentificationIcon,
  ChatBubbleBottomCenterTextIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  AcademicCapIcon,
  MapPinIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { api, type Materia, type Evento } from '../api/client.js';
import { formatColombiaDateTime } from '../utils/date.js';

interface EstudianteFirmaViewProps {
  codigoInicial?: string;
  tipoInicial?: string;
  onVolver?: () => void;
}

export const EstudianteFirmaView: React.FC<EstudianteFirmaViewProps> = ({
  codigoInicial = '',
  tipoInicial = '',
  onVolver,
}) => {
  const [codigoSesion, setCodigoSesion] = useState(codigoInicial);
  const [sesionVerificada, setSesionVerificada] = useState(false);
  const [evento, setEvento] = useState<Evento | null>(null);
  const [verificando, setVerificando] = useState(false);
  const [errorSesion, setErrorSesion] = useState<string | null>(null);

  const [materias, setMaterias] = useState<Materia[]>([]);
  const [materiaBusqueda, setMateriaBusqueda] = useState('');
  const [materiaSeleccionada, setMateriaSeleccionada] = useState<Materia | null>(null);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);

  const [nombre, setNombre] = useState('');
  const [codigoEstudiante, setCodigoEstudiante] = useState('');
  const [correoEstudiante, setCorreoEstudiante] = useState('');
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tieneFirma, setTieneFirma] = useState(false);
  const isDrawing = useRef(false);

  useEffect(() => {
    api.materias.list().then((res) => setMaterias(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (codigoInicial && codigoInicial.trim() !== '') {
      verificarSesion(codigoInicial, tipoInicial);
    }
  }, [codigoInicial, tipoInicial]);

  const verificarSesion = async (codigo: string, tipoPref?: string) => {
    if (!codigo || codigo.trim() === '') return;
    const clean = codigo.trim().toUpperCase();
    try {
      setVerificando(true);
      setErrorSesion(null);

      // Si el tipo es 'evento' o el código empieza por EVT
      if (tipoPref === 'evento' || clean.startsWith('EVT')) {
        try {
          const res = await api.eventos.verificar(clean);
          setEvento(res.data);
          setSesionVerificada(true);
          setCodigoSesion(clean);
          return;
        } catch (err: unknown) {
          if (tipoPref === 'evento') throw err;
        }
      }

      // Probar primero como sesión de sala
      try {
        await api.sesiones.verificar(clean);
        setEvento(null);
        setSesionVerificada(true);
        setCodigoSesion(clean);
        return;
      } catch {
        // Si falla como sala, intentar como evento
        const res = await api.eventos.verificar(clean);
        setEvento(res.data);
        setSesionVerificada(true);
        setCodigoSesion(clean);
      }
    } catch (err: unknown) {
      setErrorSesion(err instanceof Error ? err.message : 'La sesión o evento no existe o ya fue cerrado');
      setSesionVerificada(false);
      setEvento(null);
    } finally {
      setVerificando(false);
    }
  };

  const getCoordinates = (e: MouseEvent | TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    if ('touches' in e && e.touches.length > 0) {
      const touch = e.touches[0];
      if (!touch) return { x: 0, y: 0 };
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    const mouse = e as MouseEvent;
    return { x: mouse.clientX - rect.left, y: mouse.clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    isDrawing.current = true;
    const { x, y } = getCoordinates(e.nativeEvent);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !canvasRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoordinates(e.nativeEvent);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000000';
    ctx.lineTo(x, y);
    ctx.stroke();
    setTieneFirma(true);
  };

  const stopDrawing = () => { isDrawing.current = false; };

  const limpiarFirma = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setTieneFirma(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(2, 2);
  }, [sesionVerificada]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim()) {
      alert('Por favor ingresa tu nombre completo.');
      return;
    }
    if (!codigoEstudiante.trim()) {
      alert('Por favor ingresa tu código estudiantil o identificación.');
      return;
    }

    if (!evento && !materiaSeleccionada) {
      alert('Por favor selecciona una materia de la lista.');
      return;
    }
    if (!evento && !motivo.trim()) {
      alert('Por favor ingresa el motivo o tema de la asesoría.');
      return;
    }
    if (!tieneFirma || !canvasRef.current) {
      alert('Debes firmar en el recuadro antes de guardar tu asistencia.');
      return;
    }

    try {
      setEnviando(true);
      setErrorEnvio(null);
      const firmaBase64 = canvasRef.current.toDataURL('image/png');

      if (evento) {
        await api.eventos.registrarAsistencia({
          codigo_evento: evento.codigo,
          nombre_estudiante: nombre.trim(),
          codigo_estudiante: codigoEstudiante.trim(),
          correo_estudiante: correoEstudiante.trim() || undefined,
          firma_base64: firmaBase64,
        });
      } else {
        await api.asistencias.registrar({
          codigo_sesion: codigoSesion,
          materia_id: materiaSeleccionada!.id,
          motivo: motivo.trim(),
          nombre_estudiante: nombre.trim(),
          codigo_estudiante: codigoEstudiante.trim(),
          firma_base64: firmaBase64,
        });
      }

      setExito(true);
    } catch (err: unknown) {
      setErrorEnvio(err instanceof Error ? err.message : 'Error al registrar la asistencia');
    } finally {
      setEnviando(false);
    }
  };

  const materiasFiltradas = materias.filter(
    (m) =>
      m.nombre.toLowerCase().includes(materiaBusqueda.toLowerCase()) ||
      m.codigo.toLowerCase().includes(materiaBusqueda.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', paddingBottom: '30px' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #C62828 0%, #B71C1C 100%)',
          color: 'white',
          borderRadius: '8px 8px 0 0',
          padding: '20px 22px',
          textAlign: 'center',
          boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <AcademicCapIcon style={{ width: '22px', height: '22px' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
            {evento ? 'Registro de Asistencia a Evento' : 'Portal Estudiantil — Amigo Académico'}
          </span>
        </div>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 800 }}>
          {evento ? evento.nombre : 'Registro y Firma de Asistencia'}
        </h2>
        <p style={{ fontSize: '0.84rem', opacity: 0.9, marginTop: '4px' }}>
          {evento
            ? (evento.descripcion || 'Valida tu asistencia al evento con tu firma digital manuscrita.')
            : 'Valida tu asistencia a la asesoría universitaria con tu firma manuscrita.'}
        </p>
      </div>

      <div
        style={{
          backgroundColor: 'white',
          border: '1px solid #E0E0E0',
          borderTop: 'none',
          borderRadius: '0 0 8px 8px',
          padding: '24px 22px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
        }}
      >
        {exito ? (
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: '#E8F5E9',
                color: '#00A65A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <CheckCircleIcon style={{ width: '48px', height: '48px' }} />
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1B5E20', marginBottom: '8px' }}>
              Asistencia Registrada Exitosamente
            </h3>
            <p style={{ color: '#555', fontSize: '0.94rem', lineHeight: 1.5, marginBottom: '24px' }}>
              {evento
                ? `Tu asistencia a "${evento.nombre}" ha sido guardada con tu firma digital.`
                : 'Tu registro ha sido guardado con tu firma manuscrita digital.'}
            </p>

            <div
              style={{
                backgroundColor: '#F8F9FA',
                border: '1px solid #ECEFF1',
                borderRadius: '6px',
                padding: '16px',
                textAlign: 'left',
                marginBottom: '24px',
                fontSize: '0.88rem',
              }}
            >
              <p><strong>Estudiante:</strong> {nombre}</p>
              <p><strong>Código / Identificación:</strong> {codigoEstudiante}</p>
              {correoEstudiante && <p><strong>Correo:</strong> {correoEstudiante}</p>}
              {evento ? (
                <>
                  <p><strong>Evento:</strong> {evento.nombre} ({evento.codigo})</p>
                  {evento.lugar && <p><strong>Lugar:</strong> {evento.lugar}</p>}
                  {(evento.ponente || evento.facilitador) && (
                    <p><strong>Ponente:</strong> {evento.ponente || evento.facilitador}</p>
                  )}
                </>
              ) : (
                <>
                  <p><strong>Materia:</strong> {materiaSeleccionada?.nombre}</p>
                  <p><strong>Motivo:</strong> {motivo}</p>
                </>
              )}
              <p><strong>Fecha y Hora:</strong> {formatColombiaDateTime(new Date().toISOString())} (Colombia)</p>
            </div>

            <button
              className="btn btn-red"
              onClick={() => {
                setExito(false);
                setMateriaSeleccionada(null);
                setMateriaBusqueda('');
                setNombre('');
                setCodigoEstudiante('');
                setCorreoEstudiante('');
                setMotivo('');
                limpiarFirma();
                if (onVolver) onVolver();
              }}
              style={{ width: '100%', padding: '11px', fontSize: '0.95rem' }}
            >
              Realizar Otro Registro
            </button>
          </div>
        ) : !sesionVerificada ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#263238' }}>
                Ingresa el Código de Acceso
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#607D8B', marginTop: '4px' }}>
                Digita el código del evento o sala proyectado en pantalla.
              </p>
            </div>

            {errorSesion && (
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
                  marginBottom: '16px',
                }}
              >
                <ExclamationCircleIcon style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                <span>{errorSesion}</span>
              </div>
            )}

            <div className="form-group">
              <input
                type="text"
                className="form-input"
                placeholder="Código (ej: 9QKC o EVT-PYTH)"
                value={codigoSesion}
                onChange={(e) => setCodigoSesion(e.target.value.toUpperCase())}
                style={{
                  textAlign: 'center',
                  fontSize: '1.4rem',
                  letterSpacing: '3px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '12px',
                }}
                maxLength={20}
              />
            </div>

            <button
              className="btn btn-red"
              onClick={() => verificarSesion(codigoSesion)}
              disabled={verificando || !codigoSesion.trim()}
              style={{ width: '100%', padding: '11px', fontSize: '0.95rem' }}
            >
              {verificando ? 'Verificando código...' : 'Continuar al Formulario'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div
              style={{
                backgroundColor: '#E8F5E9',
                border: '1px solid #A5D6A7',
                color: '#1B5E20',
                padding: '12px 14px',
                borderRadius: '6px',
                marginBottom: '20px',
                fontSize: '0.88rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircleIcon style={{ width: '18px', height: '18px', color: '#00A65A', flexShrink: 0 }} />
                  {evento ? (
                    <div>
                      <span>Evento: <strong>{evento.nombre}</strong></span>
                      <span style={{ marginLeft: '8px', fontSize: '0.8rem', opacity: 0.85 }}>({evento.codigo})</span>
                    </div>
                  ) : (
                    <span>Sala Activa: <strong>{codigoSesion}</strong></span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSesionVerificada(false);
                    setEvento(null);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#2E7D32',
                    fontSize: '0.78rem',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                  }}
                >
                  Cambiar
                </button>
              </div>

              {evento && (evento.lugar || evento.ponente || evento.facilitador) && (
                <div style={{ marginTop: '8px', fontSize: '0.82rem', color: '#2E7D32', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {evento.lugar && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <MapPinIcon style={{ width: '15px', height: '15px' }} />
                      <span><strong>Lugar:</strong> {evento.lugar}</span>
                    </span>
                  )}
                  {(evento.ponente || evento.facilitador) && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <UserIcon style={{ width: '15px', height: '15px' }} />
                      <span><strong>Ponente:</strong> {evento.ponente || evento.facilitador}</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            {errorEnvio && (
              <div
                style={{
                  backgroundColor: '#FFEBEE',
                  color: '#C62828',
                  padding: '10px 14px',
                  borderRadius: '4px',
                  fontSize: '0.86rem',
                  marginBottom: '16px',
                }}
              >
                {errorEnvio}
              </div>
            )}

            {/* SECCIÓN CONDICIONAL: Solo para asesorías se pide Materia y Motivo */}
            {!evento && (
              <>
                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="form-label">
                    <BookOpenIcon style={{ width: '14px', height: '14px', display: 'inline', marginRight: '6px' }} />
                    Materia de la Asesoría *
                  </label>

                  {materiaSeleccionada ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '9px 12px',
                        backgroundColor: '#F1F8E9',
                        border: '1px solid #81C784',
                        borderRadius: '4px',
                      }}
                    >
                      <div>
                        <strong style={{ color: '#2E7D32' }}>{materiaSeleccionada.codigo}</strong> —{' '}
                        <span>{materiaSeleccionada.nombre}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setMateriaSeleccionada(null); setMateriaBusqueda(''); }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#C62828',
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                        }}
                      >
                        Cambiar
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Escribe para buscar materia (ej: Cálculo, Física...)"
                          value={materiaBusqueda}
                          onChange={(e) => { setMateriaBusqueda(e.target.value); setMostrarDropdown(true); }}
                          onFocus={() => setMostrarDropdown(true)}
                        />
                        <MagnifyingGlassIcon
                          style={{ position: 'absolute', right: '12px', top: '12px', width: '16px', height: '16px', color: '#999' }}
                        />
                      </div>

                      {mostrarDropdown && materiasFiltradas.length > 0 && (
                        <ul
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            backgroundColor: 'white',
                            border: '1px solid #CED4DA',
                            borderRadius: '0 0 4px 4px',
                            maxHeight: '180px',
                            overflowY: 'auto',
                            zIndex: 20,
                            listStyle: 'none',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                          }}
                        >
                          {materiasFiltradas.map((m) => (
                            <li
                              key={m.id}
                              onClick={() => { setMateriaSeleccionada(m); setMostrarDropdown(false); }}
                              style={{
                                padding: '9px 12px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #F1F1F1',
                                fontSize: '0.86rem',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8F9FA')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                            >
                              <strong>{m.codigo}</strong> — {m.nombre}
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <ChatBubbleBottomCenterTextIcon style={{ width: '14px', height: '14px', display: 'inline', marginRight: '6px' }} />
                    Motivo / Tema de la Asesoría *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: Duda taller de derivadas, preparación para parcial..."
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            {/* CAMPOS COMUNES */}
            <div className="form-group">
              <label className="form-label">
                <UserIcon style={{ width: '14px', height: '14px', display: 'inline', marginRight: '6px' }} />
                Nombre Completo del Estudiante / Asistente *
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Nombre y Apellidos completos"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <IdentificationIcon style={{ width: '14px', height: '14px', display: 'inline', marginRight: '6px' }} />
                Código Estudiantil o Documento de Identidad *
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: 1152030 o Cédula"
                value={codigoEstudiante}
                onChange={(e) => setCodigoEstudiante(e.target.value)}
                required
              />
            </div>

            {evento && (
              <div className="form-group">
                <label className="form-label">
                  <EnvelopeIcon style={{ width: '14px', height: '14px', display: 'inline', marginRight: '6px' }} />
                  Correo Institucional (Opcional)
                </label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="ejemplo@ufps.edu.co"
                  value={correoEstudiante}
                  onChange={(e) => setCorreoEstudiante(e.target.value)}
                />
              </div>
            )}

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ margin: 0 }}>
                  <PencilSquareIcon style={{ width: '14px', height: '14px', display: 'inline', marginRight: '6px' }} />
                  Firma Digital Manuscrita *
                </label>
                {tieneFirma && (
                  <button
                    type="button"
                    onClick={limpiarFirma}
                    className="btn btn-secondary"
                    style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                  >
                    <ArrowPathIcon style={{ width: '12px', height: '12px' }} />
                    Limpiar Firma
                  </button>
                )}
              </div>

              <div className="signature-box">
                <canvas
                  ref={canvasRef}
                  className="signature-canvas"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                {!tieneFirma && (
                  <div className="signature-placeholder">
                    <PencilSquareIcon style={{ width: '18px', height: '18px' }} />
                    <span>Dibuja tu firma aquí con el dedo o mouse</span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-green"
              disabled={enviando}
              style={{ width: '100%', padding: '12px', fontSize: '1rem', marginTop: '8px' }}
            >
              {enviando ? (
                'Registrando tu asistencia...'
              ) : (
                <>
                  <CheckCircleIcon style={{ width: '18px', height: '18px' }} />
                  {evento ? 'Confirmar y Guardar Asistencia al Evento' : 'Guardar Asistencia'}
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
