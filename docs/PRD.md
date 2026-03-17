# Product Requirements Document (PRD): StudyHub

## 1. Executive Summary

- **Product Vision:** To democratize access to academic resources by building the world's most engaging, community-driven repository of past university exams.
- **Problem Statement:** University students constantly struggle to find reliable past exams to practice for finals. Existing solutions are either heavily paywalled, cluttered with generic homework answers, or restricted to exclusive offline study groups (like fraternities).
- **Solution Overview:** StudyHub is a global, Reddit-style Progressive Web App (PWA) where students can seamlessly share, discover, rate, and discuss past exam PDFs. It combines academic exclusivity with social media mechanics to build a high-trust, peer-to-peer study community.
- **Target Users:** Global higher-education students seeking targeted exam preparation materials.
- **Unique Value Proposition (UVP):** A frictionless, modern UI combined with a unique hybrid authentication system (private email login + bi-annual `.edu` verification) ensuring high-quality, relevant content curated by actual students.

---

## 2. Market & Opportunity

- **Target Market:** The global higher education market, comprising hundreds of millions of active students. The initial beachhead market will be STEM and Business majors, where past exams are critical for success.
- **User Personas:**
  - _Persona 1: Sarah, The Stressed Seeker (Freshman/Sophomore)._ Sarah is anxious about her upcoming Calculus final. She doesn't have a broad network yet and needs realistic practice material quickly. She values the search function and heavily relies on the "Top Rated" filter.
  - _Persona 2: David, The Academic Contributor (Senior)._ David is a top student who has amassed a large folder of past exams. He wants to give back to the community and enjoys the social validation (Karma/Upvotes) of being recognized as a helpful contributor.
- **Competitor Analysis:**
  - _CourseHero/StuDocu:_ Highly commercialized, aggressive paywalls, cluttered interfaces.
  - _Reddit:_ Great UI/UX, but fragmented across generic subreddits. Difficult to search for specific PDFs and lacks a dedicated academic file-viewer.
- **Market Gap:** A free, purpose-built, highly organized platform solely focused on high-stakes exam preparation with a consumer-grade, modern user experience.

---

## 3. Product Scope

- **Core Features (MVP):**
  - Hybrid Auth (Private email account creation + `.edu` email verification loop).
  - PDF Upload portal with metadata tagging (Subject, Year, Professor).
  - Infinite-scroll Home Feed with sorting logic (Trending, Top Rated, Newest).
  - Social interaction layer (Upvote/Downvote, Threaded Comments).
  - Embedded PDF viewer.
  - Global search bar (Title, Description, Tags).
  - User reporting system for moderation.
- **Future Features (Phase 2+):**
  - Gamification: "Karma" points and user badges based on upvotes.
  - Rate Limiting: "Give a penny, take a penny" system (e.g., upload 1 exam to unlock 5 downloads) to drive organic growth.
  - Deep Search: OCR integration to search text _inside_ the uploaded PDFs.
- **Out-of-Scope Items:**
  - Direct user-to-user messaging.
  - Live tutoring or video streaming.
  - Monetizing or selling individual notes/exams.

---

## 4. User Experience

- **User Journey:**
  1.  **Discover:** Lands on the app via organic search or word-of-mouth.
  2.  **Verify:** Signs up with Gmail/Apple, enters `.edu` email to receive a 6-digit verification code.
  3.  **Engage:** Searches for "Intro to Microeconomics", sorts by "Top Rated", and finds a highly upvoted PDF.
  4.  **Consume:** Opens the PDF in the embedded viewer, reads the comments for context, and downloads it.
  5.  **Contribute:** Uploads their own past exam to help others.
- **Key Flows:**
  - _Verification Loop:_ Prompted every 6 months -> Input `.edu` -> System sends code -> User inputs code -> Account unlocked for another 6 months.
- **Wireframe Descriptions (Textual):**
  - _Landing Page:_ Clean white background. Bold, clean sans-serif typography (Inter). Minimalist hero text: “Share and discover past exams.” Soft purple/blue CTA buttons.
  - _Home Feed:_ Reddit-style centered feed. Cards have soft shadows, rounded corners. Left side: Up/Downvote arrows. Center: PDF icon, Title, Tags. Bottom: Uploader name, time, comment count.
  - _PDF Detail Page:_ 70/30 split. Left 70%: Large embedded PDF viewer. Right 30% (or below on mobile): Threaded comments, sticky action bar (Download, Report).

---

## 5. Functional Requirements

- **Detailed Feature Breakdown:**
  - _Auth:_ Must support standard JWT authentication. Must handle the 6-month expiration trigger for `.edu` re-verification.
  - _Feed Logic:_ "Trending" must use a time-decay algorithm (e.g., Hacker News ranking logic) balancing recent activity with upvote velocity.
  - _Search:_ Must perform partial string matching on titles and tags.
- **Edge Cases:**
  - User's university doesn't issue `.edu` emails (need a manual domain whitelist/request system).
  - User graduates and loses `.edu` access (account transitions to "Alumni Read-Only" mode).
  - PDF is corrupted or password-protected (upload validation must reject these).
- **System Behavior Rules:**
  - If a post reaches a net score of -5 (or receives 3 unique reports), it is automatically hidden from the "Trending" and "Newest" feeds pending admin review.

---

## 6. Non-Functional Requirements

- **Performance:** The feed must load in under 1.5 seconds. PDFs must be lazy-loaded in the viewer to save bandwidth.
- **Security:** PDFs must be sanitized upon upload to prevent malicious scripts. Rate limiting on the verification email endpoint to prevent spam.
- **Scalability:** The architecture must support rapid spikes in traffic during traditional mid-term and finals weeks (November/December and April/May).
- **Compliance:** Strict adherence to DMCA (Digital Millennium Copyright Act) with a clear, automated takedown request form for professors/universities. GDPR/CCPA compliant data deletion capabilities.

---

## 7. Risks & Mitigation

- **Product Risk:** _The "Empty Room" Problem._ If users search for their class and find nothing, they won't return.
  - _Mitigation:_ Seed the platform. Launch at specific target universities first, hiring student ambassadors to upload initial batches of past exams before opening the marketing floodgates.
- **Technical Risk:** _Runaway Storage Costs._ PDFs can be large.
  - _Mitigation:_ Impose a strict 15MB file size limit. Implement aggressive PDF compression on the backend during the upload process.
- **Market/Legal Risk:** _Copyright Takedowns._ Professors claiming copyright over exam materials.
  - _Mitigation:_ Build a robust, friction-free DMCA takedown process. Place the liability on the uploader via Terms of Service. Rely heavily on community reporting to flag sensitive material before it escalates.
