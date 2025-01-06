// pip.service.ts
import { Injectable } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class PipService {
  private pipWindow: Window | null = null;
  private defaultWidth = 400;
  private defaultHeight = 300;

  constructor(private sanitizer: DomSanitizer) {}

  openPipWindow(videoUrl: string): void {
    // Close existing PiP window if open
    this.closePipWindow();

    // Calculate position for bottom-right corner
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const left = screenWidth - this.defaultWidth;
    const top = screenHeight - this.defaultHeight;

    // Window features
    const features = [
      `width=${this.defaultWidth}`,
      `height=${this.defaultHeight}`,
      `left=${left}`,
      `top=${top}`,
      'resizable=yes',
      'location=no',
      'menubar=no',
      'status=no',
      'toolbar=no',
      'alwaysOnTop=yes'
    ].join(',');

    // Create minimal HTML content for PiP window
    const pipContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>PiP Player</title>
          <style>
            body, html {
              margin: 0;
              padding: 0;
              overflow: hidden;
              background: black;
            }
            iframe {
              width: 100%;
              height: 100vh;
              border: none;
            }
          </style>
        </head>
        <body>
          <iframe
            src="${videoUrl}"
            frameborder="0"
            allowfullscreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          ></iframe>
        </body>
      </html>
    `;

    // Open new window
    this.pipWindow = window.open('', 'pipWindow', features);

    if (this.pipWindow) {
      this.pipWindow.document.write(pipContent);
      this.pipWindow.document.close();

      // Handle window close
      this.pipWindow.onbeforeunload = () => {
        this.pipWindow = null;
      };
    }
  }

  closePipWindow(): void {
    if (this.pipWindow) {
      this.pipWindow.close();
      this.pipWindow = null;
    }
  }

  isPipActive(): boolean {
    return this.pipWindow !== null && !this.pipWindow.closed;
  }
}
