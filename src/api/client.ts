const DEFAULT_BACKEND_URL = 'https://backend.amigoacademicoufps.workers.dev';
const API_BASE = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? '' : DEFAULT_BACKEND_URL)
).replace(/\/$/, '');

export interface User {
  id: string;
  nombre: string;
  correo: string;
  tipo: 'SUPER_ADMIN' | 'DIRECTOR' | 'AMIGO_ACADEMICO';
  debeCambiarPassword?: boolean;
}

export interface Materia {
  id: string;
  codigo: string;
  nombre: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Sesion {
  id: string;
  codigo: string;
  creadaPorId: string;
  estado: 'activa' | 'cerrada';
  fechaInicio: string;
  fechaCierre?: string | null;
  qrUrl?: string;
}

export interface Asistencia {
  id: string;
  sesionId: string;
  codigoSesion?: string;
  materiaId: string;
  materiaCodigo?: string;
  materiaNombre?: string;
  motivo: string;
  nombreEstudiante: string;
  codigoEstudiante: string;
  firmaUrl: string;
  fechaHora?: string;
}

export interface Evento {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  lugar?: string | null;
  facilitador?: string | null;
  ponente?: string | null;
  creadaPorId: string;
  creadaPorNombre?: string;
  estado: 'activa' | 'cerrada';
  fechaInicio: string;
  fechaCierre?: string | null;
  totalAsistencias?: number;
  qrUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AsistenciaEvento {
  id: string;
  eventoId: string;
  eventoNombre?: string;
  eventoCodigo?: string;
  nombreEstudiante: string;
  codigoEstudiante: string;
  correoEstudiante?: string | null;
  firmaUrl: string;
  fechaHora: string;
}

export const authStorage = {
  getToken: () => localStorage.getItem('s3a_token'),
  setToken: (token: string) => localStorage.setItem('s3a_token', token),
  clearToken: () => localStorage.removeItem('s3a_token'),
  getUser: (): User | null => {
    const raw = localStorage.getItem('s3a_user');
    return raw ? JSON.parse(raw) : null;
  },
  setUser: (u: User) => localStorage.setItem('s3a_user', JSON.stringify(u)),
  clearUser: () => localStorage.removeItem('s3a_user'),
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `Error ${res.status}: ${res.statusText}`);
    return json;
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Error ${res.status}`);
  }

  return (await res.blob()) as unknown as T;
}

export const api = {
  auth: {
    login: async (correo: string, password: string) =>
      request<{ success: boolean; token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ correo, password }),
      }),
    me: async () =>
      request<{ success: boolean; user: User }>('/auth/me'),
    cambiarPassword: async (passwordActual: string, passwordNueva: string) =>
      request<{ success: boolean; message: string }>('/auth/cambiar-password', {
        method: 'POST',
        body: JSON.stringify({ passwordActual, passwordNueva }),
      }),
  },

  materias: {
    list: async () =>
      request<{ success: boolean; data: Materia[] }>('/materias'),
    create: async (data: { codigo: string; nombre: string }) =>
      request<{ success: boolean; data: Materia }>('/materias', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: async (id: string, data: { codigo?: string; nombre?: string }) =>
      request<{ success: boolean; data: Materia }>(`/materias/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: async (id: string) =>
      request<{ success: boolean; message: string }>(`/materias/${id}`, {
        method: 'DELETE',
      }),
  },

  sesiones: {
    activa: async () =>
      request<{ success: boolean; data: Sesion | null }>('/sesiones/activa'),
    abrir: async () =>
      request<{ success: boolean; data: Sesion; creada: boolean }>('/sesiones/abrir', {
        method: 'POST',
      }),
    verificar: async (codigo: string) =>
      request<{ success: boolean; data: Sesion }>(`/sesiones/verificar/${codigo}`),
    listarAsistencias: async (sesionId: string) =>
      request<{ success: boolean; data: Asistencia[]; count: number }>(
        `/sesiones/${sesionId}/asistencias`
      ),
    cerrar: async (id: string) =>
      request<{ success: boolean; data: Sesion; message: string }>(
        `/sesiones/${id}/cerrar`,
        { method: 'PATCH' }
      ),
  },

