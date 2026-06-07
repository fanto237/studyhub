import { type TranslationSchema } from '../schema';

export const shared = {
  languageSelector: {
    language: 'Sprache',
    selectLanguage: 'Sprache auswählen',
  },
  postCard: {
    by: 'Von',
    downvote: 'Beitrag downvoten',
    emptyDescription: 'Für diese Ressource wurde keine Beschreibung hinzugefügt.',
    openDetails: 'Beitragsdetails öffnen',
    upvote: 'Beitrag upvoten',
    viewPdf: 'PDF ansehen',
    voteControls: 'Abstimmungssteuerung',
    voted: 'Abgestimmt',
  },
  themeToggle: {
    toDark: 'Zum dunklen Design wechseln',
    toStudyHub: 'Zum StudyHub-Design wechseln',
  },
} as const satisfies TranslationSchema['shared'];
