import React, { useState, useEffect } from 'react';
import { Assignment, Step } from '../context/AssignmentContext';
import dayjs from 'dayjs';
import { Dialog } from '@headlessui/react';

interface TimelineGridProps {
    assignments: Assignment[];
}

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
                        <div>
                            <h4 className="font-medium text-gray-700">Tip</h4>
                            <p className="mt-1 text-primary-600">{step.tip}</p>
                        </div>
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

const TimelineGrid: React.FC<TimelineGridProps> = ({ assignments }) => {
    const [dates, setDates] = useState<string[]>([]);
    const [selectedStep, setSelectedStep] = useState<{ step: Step; assignmentTitle: string } | null>(null);
    const [stepsByDate, setStepsByDate] = useState<Map<string, { step: Step; assignmentTitle: string }[]>>(new Map());

    useEffect(() => {
        // Generate dates from today to the latest due date
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
        setDates(dateArray);

        // Organize steps by date
        const newStepsByDate = new Map<string, { step: Step; assignmentTitle: string }[]>();
        dateArray.forEach(date => newStepsByDate.set(date, []));

        assignments.forEach(assignment => {
            assignment.analysis.steps.forEach(step => {
                const stepDate = dayjs(step.date);
                if (stepDate.isBefore(today)) {
                    // Move steps from past dates to today
                    const todayKey = today.format('YYYY-MM-DD');
                    const existingSteps = newStepsByDate.get(todayKey) || [];
                    newStepsByDate.set(todayKey, [...existingSteps, { step, assignmentTitle: assignment.analysis.title }]);
                } else {
                    const dateKey = stepDate.format('YYYY-MM-DD');
                    const existingSteps = newStepsByDate.get(dateKey) || [];
                    newStepsByDate.set(dateKey, [...existingSteps, { step, assignmentTitle: assignment.analysis.title }]);
                }
            });
        });

        setStepsByDate(newStepsByDate);
    }, [assignments]);

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
                                                {assignmentSteps.map(({ step, assignmentTitle }, stepIndex) => (
                                                    <div
                                                        key={stepIndex}
                                                        className={`mb-2 p-2 rounded cursor-pointer ${step.completed
                                                            ? 'bg-green-50 border border-green-200'
                                                            : step.status === 'overdue'
                                                                ? 'bg-red-50 border border-red-200'
                                                                : 'bg-yellow-50 border border-yellow-200'
                                                            }`}
                                                        onClick={() => setSelectedStep({ step, assignmentTitle })}
                                                    >
                                                        <div className="flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={step.completed}
                                                                readOnly
                                                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                                            />
                                                            <span className="ml-2">{step.title}</span>
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