  asistencias: {
    registrar: async (data: {
      codigo_sesion: string;
      materia_id: string;
      motivo: string;
      nombre_estudiante: string;
      codigo_estudiante: string;
      firma_base64: string;
    }) =>
      request<{ success: boolean; data: Asistencia; message: string }>('/asistencias', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  usuarios: {
    list: async (tipo?: string) => {
      const q = tipo ? `?tipo=${tipo}` : '';
      return request<{ success: boolean; data: User[] }>(`/usuarios${q}`);
    },
    create: async (data: { nombre: string; correo: string; password: string; tipo: string }) =>
      request<{ success: boolean; data: User }>('/usuarios', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: async (id: string) =>
      request<{ success: boolean; message: string }>(`/usuarios/${id}`, {
        method: 'DELETE',
      }),
  },

  reportes: {
    consultar: async (filtros: {
      desde?: string;
      hasta?: string;
      materiaId?: string;
      codigoEstudiante?: string;
      nombreEstudiante?: string;
    }) => {
      const params = new URLSearchParams();
      if (filtros.desde) params.append('desde', filtros.desde);
      if (filtros.hasta) params.append('hasta', filtros.hasta);
      if (filtros.materiaId) params.append('materiaId', filtros.materiaId);
      if (filtros.codigoEstudiante) params.append('codigoEstudiante', filtros.codigoEstudiante);
      if (filtros.nombreEstudiante) params.append('nombreEstudiante', filtros.nombreEstudiante);
      return request<{ success: boolean; data: Asistencia[]; count: number }>(
        `/reportes/asistencias?${params.toString()}`
      );
    },
    consultarEventos: async (filtros: {
      desde?: string;
      hasta?: string;
      eventoId?: string;
      codigoEstudiante?: string;
      nombreEstudiante?: string;
    }) => {
      const params = new URLSearchParams();
      if (filtros.desde) params.append('desde', filtros.desde);
      if (filtros.hasta) params.append('hasta', filtros.hasta);
      if (filtros.eventoId) params.append('eventoId', filtros.eventoId);
      if (filtros.codigoEstudiante) params.append('codigoEstudiante', filtros.codigoEstudiante);
      if (filtros.nombreEstudiante) params.append('nombreEstudiante', filtros.nombreEstudiante);
      return request<{ success: boolean; data: AsistenciaEvento[]; count: number }>(
        `/reportes/eventos?${params.toString()}`
      );
    },
  },

  firmas: {
    getUrl: (asistenciaId: string) => {
      const token = authStorage.getToken();
      return `${API_BASE}/firmas/${asistenciaId}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    },
  },

  eventos: {
    list: async () =>
      request<{ success: boolean; data: Evento[]; count: number }>('/eventos'),
    getById: async (id: string) =>
      request<{ success: boolean; data: Evento }>(`/eventos/${id}`),
    create: async (data: {
      nombre: string;
      descripcion?: string;
      lugar?: string;
      facilitador?: string;
      ponente?: string;
      codigo?: string;
    }) =>
      request<{ success: boolean; data: Evento; message: string }>('/eventos', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: async (
      id: string,
      data: {
        nombre?: string;
        descripcion?: string;
        lugar?: string;
        facilitador?: string;
        ponente?: string;
        codigo?: string;
      }
    ) =>
      request<{ success: boolean; data: Evento; message: string }>(`/eventos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    cerrar: async (id: string) =>
      request<{ success: boolean; data: Evento; message: string }>(`/eventos/${id}/cerrar`, {
        method: 'PATCH',
      }),
    reabrir: async (id: string) =>
      request<{ success: boolean; data: Evento; message: string }>(`/eventos/${id}/reabrir`, {
        method: 'PATCH',
      }),
    delete: async (id: string) =>
      request<{ success: boolean; message: string }>(`/eventos/${id}`, {
        method: 'DELETE',
      }),
    listarAsistencias: async (eventoId: string) =>
      request<{ success: boolean; data: AsistenciaEvento[]; count: number }>(
        `/eventos/${eventoId}/asistencias`
      ),
    verificar: async (codigo: string) =>
      request<{ success: boolean; data: Evento }>(`/eventos/verificar/${codigo}`),
    registrarAsistencia: async (data: {
      codigo_evento: string;
      nombre_estudiante: string;
      codigo_estudiante: string;
      correo_estudiante?: string;
      firma_base64: string;
    }) =>
      request<{ success: boolean; data: AsistenciaEvento; message: string }>('/eventos/asistencias', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
};
