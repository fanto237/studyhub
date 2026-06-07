import { type TranslationSchema } from '../../schema';

export const profile = {
  loggedInProfile: 'Logged-in profile',
  myUploads: 'My uploads',
  noUploads: 'No uploads',
  profileSummary: 'Profile summary',
  profileUnavailable: 'Profile unavailable',
  quickFilters: 'Quick filters',
  reviewEveryResourceYouHaveSharedTrackHowClassmatesRespondAndKeepDownloadingOrVotingInteractionsInSyncWithYourProfileList: 'Review every resource you have shared, track how classmates respond, and keep downloading or voting interactions in sync with your profile list.',
  whenYouSharePastPapersOrStudyResourcesTheyWillAppearHereAsAPaginatedListForEasyReview: 'When you share past papers or study resources, they will appear here as a paginated list for easy review.',
  youHaveNotUploadedAnyDocumentsYet: 'You have not uploaded any documents yet.',
  youHaveReachedTheEndOfYourUploads: 'You have reached the end of your uploads.',
  yourStudyhubContributions: 'Your StudyHub contributions.',
} as const satisfies TranslationSchema['routes']['profile'];
