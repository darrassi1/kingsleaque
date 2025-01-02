import { Component, OnInit, ElementRef, ViewChild, ChangeDetectorRef, NgZone } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { loadStripe } from '@stripe/stripe-js';
import { fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

interface AnimationElement {
  x: number;
  y: number;
  type: string;
  scale?: number;
  rotation?: number;
  opacity?: number;
  velocity?: { x: number; y: number };
}

interface AppState {
  isDarkMode: boolean;
  isLoggedIn: boolean;
  isLoading: boolean;
  showContent: boolean;
  showLoginForm: boolean;
  errorMessage: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  safeVideoUrl!: SafeResourceUrl;
  videoUrl: string = 'https://www.youtube.com/embed/J1tTti-xMgs';

  private ctx!: CanvasRenderingContext2D;
  private animationElements: AnimationElement[] = [];
  private lastTime = 0;
  private readonly frameTime = 1000 / 60; // 60 FPS
  private stripe = loadStripe('your-stripe-publishable-key-here');

  state: AppState = {
    isDarkMode: false,
    isLoggedIn: false,
    isLoading: false,
    showContent: true,
    showLoginForm: false,
    errorMessage: '',
  };

  username = '';
  password = '';


  constructor(
    private sanitizer: DomSanitizer,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {this.updateSafeVideoUrl();}
  updateSafeVideoUrl() {
    this.safeVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.videoUrl);
  }
  updateVideoUrl() {
    this.updateSafeVideoUrl();
    console.log('Video URL updated to:', this.videoUrl);
  }

  ngOnInit() {
    this.loadSavedTheme();
    this.initCanvas();
    this.setupResizeHandler();
    this.startAnimation();

    this.safeVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.videoUrl);
  }

  updateState(newState: Partial<AppState>) {
    this.state = { ...this.state, ...newState };
    this.cdr.markForCheck();
  }

  async login() {
    this.updateState({ isLoading: true });
    setTimeout(() => {
      if (this.username === 'admin' && this.password === 'admin321') {
        this.updateState({
          isLoggedIn: true,
          showContent: true,
          showLoginForm: false,
          isLoading: false,
        });
      } else {
        this.updateState({
          errorMessage: 'Invalid credentials',
          isLoading: false,
        });
      }
    }, 1000);
  }

  async handleDonation() {
    this.updateState({ isLoading: true });
    try {
      const stripe = await this.stripe;
      if (!stripe) throw new Error('Stripe failed to load');

      const { error } = await stripe.redirectToCheckout({
        lineItems: [{ price: 'price_id', quantity: 1 }],
        mode: 'payment',
        successUrl: `${window.location.origin}/success`,
        cancelUrl: `${window.location.origin}/cancel`,
      });

      if (error) throw error;
    } catch (err) {
      this.updateState({
        errorMessage: 'Payment failed',
        isLoading: false,
      });
    }
  }

  toggleDarkMode() {
    this.updateState({ isDarkMode: !this.state.isDarkMode });
    localStorage.setItem('darkMode', String(this.state.isDarkMode));
  }

  private loadSavedTheme() {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme) {
      this.updateState({ isDarkMode: savedTheme === 'true' });
    }
  }

  private initCanvas() {
    const ctx = this.canvas.nativeElement.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    this.ctx = ctx;
    this.setCanvasDimensions();
    this.initializeElements();
  }

  private setCanvasDimensions() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.nativeElement.getBoundingClientRect();
    this.canvas.nativeElement.width = rect.width * dpr;
    this.canvas.nativeElement.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  private setupResizeHandler() {
    fromEvent(window, 'resize')
      .pipe(debounceTime(200))
      .subscribe(() => {
        this.setCanvasDimensions();
        this.resetCanvas();
      });
  }

  private initializeElements() {
    this.animationElements = [];
    const count = this.state.isDarkMode ? 200 : 20;
    for (let i = 0; i < count; i++) {
      this.animationElements.push({
        x: Math.random() * this.canvas.nativeElement.width,
        y: Math.random() * this.canvas.nativeElement.height,
        type: 'star',
        scale: Math.random() * 2 + 0.5,
        opacity: Math.random(),
        velocity: { x: Math.random() - 0.5, y: Math.random() - 0.5 },
      });
    }
  }

  private startAnimation() {
    this.ngZone.runOutsideAngular(() => {
      const animate = (currentTime: number) => {
        requestAnimationFrame(animate);
        const delta = currentTime - this.lastTime;
        if (delta < this.frameTime) return;
        this.lastTime = currentTime;
        this.updateAndDraw();
      };
      requestAnimationFrame(animate);
    });
  }

  private updateAndDraw() {
    this.ctx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    this.animationElements.forEach((element) => {
      element.x += element.velocity!.x;
      element.y += element.velocity!.y;
      if (element.x < 0) element.x = this.canvas.nativeElement.width;
      if (element.x > this.canvas.nativeElement.width) element.x = 0;
      if (element.y < 0) element.y = this.canvas.nativeElement.height;
      if (element.y > this.canvas.nativeElement.height) element.y = 0;

      this.ctx.fillStyle = `rgba(255, 255, 255, ${element.opacity})`;
      this.ctx.beginPath();
      this.ctx.arc(element.x, element.y, element.scale!, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  private resetCanvas() {
    this.initializeElements();
  }
}
