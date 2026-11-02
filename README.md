# CODE THINK 11.6.0

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
Legacy unsaved passwords cannot be recovered. Since 11.4, reset keeps the visible login and issues only a new temporary
password while retaining pupil identity, work and grades. Archive is reversible and
does not erase work or delete Firebase Authentication accounts.
Spark billing stays unchanged. See UPDATE_11_4_KK.txt.


## 11.4 stable pupil logins

Deploy the matching firestore.rules before the new client. In Firebase Console,
the project owner must set platformConfig/auth.directoryOwnerUid to the existing
site-owner teacher UID. This is an IAM-only configuration; clients cannot appoint
themselves. The configured teacher can reset their own pupils. Other approved
teachers cannot claim or overwrite the site's login directory.

Reset rotates the internal Firebase Auth account while keeping Users.login stable.
The atomic commit updates the private profile, opaque login route, identity binding,
and encrypted temporary receipt together. The public, non-listable lookup stores
only an opaque Auth alias and random tenant/pupil IDs, with SHA-256 document keys.
It never stores passwords, names or learning records. Existing legacy accounts keep
working without migration; their route is created on their first reset.

Use the same visible login for sign-in and password changes. Old credentials and
old sessions no longer access data. Existing identities cannot be reassigned across
tenants. This does not retroactively rename logins changed by older releases.


## 11.5 private pupil profile

Avatar, personal/weekly goals, current-class progress, reviewed feedback, derived XP and five achievement criteria. No writable XP counter and no leaderboard. Each source task, correction and transfer phase is deduplicated; teacher assessment controls rewards. Language/theme stay device-local.

Pupils may change their own login after password reauthentication (once per 24 hours) or change their own password. Native Auth reserves the new username; a private one-time LoginHandoffs record permits only the same pupil to complete an atomic identity rebind. Interrupted final commits can resume on new-login sign-in. Teacher password reset continues preserving the visible login. No pupil-chosen password is persisted. Deploy this release firestore.rules together with SITE files. See UPDATE_11_5_KK.txt.


## 11.6 teacher desk

Private teacher profile, accurate pending queue (including corrections), side-by-side review, independent Python trial input, human-selected five-stage rubric, feedback templates, correction comparison and saved-run timeline. Class thinking map separates saved/empty stages from teacher-reviewed scores. Descriptive common difficulties use the latest reviewed stage per pupil; correction totals do not replace stage scores.

Archived pupils can be permanently purged from the platform after explicit DELETE confirmation. An irreversible non-personal marker immediately revokes access, blocks resurrection and supports resumable batched cleanup of owned learning/profile/credential/identity/route/handoff documents. Firebase Authentication records are retained; the UI and UPDATE_11_6_KK.txt explain separate Console cleanup. No production pupil purge is executed by deployment.

Public institutional name and author contacts were supplied by the author. QR is a locally generated SVG with the public site URL. Deploy this release Rules together with SITE files.
