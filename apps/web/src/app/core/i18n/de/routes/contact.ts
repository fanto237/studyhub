export const contact = {
  eyebrow: 'StudyHub kontaktieren',
  title: 'Kontakt aufnehmen',
  summary:
    'Fragen, Feedback, Inhaltsprobleme, Kontoanfragen oder Sicherheitsmeldungen können direkt per E-Mail gesendet werden. Das Formular unten öffnet deine E-Mail-App mit einer vorformulierten Nachricht an StudyHub.',
  emailCardTitle: 'Lucien per E-Mail kontaktieren',
  emailCardDescription: 'Nutze die direkte Adresse, wenn sie möchten.',
  privacyCardTitle: 'Keine Nachricht wird automatisch gesendet',
  privacyCardDescription:
    'Diese Seite nutzt einen mailto-Link. Dein Browser öffnet deine E-Mail-App, danach kannst du die Nachricht selbst prüfen und senden.',
  form: {
    title: 'E-Mail senden',
    help: 'Beschreibe, was passiert ist, und füge bei Bedarf Links, Benutzernamen oder Ressourcentitel hinzu.',
    nameLabel: 'Dein Name',
    namePlaceholder: 'Max Student',
    emailLabel: 'Antwort-E-Mail',
    emailPlaceholder: 'du@example.com',
    subjectLabel: 'Betreff',
    subjectPlaceholder: 'Wie kann StudyHub helfen?',
    messageLabel: 'Nachricht',
    messagePlaceholder: 'Schreibe deine Nachricht hier…',
    mailtoNotice:
      'Beim Absenden wird deine E-Mail-App geöffnet. Bitte klicke dort auf Senden, damit die Nachricht zugestellt wird.',
    sendButton: 'E-Mail-App öffnen',
    mailClientOpened:
      'Deine E-Mail-App sollte sich mit der ausgefüllten Nachricht öffnen. Prüfe sie und klicke dann auf Senden.',
  },
  mail: {
    intro: 'Hallo StudyHub,',
    name: 'Name',
    email: 'Antwort-E-Mail',
    sentFrom: 'Gesendet von der StudyHub-Kontaktseite.',
    notProvided: 'Nicht angegeben',
  },
} as const;
