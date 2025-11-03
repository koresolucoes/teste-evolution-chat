export interface WhatsappInstance {
  id: string;
  instance_name: string;
  apikey: string;
  owner_number?: string;
  status: 'created' | 'connecting' | 'connected' | 'disconnected';
  created_at: string;
  webhook_secret?: string;
}