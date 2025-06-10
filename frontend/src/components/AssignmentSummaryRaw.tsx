import React from 'react';

interface AssignmentSummaryRawProps {
    assignment: {
        text: string;
        dueDate: string;
        analysis: {
            title: string;
            summary: string;
            difficulty: 'easy' | 'medium' | 'hard';
            estimatedTime: string;
            steps: Array<{
                title: string;
                description: string;
                tip: string;
            }>;
        };
    };
}

const AssignmentSummaryRaw: React.FC<AssignmentSummaryRawProps> = ({ assignment }) => {
    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Raw Assignment Data
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Original assignment text and analysis details
                </p>
            </div>
            <div className="border-t border-gray-200">
                <dl>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Original Text</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-wrap">
                            {assignment.text}
                        </dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Due Date</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {new Date(assignment.dueDate).toLocaleDateString()}
                        </dd>
                    </div>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Analysis</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-medium">Title</h4>
                                    <p>{assignment.analysis.title}</p>
                                </div>
                                <div>
                                    <h4 className="font-medium">Summary</h4>
                                    <p>{assignment.analysis.summary}</p>
                                </div>
                                <div>
                                    <h4 className="font-medium">Difficulty</h4>
                                    <p>{assignment.analysis.difficulty}</p>
                                </div>
                                <div>
                                    <h4 className="font-medium">Estimated Time</h4>
                                    <p>{assignment.analysis.estimatedTime}</p>
                                </div>
                                <div>
                                    <h4 className="font-medium">Steps</h4>
                                    <ul className="mt-2 space-y-2">
                                        {assignment.analysis.steps.map((step, index) => (
                                            <li key={index} className="border-l-4 border-primary-500 pl-4">
                                                <h5 className="font-medium">{step.title}</h5>
                                                <p className="text-gray-600">{step.description}</p>
                                                <p className="text-primary-600 text-sm mt-1">
                                                    Tip: {step.tip}
                                                </p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </dd>
                    </div>
                </dl>
            </div>
        </div>
    );
};

export default AssignmentSummaryRaw;
