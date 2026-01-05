
import React, { useState, createContext, useContext } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Calendar from './pages/Calendar';
import Evaluation from './pages/Evaluation';
import Reports from './pages/Reports';
import Feedback from './pages/Feedback';
import Settings from './pages/Settings';
import AIChatBot from './components/AIChatBot';
import { Language } from './services/i18n';
import { Patient, TestResult, Session } from './types';
import { MOCK_PATIENTS, MOCK_RESULTS, MOCK_SESSIONS } from './constants';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
}

export const LanguageContext = createContext<LanguageContextType>({
  lang: 'pt-BR',
  setLang: () => {},
});

// Global Data Context
interface DataContextType {
  patients: Patient[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  testResults: TestResult[];
  setTestResults: React.Dispatch<React.SetStateAction<TestResult[]>>;
  sessions: Session[];
  setSessions: React.Dispatch<React.SetStateAction<Session[]>>;
  addPatient: (patient: Patient) => void;
  deletePatient: (id: string) => void;
  addTestResult: (result: TestResult) => void;
  addSession: (session: Session) => void;
  deleteSession: (id: string) => void;
}

export const DataContext = createContext<DataContextType>({
  patients: [],
  setPatients: () => {},
  testResults: [],
  setTestResults: () => {},
  sessions: [],
  setSessions: () => {},
  addPatient: () => {},
  deletePatient: () => {},
  addTestResult: () => {},
  addSession: () => {},
  deleteSession: () => {},
});

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('pt-BR');
  const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
  const [testResults, setTestResults] = useState<TestResult[]>(MOCK_RESULTS);
  const [sessions, setSessions] = useState<Session[]>(MOCK_SESSIONS);

  const addPatient = (patient: Patient) => {
    setPatients(prev => [patient, ...prev]);
  };

  const deletePatient = (id: string) => {
    setPatients(currentPatients => currentPatients.filter(p => String(p.id) !== String(id)));
    setTestResults(currentResults => currentResults.filter(r => String(r.patientId) !== String(id)));
    setSessions(currentSessions => currentSessions.filter(s => String(s.patientId) !== String(id)));
  };

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [result, ...prev]);
  };

  const addSession = (session: Session) => {
    setSessions(prev => [session, ...prev].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()));
  };

  const deleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      <DataContext.Provider value={{ 
        patients, 
        setPatients, 
        testResults, 
        setTestResults,
        sessions,
        setSessions,
        addPatient,
        deletePatient,
        addTestResult,
        addSession,
        deleteSession
      }}>
        <Router>
          <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 ml-64 p-8 relative">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/patients" element={<Patients />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/evaluations" element={<Evaluation />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/feedback" element={<Feedback />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
            <AIChatBot />
          </div>
        </Router>
      </DataContext.Provider>
    </LanguageContext.Provider>
  );
};

export default App;
