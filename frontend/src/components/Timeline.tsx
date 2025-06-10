import React, { useEffect, useState } from 'react';
import { useAssignment } from '../context/AssignmentContext';
import { useAuth } from '../context/AuthContext';
import TimelineGrid from './TimelineGrid';
import { fetchAssignments } from '../services/assignmentService';
import type { Assignment } from '../context/AssignmentContext';

const Timeline: React.FC = () => {
    const { assignments, setAssignments } = useAssignment();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadAssignments = async () => {
            if (!user?.email) return;

            try {
                setIsLoading(true);
                setError(null);
                const fetchedAssignments = await fetchAssignments(user.email);
                setAssignments(fetchedAssignments);
            } catch (err) {
                setError('Failed to load assignments');
                console.error('Error loading assignments:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadAssignments();
    }, [user?.email, setAssignments]);

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <p className="text-gray-600">Loading assignments...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <p className="text-red-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
                <h1 className="text-2xl font-semibold text-gray-900 mb-6">Assignment Timeline</h1>

                {assignments.length === 0 ? (
                    <p className="text-gray-600">No assignments have been analyzed yet.</p>
                ) : (
                    <TimelineGrid assignments={assignments} />
                )}
            </div>
        </div>
    );
};

export default Timeline; 