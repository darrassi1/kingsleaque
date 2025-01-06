import {Component, OnInit, ElementRef, ViewChild, ChangeDetectorRef, NgZone, HostListener} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
interface PiPWindow extends Window {
  pictureInPictureEnabled?: boolean;
}

declare var window: PiPWindow;

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
  isPiPSupported: boolean = false;
isInPiPMode: boolean = false;
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

playNext() {
  if (this.currentIndex < this.videosUrl.length - 1) {
    this.currentIndex++;
  } else {
    this.currentIndex = 0; // Loop back to start
  }
  this.videoUrl = this.videosUrl[this.currentIndex].url;
  this.updateVideoUrl();
}

  playPrevious() {
  if (this.currentIndex > 0) {
    this.currentIndex--;
  } else {
    this.currentIndex = this.videosUrl.length - 1; // Loop to end
  }
  this.videoUrl = this.videosUrl[this.currentIndex].url;
  this.updateVideoUrl();
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
    private cdr: ChangeDetectorRef
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
      this.isPiPSupported = document.pictureInPictureEnabled;

  // Add event listeners for PiP changes
  document.addEventListener('enterpictureinpicture', () => {
    this.ngZone.run(() => {
      this.isInPiPMode = true;
      this.cdr.detectChanges();
    });
  });

  document.addEventListener('leavepictureinpicture', () => {
    this.ngZone.run(() => {
      this.isInPiPMode = false;
      this.cdr.detectChanges();
    });
  });
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
   async togglePictureInPicture() {
  try {
    // Check if PiP is supported
    if (!document.pictureInPictureEnabled) {
      alert('Picture-in-Picture is not supported in your browser');
      return;
    }

    // Get the current video ID
    const currentVideoId = this.extractVideoId(this.videoUrl);

    // If already in PiP mode, exit
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
      return;
    }

    // Create a video element
    const video = document.createElement('video');
    video.muted = false;
    video.autoplay = true;
    video.controls = true;

    // Set up video source using a proxy or direct YouTube stream
    // We'll use an invidious instance as a proxy to get the video stream
    const proxyUrl = `https://inv.tux.pizza/latest_version?id=${currentVideoId}&itag=22`;

    try {
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error('Failed to get video stream');

      const data = await response.json();
      video.src = data.url;

      // Add the video element to the DOM temporarily
      video.style.display = 'none';
      document.body.appendChild(video);

      // Wait for the video to be loaded
      await new Promise((resolve) => {
        video.addEventListener('loadedmetadata', resolve);
        video.addEventListener('error', () => {
          alert('Failed to load video stream');
          video.remove();
        });
      });

      // Request Picture-in-Picture
      await video.requestPictureInPicture();

      // Sync the PiP video with the current YouTube player time
      if (this.player?.getCurrentTime) {
        const currentTime = await this.player.getCurrentTime();
        video.currentTime = currentTime;
      }

      // Clean up when PiP is closed
      video.addEventListener('leavepictureinpicture', () => {
        video.remove();
      });

    } catch (error) {
      console.error('Error:', error);
      video.remove();
      alert('Failed to enter Picture-in-Picture mode. Please try again.');
    }

  } catch (error) {
    console.error('PiP error:', error);
    alert('Failed to toggle Picture-in-Picture mode');
  }
}
  private loadSavedTheme() {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme) {
      this.updateState({ isDarkMode: savedTheme === 'true' });
    }
  }
}
