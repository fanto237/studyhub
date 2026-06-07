import { type TranslationSchema } from '../../schema';

export const postDetail = {
  addContextForModerators: 'Füge Kontext für Moderatorinnen und Moderatoren hinzu…',
  askAQuestionShareStudyTipsOrClarifyThisPdf: 'Stelle eine Frage, teile Lerntipps oder kläre diese PDF…',
  commentDeleted: 'Kommentar gelöscht.',
  commentUpdated: 'Kommentar aktualisiert.',
  contributor: 'Mitwirkende Person',
  contributorProfile: 'Mitwirkendenprofil',
  dangerZone: 'Gefahrenbereich',
  deleteThisCommentRepliesWillStayVisibleAndThisCommentWillBeShownAsDeleted: 'Diesen Kommentar löschen? Antworten bleiben sichtbar und dieser Kommentar wird als [deleted] angezeigt.',
  deleteTitle: '„{title}“ löschen?',
  discussion: 'Diskussion',
  flagThisResource: 'Diese Ressource melden',
  noCommentsYet: 'Noch keine Kommentare.',
  postTags: 'Beitrags-Tags',
  previewUnavailable: 'Vorschau nicht verfügbar.',
  repliesTo: 'Antworten an @',
  replyingTo: 'Antwort an',
  report: {
    reasons: {
      abusive: {
        description: 'Belästigung, Hass oder unsichere Inhalte.',
        label: 'Missbräuchlicher Inhalt',
      },
      copyright: {
        description: 'Die PDF scheint Rechte Dritter zu verletzen.',
        label: 'Urheberrechtsproblem',
      },
      other: {
        description: 'Etwas anderes, das Moderatorinnen und Moderatoren prüfen sollten.',
        label: 'Sonstiges',
      },
      spam: {
        description: 'Werbliche, irreführende oder minderwertige Inhalte.',
        label: 'Spam oder Betrug',
      },
      wrongContent: {
        description: 'Titel, Tags oder Datei passen nicht zur Ressource.',
        label: 'Falscher Inhalt',
      },
    },
  },
  reportsGoToModeratorsChooseTheClosestReasonAndAddDetailsWhenHelpful: 'Meldungen gehen an Moderatorinnen und Moderatoren. Wähle den passendsten Grund und füge bei Bedarf Details hinzu.',
  resourceActions: 'Ressourcenaktionen',
  resourceDetail: 'Ressourcendetail',
  startTheThreadWithANoteOrQuestionAboutThisPdf: 'Starte die Diskussion mit einem Hinweis oder einer Frage zu dieser PDF.',
  theDiscussionCouldNotBeRefreshed: 'Die Diskussion konnte nicht aktualisiert werden.',
  thisPostCouldNotBeLoadedPleaseTryAgain: 'Dieser Beitrag konnte nicht geladen werden. Bitte versuche es erneut.',
  thisPostLinkIsMissingAnId: 'Diesem Beitragslink fehlt eine ID.',
  thisRemovesThePdfFromStudyhubAndMakesItsDetailPageUnavailableThisActionCannotBeUndoneFromTheInterface: 'Dadurch wird die PDF aus StudyHub entfernt und ihre Detailseite ist nicht mehr verfügbar. Diese Aktion kann über die Oberfläche nicht rückgängig gemacht werden.',
  thisReportCouldNotBeSentPleaseTryAgain: 'Diese Meldung konnte nicht gesendet werden. Bitte versuche es erneut.',
  useOpenPdfOrDownloadToViewThisResource: 'Verwende „PDF öffnen“ oder „Herunterladen“, um diese Ressource anzusehen.',
  writeAReply: 'Antwort schreiben…',
  yourCommentWasPosted: 'Dein Kommentar wurde gepostet.',
  yourReplyWasPosted: 'Deine Antwort wurde gepostet.',
} as const satisfies TranslationSchema['routes']['postDetail'];
