import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import axios from 'axios';
import { useAuth } from './AuthContext';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

// Types
export interface Step {
    title: string;
    description: string;
    completed: boolean;
    tip?: string;
    date?: string;
    status?: 'pending' | 'completed' | 'overdue';
    assignedDate?: string;
}

export interface AssignmentAnalysis {
    title: string;
    summary: string;
    difficulty: '매우 쉬움' | '쉬움' | '보통' | '어려움' | '매우 어려움';
    estimatedTime: string;
    dueDate: string;
    steps: Step[];
}

export interface Assignment {
    id: string;
    title: string;
    dueDate: string;
    createdAt?: string;
    updatedAt?: string;
    analysis: {
        title: string;
        difficulty: string;
        estimatedTime: string;
        summary?: string;
        steps: Step[];
    };
}

interface AssignmentContextType {
    assignments: Assignment[];
    loading: boolean;
    error: string | null;
    fetchAssignments: () => Promise<void>;
    addAssignment: (assignment: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateStepStatus: (assignmentId: string, stepTitle: string, completed: boolean) => Promise<void>;
    reassignOverdueSteps: (assignmentId: string) => Promise<void>;
    deleteAssignment: (assignmentId: string) => Promise<void>;
    getAssignmentById: (assignmentId: string) => Assignment | undefined;
    getOverdueSteps: (assignmentId: string) => Step[];
    getUpcomingSteps: (assignmentId: string) => Step[];
    setAssignments: (assignments: Assignment[]) => void;
}

const AssignmentContext = createContext<AssignmentContextType | undefined>(undefined);

export const useAssignment = () => {
    const context = useContext(AssignmentContext);
    if (context === undefined) {
        throw new Error('useAssignment must be used within an AssignmentProvider');
    }
    return context;
};

export const AssignmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    const fetchAssignments = async () => {
        if (!user?.email) {
            console.log('No user email available');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            console.log('Fetching assignments for:', user.email);
            const response = await axios.get(`http://localhost:3001/api/assignments/${user.email}`);
            console.log('Fetched assignments:', response.data);
            setAssignments(response.data);
        } catch (err) {
            console.error('Error fetching assignments:', err);
            setError('Failed to fetch assignments');
        } finally {
            setLoading(false);
        }
    };

    const addAssignment = async (assignment: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (!user?.email) return;

        const now = new Date().toISOString();
        const newAssignment: Assignment = {
            ...assignment,
            id: Date.now().toString(),
            createdAt: now,
            updatedAt: now,
        };

        try {
            const response = await axios.post(`http://localhost:3001/api/assignments/${user.email}`, newAssignment);
            setAssignments(prev => [...prev, response.data]);
        } catch (error) {
            console.error('Failed to add assignment:', error);
            setError('Failed to add assignment');
        }
    };

    const updateStepStatus = async (assignmentId: string, stepTitle: string, completed: boolean) => {
        if (!user?.email) return;

        try {
            const response = await axios.put(
                `http://localhost:3001/api/assignments/${user.email}/${assignmentId}`,
                { stepTitle, completed }
            );

            setAssignments(prevAssignments =>
                prevAssignments.map(assignment =>
                    assignment.id === assignmentId ? response.data : assignment
                )
            );
        } catch (err) {
            console.error('Error updating step status:', err);
            setError('Failed to update step status');
        }
    };

    const reassignOverdueSteps = async (assignmentId: string) => {
        if (!user?.email) return;

        try {
            const response = await axios.put(
                `http://localhost:3001/api/assignments/${user.email}/${assignmentId}/reassign`,
                {}
            );

            setAssignments(prevAssignments =>
                prevAssignments.map(assignment =>
                    assignment.id === assignmentId ? response.data : assignment
                )
            );
        } catch (error) {
            console.error('Failed to reassign steps:', error);
            setError('Failed to reassign steps');
        }
    };

    const deleteAssignment = async (assignmentId: string) => {
        if (!user?.email) return;

        try {
            await axios.delete(`http://localhost:3001/api/assignments/${user.email}/${assignmentId}`);
            setAssignments(prevAssignments =>
                prevAssignments.filter(assignment => assignment.id !== assignmentId)
            );
        } catch (err) {
            console.error('Error deleting assignment:', err);
            setError('Failed to delete assignment');
        }
    };

    const getAssignmentById = useCallback((assignmentId: string) => {
        return assignments.find(assignment => assignment.id === assignmentId);
    }, [assignments]);

    const getOverdueSteps = useCallback((assignmentId: string) => {
        const assignment = assignments.find(a => a.id === assignmentId);
        if (!assignment) return [];

        return assignment.analysis.steps.filter(step =>
            step.status === 'overdue' ||
            (dayjs(step.assignedDate || step.date).isBefore(dayjs()) && !step.completed)
        );
    }, [assignments]);

    const getUpcomingSteps = useCallback((assignmentId: string) => {
        const assignment = assignments.find(a => a.id === assignmentId);
        if (!assignment) return [];

        const today = dayjs();
        return assignment.analysis.steps.filter(step =>
            !step.completed &&
            dayjs(step.assignedDate || step.date).isAfter(today)
        );
    }, [assignments]);

    useEffect(() => {
        if (user?.email) {
            console.log('User email changed, fetching assignments...');
            fetchAssignments();
        }
    }, [user?.email]);

    return (
        <AssignmentContext.Provider
            value={{
                assignments,
                loading,
                error,
                fetchAssignments,
                addAssignment,
                updateStepStatus,
                reassignOverdueSteps,
                deleteAssignment,
                getAssignmentById,
                getOverdueSteps,
                getUpcomingSteps,
                setAssignments,
            }}
        >
            {children}
        </AssignmentContext.Provider>
    );
};

export default AssignmentProvider;
