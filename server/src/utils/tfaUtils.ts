// 1. Yeni otplib API'si için Type-Safe Interface (Arayüz) tanımlıyoruz
interface ModernOtplibAPI {
  generateSecret(length?: number): string;
  verify(opts: { token: string; secret: string; window?: number }): boolean;
  generate(secret: string): string;
}

// 2. Kütüphaneyi doğrudan içe aktarıp arayüzümüze bağlıyoruz (any kullanmadan)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const otplib = require('otplib') as ModernOtplibAPI;

/**
 * 2FA (TOTP) işlemlerini yöneten yardımcı araçlar.
 */
export const tfaUtils = {
  generateSecret: (): string => {
    // Yeni versiyonda authenticator yok, fonksiyon doğrudan ana objede!
    return otplib.generateSecret();
  },

  generateURI: (options: { label: string; issuer: string; secret: string }): string => {
    // Kütüphanelerin güncellemeleriyle fonksiyon imzalarının bozulmasını engellemek için
    // Google Authenticator ve Authy'nin anladığı standart URI'yi manuel üretiyoruz. (Kurşun Geçirmez Yöntem)
    const encodedLabel = encodeURIComponent(options.label);
    const encodedIssuer = encodeURIComponent(options.issuer);
    return `otpauth://totp/${encodedIssuer}:${encodedLabel}?secret=${options.secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
  },

  verify: (options: { token: string; secret: string; window?: number }): { valid: boolean } => {
    // Doğrulama işlemi de artık doğrudan ana objede yapılıyor
    const isValid = otplib.verify({
      token: options.token,
      secret: options.secret,
      window: options.window ?? 1,
    });
    return { valid: !!isValid };
  },

  generateCode: (secret: string): string => {
    return otplib.generate(secret);
  },
};
