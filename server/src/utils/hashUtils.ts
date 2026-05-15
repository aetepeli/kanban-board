import bcrypt from "bcrypt";

const salt_rounds = 10;

interface HashOptions {
  password: string;
}

interface VerifyOptions {
  password: string; // Kullanıcının login olurken girdiği düz şifre
  hash: string; // Veritabanından çektiğimiz şifrelenmiş (hashed) şifre
}

const hashPassword = async ({ password }: HashOptions): Promise<string> => {
  return await bcrypt.hash(password, salt_rounds);
};

// verify password
export const verifyPassword = async ({
  password,
  hash,
}: VerifyOptions): Promise<boolean> => {
  // bcrypt.compare eşleşme durumunda true, aksi halde false döner
  return await bcrypt.compare(password, hash);
};

const passwordUtils = {
  hashPassword,
  verifyPassword,
};

export default passwordUtils;
