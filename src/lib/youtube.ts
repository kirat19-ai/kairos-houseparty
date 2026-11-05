// Minimal YouTube IFrame API loader + types.

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface YTPlayer {
  loadVideoById(opts: { videoId: string; startSeconds?: number; endSeconds?: number }): void;
  cueVideoById(opts: { videoId: string; startSeconds?: number; endSeconds?: number }): void;
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  setVolume(v: number): void;
  getVolume(): number;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  destroy(): void;
}

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<any> | null = null;

export function loadYouTubeAPI(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject("no window");
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT);
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return apiPromise;
}

export function createPlayer(
  el: HTMLElement,
  onReady: (p: YTPlayer) => void,
  onStateChange?: (state: number) => void,
): void {
  loadYouTubeAPI().then((YT) => {
    const p: YTPlayer = new YT.Player(el, {
      width: "100%",
      height: "100%",
      playerVars: {
        controls: 0,
        disablekb: 1,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
        fs: 0,
      },
      events: {
        onReady: () => onReady(p),
        onStateChange: (e: any) => onStateChange?.(e.data),
      },
    });
  });
}

export const YT_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const;
