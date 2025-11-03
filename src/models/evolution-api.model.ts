export interface CreateInstanceResponse {
  instance: {
    instanceName: string;
    instanceId: string;
    status: string;
  };
  hash: string;
  settings: object;
}

export interface ConnectionStateResponse {
  instance: {
    instanceName: string;
    state: 'open' | 'close' | 'connecting';
  };
}

export interface ConnectResponse {
  pairingCode: string;
  code: string;
  count: number;
}

export interface LogoutResponse {
  status: string;
  error: boolean;
  response: {
    message: string;
  };
}