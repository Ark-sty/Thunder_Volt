import React from 'react';
import AssignmentUploader from './AssignmentUploader';

const TaskInput: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <h1 className="text-2xl font-semibold text-gray-900 mb-6">Task Input</h1>
                    <div className="bg-white shadow rounded-lg p-6">
                        <AssignmentUploader />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskInput; 