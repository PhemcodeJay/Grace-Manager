## Packages
recharts | For dashboard analytics charts (attendance trends, donation history)
date-fns | For date formatting and calendar logic
framer-motion | For smooth page transitions and UI animations
clsx | Utility for constructing className strings conditionally
tailwind-merge | Utility for merging tailwind classes efficiently

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  sans: ["var(--font-sans)"],
  display: ["var(--font-display)"],
}
Authentication uses /api/user to check session status.
File uploads not explicitly required by schema but photoUrl field exists on Member - assuming external URL or separate flow for now.
