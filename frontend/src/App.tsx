import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AssignmentProvider } from './context/AssignmentContext';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import TaskInput from './components/TaskInput';
import Timeline from './components/Timeline';
import SummaryTable from './components/SummaryTable';
import Navbar from './components/Navbar';
import { useAuth } from './context/AuthContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    return user ? <>{children}</> : <Navigate to="/login" />;
};

const AppContent: React.FC = () => {
    const { user } = useAuth();

    return (
        <>
            <Navbar />
            <Routes>
                {!user ? (
                    <>
                        <Route path="/login" element={<LoginForm />} />
                        <Route path="/register" element={<RegisterForm />} />
                        <Route path="*" element={<Navigate to="/login" />} />
                    </>
                ) : (
                    <>
                        <Route path="/task-input" element={
                            <ProtectedRoute>
                                <TaskInput />
                            </ProtectedRoute>
                        } />
                        <Route path="/timeline" element={
                            <ProtectedRoute>
                                <Timeline />
                            </ProtectedRoute>
                        } />
                        <Route path="/summary" element={
                            <ProtectedRoute>
                                <SummaryTable />
                            </ProtectedRoute>
                        } />
                        <Route path="/" element={<Navigate to="/task-input" />} />
                    </>
                )}
            </Routes>
        </>
    );
};

const App: React.FC = () => {
    return (
        <Router>
            <AuthProvider>
                <AssignmentProvider>
                    <AppContent />
                </AssignmentProvider>
            </AuthProvider>
        </Router>
    );
};

export default App; 