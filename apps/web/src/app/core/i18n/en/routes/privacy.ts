export const privacy = {
  eyebrow: 'Privacy information',
  title: 'Privacy Policy',
  summary:
    'This practical draft explains how StudyHub collects, uses, stores, and shares information for verified student accounts, public resources, comments, votes, reports, cookie sessions, file storage, email verification, and optional AI metadata suggestions. Replace it with a counsel-reviewed policy when official operator, contact, and jurisdiction details are available.',
  lastUpdatedLabel: 'Last updated',
  lastUpdated: 'June 28, 2026',
  sections: [
    {
      heading: 'Information StudyHub collects',
      paragraphs: [
        'StudyHub collects information you provide when you create and manage an account, including your full name, username, private email, school email, university name, password credentials, verification status, optional profile details, and optional authenticator-app two-factor authentication setup data.',
        'StudyHub also processes content and activity generated through the service, such as uploaded PDFs, titles, descriptions, tags, comments, votes, reports, download actions, profile edits, verification and password-reset codes, refresh sessions, timestamps, and basic technical information needed to operate and secure the service.',
      ],
      bullets: [],
    },
    {
      heading: 'How StudyHub uses information',
      paragraphs: [
        'StudyHub uses information to create and verify accounts, authenticate sessions, show public profiles and resources, organize feeds and search, process uploads and downloads, send verification or password-reset emails, provide optional security features, moderate reports, prevent abuse, and maintain the service.',
        'StudyHub may also use aggregated or operational information to understand product usage, troubleshoot errors, protect against fraud, and improve reliability and user experience.',
      ],
      bullets: [],
    },
    {
      heading: 'Cookies, sessions, and local preferences',
      paragraphs: [
        'StudyHub uses HttpOnly authentication cookies for access and refresh tokens. These cookies help keep you signed in and are not intended to be read by browser JavaScript. The refresh cookie is scoped to authentication endpoints.',
        'The web app may store non-sensitive preferences such as selected language or theme in your browser so the interface stays consistent between visits.',
      ],
      bullets: [],
    },
    {
      heading: 'Public profiles and community visibility',
      paragraphs: [
        'StudyHub is a community-sharing platform, so some information is public or visible to other authenticated users. This can include your username, public profile details, university context, uploaded resource metadata, comments, scores, download counts, and contribution history.',
        'Individual reports, authentication details, private email addresses, school email verification codes, and password credentials are not intended to be public, although no online service can guarantee absolute confidentiality.',
      ],
      bullets: [],
    },
    {
      heading: 'PDF storage, downloads, and AI metadata suggestions',
      paragraphs: [
        'Uploaded PDFs are stored so other users can view or download them through StudyHub. StudyHub currently uses Cloudflare R2-compatible object storage for post files and may process PDF metadata for previews, search, validation, moderation, and download delivery.',
        'If you choose to request AI metadata suggestions, StudyHub extracts readable text from the PDF and sends relevant text to Groq, an OpenAI-compatible provider, to suggest a title, description, and tags. This optional flow runs only when you request suggestions and does not perform OCR for scanned image-only files.',
      ],
      bullets: [],
    },
    {
      heading: 'Service providers',
      paragraphs: [
        'StudyHub relies on service providers to operate the product, including database and application hosting, email delivery for verification and password reset, Cloudflare R2-compatible storage for PDFs, and Groq for optional AI metadata suggestions.',
        'Providers process information to perform services for StudyHub. Do not upload sensitive personal, confidential, or restricted documents unless you are comfortable with the processing described here and are allowed to share them.',
      ],
      bullets: [],
    },
    {
      heading: 'Retention, deletion, and anonymization',
      paragraphs: [
        'StudyHub keeps account, content, session, and moderation information for as long as needed to provide the service, protect users, comply with obligations, resolve disputes, enforce rules, and maintain backups or logs.',
        'When you delete your account, StudyHub may anonymize account details and remove or de-identify personal profile information. Some public contributions, moderation records, backups, logs, or security records may remain for a limited period or in de-identified form when needed for community integrity and service operations.',
      ],
      bullets: [],
    },
    {
      heading: 'Security',
      paragraphs: [
        'StudyHub uses technical and organizational safeguards such as password hashing, HttpOnly cookies, access controls, validation, rate limits, optional two-factor authentication, and monitoring to help protect information.',
        'No system is perfectly secure. You can help by using a strong password, keeping your email account secure, enabling two-factor authentication when available, and reporting suspicious activity.',
      ],
      bullets: [],
    },
    {
      heading: 'Your choices and contact',
      paragraphs: [
        'You can update profile information, change security settings, request password resets, delete your account where product controls are available, and decide whether to request optional AI metadata suggestions for a PDF.',
        'Until a dedicated privacy contact is published, use available in-product contact, support, or report channels for privacy questions, account requests, content concerns, or suspected security issues.',
      ],
      bullets: [],
    },
    {
      heading: 'Changes to this Policy',
      paragraphs: [
        'StudyHub may update this Privacy Policy as the service, providers, legal requirements, or official operator details change. The updated page should show the latest effective or last-updated date.',
        'If a change materially affects how StudyHub handles information, the product should provide reasonable notice through appropriate channels when practical.',
      ],
      bullets: [],
    },
  ],
} as const;
