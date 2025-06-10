import React, { useState, useEffect } from 'react';
import { useAssignment, Assignment } from '../context/AssignmentContext';
import { useAuth } from '../context/AuthContext';
import AssignmentDetail from './AssignmentDetail';
import { fetchAssignments } from '../services/assignmentService';

const SummaryTable: React.FC = () => {
    const { assignments, setAssignments } = useAssignment();
    const { user } = useAuth();
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
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
                <h1 className="text-2xl font-semibold text-gray-900 mb-6">Assignment Summary</h1>

                {assignments.length === 0 ? (
                    <p className="text-gray-600">No assignments have been analyzed yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Title
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Difficulty
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Estimated Time
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Due Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {assignments.map((assignment, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => setSelectedAssignment(assignment)}
                                                className="text-primary-600 hover:text-primary-900 font-medium"
                                            >
                                                {assignment.analysis.title}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium
                                                ${assignment.analysis.difficulty === '매우 쉬움' ? 'bg-green-100 text-green-800' :
                                                    assignment.analysis.difficulty === '쉬움' ? 'bg-green-50 text-green-700' :
                                                        assignment.analysis.difficulty === '보통' ? 'bg-yellow-100 text-yellow-800' :
                                                            assignment.analysis.difficulty === '어려움' ? 'bg-orange-100 text-orange-800' :
                                                                'bg-red-100 text-red-800'}`}>
                                                {assignment.analysis.difficulty}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {assignment.analysis.estimatedTime}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(assignment.dueDate).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <AssignmentDetail
                isOpen={!!selectedAssignment}
                onClose={() => setSelectedAssignment(null)}
                assignment={selectedAssignment}
            />
        </div>
    );
};

export default SummaryTable; 