/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Audio chime using Web Audio API (offline, zero external asset dependency)
function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    const now = ctx.currentTime;
    
    // Play a friendly two-tone legal alert chime (E5 -> A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now); // E5
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.00, now + 0.12); // A5
    gain2.gain.setValueAtTime(0.15, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch (e) {
    // Audio context may require user interaction first
  }
}

export const notificationService = {
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  },

  getPermission(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  },

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (e) {
      console.error('Error requesting notification permission:', e);
      return false;
    }
  },

  async notifyCaseChange(options: {
    courtName: string;
    gak: string;
    newDecision: string;
    oldDecision?: string;
    caseId: string;
  }): Promise<boolean> {
    playNotificationChime();

    const title = '⚖️ ΣΟΛΩΝ: Έκδοση / Αλλαγή Απόφασης!';
    const body = `${options.courtName} (ΓΑΚ: ${options.gak}): ${options.newDecision}`;

    if (!this.isSupported() || Notification.permission !== 'granted') {
      return false;
    }

    try {
      // Prefer ServiceWorker registration for reliable Android PWA push notifications
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          const swOptions: any = {
            body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            vibrate: [200, 100, 200, 100, 200],
            tag: `solon-case-${options.caseId}`,
            data: {
              url: window.location.href,
              caseId: options.caseId,
              timestamp: Date.now()
            }
          };
          await registration.showNotification(title, swOptions);
          return true;
        }
      }

      // Fallback to standard Notification API
      new Notification(title, {
        body,
        icon: '/icon-192.png',
      });
      return true;
    } catch (err) {
      console.error('Failed to trigger notification:', err);
      return false;
    }
  },

  async sendTestNotification(): Promise<boolean> {
    const perm = await this.requestPermission();
    if (!perm) return false;

    playNotificationChime();

    const title = '⚖️ ΣΟΛΩΝ Track: Δοκιμαστική Ειδοποίηση';
    const body = 'Οι ειδοποιήσεις λειτουργούν άριστα! Θα ενημερώνεστε αυτόματα όταν υπάρχει αλλαγή στην κατάσταση των υποθέσεών σας.';

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          const swOptions: any = {
            body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            vibrate: [200, 100, 200],
            tag: 'solon-test-notification'
          };
          await registration.showNotification(title, swOptions);
          return true;
        }
      }

      new Notification(title, {
        body,
        icon: '/icon-192.png'
      });
      return true;
    } catch (err) {
      console.error('Test notification failed:', err);
      return false;
    }
  }
};
