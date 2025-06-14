import React, { useEffect } from 'react';
import { useAssignment } from '../context/AssignmentContext';
import { useAuth } from '../context/AuthContext';
import TimelineGrid from './TimelineGrid';

const Timeline: React.FC = () => {
    // ✅ Provider 가 내려주는 상태만 사용
    const { assignments, fetchAssignments, loading, error } = useAssignment();
    const { user } = useAuth();

    /* ➜ 이메일이 바뀌거나, 첫 진입인데 데이터가 없으면 1회만 호출 */
    useEffect(() => {
        if (user?.email && assignments.length === 0) {
            fetchAssignments();
        }
    }, [user?.email, assignments.length, fetchAssignments]);

    /* ----------- UI 렌더링 ----------- */
    if (loading) {
        return (
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        <p className="ml-3 text-gray-600">Loading assignments...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Error</h3>
                                <p className="mt-1 text-sm text-red-700">{error}</p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="mt-2 text-sm font-medium text-red-600 hover:text-red-500"
                                >
                                    Try again
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* 정상 화면 */
    return (
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
                <h1 className="text-2xl font-semibold text-gray-900 mb-6">Assignment Timeline</h1>

                {assignments.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600">No assignments have been analyzed yet.</p>
                    </div>
                ) : (
                    <TimelineGrid />
                )}
            </div>
        </div>
    );
};

export default Timeline;
