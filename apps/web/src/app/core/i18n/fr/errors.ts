export const errors = {
  auth: {
    logoutIncomplete: 'La déconnexion n’a pas abouti. Veuillez réessayer.',
  },
  feed: {
    load: 'Le fil StudyHub n’a pas pu être chargé. Veuillez réessayer.',
  },
  network: 'Impossible de joindre StudyHub. Vérifiez votre connexion et réessayez.',
  posts: {
    pdfDownload: 'Le téléchargement du PDF n’a pas pu être préparé. Veuillez réessayer.',
    voteSave: 'Votre vote n’a pas pu être enregistré. Veuillez réessayer.',
  },
  profile: {
    contributorNotFound: 'Ce contributeur est introuvable ou n’est plus disponible.',
    contributorUploadsLoad: 'This contributor\'s uploads could not be loaded. Please try again.',
    load: 'Votre profil n’a pas pu être chargé. Veuillez réessayer.',
    loadRefresh: 'Votre profil n’a pas pu être chargé. Actualisez la page pour réessayer.',
    publicLoad: 'Ce profil n’a pas pu être chargé. Veuillez réessayer.',
    uploadsLoad: 'Vos téléversements n’ont pas pu être chargés. Veuillez réessayer.',
  },
} as const;
