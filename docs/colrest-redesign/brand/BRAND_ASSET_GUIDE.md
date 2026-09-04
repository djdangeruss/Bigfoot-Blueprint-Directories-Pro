# Colombian Restaurant Near Me brand assets

Date integrated: 2026-07-19
Status: production candidate

## Asset roles

- `logo-header-light.png`: transparent horizontal wordmark for light navigation.
- `logo-header-dark.png`: transparent horizontal wordmark for dark navigation.
- `logo-primary-light.png`: transparent stacked primary lockup for the light
  footer and larger brand placements.
- `logo-primary-dark.png`: transparent stacked primary lockup for the dark
  footer and larger dark-surface placements.
- `brand-avatar-256.png`: compact mobile-navigation identity.
- `favicon-32.png`, `favicon-192.png`, `favicon-512.png`, and
  `apple-touch-icon.png`: transparent-corner browser and installed-app identity
  that preserves the owner's rounded cream tile.
- `social-avatar-1080.png`: square social/profile and default share identity.

The supplied source exports are preserved unchanged under `source/`. They are
opaque RGB masters with generous canvas space. The web wordmarks are
non-destructive transparent derivatives: the original artwork, spelling,
palette, Colombian accent strokes, and location/utensil marks are preserved;
only the baked background and excess canvas were removed.

## Theme behavior

The full horizontal light/dark lockups switch with the existing theme control.
Mobile uses the square avatar so language, theme, and menu controls retain safe
touch targets. The footer switches between the owner-supplied light and dark
stacked primary lockups.

## Source authority

The original files came from the owner's Downloads folder and remain the
creative masters. Production derivatives live in
`artifacts/directory-master/public/brand/`. Do not regenerate or recolor them
without owner approval; future vector or native-transparent masters should
supersede these raster derivatives through the same visual and recovery gates.
