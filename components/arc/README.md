# Arc Select

Official Free MIT source: https://uiarc.dev/r/select.json, fetched 2026-10-25.
Installed manually per https://uiarc.dev/components/select/markdown. Required dependencies: @radix-ui/react-select, motion, lucide-react. Official motion tokens retained. Local CSS token bridge and Task form adapter are documented in preview/murmura/HELP_SELECT_ACCEPTANCE.md. Keep LICENSE.

# Arc File Upload

Official Free MIT source: https://uiarc.dev/r/file-upload.json, fetched 2026-10-25.
Manual install per https://uiarc.dev/components/blocks/file-upload/markdown.
Compared with https://uiarc.dev/components/file-dropzone/markdown; selected File Upload for controlled value/onChange, disabled, transfer progress/cancellation/retry.
Dependencies `motion` and `lucide-react` already installed. Original TSX/CSS unchanged; Task theme bridge, validation, bounded queue and signed private upload live in `features/media-library/components/upload.*`. Keep LICENSE.

Source SHA-256:
- file-upload.tsx: `568d3932d11ee7bf261545e8d4f1cf7e4b0a2fc40f974d3baf381d1df28954a3`
- file-upload.module.css: `3a4ef30a0872ce36c9d0ed5cc792cdeb96349594d1a43b8f67fdd456f4c57153`

Official props used: `label`, `description`, `accept`, `multiple`, `maxSize`, `disabled`, `onUpload(file,{signal,onProgress})`. The block uses its own uncontrolled selection; no invented upload prop or fake timer. Value/onChange remain available if the host later needs controlled selection.
Keyboard/accessibility: Enter/Space open native chooser; helper description and polite status announcements retained; per-file remove/retry buttons have filename labels; removal restores focus and aborts the actual transfer; reduced-motion behavior preserved.

# Arc Toast and Toast Stack

Manual installation from the official free registry on 2026-10-25:
- https://uiarc.dev/components/toast/markdown and https://uiarc.dev/r/toast.json
- https://uiarc.dev/components/toast-stack/markdown and https://uiarc.dev/r/toast-stack.json

The documentation recommends Toast Stack for an app-wide queue. Both components are installed; the application mounts one ToastStackProvider and ToastStack. Existing `motion` and `lucide-react` versions are reused without a new notification dependency. Keep the MIT LICENSE in this folder.

Toast TSX/CSS and Stack CSS are unchanged. Stack TSX only translates its close-button label and screen-reader type labels to Chinese; animation, pause/resume timers, hidden/leaving inertness, focus handoff, Alt+T, Tab, Escape, pointer handling and reduced motion remain official source. The host adapter lives in `components/feedback/`; it maps theme tokens and preserves inline field errors/ongoing connection statuses. It does not change Clerk, permissions, Slack or business actions.

Official registry source SHA-256 before localization:
- registry/components/toast/toast.tsx: `cc68a59e0db6f1f1a0c1b8ec6aaa7638c08be7e13367b370f8d3f44accddba7f`
- registry/components/toast/toast.module.css: `7c971d71804b5d4b10c876a08d8a5b3caa0ef19aa7d94d0ccfdb9e291d02fa1c`
- registry/components/toast-stack/toast-stack.tsx: `ba422f5d6e330c49b9f2a110af7cf91e46e20697490ef7f103909e982adde49a`
- registry/components/toast-stack/toast-stack.module.css: `68ea14b271d2af559f90dd2e972b20591092b1dff9ef5e6a408f6082c015379a`
