import { randomBytes, scrypt } from 'crypto';


  
export const comparePasswords = async (password: string, storedPassword: string) => {
  const [hashed, salt] = storedPassword.split('.');

  return new Promise((resolve, reject) => {
    scrypt(password, salt, 32, (err, key) => {
      if (err) {
        reject(err);
      }

      resolve(key.toString('hex') === hashed);
    });
  });
};

export const saltAndHash = (password: string): Promise<[string, string]> => {
  const salt = randomBytes(4).toString('hex');

  return new Promise((resolve, reject) => {
    scrypt(password, salt, 32, (err, key) => {
      if (err) {
        reject(err);
      }

      resolve([key.toString('hex'), salt]);
    });
  });
};
