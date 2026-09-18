Active media files:
- ../images/portrait.webp : couple portrait shown near the bottom of the invitation.
- ../media/bgm.mp3 : wedding background music.
- ../images/share-card.jpg : 1200 x 630 social preview used by WhatsApp and social apps.

Keep these filenames unchanged when replacing media so the page does not make a
failed request before loading a fallback.

Security note: index.html allows its inline JavaScript through a SHA-256 value in
the Content-Security-Policy meta tag. After editing anything inside the <script>
block, recalculate that hash and update script-src or the browser will block the
script by design.
