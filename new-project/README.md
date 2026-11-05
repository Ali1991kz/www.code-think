# CODE THINK: code-think-new copy

Open https://ali1991kz.github.io/www.code-think/new-project/ .
The original root application and its Firebase configuration are unchanged.
This entry point uses code-think-new, reuses the platform assets and gives the
copy separate Auth sessions, temporary-password vault keys, UI sessions and drafts.

Firebase Authentication Email/Password, Firestore Rules and the 7 indexes must
be configured in the new project. Setup: new-project/setup.html. Teacher rights
still require owner approval in teacherAccess/<new Auth UID> (enabled: true).

Existing pupils, passwords, learning records, grades and private teacher materials
have not been migrated. They require a separate authorized export/import.
This page explicitly labels that state. Do not treat the copy as a completed
student-data migration.
