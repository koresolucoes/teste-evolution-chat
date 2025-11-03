import { ChangeDetectionStrategy, Component, inject, viewChild, ElementRef, effect } from '@angular/core';
import { WhatsappService } from '../../services/whatsapp.service';
import { RouterLink } from '@angular/router';

declare var QRCode: any;

@Component({
  selector: 'app-whatsapp',
  templateUrl: './whatsapp.component.html',
  imports: [RouterLink],
  // FIX: Corrected typo from 'Change.OnPush' to 'ChangeDetectionStrategy.OnPush'
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
        QRCode.toCanvas(canvas, qrCodeString, { width: 256 }, (error: Error | null) => {
          if (error) console.error(error);
        });
      }
    });
  }

  connect(): void {
    this.whatsappService.connect();
  }

  disconnect(): void {
    this.whatsappService.disconnect();
  }
}
