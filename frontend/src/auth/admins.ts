const ADMIN_EMAILS = new Set([
  'werkhardor@gmail.com',
])

export function isAdminEmail(email?: string | null) {
  return Boolean(email && ADMIN_EMAILS.has(email.trim().toLowerCase()))
}
