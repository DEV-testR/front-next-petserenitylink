export type UserInfo = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

export const defaultUserInfo: UserInfo = {
  firstName: '',
  lastName: '',
  email: '',
  role: '',
};