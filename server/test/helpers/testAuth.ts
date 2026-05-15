import tokenUtils from '../../src/utils/generateToken';
import { type User } from '@prisma/client';
import fixtures from './fixtures';

export type TestUser = {
  user: User;
  accessToken: string;
};

export const createTestUser = (override: Partial<User> = {}): TestUser => {
  const user = fixtures.user.build(override) as User;

  const accessToken = tokenUtils.generateAccessToken({ userId: user.id });

  return { user, accessToken };
};
