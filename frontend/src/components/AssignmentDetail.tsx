// src/components/AssignmentDetail.tsx
import React from 'react';
import { Dialog } from '@headlessui/react';
import { Step, useAssignment } from '../context/AssignmentContext';

/* ───────── 색상·스타일 헬퍼 ───────── */
const diffColor = (d: string) =>
    d === '매우 쉬움' ? 'bg-green-100 text-green-800'
        : d === '쉬움' ? 'bg-green-50 text-green-700'
            : d === '보통' ? 'bg-yellow-100 text-yellow-800'
                : d === '어려움' ? 'bg-orange-100 text-orange-800'
                    : 'bg-red-100 text-red-800';

const stepBorder = (s: Step) =>
    s.completed ? 'bg-green-50 border border-green-200'
        : s.status === 'overdue' ? 'bg-red-50 border border-red-200'
            : 'bg-white border border-gray-200';

/* ───────── 단일 Step 카드 ───────── */
interface StepCardProps {
    step: Step;
    assignmentId: string;
}
const StepCard: React.FC<StepCardProps> = ({ step, assignmentId }) => {
    const { updateStepStatus } = useAssignment();

    return (
        <div className={`p-4 rounded-lg ${stepBorder(step)}`}>
            <div className="flex items-start">
                <input
                    type="checkbox"
                    checked={!!step.completed}
                    onChange={(e) =>
                        updateStepStatus(assignmentId, step.title, e.target.checked)
                    }
                    className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
                />

                <div className="ml-3">
                    <h4 className="text-lg font-medium text-gray-900">{step.title}</h4>
                    <p className="mt-1 text-gray-600">{step.description}</p>

                    {step.tip && (
                        <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                            Tip: {step.tip}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

/* ───────── AssignmentDetail 모달 ───────── */
interface AssignmentDetailProps {
    isOpen: boolean;
    onClose: () => void;
    assignmentId: string | null;
}

const AssignmentDetail: React.FC<AssignmentDetailProps> = ({
    isOpen,
    onClose,
    assignmentId,
}) => {
    const { getAssignmentById } = useAssignment();
    const assignment = assignmentId ? getAssignmentById(assignmentId) : null;

    if (!isOpen || !assignment) return null;

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="mx-auto max-w-4xl w-full rounded-lg bg-white p-6 shadow-xl max-h-[90vh] flex flex-col">
                    {/* ── 헤더 ── */}
                    <div className="flex justify-between items-start mb-6">
                        <Dialog.Title className="text-2xl font-bold text-gray-900">
                            {assignment.analysis.title}
                        </Dialog.Title>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                            <span className="sr-only">Close</span>
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* ── 내용 ── */}
                    <div className="space-y-6 overflow-y-auto flex-1 pr-2">
                        {/* 메타정보 */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Difficulty</h3>
                                    <span className={`mt-1 inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${diffColor(assignment.analysis.difficulty)}`}>
                                        {assignment.analysis.difficulty}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Estimated Time</h3>
                                    <p className="mt-1 text-sm text-gray-900">{assignment.analysis.estimatedTime}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {new Date(assignment.dueDate).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Summary */}
                        {assignment.analysis.summary && (
                            <section>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Summary</h3>
                                <p className="text-gray-600">{assignment.analysis.summary}</p>
                            </section>
                        )}

                        {/* Steps */}
                        <section>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Steps</h3>
                            <div className="space-y-4">
                                {assignment.analysis.steps.map((step) => (
                                    <StepCard key={step.title} step={step} assignmentId={assignment.id} />
                                ))}
                            </div>
                        </section>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

export default AssignmentDetail;
