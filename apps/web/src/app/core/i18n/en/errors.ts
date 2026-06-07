import { type TranslationSchema } from '../schema';

export const errors = {
  auth: {
    logoutIncomplete: 'Logout was not completed. Please try again.',
  },
  feed: {
    load: 'The StudyHub feed could not be loaded. Please try again.',
  },
  network: 'Could not reach StudyHub. Check your connection and try again.',
  posts: {
    pdfDownload: 'The PDF download could not be prepared. Please try again.',
    voteSave: 'Your vote could not be saved. Please try again.',
  },
  profile: {
    contributorNotFound: 'This contributor was not found or is no longer available.',
    contributorUploadsLoad: 'This contributor\'s uploads could not be loaded. Please try again.',
    load: 'Your profile could not be loaded. Please try again.',
    loadRefresh: 'Your profile could not be loaded. Refresh the page to try again.',
    publicLoad: 'This profile could not be loaded. Please try again.',
    uploadsLoad: 'Your uploads could not be loaded. Please try again.',
  },
} as const satisfies TranslationSchema['errors'];
