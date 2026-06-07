import { type TranslationSchema } from '../schema';

export const errors = {
  auth: {
    logoutIncomplete: 'Die Abmeldung wurde nicht abgeschlossen. Bitte versuche es erneut.',
  },
  feed: {
    load: 'Der StudyHub-Feed konnte nicht geladen werden. Bitte versuche es erneut.',
  },
  network: 'StudyHub ist nicht erreichbar. Prüfe deine Verbindung und versuche es erneut.',
  posts: {
    pdfDownload: 'Der PDF-Download konnte nicht vorbereitet werden. Bitte versuche es erneut.',
    voteSave: 'Deine Stimme konnte nicht gespeichert werden. Bitte versuche es erneut.',
  },
  profile: {
    contributorNotFound: 'Diese mitwirkende Person wurde nicht gefunden oder ist nicht mehr verfügbar.',
    contributorUploadsLoad: 'Die Uploads dieser Person konnten nicht geladen werden. Bitte versuche es erneut.',
    load: 'Dein Profil konnte nicht geladen werden. Bitte versuche es erneut.',
    loadRefresh: 'Dein Profil konnte nicht geladen werden. Aktualisiere die Seite, um es erneut zu versuchen.',
    publicLoad: 'Dieses Profil konnte nicht geladen werden. Bitte versuche es erneut.',
    uploadsLoad: 'Deine Uploads konnten nicht geladen werden. Bitte versuche es erneut.',
  },
} as const satisfies TranslationSchema['errors'];
