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
