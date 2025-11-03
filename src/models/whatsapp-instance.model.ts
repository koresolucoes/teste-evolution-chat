export interface WhatsappInstance {
  id: string;
  instanceName: string;
  instanceApiKey: string;
  ownerNumber?: string;
  status: 'created' | 'connecting' | 'connected' | 'disconnected';
  createdAt: string;
}
