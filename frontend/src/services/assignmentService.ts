import axios from 'axios';
import { Assignment } from '../context/AssignmentContext';

export const fetchAssignments = async (email: string): Promise<Assignment[]> => {
    try {
        const response = await axios.get(`http://localhost:3001/api/assignments/${encodeURIComponent(email)}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching assignments:', error);
        throw error;
    }
}; 