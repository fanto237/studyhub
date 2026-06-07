import { type TranslationSchema } from '../schema';

export const shared = {
  languageSelector: {
    language: 'Language',
    selectLanguage: 'Select language',
  },
  postCard: {
    by: 'By',
    downvote: 'Downvote post',
    emptyDescription: 'No description was added for this resource.',
    openDetails: 'Open post details',
    upvote: 'Upvote post',
    viewPdf: 'View PDF',
    voteControls: 'Vote controls',
    voted: 'Voted',
  },
  themeToggle: {
    toDark: 'Switch to dark theme',
    toStudyHub: 'Switch to StudyHub theme',
  },
} as const satisfies TranslationSchema['shared'];
