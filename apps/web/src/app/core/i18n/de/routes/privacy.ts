export const privacy = {
  eyebrow: 'Datenschutzinformationen',
  title: 'Datenschutzerklärung',
  summary:
    'Dieser praktische Entwurf erklärt, wie StudyHub Informationen für verifizierte Studierendenkonten, öffentliche Ressourcen, Kommentare, Stimmen, Meldungen, Cookie-Sitzungen, Dateispeicherung, E-Mail-Verifizierung und optionale KI-Vorschläge für Metadaten erhebt, nutzt, speichert und teilt. Ersetze ihn durch eine juristisch geprüfte Erklärung, sobald offizielle Betreiber-, Kontakt- und Gerichtsstandsdaten verfügbar sind.',
  lastUpdatedLabel: 'Zuletzt aktualisiert',
  lastUpdated: '28. Juni 2026',
  sections: [
    {
      heading: 'Welche Informationen StudyHub erhebt',
      paragraphs: [
        'StudyHub erhebt Informationen, die du beim Erstellen und Verwalten eines Kontos angibst, darunter vollständiger Name, Benutzername, private E-Mail, Hochschul-E-Mail, Hochschulname, Passwortdaten, Verifizierungsstatus, optionale Profildetails und optionale Einrichtungsdaten für Zwei-Faktor-Authentifizierung per Authenticator-App.',
        'StudyHub verarbeitet außerdem Inhalte und Aktivitäten aus dem Dienst, etwa hochgeladene PDFs, Titel, Beschreibungen, Tags, Kommentare, Stimmen, Meldungen, Downloadaktionen, Profiländerungen, Verifizierungs- und Passwort-Zurücksetzungscodes, Refresh-Sitzungen, Zeitstempel und grundlegende technische Informationen, die für Betrieb und Sicherheit des Dienstes nötig sind.',
      ],
      bullets: [],
    },
    {
      heading: 'Wie StudyHub Informationen verwendet',
      paragraphs: [
        'StudyHub verwendet Informationen, um Konten zu erstellen und zu verifizieren, Sitzungen zu authentifizieren, öffentliche Profile und Ressourcen anzuzeigen, Feeds und Suche zu organisieren, Uploads und Downloads zu verarbeiten, Verifizierungs- oder Passwort-Zurücksetzungs-E-Mails zu senden, optionale Sicherheitsfunktionen bereitzustellen, Meldungen zu moderieren, Missbrauch zu verhindern und den Dienst zu warten.',
        'StudyHub kann aggregierte oder betriebliche Informationen auch nutzen, um die Produktnutzung zu verstehen, Fehler zu beheben, Betrug abzuwehren und Zuverlässigkeit sowie Nutzererlebnis zu verbessern.',
      ],
      bullets: [],
    },
    {
      heading: 'Cookies, Sitzungen und lokale Einstellungen',
      paragraphs: [
        'StudyHub nutzt HttpOnly-Authentifizierungscookies für Access- und Refresh-Tokens. Diese Cookies helfen, dich angemeldet zu halten, und sollen nicht durch Browser-JavaScript gelesen werden. Das Refresh-Cookie ist auf Authentifizierungsendpunkte beschränkt.',
        'Die Web-App kann nicht sensible Einstellungen wie ausgewählte Sprache oder Theme in deinem Browser speichern, damit die Oberfläche zwischen Besuchen konsistent bleibt.',
      ],
      bullets: [],
    },
    {
      heading: 'Öffentliche Profile und Community-Sichtbarkeit',
      paragraphs: [
        'StudyHub ist eine Community-Sharing-Plattform. Daher sind manche Informationen öffentlich oder für andere angemeldete Nutzer sichtbar. Dazu können Benutzername, öffentliche Profildetails, Hochschulkontext, Metadaten hochgeladener Ressourcen, Kommentare, Bewertungen, Downloadzahlen und Beitragshistorie gehören.',
        'Einzelne Meldungen, Authentifizierungsdetails, private E-Mail-Adressen, Hochschul-E-Mail-Verifizierungscodes und Passwortdaten sind nicht zur Veröffentlichung bestimmt, auch wenn kein Onlinedienst absolute Vertraulichkeit garantieren kann.',
      ],
      bullets: [],
    },
    {
      heading: 'PDF-Speicherung, Downloads und KI-Vorschläge',
      paragraphs: [
        'Hochgeladene PDFs werden gespeichert, damit andere Nutzer sie über StudyHub ansehen oder herunterladen können. StudyHub nutzt derzeit Cloudflare-R2-kompatiblen Objektspeicher für Beitragsdateien und kann PDF-Metadaten für Vorschauen, Suche, Validierung, Moderation und Downloadbereitstellung verarbeiten.',
        'Wenn du KI-Vorschläge für Metadaten anforderst, extrahiert StudyHub lesbaren Text aus dem PDF und sendet relevanten Text an Groq, einen OpenAI-kompatiblen Anbieter, um einen Titel, eine Beschreibung und Tags vorzuschlagen. Dieser optionale Ablauf startet nur auf deine Anfrage und führt keine OCR für gescannte reine Bilddateien durch.',
      ],
      bullets: [],
    },
    {
      heading: 'Dienstleister',
      paragraphs: [
        'StudyHub stützt sich auf Dienstleister zum Betrieb des Produkts, einschließlich Datenbank- und Anwendungshosting, E-Mail-Versand für Verifizierung und Passwort-Zurücksetzung, Cloudflare-R2-kompatibler Speicherung für PDFs und Groq für optionale KI-Vorschläge für Metadaten.',
        'Dienstleister verarbeiten Informationen, um Leistungen für StudyHub zu erbringen. Lade keine sensiblen persönlichen, vertraulichen oder eingeschränkten Dokumente hoch, wenn du mit der hier beschriebenen Verarbeitung nicht einverstanden bist oder sie nicht teilen darfst.',
      ],
      bullets: [],
    },
    {
      heading: 'Aufbewahrung, Löschung und Anonymisierung',
      paragraphs: [
        'StudyHub bewahrt Konto-, Inhalts-, Sitzungs- und Moderationsinformationen so lange auf, wie es nötig ist, um den Dienst bereitzustellen, Nutzer zu schützen, Verpflichtungen einzuhalten, Streitigkeiten zu klären, Regeln durchzusetzen und Backups oder Protokolle zu pflegen.',
        'Wenn du dein Konto löschst, kann StudyHub Kontodetails anonymisieren und persönliche Profilinformationen entfernen oder de-identifizieren. Einige öffentliche Beiträge, Moderationsunterlagen, Backups, Protokolle oder Sicherheitsdaten können für begrenzte Zeit oder in de-identifizierter Form bestehen bleiben, wenn dies für Community-Integrität und Betriebsabläufe erforderlich ist.',
      ],
      bullets: [],
    },
    {
      heading: 'Sicherheit',
      paragraphs: [
        'StudyHub verwendet technische und organisatorische Schutzmaßnahmen wie Passwort-Hashing, HttpOnly-Cookies, Zugriffskontrollen, Validierung, Ratenbegrenzungen, optionale Zwei-Faktor-Authentifizierung und Monitoring, um Informationen zu schützen.',
        'Kein System ist vollkommen sicher. Du kannst helfen, indem du ein starkes Passwort verwendest, dein E-Mail-Konto schützt, Zwei-Faktor-Authentifizierung aktivierst, wenn verfügbar, und verdächtige Aktivitäten meldest.',
      ],
      bullets: [],
    },
    {
      heading: 'Deine Wahlmöglichkeiten und Kontakt',
      paragraphs: [
        'Du kannst Profilinformationen aktualisieren, Sicherheitseinstellungen ändern, Passwort-Zurücksetzungen anfordern, dein Konto löschen, soweit Produktfunktionen verfügbar sind, und selbst entscheiden, ob du optionale KI-Vorschläge für Metadaten für ein PDF anforderst.',
        'Bis ein eigener Datenschutzkontakt veröffentlicht ist, nutze verfügbare Kontakt-, Support- oder Meldewege im Produkt für Datenschutzfragen, Kontoanfragen, Inhaltsbedenken oder vermutete Sicherheitsprobleme.',
      ],
      bullets: [],
    },
    {
      heading: 'Änderungen dieser Erklärung',
      paragraphs: [
        'StudyHub kann diese Datenschutzerklärung aktualisieren, wenn sich Dienst, Anbieter, rechtliche Anforderungen oder offizielle Betreiberangaben ändern. Die aktualisierte Seite sollte das aktuelle Wirksamkeits- oder Aktualisierungsdatum zeigen.',
        'Wenn eine Änderung wesentlich beeinflusst, wie StudyHub Informationen verarbeitet, sollte das Produkt nach Möglichkeit über geeignete Kanäle angemessen informieren.',
      ],
      bullets: [],
    },
  ],
} as const;
