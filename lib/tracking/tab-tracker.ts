/**
 * HPタブクリックトラッキング機能
 */

import { getOrCreateSessionId, getDeviceInfo, getStoredUTMData } from './utm-tracker'

export interface TabClickData {
  tabId: string // header, sidebar, footer, price_page, etc.
  tabLabel: string // 「予約する」「今すぐ予約」など
  tabPosition?: string // header, sidebar, footer, floating
  pageUrl: string
}

/**
 * タブクリックイベントを記録
 */
export async function trackTabClick(
  clinicId: string,
  tabData: TabClickData
): Promise<void> {
  try {
    const sessionId = getOrCreateSessionId()
    const utmData = getStoredUTMData()
    const deviceInfo = getDeviceInfo()

    const eventData = {
      session_id: sessionId,
      clinic_id: clinicId,
      tab_id: tabData.tabId,
      tab_label: tabData.tabLabel,
      tab_position: tabData.tabPosition || null,
      page_url: tabData.pageUrl,
      utm_source: utmData?.utm.utm_source || null,
      utm_medium: utmData?.utm.utm_medium || null,
      utm_campaign: utmData?.utm.utm_campaign || null,
      device_type: deviceInfo.device_type,
      os: deviceInfo.os,
      browser: deviceInfo.browser,
    }

    console.log('[TabTracker] Tracking tab click:', eventData)

    const response = await fetch('/api/tracking/tab-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    })

    if (!response.ok) {
      console.error('[TabTracker] Failed to track tab click:', await response.text())
    }

    // Google Tag Manager dataLayerにもpush（GA4連携用）
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'tab_click',
        tab_id: tabData.tabId,
        tab_label: tabData.tabLabel,
        tab_position: tabData.tabPosition,
        page_url: tabData.pageUrl,
      })
    }

    // Microsoft Clarity カスタムタグ
    if (typeof window !== 'undefined' && (window as any).clarity) {
      (window as any).clarity('set', 'clicked_tab', tabData.tabId)
    }
  } catch (error) {
    console.error('[TabTracker] Error tracking tab click:', error)
  }
}

/**
 * タブクリックトラッキング用のスクリプトを生成（HP埋め込み用）
 */
export function generateTabTrackingScript(clinicId: string): string {
  return `
<!-- D-MAX タブクリックトラッキング -->
<script>
(function() {
  // セッションID管理
  function getOrCreateSessionId() {
    let sessionId = sessionStorage.getItem('dmax_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('dmax_session_id', sessionId);
    }
    return sessionId;
  }

  // デバイス情報取得
  function getDeviceInfo() {
    const ua = navigator.userAgent;
    let device_type = 'desktop';
    if (/mobile/i.test(ua) && !/tablet|ipad/i.test(ua)) {
      device_type = 'mobile';
    } else if (/tablet|ipad/i.test(ua)) {
      device_type = 'tablet';
    }

    let os = 'unknown';
    if (/windows/i.test(ua)) os = 'Windows';
    else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
    else if (/linux/i.test(ua)) os = 'Linux';
    else if (/android/i.test(ua)) os = 'Android';
    else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';

    let browser = 'unknown';
    if (/edg/i.test(ua)) browser = 'Edge';
    else if (/chrome/i.test(ua)) browser = 'Chrome';
    else if (/safari/i.test(ua)) browser = 'Safari';
    else if (/firefox/i.test(ua)) browser = 'Firefox';

    return { device_type, os, browser };
  }

  // UTMパラメータ取得
  function getUTMParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
    };
  }

  // タブクリックイベント送信
  function trackTabClick(tabId, tabLabel, tabPosition) {
    const sessionId = getOrCreateSessionId();
    const deviceInfo = getDeviceInfo();
    const utm = getUTMParams();

    const data = {
      session_id: sessionId,
      clinic_id: '${clinicId}',
      tab_id: tabId,
      tab_label: tabLabel,
      tab_position: tabPosition,
      page_url: window.location.href,
      ...utm,
      ...deviceInfo,
    };

    // D-MAX APIに送信
    fetch('https://dmax.com/api/tracking/tab-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      keepalive: true
    }).catch(function(err) {
      console.error('Tab tracking error:', err);
    });

    // Google Tag Manager dataLayer
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'tab_click',
        tab_id: tabId,
        tab_label: tabLabel,
        tab_position: tabPosition,
      });
    }
  }

  // 全ての予約ボタンに自動でトラッキング設定
  window.addEventListener('load', function() {
    // data-dmax-tab 属性を持つ要素を全て取得
    const tabButtons = document.querySelectorAll('[data-dmax-tab]');

    tabButtons.forEach(function(button) {
      button.addEventListener('click', function(e) {
        const tabId = button.getAttribute('data-dmax-tab');
        const tabLabel = button.textContent.trim();
        const tabPosition = button.getAttribute('data-dmax-position') || 'unknown';

        trackTabClick(tabId, tabLabel, tabPosition);
      });
    });
  });

  // グローバル関数として公開（手動トラッキング用）
  window.dmaxTrackTab = trackTabClick;
})();
</script>
`.trim()
}
