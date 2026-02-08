import api from './api';

/**
 * VAPID 공개키를 Uint8Array로 변환 (applicationServerKey용)
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

/**
 * 푸시 알림 지원 여부 확인 (동기 - 기본 체크)
 */
export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * 푸시 알림 지원 여부 확인 (비동기 - SW ready 후 정확한 체크)
 * iOS standalone PWA에서는 SW가 준비된 후에만 PushManager 접근 가능
 */
export async function checkPushSupport() {
  if (!('serviceWorker' in navigator)) return false;

  try {
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, reject) => setTimeout(() => reject(new Error('SW timeout')), 5000))
    ]);
    return !!(registration && registration.pushManager);
  } catch {
    return false;
  }
}

/**
 * 현재 푸시 권한 상태
 * @returns {'default'|'granted'|'denied'|'unsupported'}
 */
export function getPushPermissionState() {
  if ('Notification' in window) return Notification.permission;
  if ('permission' in (PushManager || {})) return 'default';
  return 'unsupported';
}

/**
 * 푸시 알림 구독
 * 1. VAPID 공개키 조회
 * 2. 브라우저 알림 권한 요청
 * 3. Service Worker를 통해 Push 구독 생성
 * 4. 백엔드에 구독 정보 전송
 */
export async function subscribeToPush() {
  if (!('serviceWorker' in navigator)) {
    console.warn('[Push] ServiceWorker 미지원');
    return false;
  }

  try {
    const result = await api.getVapidPublicKey();
    const vapidPublicKey = result?.vapidPublicKey;
    if (!vapidPublicKey) {
      console.error('[Push] VAPID 키를 가져올 수 없음');
      return false;
    }

    // 알림 권한 요청 (Notification API 사용 가능 시)
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('[Push] 알림 권한 거부:', permission);
        return false;
      }
    }

    const registration = await navigator.serviceWorker.ready;

    if (!registration.pushManager) {
      console.error('[Push] PushManager를 사용할 수 없음');
      return false;
    }

    // 기존 구독이 있으면 해제 후 재구독 (VAPID 키 변경 대응)
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      await existing.unsubscribe();
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    const subJson = subscription.toJSON();
    await api.subscribeToPush({
      endpoint: subJson.endpoint,
      keys: {
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
      }
    });

    console.log('[Push] 구독 완료');
    return true;
  } catch (error) {
    console.error('[Push] 구독 실패:', error.message || error);
    return false;
  }
}

/**
 * 푸시 알림 구독 해제
 */
export async function unsubscribeFromPush() {
  if (!('serviceWorker' in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    if (!registration.pushManager) return true;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      await api.unsubscribeFromPush(endpoint);
      console.log('[Push] 구독 해제 완료');
    }
    return true;
  } catch (error) {
    console.error('[Push] 구독 해제 실패:', error);
    return false;
  }
}

/**
 * 현재 푸시 구독 존재 여부
 */
export async function isSubscribedToPush() {
  if (!('serviceWorker' in navigator)) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    if (!registration.pushManager) return false;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
}
