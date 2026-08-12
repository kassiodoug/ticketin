export const formatVerificationCode = (code: string, sep: string) => {
  if (!code) return code;

  return code.replace(/^(.{3})(.{3})(.{3})$/, `$1${sep}$2${sep}$3`);
};
