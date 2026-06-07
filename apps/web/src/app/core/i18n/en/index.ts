import { type TranslationSchema } from '../schema';
import { common } from './common';
import { errors } from './errors';
import { navigation } from './navigation';
import { shared } from './shared';
import { validation } from './validation';
import { landing } from './routes/landing';
import { home } from './routes/home';
import { profileEdit } from './routes/profile-edit';
import { profile } from './routes/profile';
import { upload } from './routes/upload';
import { postDetail } from './routes/post-detail';
import { userProfile } from './routes/user-profile';
import { login } from './routes/login';
import { signup } from './routes/signup';

export const en = {
  language: {
    code: 'en',
    label: 'EN',
    locale: 'en-US',
  },
  common,
  navigation,
  validation,
  errors,
  shared,
  routes: {
    landing,
    home,
    profileEdit,
    profile,
    upload,
    postDetail,
    userProfile,
    login,
    signup,
  },
} as const satisfies TranslationSchema;
