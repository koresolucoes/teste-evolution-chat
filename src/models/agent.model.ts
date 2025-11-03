export interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  system_prompt: string;
  knowledge_base_files?: string[];
  created_at?: string;
}
