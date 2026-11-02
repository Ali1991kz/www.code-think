# CODE THINK 11.1.0

Static Python learning platform for grades 7–8. GitHub Pages serves these site files;
Firebase Authentication and Cloud Firestore store accounts and learning progress.
No Apps Script, Sheets, Cloud Functions, billing upgrade or administrator key is needed.

## Update an existing installation

Publish the matching `firestore.rules` in Firebase Console, then publish the updated
site files. Keep the existing project configuration, accounts and teacher approval.
Do not run setup again for an existing teacher. The 31 tasks and flowchart engine
are retained. Detailed changes are listed in `UPDATE_11_1_KK.txt` in the full archive.

The teacher can export grades and a JSON learning-data backup. Restore adds missing
records only within the same project and school; it does not recreate Firebase
Authentication accounts or passwords and does not overwrite current records.

Only the SITE files belong in the public website. Never publish TEACHER_SETUP,
CHECKS, exported backups, credentials or pupil result files.
