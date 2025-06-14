import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, Dispatch, SetStateAction } from 'react';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import axios from 'axios';
import { useAuth } from './AuthContext';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

// Types
export type StepStatus = 'completed' | 'pending' | 'overdue';

export interface Step {
    title: string;
    description: string;
    tip?: string;
    date?: string;
    assignedDate?: string;
    completed?: boolean;
    status?: StepStatus;
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
    setAssignments: Dispatch<SetStateAction<Assignment[]>>;
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

    const fetchAssignments = useCallback(async () => {
        if (!user?.email) return;

        setLoading(true);
        setError(null);
        try {
            const { data } = await axios.get(
                `http://localhost:3001/api/assignments/${user.email}`,
            );
            setAssignments(data);
        } catch (err) {
            setError('Failed to fetch assignments');
        } finally {
            setLoading(false);
        }
    }, [user?.email]);


    const addAssignment = async (assignment: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (!user?.email) return;

        const now = new Date().toISOString();
        const newAssignment: Assignment = {
            ...assignment,
            id: Date.now().toString(),
            createdAt: now,
            updatedAt: now,
        };

        // AssignmentContext.tsx  (addAssignment 안)
        try {
            const { data } = await axios.post(
                `http://localhost:3001/api/assignments/${user.email}`,
                newAssignment
            );
            setAssignments((prev) => [...prev, data]);
            setError(null);            //성공 시 에러 초기화
        } catch (err) {
            console.error('Failed to add assignment:', err);
            setError('Failed to add assignment');
        }

    };

    const updateStepStatus = async (assignmentId: string, stepTitle: string, completed: boolean) => {
        if (!user?.email) return;

        // Optimistically update the UI
        const newStatus: StepStatus = completed ? 'completed' : 'pending';

        // Create a new assignments array with the updated step
        const updatedAssignments = assignments.map(assignment =>
            assignment.id === assignmentId
                ? {
                    ...assignment,
                    analysis: {
                        ...assignment.analysis,
                        steps: assignment.analysis.steps.map(step =>
                            step.title === stepTitle
                                ? { ...step, completed, status: newStatus }
                                : step
                        )
                    }
                }
                : assignment
        );

        // Update state once
        setAssignments(updatedAssignments);

        try {
            const response = await axios.put(
                `http://localhost:3001/api/assignments/${user.email}/${assignmentId}`,
                { stepTitle, completed }
            );

            // Only update if the server response is different from our optimistic update
            if (JSON.stringify(response.data) !== JSON.stringify(updatedAssignments.find(a => a.id === assignmentId))) {
                setAssignments(prevAssignments =>
                    prevAssignments.map(assignment =>
                        assignment.id === assignmentId ? response.data : assignment
                    )
                );
            }
        } catch (err) {
            console.error('Error updating step status:', err);
            // Revert on error
            const revertStatus: StepStatus = !completed ? 'completed' : 'pending';
            setAssignments(prevAssignments =>
                prevAssignments.map(assignment =>
                    assignment.id === assignmentId
                        ? {
                            ...assignment,
                            analysis: {
                                ...assignment.analysis,
                                steps: assignment.analysis.steps.map(step =>
                                    step.title === stepTitle
                                        ? { ...step, completed: !completed, status: revertStatus }
                                        : step
                                )
                            }
                        }
                        : assignment
                )
            );
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
    }, [user?.email, fetchAssignments]);

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
