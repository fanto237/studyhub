import { type TranslationSchema } from '../../schema';

export const postDetail = {
  addContextForModerators: 'Add context for moderators...',
  askAQuestionShareStudyTipsOrClarifyThisPdf: 'Ask a question, share study tips, or clarify this PDF...',
  commentDeleted: 'Comment deleted.',
  commentUpdated: 'Comment updated.',
  contributor: 'Contributor',
  contributorProfile: 'Contributor profile',
  dangerZone: 'Danger zone',
  deleteThisCommentRepliesWillStayVisibleAndThisCommentWillBeShownAsDeleted: 'Delete this comment? Replies will stay visible and this comment will be shown as [deleted].',
  deleteTitle: 'Delete “{title}”?',
  discussion: 'Discussion',
  flagThisResource: 'Flag this resource',
  noCommentsYet: 'No comments yet.',
  postTags: 'Post tags',
  previewUnavailable: 'Preview unavailable.',
  repliesTo: 'Replies to @',
  replyingTo: 'Replying to',
  report: {
    reasons: {
      abusive: {
        description: 'Harassment, hate, or unsafe material.',
        label: 'Abusive content',
      },
      copyright: {
        description: 'The PDF appears to violate someone else\'s rights.',
        label: 'Copyright issue',
      },
      other: {
        description: 'Something else that moderators should review.',
        label: 'Other',
      },
      spam: {
        description: 'Promotional, misleading, or low-quality content.',
        label: 'Spam or scam',
      },
      wrongContent: {
        description: 'The title, tags, or file do not match the resource.',
        label: 'Wrong content',
      },
    },
  },
  reportsGoToModeratorsChooseTheClosestReasonAndAddDetailsWhenHelpful: 'Reports go to moderators. Choose the closest reason and add details when helpful.',
  resourceActions: 'Resource actions',
  resourceDetail: 'Resource detail',
  startTheThreadWithANoteOrQuestionAboutThisPdf: 'Start the thread with a note or question about this PDF.',
  theDiscussionCouldNotBeRefreshed: 'The discussion could not be refreshed.',
  thisPostCouldNotBeLoadedPleaseTryAgain: 'This post could not be loaded. Please try again.',
  thisPostLinkIsMissingAnId: 'This post link is missing an id.',
  thisRemovesThePdfFromStudyhubAndMakesItsDetailPageUnavailableThisActionCannotBeUndoneFromTheInterface: 'This removes the PDF from StudyHub and makes its detail page unavailable. This action cannot be undone from the interface.',
  thisReportCouldNotBeSentPleaseTryAgain: 'This report could not be sent. Please try again.',
  useOpenPdfOrDownloadToViewThisResource: 'Use Open PDF or Download to view this resource.',
  writeAReply: 'Write a reply...',
  yourCommentWasPosted: 'Your comment was posted.',
  yourReplyWasPosted: 'Your reply was posted.',
} as const satisfies TranslationSchema['routes']['postDetail'];
