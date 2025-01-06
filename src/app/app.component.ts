import {Component, OnInit, ElementRef, ViewChild, ChangeDetectorRef, NgZone, HostListener} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';


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
    },
    playerVars: {
      'enablejsapi': 1,
      'playsinline': 1,
      'allow': 'picture-in-picture; autoplay',
      'fs': 1
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
      document.addEventListener('enterpictureinpicture', () => {
    this.ngZone.run(() => {
      console.log('Entered PiP mode');
      this.cdr.detectChanges();
    });
  });

  document.addEventListener('leavepictureinpicture', () => {
    this.ngZone.run(() => {
      console.log('Left PiP mode');
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
// Add these to your app.component.ts



async togglePictureInPicture() {
  try {
    // If we're already in PiP mode, exit
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
      return;
    }

    // Get the video element from the YouTube iframe
    const iframe = document.getElementById('youtube-player') as HTMLIFrameElement;
    if (!iframe) return;

    // Force the video to play - this is required for PiP
    await this.player.playVideo();

    // We need to wait a bit for the video to start playing
    await new Promise(resolve => setTimeout(resolve, 100));

    // Create a temporary video element that mirrors the YouTube video
    const video = document.createElement('video');
    video.muted = true; // Must be muted initially due to autoplay policies
    video.style.display = 'none';
    video.playsInline = true;
    video.autoplay = true;

    // Handle video stream from YouTube canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas size to match video
    canvas.width = 640;  // Standard YouTube width
    canvas.height = 360; // Standard YouTube height

    // Create a media stream from the canvas
    const stream = canvas.captureStream();
    video.srcObject = stream;

    // Add video to document temporarily
    document.body.appendChild(video);

    // Start playing the video
    await video.play();

    // Function to capture frames from YouTube
    const captureFrame = () => {
      if (!document.pictureInPictureElement) {
        // If PiP is closed, clean up
        video.remove();
        return;
      }

      // Draw the YouTube iframe to canvas
      if (ctx) {
        // @ts-ignore
        ctx.drawImage(iframe, 0, 0, canvas.width, canvas.height);
      }

      requestAnimationFrame(captureFrame);
    };

    try {
      // Request Picture-in-Picture
      await video.requestPictureInPicture();

      // Start capturing frames
      captureFrame();

      // Sync audio with the main YouTube player
      this.player.unMute();

      // Listen for PiP window close
      video.addEventListener('leavepictureinpicture', () => {
        video.remove();
        canvas.remove();
      });

    } catch (error) {
      console.error('Failed to enter PiP mode:', error);
      video.remove();
      canvas.remove();
      alert('Failed to enter Picture-in-Picture mode. Please use browser controls: right-click the video and select "Picture in Picture"');
    }

  } catch (error) {
    console.error('PiP error:', error);
    alert('To use Picture-in-Picture: Right-click on the video and select "Picture in Picture"');
  }
}
  private loadSavedTheme() {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme) {
      this.updateState({ isDarkMode: savedTheme === 'true' });
    }
  }
}
