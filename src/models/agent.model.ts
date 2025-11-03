export interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  systemPrompt: string;
  knowledgeBaseFiles?: string[];
  createdAt?: string;
}