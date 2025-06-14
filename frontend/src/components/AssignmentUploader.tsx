import React, { useState, ChangeEvent } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useAssignment } from '../context/AssignmentContext';
import { useAuth } from '../context/AuthContext';

interface FormData {
    dueDate: Date | null;
}

interface FormErrors {
    file?: string;
    dueDate?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

const AssignmentUploader: React.FC = () => {
    const { fetchAssignments } = useAssignment();
    const { user } = useAuth();
    const [formData, setFormData] = useState<FormData>({
        dueDate: null
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (file.type !== 'application/pdf') {
            setError('Please upload a PDF file');
            return;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            setError('File size must be less than 5MB');
            return;
        }

        setSelectedFile(file);
        setError(null);
    };

    const handleDateChange = (date: Date | null) => {
        setFormData((prev: FormData) => ({
            ...prev,
            dueDate: date
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedFile || !formData.dueDate) {
            setError('Please select a PDF file and due date');
            return;
        }

        if (!user) {
            setError('You must be logged in to analyze assignments');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Check server health first
            try {
                await axios.get('http://localhost:3001/api/health');
            } catch (healthError) {
                throw new Error('Server is not responding. Please make sure the backend server is running.');
            }

            const formDataToSend = new FormData();
            formDataToSend.append('file', selectedFile);

            // Ensure the date is set to the start of the day in local timezone
            const dueDate = new Date(formData.dueDate);
            dueDate.setDate(dueDate.getDate() + 1);
            dueDate.setHours(0, 0, 0, 0);
            formDataToSend.append('dueDate', dueDate.toISOString().split('T')[0]);


            const response = await axios.post(
                `http://localhost:3001/api/analyze?username=${encodeURIComponent(user.email || '')}`,
                formDataToSend,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    timeout: 30000, // 30 second timeout
                }
            );

            if (response.data.error) {
                throw new Error(response.data.error);
            }

            await fetchAssignments();

            // Reset form
            setFormData({
                dueDate: null
            });
            setSelectedFile(null);
            const fileInput = document.getElementById('file') as HTMLInputElement;
            if (fileInput) {
                fileInput.value = '';
            }
        } catch (err: any) {
            console.error('Error:', err);
            if (err.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                setError(err.response.data.error || 'Failed to analyze assignment. Please try again.');
            } else if (err.request) {
                // The request was made but no response was received
                setError('Unable to connect to the server. Please check if the server is running.');
            } else {
                // Something happened in setting up the request that triggered an Error
                setError(err.message || 'An unexpected error occurred. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="file" className="block text-sm font-medium text-gray-700">
                        Upload PDF (max 5MB)
                    </label>
                    <input
                        type="file"
                        id="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="mt-1 block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-semibold
                            file:bg-primary-50 file:text-primary-700
                            hover:file:bg-primary-100"
                    />
                    {selectedFile && (
                        <p className="mt-2 text-sm text-gray-500">
                            Selected file: {selectedFile.name}
                        </p>
                    )}
                </div>

                <div>
                    <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                        Due Date
                    </label>
                    <div className="mt-1">
                        <DatePicker
                            selected={formData.dueDate}
                            onChange={handleDateChange}
                            dateFormat="yyyy-MM-dd"
                            minDate={new Date()}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholderText="Select due date"
                        />
                    </div>
                </div>

                {error && (
                    <div className="text-red-600 text-sm">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                    {isLoading ? (
                        <>
                            <svg
                                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                            </svg>
                            Processing...
                        </>
                    ) : (
                        'Analyze Assignment'
                    )}
                </button>
            </form>
        </div>
    );
};

export default AssignmentUploader;
