import { type TranslationSchema } from '../../schema';

export const userProfile = {
  contributorSummary: 'Contributor summary',
  noPublicUploadsFound: 'No public uploads found.',
  publicUploads: 'Public uploads',
  reviewThisContributorsVisibleStudyhubMaterialsTrustSignalsAndCommunityFeedbackWithoutExposingPrivateAccountDetails: 'Review this contributor\'s visible StudyHub materials, trust signals, and community feedback without exposing private account details.',
  studyhubOnlyShowsContributorActivityAndPublicTrustSignalsHere: 'StudyHub only shows contributor activity and public trust signals here.',
  tagsWillAppearAfterThisContributorsUploadsLoad: 'Tags will appear after this contributor\'s uploads load.',
  theseTotalsAreForTheLoadedUploadListNotPrivateAccountData: 'These totals are for the loaded upload list, not private account data.',
  thisProfileLinkIsMissingAUserId: 'This profile link is missing a user id.',
} as const satisfies TranslationSchema['routes']['userProfile'];
