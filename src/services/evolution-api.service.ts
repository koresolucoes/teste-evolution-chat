import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SettingsService } from './settings.service';
import { CreateInstanceResponse, ConnectionStateResponse, ConnectResponse, LogoutResponse } from '../models/evolution-api.model';

@Injectable({
  providedIn: 'root',
})
export class EvolutionApiService {
  private http = inject(HttpClient);
  private settingsService = inject(SettingsService);

  createInstance(globalApiKey: string, instanceName: string): Observable<CreateInstanceResponse | null> {
    const apiUrl = this.settingsService.settings().apiUrl;
    if (!apiUrl || !globalApiKey) {
      return throwError(() => new Error('API URL or Global API Key is not configured.'));
    }

    const url = `${apiUrl}/instance/create`;
    const headers = new HttpHeaders({ 'apikey': globalApiKey });
    const body = {
      instanceName: instanceName,
      qrcode: true, 
      integration: 'WHATSAPP-BAILEYS'
    };

    return this.http.post<CreateInstanceResponse>(url, body, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  connect(instanceApiKey: string, instanceName: string): Observable<ConnectResponse | null> {
      const apiUrl = this.settingsService.settings().apiUrl;
      if (!apiUrl) return of(null);

      const url = `${apiUrl}/instance/connect/${instanceName}`;
      const headers = new HttpHeaders({ 'apikey': instanceApiKey });
      return this.http.get<ConnectResponse>(url, { headers }).pipe(
        catchError(this.handleError)
      );
  }
  
  getConnectionState(instanceApiKey: string, instanceName: string): Observable<ConnectionStateResponse | null> {
    const apiUrl = this.settingsService.settings().apiUrl;
    if (!apiUrl) return of(null);

    const url = `${apiUrl}/instance/connectionState/${instanceName}`;
    const headers = new HttpHeaders({ 'apikey': instanceApiKey });
    return this.http.get<ConnectionStateResponse>(url, { headers }).pipe(
        catchError(err => {
          if (err.status === 404) {
            // FIX: Explicitly define the object type to prevent TypeScript from widening the 'state' literal type to 'string'.
            const offlineState: ConnectionStateResponse = { instance: { instanceName, state: 'close' } };
            return of(offlineState);
          }
          return this.handleError(err);
        })
    );
  }

  logout(instanceApiKey: string, instanceName: string): Observable<LogoutResponse | null> {
      const apiUrl = this.settingsService.settings().apiUrl;
      if (!apiUrl) return of(null);

      const url = `${apiUrl}/instance/logout/${instanceName}`;
      const headers = new HttpHeaders({ 'apikey': instanceApiKey });
      return this.http.delete<LogoutResponse>(url, { headers }).pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.status === 403 && error.error?.response?.message) {
         errorMessage = `API Error: ${error.error.response.message.join(' ')}`;
      } else {
         errorMessage = `Server returned code: ${error.status}, error message is: ${error.message}`;
      }
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
