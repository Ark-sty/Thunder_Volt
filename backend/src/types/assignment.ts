export interface Step {
    title: string;
    description: string;
    tip: string;
    date: string;
    completed?: boolean;
    status?: 'pending' | 'completed' | 'overdue';
}

export interface AssignmentAnalysis {
    title: string;
    summary: string;
    difficulty: '매우 쉬움' | '쉬움' | '보통' | '어려움' | '매우 어려움';
    estimatedTime: string;
    dueDate: string;
    steps: Step[];
}

export interface Assignment {
    id: string;
    text: string;
    dueDate: string;
    analysis: AssignmentAnalysis;
    createdAt: string;
    updatedAt: string;
} 