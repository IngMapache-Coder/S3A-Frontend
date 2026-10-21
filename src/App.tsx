import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.js';
import { Sidebar } from './components/Sidebar.js';
import { LoginView } from './views/LoginView.js';
import { TutorSalaView } from './views/TutorSalaView.js';
import { EstudianteFirmaView } from './views/EstudianteFirmaView.js';
import { TutoresView } from './views/TutoresView.js';
import { MateriasView } from './views/MateriasView.js';
import { ReportesView } from './views/ReportesView.js';
import { PerfilView } from './views/PerfilView.js';
import { CambioPasswordObligatorio } from './components/CambioPasswordObligatorio.js';
import { authStorage, type User } from './api/client.js';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('sala');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [codigoSalaEstudiante, setCodigoSalaEstudiante] = useState<string>('');
  const [modoEstudianteDirecto, setModoEstudianteDirecto] = useState<boolean>(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codigo = params.get('codigo');
    const tab = params.get('tab');

    if (codigo) setCodigoSalaEstudiante(codigo);

    if (tab === 'estudiante' || codigo) {
      setModoEstudianteDirecto(true);
      setActiveTab('estudiante');
      return;
    }

    const savedUser = authStorage.getUser();
    if (savedUser && authStorage.getToken()) {
      setUser(savedUser);
    }
  }, []);

  const handleLoginSuccess = (u: User) => {
    setUser(u);
    setActiveTab('sala');
    setModoEstudianteDirecto(false);
  };

  const handleLogout = () => {
    authStorage.clearToken();
    authStorage.clearUser();
    setUser(null);
    setModoEstudianteDirecto(false);
  };

  const handleAbrirComoEstudiante = (codigo: string) => {
    setCodigoSalaEstudiante(codigo);
    setActiveTab('estudiante');
  };

  if (modoEstudianteDirecto && !user) {
    return (
      <div className="app-container">
        <header className="header-navbar">
          <div className="brand-title">
            <span>S3A — AMIGO ACADÉMICO</span>
            <span className="brand-badge">Estudiante</span>
          </div>
          <button
            className="btn btn-outline-red"
            onClick={() => setModoEstudianteDirecto(false)}
            style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}
          >
            Acceso Docente / Tutor
          </button>
        </header>
        <main className="content-area" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <EstudianteFirmaView
            codigoInicial={codigoSalaEstudiante}
            onVolver={() => setModoEstudianteDirecto(false)}
          />
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        onIrComoEstudiante={() => {
          setModoEstudianteDirecto(true);
          setActiveTab('estudiante');
        }}
      />
    );
  }

  if (user.debeCambiarPassword) {
    return (
      <CambioPasswordObligatorio
        user={user}
        onSuccess={(updatedUser) => setUser(updatedUser)}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="app-container">
      <Navbar
        user={user}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
        onOpenPerfil={() => setActiveTab('perfil')}
        activeTab={activeTab}
      />

      <div className="main-wrapper">
        <Sidebar
          user={user}
          isOpen={sidebarOpen}
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
        />

        <main className="content-area">
          {activeTab === 'sala' && (
            <TutorSalaView onAbrirComoEstudiante={handleAbrirComoEstudiante} />
          )}
          {activeTab === 'estudiante' && (
            <EstudianteFirmaView
              codigoInicial={codigoSalaEstudiante}
              onVolver={() => setActiveTab('sala')}
            />
          )}
          {activeTab === 'tutores' && <TutoresView currentUser={user} />}
          {activeTab === 'materias' && <MateriasView />}
          {activeTab === 'reportes' && <ReportesView />}
          {activeTab === 'perfil' && <PerfilView user={user} />}
        </main>
      </div>
    </div>
  );
};

export default App;
