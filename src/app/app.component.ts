import {Component, OnInit, ElementRef, ViewChild, ChangeDetectorRef, NgZone, HostListener} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PipService } from './pip.service';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: any;
  }
}
interface VideoItem {
  url: string;
  title: string;
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
  player: any;
  currentIndex: number = 0;
  safeVideoUrl!: SafeResourceUrl;
  videoUrl: string = 'https://www.youtube.com/embed/JKzuzoQnV-8';
  menuVisible = false;
  videosUrl: VideoItem[] = [
    {
      url: 'https://www.youtube.com/embed/bNyUyrR0PHo',
      title: 'Aljazeera'
    },
    {
      url: 'https://www.youtube.com/embed/JKzuzoQnV-8',
      title: '👑 KINGS YCN-R2D2 ⚽'
    },
        {
      url: 'https://www.youtube.com/embed/jJqcFN-hjGg',
      title: 'AlArabiya'
    },
            {
      url: 'https://www.youtube.com/embed/e2RgSa1Wt5o',
      title: 'Alaraby TV'
    },
                {
      url: 'https://www.youtube.com/embed/OLWU0rKOQ6o',
      title: 'Surya TV'
    },
                    {
      url: 'https://www.youtube.com/embed/et0bSUddkn4',
      title: 'AlHadath'
    },
                        {
      url: 'https://www.youtube.com/embed/f6VpkfV7m4Y',
      title: 'Asharq News'
    },
    // Add more videos with their titles...
  ];
    isPlaying: boolean = false;
      // Add these methods
  togglePiP(): void {
    if (this.pipService.isPipActive()) {
      this.pipService.closePipWindow();
    } else {
      // Extract the current video URL and open in PiP
      const currentVideo = this.videosUrl[this.currentIndex];
      const videoId = this.extractVideoId(currentVideo.url);
      const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`;
      this.pipService.openPipWindow(embedUrl);
    }
  }
 initPlayer() {
    const iframe = document.getElementById('youtube-player');
    if (!iframe) {
      setTimeout(() => this.initPlayer(), 100);
      return;
    }

    this.player = new window.YT.Player('youtube-player', {
      events: {
        'onReady': () => {
          if (this.player?.getPlayerState) {
            const state = this.player.getPlayerState();
            this.ngZone.run(() => {
              this.isPlaying = state === window.YT.PlayerState.PLAYING;
              // Autoplay when player is ready
              this.player.playVideo();
              this.isPlaying = true;
              this.cdr.detectChanges();
            });
          }
        },
        'onStateChange': (event: any) => {
          this.ngZone.run(() => {
            this.onPlayerStateChange(event);
            this.cdr.detectChanges();
          });
        }
      }
    });
  }



onPlayerStateChange(event: any) {
  // Handle all possible player states
  switch (event.data) {
    case window.YT.PlayerState.PLAYING:
      this.isPlaying = true;
      break;
    case window.YT.PlayerState.PAUSED:
    case window.YT.PlayerState.ENDED:
    case window.YT.PlayerState.BUFFERING:
    case window.YT.PlayerState.UNSTARTED:
      this.isPlaying = false;
      break;
  }
  this.cdr.detectChanges();
}
togglePlayButton() {
  if (!this.player) {
    this.initPlayer();
    return;
  }

  const currentVideo = this.videosUrl[this.currentIndex]; // Use currentIndex instead of find
  this.togglePlay(currentVideo, this.currentIndex, new Event('click'));
}

togglePlay(video: VideoItem, index: number, event: Event) {
  event.stopPropagation();

  // Initialize player if it doesn't exist
  if (!this.player) {
    this.initPlayer();
    return;
  }

  if (video.url === this.videoUrl) {
    // Toggle play/pause for current video
    if (this.player.getPlayerState) {
      const playerState = this.player.getPlayerState();
      if (playerState === window.YT.PlayerState.PLAYING) {
        this.player.pauseVideo();
        this.isPlaying = false;
      } else {
        this.player.playVideo();
        this.isPlaying = true;
      }
    } else {
      // If player state isn't available yet, try to play
      this.player.playVideo();
      this.isPlaying = true;
    }
  } else {
    // Select and play new video
    this.selectVideo(video, index);
    this.isPlaying = true;
  }
  this.cdr.detectChanges();
}

toggleMenu() {
  this.menuVisible = !this.menuVisible;
}
selectVideo(video: VideoItem, index: number) {
  this.videoUrl = video.url;
  this.currentIndex = index;
  this.updateVideoUrl();

  // If player exists, load the video directly
  if (this.player?.loadVideoById) {
    const videoId = this.extractVideoId(video.url);
    this.player.loadVideoById(videoId);
  }
}

  // Update your existing playNext and playPrevious methods to handle PiP
  playNext(): void {
    if (this.currentIndex < this.videosUrl.length - 1) {
      this.currentIndex++;
    } else {
      this.currentIndex = 0;
    }
    this.videoUrl = this.videosUrl[this.currentIndex].url;
    this.updateVideoUrl();

    // Update PiP window if active
    if (this.pipService.isPipActive()) {
      const videoId = this.extractVideoId(this.videoUrl);
      const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`;
      this.pipService.closePipWindow();
      this.pipService.openPipWindow(embedUrl);
    }
  }

  playPrevious(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else {
      this.currentIndex = this.videosUrl.length - 1;
    }
    this.videoUrl = this.videosUrl[this.currentIndex].url;
    this.updateVideoUrl();

    // Update PiP window if active
    if (this.pipService.isPipActive()) {
      const videoId = this.extractVideoId(this.videoUrl);
      const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`;
      this.pipService.closePipWindow();
      this.pipService.openPipWindow(embedUrl);
    }
  }
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.state.showContent) { // Only if video section is visible
      switch(event.key) {
        case 'ArrowRight':
          this.playNext();
          break;
        case 'ArrowLeft':
          this.playPrevious();
          break;
      }
    }
  }
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
    private cdr: ChangeDetectorRef,
     public pipService: PipService  // Changed to public
  ) {this.updateSafeVideoUrl();
        this.initYouTubeAPI();


  }
   private initYouTubeAPI() {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = () => {
      this.ngZone.run(() => {
        this.initPlayer();
      });
    };

    if (window.YT && window.YT.Player) {
      this.initPlayer();
    }
  }

// Add this method to periodically check player state
private startStateTracking() {
  setInterval(() => {
    if (this.player?.getPlayerState) {
      this.ngZone.run(() => {
        const state = this.player.getPlayerState();
        this.isPlaying = state === window.YT.PlayerState.PLAYING;
        this.cdr.detectChanges();
      });
    }
  }, 500); // Check every 500ms
}
    redirectToHome() {
    this.state.showContent = true;
    this.state.showLoginForm = false;
  }
  updateSafeVideoUrl() {
    this.safeVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.videoUrl);
  }
updateVideoUrl() {
  // Extract video ID from URL if it's a YouTube URL
  const videoId = this.extractVideoId(this.videoUrl);
  const embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1`;
  this.safeVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
}

extractVideoId(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : '';
}
// Update ngOnInit to start state tracking
 ngOnInit() {
    this.loadSavedTheme();
    this.updateSafeVideoUrl();
    this.startStateTracking();
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

handleDonation() {
  // Open Buy Me a Coffee in a new tab
  window.open('https://buymeacoffee.com/darrassi1', '_blank');
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
