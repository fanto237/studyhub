import { type TranslationSchema } from '../../schema';

export const profile = {
  aiSuggestionsToday: 'KI-Vorschläge heute',
  loggedInProfile: 'Angemeldetes Profil',
  myUploads: 'Meine Uploads',
  noUploads: 'Keine Uploads',
  profileSummary: 'Profilzusammenfassung',
  profileUnavailable: 'Profil nicht verfügbar',
  quickFilters: 'Schnellfilter',
  reviewEveryResourceYouHaveSharedTrackHowClassmatesRespondAndKeepDownloadingOrVotingInteractionsInSyncWithYourProfileList: 'Überprüfe jede Ressource, die du geteilt hast, verfolge die Reaktionen deiner Kommilitoninnen und Kommilitonen und halte Download- oder Abstimmungsinteraktionen mit deiner Profilliste synchron.',
  whenYouSharePastPapersOrStudyResourcesTheyWillAppearHereAsAPaginatedListForEasyReview: 'Wenn du alte Prüfungen oder Lernmaterialien teilst, erscheinen sie hier als paginierte Liste zur einfachen Durchsicht.',
  youHaveNotUploadedAnyDocumentsYet: 'Du hast noch keine Dokumente hochgeladen.',
  youHaveReachedTheEndOfYourUploads: 'Du hast das Ende deiner Uploads erreicht.',
  yourStudyhubContributions: 'Deine StudyHub-Beiträge.',
} as const satisfies TranslationSchema['routes']['profile'];
