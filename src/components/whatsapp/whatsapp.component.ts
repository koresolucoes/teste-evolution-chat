import { ChangeDetectionStrategy, Component, inject, viewChild, ElementRef, effect } from '@angular/core';
import { WhatsappService } from '../../services/whatsapp.service';
import { RouterLink } from '@angular/router';
import { toCanvas } from 'qrcode';

@Component({
  selector: 'app-whatsapp',
  standalone: true,
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

  private async generateQrCode(canvas: HTMLCanvasElement, text: string): Promise<void> {
    try {
      await toCanvas(canvas, text, { width: 256 });
    } catch (error) {
      console.error('QR Code generation failed:', error);
    }
  }

  connect(): void {
    this.whatsappService.connect();
  }

  disconnect(): void {
    this.whatsappService.disconnect();
  }
}