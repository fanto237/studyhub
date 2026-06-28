export const contact = {
  eyebrow: 'Contacter StudyHub',
  title: 'Entrer en contact',
  summary:
    'Questions, retours, problèmes de contenu, demandes liées au compte ou signalements de sécurité peuvent être envoyés directement par e-mail. Le formulaire ci-dessous ouvre votre application mail avec un message prérempli pour StudyHub.',
  emailCardTitle: 'Envoyer un e-mail à Lucien',
  emailCardDescription: 'Utilisez l’adresse directe si vous préférez.',
  privacyCardTitle: 'Aucun message n’est envoyé automatiquement',
  privacyCardDescription:
    'Cette page utilise un lien mailto. Votre navigateur ouvre votre application mail, puis vous pouvez relire et envoyer le message vous-même.',
  form: {
    title: 'Envoyer un e-mail',
    help: 'Expliquez ce qui s’est passé et ajoutez des liens, noms d’utilisateur ou titres de ressources lorsque c’est utile.',
    nameLabel: 'Votre nom',
    namePlaceholder: 'Jeanne Étudiante',
    emailLabel: 'E-mail de réponse',
    emailPlaceholder: 'vous@exemple.com',
    subjectLabel: 'Objet',
    subjectPlaceholder: 'Comment StudyHub peut-il aider ?',
    messageLabel: 'Message',
    messagePlaceholder: 'Écrivez votre message ici…',
    mailtoNotice:
      'L’envoi ouvre votre application mail. Veuillez ensuite appuyer sur Envoyer dans cette application pour transmettre le message.',
    sendButton: 'Ouvrir l’application mail',
    mailClientOpened:
      'Votre application mail devrait s’ouvrir avec le message prérempli. Relisez-le, puis appuyez sur Envoyer.',
  },
  mail: {
    intro: 'Bonjour StudyHub,',
    name: 'Nom',
    email: 'E-mail de réponse',
    sentFrom: 'Envoyé depuis la page de contact StudyHub.',
    notProvided: 'Non renseigné',
  },
} as const;
