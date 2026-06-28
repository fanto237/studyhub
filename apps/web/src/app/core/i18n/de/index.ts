import { type TranslationSchema } from '../schema';
import { common } from './common';
import { errors } from './errors';
import { navigation } from './navigation';
import { contact } from './routes/contact';
import { home } from './routes/home';
import { landing } from './routes/landing';
import { login } from './routes/login';
import { postDetail } from './routes/post-detail';
import { privacy } from './routes/privacy';
import { profile } from './routes/profile';
import { profileEdit } from './routes/profile-edit';
import { signup } from './routes/signup';
import { terms } from './routes/terms';
import { upload } from './routes/upload';
import { userProfile } from './routes/user-profile';
import { shared } from './shared';
import { validation } from './validation';

export const de = {
  language: {
    code: 'de',
    label: 'DE',
    locale: 'de-DE',
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
    terms,
    privacy,
    contact,
  },
} as const satisfies TranslationSchema;
