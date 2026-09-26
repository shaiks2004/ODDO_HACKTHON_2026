export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return '••••••••@company.com';
  }
  const [localPart, domain] = email.split('@');
  if (!localPart || localPart.length <= 1) {
    return `${localPart || 'u'}•••••@${domain}`;
  }
  const firstChar = localPart[0];
  const bulletCount = Math.min(8, Math.max(4, localPart.length - 1));
  const maskedLocal = firstChar + '•'.repeat(bulletCount);
  return `${maskedLocal}@${domain}`;
}
