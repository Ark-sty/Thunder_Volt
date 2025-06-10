export interface AssignmentStep {
    title: string;
    description: string;
    tip: string;
    date: string;
}

export interface AssignmentAnalysis {
    title: string;
    summary: string;
    difficulty: '매우 쉬움' | '쉬움' | '보통' | '어려움' | '매우 어려움';
    estimatedTime: string;
    dueDate: string;
    steps: AssignmentStep[];
}

export interface Assignment {
    analysis: AssignmentAnalysis;
    dueDate: string;
} 