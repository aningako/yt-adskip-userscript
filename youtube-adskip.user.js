// ==UserScript==
// @name         YouTube Ad Cleaner (no network tampering)
// @namespace    https://github.com/aningako/yt-adskip-userscript
// @version      1.0.0
// @author       aning & cipher + Claude
// @license      MIT
// @homepageURL  https://github.com/aningako/yt-adskip-userscript
// @supportURL   https://github.com/aningako/yt-adskip-userscript/issues
// @updateURL    https://raw.githubusercontent.com/aningako/yt-adskip-userscript/main/youtube-adskip.user.js
// @downloadURL  https://raw.githubusercontent.com/aningako/yt-adskip-userscript/main/youtube-adskip.user.js
// @description  Hides YouTube ad elements and fast-skips video ads using only DOM/CSS. Does not block, modify or intercept any network request.
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @match        https://music.youtube.com/*
// @run-at       document-start
// @grant        none
// @noframes
// ==/UserScript==

/*
 * Cooked by aning & cipher + Claude
 *
 * SAFETY NOTES
 *  - No fetch/XHR/JSON.parse/WebSocket patching, no request blocking: network is untouched.
 *  - No external resources, no eval, no innerHTML (works under YouTube's Trusted Types).
 *  - Only clicks known "Skip" / "Close" ad buttons; never clicks advertiser links.
 *  - Restores your mute state and playback speed after each ad.
 */
(function () {
  'use strict';

  const CONFIG = {
    hideAdElements: true,     // CSS-hide banners, in-feed ads, promoted items
    fastForwardAds: true,     // jump to end of unskippable video ads
    muteDuringAds: true,      // mute while an ad is on screen
    dismissAdblockPopup: true,// close the "ad blockers not allowed" dialog if it appears
    debug: false,
  };

  const log = (...a) => CONFIG.debug && console.log('[YT-AdCleaner]', ...a);

  /* ---------- 1. Cosmetic hiding (pure CSS) ---------- */
  const AD_CSS_SELECTORS = [
    '#masthead-ad',
    'ytd-banner-promo-renderer',
    'ytd-statement-banner-renderer',
    'ytd-ad-slot-renderer',
    'ytd-in-feed-ad-layout-renderer',
    'ytd-display-ad-renderer',
    'ytd-promoted-sparkles-web-renderer',
    'ytd-promoted-sparkles-text-search-renderer',
    'ytd-promoted-video-renderer',
    'ytd-compact-promoted-video-renderer',
    'ytd-search-pyv-renderer',
    'ytd-video-masthead-ad-v3-renderer',
    'ytd-primetime-promo-renderer',
    'ytd-player-legacy-desktop-watch-ads-renderer',
    'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-ads"]',
    'ytd-rich-item-renderer:has(> #content > ytd-ad-slot-renderer)',
    'ytd-rich-section-renderer:has(ytd-statement-banner-renderer)',
    '#player-ads',
    '#panels > ytd-ads-engagement-panel-content-renderer',
    '.ytd-merch-shelf-renderer',
    'ytd-merch-shelf-renderer',
    '.ytp-ad-overlay-container',
    '.ytp-ad-overlay-slot',
    '.ytp-ad-image-overlay',
    '.ytp-featured-product',
    'ytm-promoted-sparkles-web-renderer',
    'ytm-companion-ad-renderer',
    'ad-slot-renderer',
  ];

  function injectCSS() {
    if (!CONFIG.hideAdElements) return;
    const style = document.createElement('style');
    style.id = 'yt-adcleaner-style';
    style.textContent = AD_CSS_SELECTORS.join(',\n') + ' { display: none !important; }';
    (document.head || document.documentElement).appendChild(style);
  }

  /* ---------- 2. Video ad handling ---------- */
  const SKIP_BUTTONS = [
    '.ytp-ad-skip-button',
    '.ytp-ad-skip-button-modern',
    '.ytp-skip-ad-button',
    '.ytp-ad-skip-button-slot button',
    'button[id^="skip-button"]',
    '.ytp-ad-overlay-close-button',
  ].join(',');

  let state = { inAd: false, wasMuted: false, prevRate: 1 };

  function getPlayer() {
    return document.querySelector('#movie_player, .html5-video-player');
  }

  function clickSkip() {
    document.querySelectorAll(SKIP_BUTTONS).forEach((btn) => {
      if (btn.offsetParent !== null) {   // only visible buttons
        btn.click();
        log('clicked', btn.className || btn.id);
      }
    });
  }

  function handleVideoAd() {
    const player = getPlayer();
    if (!player) return;
    const video = player.querySelector('video');
    const adShowing = player.classList.contains('ad-showing') ||
                      player.classList.contains('ad-interrupting');

    if (adShowing) {
      if (!state.inAd && video) {
        state = { inAd: true, wasMuted: video.muted, prevRate: video.playbackRate || 1 };
        log('ad start');
      }
      clickSkip();
      if (video) {
        if (CONFIG.muteDuringAds) video.muted = true;
        if (CONFIG.fastForwardAds) {
          const d = video.duration;
          if (Number.isFinite(d) && d > 0 && video.currentTime < d - 0.1) {
            video.currentTime = d - 0.05;
          } else {
            video.playbackRate = 16;
          }
          if (video.paused) video.play().catch(() => {});
        }
      }
    } else if (state.inAd) {
      if (video) {
        video.muted = state.wasMuted;
        video.playbackRate = state.prevRate;
      }
      state.inAd = false;
      log('ad end, restored');
    }
  }

  /* ---------- 3. Anti-adblock popup ---------- */
  function handleEnforcementPopup() {
    if (!CONFIG.dismissAdblockPopup) return;
    const msg = document.querySelector('ytd-enforcement-message-view-model');
    if (!msg) return;
    const dialog = msg.closest('tp-yt-paper-dialog');
    const dismiss = msg.querySelector('#dismiss-button button, button[aria-label*="Close" i]');
    if (dismiss) dismiss.click();
    else if (dialog) dialog.remove();
    document.querySelectorAll('tp-yt-iron-overlay-backdrop').forEach((b) => b.remove());
    const v = document.querySelector('#movie_player video');
    if (v && v.paused) v.play().catch(() => {});
    log('dismissed enforcement popup');
  }

  /* ---------- 4. Scheduler (throttled observer + fallback timer) ---------- */
  let scheduled = false;
  function tick() {
    scheduled = false;
    try {
      handleVideoAd();
      handleEnforcementPopup();
    } catch (e) {
      log('error', e);
    }
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(tick);
  }

  function start() {
    injectCSS();
    new MutationObserver(schedule).observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });
    setInterval(tick, 500); // fallback in case mutations are missed
    document.addEventListener('yt-navigate-finish', schedule);
  }

  if (document.documentElement) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });
})();
