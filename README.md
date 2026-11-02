# CODE THINK 11.3.0

Static Python learning platform: 31 tasks, grades 7–8 (19/12), Kazakh and Russian.
GitHub Pages hosts the site. Firebase Auth and Firestore store accounts/progress.
Firebase Spark remains supported; no Apps Script, Cloud Functions or paid upgrade.

## 11.2 pedagogical revision

All 31 tasks have explicit inputs, outputs, a collapsible I/O example, contextual
purpose, boundary-test suggestions, and task-specific reasoning prompts. The
recommended order respects prerequisites within each grade. Earlier-grade
knowledge is explicitly identified rather than unlocking another grade's tasks.
Examples are public learning aids, not reference solutions or the full private test set.

Existing school tasks are displayed through their stable sourceKey and the updated
bundled wording. No Firebase migration, rule publication or teacher setup is needed.
Existing attempts and grades are preserved. Runner, trace engine, flowcharts,
diagnostic content and private reference programs/test cases are unchanged.

The teacher Pedagogy tab links to `ped-idea-demo.html`, an account-free bilingual
presentation demonstration. Its arithmetic demonstration stores no learning data
and is separate from the main Python runner. Budget comparison is an optional
extension of the discount task, not a new core requirement.

Publish SITE files only. Never publish TEACHER_SETUP, CHECKS, pupil exports,
credentials or backups. See UPDATE_11_2_KK.txt in the full package.

## 11.3 pupil management

Per-row and selected-pupil archive/restore; masked password fields with eye controls;
immediate class filters with normalized Latin/Cyrillic lookalikes.
New temporary-password receipts are AES-GCM encrypted in the existing teacher-only
RegistrationJobs collection, atomically with account enrollment/reset. The key is
derived from the teacher password (PBKDF2-SHA256, 210000 iterations) and held only
in the browser session, not in Firestore. No pupil-chosen password is captured.
After a teacher-password change old receipts may need replacement.
Legacy unsaved passwords cannot be recovered. Reset gives a new login and temporary
password while retaining pupil identity, work and grades. Archive is reversible and
does not erase work or delete Firebase Authentication accounts.
Rules/config and Spark billing stay unchanged. See UPDATE_11_3_KK.txt.
