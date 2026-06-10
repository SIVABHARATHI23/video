# VidsSave Chrome Extension

A small browser extension that sends the video on your current tab to your
VidsSave site, which then analyzes the link and shows download options.

## Install (developer mode)

1. Start your VidsSave site first: `npm run dev` (or `npm run start`) in the
   project root, so it's running at **http://localhost:3000**.
2. Open Chrome and go to `chrome://extensions`.
3. Turn on **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select this `extension/` folder.
5. The VidsSave icon appears in your toolbar. Pin it if you like.

## Use it

- **Toolbar popup:** open any video page, click the VidsSave icon, then
  **Download this video**. A new tab opens on your site with the link already
  analyzed.
- **Right-click menu:** right-click a page, link, video or image and choose
  **Download with VidsSave**.

## Point it at a different site

If your site runs on another port or a deployed URL, open the popup and change
the **VidsSave site URL** field (e.g. `http://localhost:3210` or
`https://your-domain.com`). It's saved automatically.

## Notes

- Works alongside the `?url=` support added to the site: any link opened as
  `<site>/?url=<video-link>` auto-fills the box and starts analyzing.
- No tracking, no external servers — it only opens your own VidsSave site.
- Icons (`icon16/48/128.png`) are included. To regenerate or restyle them, edit
  and run `node extension/make-icons.mjs`.
```
