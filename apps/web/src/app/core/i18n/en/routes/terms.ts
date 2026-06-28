export const terms = {
  eyebrow: 'Legal information',
  title: 'Terms of Service',
  summary:
    'These Terms are a practical product draft for using StudyHub, a student-focused platform for sharing study resources. They explain expected conduct, uploaded content rules, public visibility, AI metadata suggestions, and account responsibilities. Replace this draft with counsel-reviewed terms when official operator, contact, and jurisdiction details are available.',
  lastUpdatedLabel: 'Last updated',
  lastUpdated: 'June 28, 2026',
  sections: [
    {
      heading: 'Acceptance of these Terms',
      paragraphs: [
        'By creating an account, browsing public pages, uploading files, commenting, voting, reporting content, downloading resources, or otherwise using StudyHub, you agree to these Terms.',
        'If you do not agree, do not use the service. StudyHub may update these Terms as the product, operator details, contact channels, or legal requirements evolve.',
      ],
      bullets: [],
    },
    {
      heading: 'Student eligibility and account responsibility',
      paragraphs: [
        'StudyHub is designed for students and study communities. You must provide accurate account information, keep your credentials secure, and verify your school email when requested.',
        'You are responsible for activity from your account, including uploads, comments, votes, reports, downloads, profile edits, and optional two-factor authentication settings.',
      ],
      bullets: [
        'Use your own account and do not impersonate another person or institution.',
        'Keep your password private and consider enabling authenticator-app two-factor authentication when available.',
        'Tell StudyHub through available support or report channels if you believe your account has been misused.',
      ],
    },
    {
      heading: 'User content and upload permissions',
      paragraphs: [
        'You keep ownership of content you submit, such as PDF resources, titles, descriptions, tags, profile information, comments, votes, and reports. You grant StudyHub a non-exclusive, worldwide, royalty-free permission to host, store, reproduce, display, distribute, process, moderate, back up, and make that content available as needed to operate the service.',
        'Only upload material that you created, are allowed to share, or can lawfully make available to classmates. Do not upload copyrighted works, confidential materials, answer keys, exam papers, or institutional content when sharing is not permitted.',
      ],
      bullets: [
        'Public posts, comments, profile details, scores, and download counts may be visible to other users.',
        'StudyHub may generate previews, search metadata, and download links for uploaded PDFs.',
        'You are responsible for checking that your upload does not violate copyright, academic rules, privacy rights, or institutional policies.',
      ],
    },
    {
      heading: 'Academic integrity and prohibited conduct',
      paragraphs: [
        'StudyHub is for legitimate study support, not cheating or academic misconduct. Use resources responsibly and follow your school policies, course rules, and exam instructions.',
        'You may not misuse the service, interfere with its security, or harm other users.',
      ],
      bullets: [
        'Do not upload current restricted exams, confidential solutions, malware, spam, harassment, hate content, sexually explicit content, or unlawful material.',
        'Do not scrape the service, bypass access controls, abuse authentication flows, sell accounts, manipulate votes, or submit false reports.',
        'Do not use StudyHub to coordinate plagiarism, unauthorized collaboration, or other violations of academic integrity rules.',
      ],
    },
    {
      heading: 'Moderation, reports, and takedowns',
      paragraphs: [
        'StudyHub may review, hide, edit metadata for, remove, or restrict access to content or accounts when content appears harmful, unlawful, infringing, misleading, low quality, or inconsistent with these Terms.',
        'Users can report resources and comments through available product channels. StudyHub will decide what action is appropriate, but cannot promise immediate review or a particular outcome.',
      ],
      bullets: [],
    },
    {
      heading: 'AI metadata suggestions',
      paragraphs: [
        'When you request metadata suggestions for a PDF, StudyHub extracts readable text from the file and sends relevant text to an OpenAI-compatible provider, currently Groq, to suggest a title, description, and tags. This feature is optional and does not create a post by itself.',
        'AI suggestions can be incomplete, inaccurate, or unsuitable. You must review and edit suggestions before publishing and you remain responsible for the final metadata and upload.',
      ],
      bullets: [],
    },
    {
      heading: 'Downloads, study use, and no academic guarantee',
      paragraphs: [
        'Resources on StudyHub are user-submitted. StudyHub does not guarantee that any PDF, description, comment, score, tag, answer, or download is accurate, complete, safe, current, or approved by an instructor or institution.',
        'Use downloaded materials as study aids only. Verify important information independently before relying on it for coursework, exams, or decisions.',
      ],
      bullets: [],
    },
    {
      heading: 'Account deletion, suspension, and termination',
      paragraphs: [
        'You may request or use available product controls to delete your account. Deletion may anonymize account details and some community contributions may remain in de-identified form when needed to preserve discussions, moderation records, or service integrity.',
        'StudyHub may suspend or terminate access, remove content, revoke sessions, or limit features if your account appears to violate these Terms, creates risk, or is required by law or platform operations.',
      ],
      bullets: [],
    },
    {
      heading: 'Disclaimers and limits of responsibility',
      paragraphs: [
        'StudyHub is provided on an “as is” and “as available” basis. The service may change, experience errors, lose availability, or remove features, and StudyHub does not promise uninterrupted or error-free operation.',
        'To the fullest extent permitted by applicable law, StudyHub is not responsible for indirect, incidental, special, consequential, or punitive damages, lost data, academic outcomes, or disputes arising from user content or use of the service.',
      ],
      bullets: [],
    },
    {
      heading: 'Changes and contact',
      paragraphs: [
        'StudyHub may revise these Terms as the service matures. Continued use after updates means you accept the updated Terms. If official operator, contact, or governing-law details become available, this page should be updated to include them.',
        'Until a dedicated legal contact is published, use available in-product contact, support, or report channels for questions, safety concerns, account requests, or content issues.',
      ],
      bullets: [],
    },
  ],
} as const;
