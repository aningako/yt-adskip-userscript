# YouTube Ad Cleaner

A lightweight userscript that hides YouTube ad elements and fast-skips video ads using only DOM and CSS. It does **not** block, modify or intercept any network request.

> Cooked by **aning** & **cipher** + **Claude**

---

## Features

- **Hides ad elements**: banners, masthead ads, in-feed ads, promoted videos, merch shelves, overlay ads and ad side panels.
- **Fast-skips video ads**: clicks the "Skip" button as soon as it appears and jumps to the end of unskippable ads.
- **Mutes during ads**: mutes while an ad plays, then restores your previous volume state.
- **Restores playback speed**: puts back the speed you were using once the ad ends.
- **Closes the "ad blockers not allowed" popup** if it appears, and resumes the video.
- **Works on** `www.youtube.com`, `m.youtube.com` and `music.youtube.com`.

## Safety

- No fetch, XHR, `JSON.parse` or WebSocket patching. Network traffic is untouched.
- No external resources, no `eval`, no `innerHTML` (compatible with YouTube's Trusted Types).
- Only clicks known "Skip" / "Close" ad buttons. It never clicks advertiser links.
- `@grant none`: the script asks for no special userscript permissions.

---

## Installation

### 1. Install a userscript manager

Pick one for your browser:

| Browser | Extension |
| --- | --- |
| Chrome / Edge / Brave / Opera | [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/) |
| Firefox | [Violentmonkey](https://violentmonkey.github.io/) or [Tampermonkey](https://www.tampermonkey.net/) |
| Safari | [Userscripts](https://apps.apple.com/app/userscripts/id1463298887) or Tampermonkey |

> **Chrome / Edge users:** for Manifest V3 versions of Tampermonkey, you may need to turn on **Developer mode** on the `chrome://extensions` page (or allow user scripts in the extension's details) before scripts will run.

### 2. Install the script

**Option A: one click**

1. Click here: **[Install youtube-adskip.user.js](https://raw.githubusercontent.com/aningako/yt-adskip-userscript/main/youtube-adskip.user.js)**
2. Your userscript manager will open an install page. Click **Install**.

**Option B: manual**

1. Open your userscript manager's dashboard and choose **Create a new script**.
2. Delete the template code.
3. Paste the full contents of `youtube-adskip.user.js`.
4. Save (`Ctrl + S`).

### 3. Reload YouTube

Refresh any open YouTube tabs. The script is now active.

---

## Configuration

You can turn features on or off by editing the `CONFIG` block near the top of the script:

```js
const CONFIG = {
  hideAdElements: true,      // CSS-hide banners, in-feed ads, promoted items
  fastForwardAds: true,      // jump to end of unskippable video ads
  muteDuringAds: true,       // mute while an ad is on screen
  dismissAdblockPopup: true, // close the "ad blockers not allowed" dialog
  debug: false,              // log activity to the browser console
};
```

Set any option to `false` to disable it, then save and reload YouTube.

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Nothing happens | Check that the script is **enabled** in your userscript manager and that the manager itself is on for youtube.com. On Chrome/Edge, make sure Developer mode / user scripts are allowed. |
| Some ads still show | YouTube changes its page layout often. Set `debug: true`, open DevTools (`F12`) → Console, and look for `[YT-AdCleaner]` messages. Open an issue with what you see. |
| Video stays muted after an ad | Unmute once manually. The script restores whatever mute state you had when the ad started. |
| Conflicts with another ad blocker | Try disabling one of them. Running two ad tools at once can cause odd behavior. |

---

## How it works

1. **CSS hiding**: injects one `<style>` tag that sets known ad containers to `display: none`.
2. **Video ad detection**: watches the player for the `ad-showing` / `ad-interrupting` classes.
3. **Skip / fast-forward**: clicks a visible Skip button if there is one. Otherwise it seeks to the end of the ad, or plays it at 16× speed if the length isn't known yet.
4. **Restore**: when the ad ends, it puts your mute state and playback speed back.
5. **Scheduler**: a throttled `MutationObserver`, a 500 ms fallback timer and YouTube's `yt-navigate-finish` event keep it working as you move between videos.

---

## Disclaimer

This project is for personal and educational use. Use it at your own risk and in line with YouTube's Terms of Service. Consider supporting your favorite creators through YouTube Premium, memberships or other direct means.

## Credits

Cooked by **aning** & **cipher** + **Claude**
