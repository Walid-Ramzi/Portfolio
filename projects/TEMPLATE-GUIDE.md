# Project page template — quick guide

`project-detail-template.html` is written for pages that live in
`projects/project_details/<category>/` (assets use `../../../`). Copy it there first;
opened in place it will look unstyled, and it is marked `noindex`.

1. **Copy** to `projects/project_details/classic_control/my-project.html` (or `PLC_CONTROL/`).
2. **Keys / titles**: search for `myProject` and replace with e.g. `classicProject.my-project`.
   Add those keys to `js/i18n/en.json`, `fr.json`, `ar.json` (same shape as an existing project).
   Until a key exists the English text in the HTML is shown. Page `<title>` also uses the `.title` key.
3. **Images**: put the file in `assets/projects/<slug>/` and replace the placeholder `<div>` in the
   "Control Circuit" figure with the `<a><img></a>` shown in the comment (wide drawings scroll sideways on phones).
4. **Video**: replace `PROJECT_VIDEO_ID` with the YouTube ID (keep the `.video-frame` wrapper), or delete the block.
5. **Category link**: the back button and breadcrumb point to `../../classic-control.html`;
   for a PLC project use `../../plc-control.html` and the matching translation key.
6. **Listing**: copy a `<article class="project-card category-card">` in `classic-control.html` /
   `plc-control.html`, point its link at the new page, and add the URL to `sitemap.xml`.
   Remove a placeholder card on `plc-control.html` when you add a real one.

Translation snippet (inside `classicProject`):
```json
"my-project": { "title": "...", "eyebrow": "...", "tag1": "...", "tag2": "...", "overview": "...",
  "explain": "...", "diagram": "...", "comp1": "...", "comp2": "...", "videoNote": "...", "note": "..." }
```
