// src/components/SummaryTable.tsx
import React, { useState, useEffect } from 'react';
import { useAssignment } from '../context/AssignmentContext';
import { useAuth } from '../context/AuthContext';
import AssignmentDetail from './AssignmentDetail';

const SummaryTable: React.FC = () => {
    const { assignments, fetchAssignments, loading, error } = useAssignment();
    const { user } = useAuth();
    /** 모달용 – 과제 id만 저장 */
    const [selectedId, setSelectedId] = useState<string | null>(null);

    /* 첫 진입 또는 이메일 변경 시 한 번만 GET */
    useEffect(() => {
        if (user?.email && assignments.length === 0) fetchAssignments();
    }, [user?.email, assignments.length, fetchAssignments]);

    /* ───────── 로딩 & 에러 화면 ───────── */
    if (loading) {
        return (
            <div className="max-w-7xl mx-auto py-6">
                <p className="text-gray-600 text-center">Loading assignments...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto py-6">
                <p className="text-red-600 text-center">{error}</p>
            </div>
        );
    }

    /* ───────── 정상 화면 ───────── */
    return (
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">
                Assignment Summary
            </h1>

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
                                    Estimated&nbsp;Time
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Due&nbsp;Date
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {assignments.map((a) => (
                                <tr key={a.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => setSelectedId(a.id)}
                                            className="text-primary-600 hover:text-primary-900 font-medium"
                                        >
                                            {a.analysis.title}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${a.analysis.difficulty === '매우 쉬움'
                                                    ? 'bg-green-100 text-green-800'
                                                    : a.analysis.difficulty === '쉬움'
                                                        ? 'bg-green-50 text-green-700'
                                                        : a.analysis.difficulty === '보통'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : a.analysis.difficulty === '어려움'
                                                                ? 'bg-orange-100 text-orange-800'
                                                                : 'bg-red-100 text-red-800'
                                                }`}
                                        >
                                            {a.analysis.difficulty}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {a.analysis.estimatedTime}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(a.dueDate).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* 상세 모달 – id만 전달 */}
            <AssignmentDetail
                isOpen={!!selectedId}
                onClose={() => setSelectedId(null)}
                assignmentId={selectedId}
            />
        </div>
    );
};

export default SummaryTable;
