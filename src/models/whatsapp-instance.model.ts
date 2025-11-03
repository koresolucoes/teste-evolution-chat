export interface WhatsappInstance {
  id: string;
  instanceName: string;
  apikey: string;
  ownerNumber?: string;
  status: 'created' | 'connecting' | 'connected' | 'disconnected';
  createdAt: string;
}
