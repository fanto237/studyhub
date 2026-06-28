export const contact = {
  eyebrow: 'Contact StudyHub',
  title: 'Get in touch',
  summary:
    'Questions, feedback, content concerns, account requests, or security reports can be sent directly by email. The form below opens your email app with a pre-filled message to StudyHub.',
  emailCardTitle: 'Email Lucien',
  emailCardDescription: 'Use the direct address if you prefer.',
  privacyCardTitle: 'No message is sent automatically',
  privacyCardDescription:
    'This page uses a mailto link. Your browser opens your email app, then you can review and send the message yourself.',
  form: {
    title: 'Send an email',
    help: 'Tell us what happened and include links, usernames, or resource titles when useful.',
    nameLabel: 'Your name',
    namePlaceholder: 'Jane Student',
    emailLabel: 'Reply email',
    emailPlaceholder: 'you@example.com',
    subjectLabel: 'Subject',
    subjectPlaceholder: 'How can StudyHub help?',
    messageLabel: 'Message',
    messagePlaceholder: 'Write your message here…',
    mailtoNotice:
      'Submitting opens your email app. Please press Send there to deliver the message.',
    sendButton: 'Open email app',
    mailClientOpened:
      'Your email app should be opening with the message filled in. Review it, then press Send.',
  },
  mail: {
    intro: 'Hello StudyHub,',
    name: 'Name',
    email: 'Reply email',
    sentFrom: 'Sent from the StudyHub contact page.',
    notProvided: 'Not provided',
  },
} as const;
