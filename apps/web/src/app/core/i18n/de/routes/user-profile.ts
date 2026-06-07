import { type TranslationSchema } from '../../schema';

export const userProfile = {
  contributorSummary: 'Zusammenfassung der mitwirkenden Person',
  noPublicUploadsFound: 'Keine öffentlichen Uploads gefunden.',
  publicUploads: 'Öffentliche Uploads',
  reviewThisContributorsVisibleStudyhubMaterialsTrustSignalsAndCommunityFeedbackWithoutExposingPrivateAccountDetails: 'Sieh dir die sichtbaren StudyHub-Materialien, Vertrauenssignale und Community-Rückmeldungen dieser Person an, ohne private Kontodaten offenzulegen.',
  studyhubOnlyShowsContributorActivityAndPublicTrustSignalsHere: 'StudyHub zeigt hier nur Aktivitäten der mitwirkenden Person und öffentliche Vertrauenssignale.',
  tagsWillAppearAfterThisContributorsUploadsLoad: 'Tags erscheinen, sobald die Uploads dieser Person geladen wurden.',
  theseTotalsAreForTheLoadedUploadListNotPrivateAccountData: 'Diese Summen beziehen sich auf die geladene Upload-Liste, nicht auf private Kontodaten.',
  thisProfileLinkIsMissingAUserId: 'Diesem Profillink fehlt eine Benutzer-ID.',
} as const satisfies TranslationSchema['routes']['userProfile'];
