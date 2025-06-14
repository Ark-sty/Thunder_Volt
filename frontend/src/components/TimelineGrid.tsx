import React, { useState, useMemo } from 'react';
import { Assignment, Step, StepStatus, useAssignment } from '../context/AssignmentContext';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';
import { Dialog } from '@headlessui/react';

interface StepModalProps {
    isOpen: boolean;
    onClose: () => void;
    step: Step;
    assignmentTitle: string;
}

const StepModal: React.FC<StepModalProps> = ({ isOpen, onClose, step, assignmentTitle }) => {
    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="mx-auto max-w-lg w-full rounded-lg bg-white p-6 shadow-xl">
                    <Dialog.Title className="text-lg font-medium text-gray-900 mb-2">
                        {assignmentTitle}
                    </Dialog.Title>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">{step.title}</h3>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-medium text-gray-700">Description</h4>
                            <p className="mt-1 text-gray-600">{step.description}</p>
                        </div>
                        {step.tip && (
                            <div>
                                <h4 className="font-medium text-gray-700">Tip</h4>
                                <p className="mt-1 text-primary-600">{step.tip}</p>
                            </div>
                        )}
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                        >
                            Close
                        </button>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

const TimelineGrid: React.FC = () => {
    const { assignments, updateStepStatus } = useAssignment();
    const { user } = useAuth();
    const [selectedStep, setSelectedStep] = useState<{ step: Step; assignmentTitle: string; assignmentId: string } | null>(null);

    const dates = useMemo(() => {
        const today = dayjs();
        const latestDueDate = assignments.reduce((latest, assignment) => {
            const dueDate = dayjs(assignment.dueDate);
            return dueDate.isAfter(latest) ? dueDate : latest;
        }, today);

        const dateArray: string[] = [];
        let currentDate = today;
        while (currentDate.isSameOrBefore(latestDueDate, 'day')) {
            dateArray.push(currentDate.format('YYYY-MM-DD'));
            currentDate = currentDate.add(1, 'day');
        }
        return dateArray;
    }, [assignments]);

    const stepsByDate = useMemo(() => {
        const newStepsByDate = new Map<string, { step: Step; assignmentTitle: string; assignmentId: string }[]>();
        dates.forEach(date => newStepsByDate.set(date, []));

        assignments.forEach(assignment => {
            assignment.analysis.steps.forEach(originalStep => {
                const stepDate = dayjs(originalStep.date ?? assignment.dueDate);
                const today = dayjs();
                const targetDate = stepDate.isBefore(today) ? today.format('YYYY-MM-DD') : stepDate.format('YYYY-MM-DD');
                const existingSteps = newStepsByDate.get(targetDate) || [];

                // 🚩 항상 최신 상태의 step을 찾아서 집어넣기
                const freshStep = assignment.analysis.steps.find(s => s.title === originalStep.title)!;

                newStepsByDate.set(targetDate, [...existingSteps, {
                    step: freshStep,
                    assignmentTitle: assignment.analysis.title,
                    assignmentId: assignment.id
                }]);
            });
        });

        return newStepsByDate;
    }, [assignments, dates]);


    const handleStepStatusChange = (assignmentId: string, stepTitle: string, completed: boolean) => {
        if (!user?.email) return;
        /* updateStepStatus 내부가 자동으로
        ▸ 옵티미스틱 반영
        ▸ 서버 요청
        ▸ 실패 시 롤백
        을 모두 처리합니다. */
        updateStepStatus(assignmentId, stepTitle, completed);
    };

    return (
        <div className="overflow-x-auto">
            <div className="min-w-full inline-block align-middle">
                <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 z-10">
                                    Assignment
                                </th>
                                {dates.map(date => (
                                    <th key={date} className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                                        {dayjs(date).format('MMM D')}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {assignments.map((assignment) => (
                                <tr key={assignment.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                                        {assignment.analysis.title}
                                    </td>
                                    {dates.map(date => {
                                        const dateSteps = stepsByDate.get(date) || [];
                                        const assignmentSteps = dateSteps.filter(({ step }) =>
                                            assignment.analysis.steps.some(s => s.title === step.title)
                                        );

                                        return (
                                            <td key={date} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[200px]">
                                                {assignmentSteps.map(({ step, assignmentTitle, assignmentId }, stepIndex) => (
                                                    <div
                                                        key={stepIndex}
                                                        className={`mb-2 p-2 rounded ${step.completed
                                                            ? 'bg-green-50 border border-green-200'
                                                            : step.status === 'overdue'
                                                                ? 'bg-red-50 border border-red-200'
                                                                : 'bg-yellow-50 border border-yellow-200'
                                                            }`}
                                                    >
                                                        <div className="flex items-center">
                                                            <div className="relative flex items-center" onClick={(e) => e.stopPropagation()}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={step.completed ?? false}
                                                                    onChange={(e) => {
                                                                        e.stopPropagation();
                                                                        handleStepStatusChange(assignmentId, step.title, e.target.checked);
                                                                    }}
                                                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
                                                                />
                                                            </div>
                                                            <span
                                                                className="ml-2 cursor-pointer flex-grow"
                                                                onClick={() => setSelectedStep({ step, assignmentTitle, assignmentId })}
                                                            >
                                                                {step.title}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedStep && (
                <StepModal
                    isOpen={!!selectedStep}
                    onClose={() => setSelectedStep(null)}
                    step={selectedStep.step}
                    assignmentTitle={selectedStep.assignmentTitle}
                />
            )}
        </div>
    );
};

export default TimelineGrid;
