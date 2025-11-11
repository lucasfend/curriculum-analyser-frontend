export interface AgentResult {
    analysis: string;
    usedService: "gemini" | "openai";
    geminiAttempt: number;
}

export interface Job {
    id: number;
    title: string;
    company: string;
    requirements: string;
    description: string;
}

export interface MatchedJob {
    job: Job;
    matchScore: number;
}

export interface AnalysisResponse {
    agentResult: AgentResult;
    matchedJobs: MatchedJob[];
}