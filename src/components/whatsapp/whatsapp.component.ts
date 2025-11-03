import { ChangeDetectionStrategy, Component, inject, viewChild, ElementRef, effect } from '@angular/core';
import { WhatsappService } from '../../services/whatsapp.service';
import { RouterLink } from '@angular/router';

declare var QRCode: any;

@Component({
  selector: 'app-whatsapp',
  templateUrl: './whatsapp.component.html',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WhatsappComponent {
  whatsappService = inject(WhatsappService);
  
  qrCanvas = viewChild<ElementRef<HTMLCanvasElement>>('qrCanvas');

  constructor() {
    effect(() => {
      const canvas = this.qrCanvas()?.nativeElement;
      const qrCodeString = this.whatsappService.qrCodeString();

      if (canvas && qrCodeString) {
        this.generateQrCode(canvas, qrCodeString);
      }
    });
  }

  private generateQrCode(canvas: HTMLCanvasElement, text: string, attempt: number = 1): void {
    if (typeof QRCode !== 'undefined') {
      QRCode.toCanvas(canvas, text, { width: 256 }, (error: Error | null) => {
        if (error) {
          console.error('QR Code generation failed:', error);
        }
      });
    } else if (attempt <= 5) {
      // If QRCode is not defined, wait 500ms and retry.
      setTimeout(() => this.generateQrCode(canvas, text, attempt + 1), 500);
    } else {
      console.error('Failed to load QRCode library after several attempts.');
    }
  }

  connect(): void {
    this.whatsappService.connect();
  }

  disconnect(): void {
    this.whatsappService.disconnect();
  }
}
