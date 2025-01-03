import { Component, OnInit, ElementRef, ViewChild, ChangeDetectorRef, NgZone } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { loadStripe } from '@stripe/stripe-js';

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
menuVisible = false;
toggleMenu() {
  this.menuVisible = !this.menuVisible;
}
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
    redirectToHome() {
    this.state.showContent = true;
    this.state.showLoginForm = false;
  }
  updateSafeVideoUrl() {
    this.safeVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.videoUrl);
  }
  updateVideoUrl() {
    this.updateSafeVideoUrl();
    console.log('Video URL updated to:', this.videoUrl);
  }
  ngOnInit() {
    this.loadSavedTheme();
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









}
