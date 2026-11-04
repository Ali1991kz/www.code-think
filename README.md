# CODE THINK 12.1.0

Static Python learning platform: 31 tasks, grades 7–8 (19/12), Kazakh and Russian.
GitHub Pages hosts the site. Firebase Auth and Firestore store accounts/progress.
Firebase Spark remains supported; no Apps Script, Cloud Functions or paid upgrade.

## 12.1 debugging laboratory

Eight bilingual logical-error exercises (four per grade) unlock after the initial
diagnostic is submitted. Pupils propose a failing input and expected output,
compare the buggy program with the correct result, explain the error, then repair
and run Python against their example plus additional cases. Teachers can preview
both grades and inspect saved evidence. Practice records remain separate from
grades and XP. Publish the updated Firestore Rules before saving lab work.
See [setup and teacher guide](UPDATE_12_1_KK.md).

Validation: `node --test tests/debug-lab.test.cjs tests/debug-lab-api.test.cjs`.
Tests use real CPython for program outputs and mocked browser/API environments;
they do not substitute for browser/Pyodide or Firestore emulator verification.

## 12.0 olympiad preparation

The teacher's Pedagogy tab is replaced by Olympiad Preparation; pupils also get
an Olympiad tab. Fifteen bilingual adapted grade-8 tasks cover strings, persistent
versions and height-route queries. Each includes constraints, I/O, two examples,
a Python editor and additional browser practice checks (158 cases total).

Grade-8 access opens after all 12 canonical core problems are teacher-graded.
Teachers can grant/revoke access manually. Drafts and self-reported practice
results are saved separately from grades and XP. Practice tests are public static
assets, not a secure competition judge. Publish the updated Firestore Rules
separately before using access/progress. See [setup and teacher guide](UPDATE_12_0_KK.md).

Validation: `python tests/build_olympiad_bank.py --check` and
`node --test tests/community.test.cjs tests/olympiad.test.cjs tests/olympiad-api.test.cjs`.
The independent executable checks include all 158 cases, 30 examples, small-case
algorithm comparisons, access control at the API layer and the Python I/O harness.

## 11.9 online participants and XP ticker

Authenticated pupil and teacher screens include a bilingual, pausable ticker.
Pupils see their class and teacher; teachers see their own school workspace.
`Presence` heartbeats use server timestamps, one record per account, a 60-second
refresh and 150-second expiry. This is recent visible-page activity, not instant
connection detection. Hidden tabs stop polling. No new index is required.

Only the teacher writes `CommunityScores`, derived with the existing profile XP
function from reviewed work. Names/class/XP are shared; credentials, answers and
private profiles stay private. A grading action republishes XP; an open teacher
screen reconciles every five minutes. Missing XP is shown as pending, not zero.
The new `firestore.rules` must be published separately in Firebase before this
feature becomes available. See [setup instructions](UPDATE_11_9_KK.md).

Validation: `node --test tests/community.test.cjs`. A separate real-emulator Rules
suite is included in `tests/community-rules.test.cjs` (requires Firebase CLI/Java).

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


## 11.7 interactive practice and active time

All 31 task scenes consume actual interpreter frames, share the existing playback controls and preserve the existing flowchart. Separate grade-scoped Python practice uses the real Python worker and browser-local drafts, without assessed submissions or XP. No reference code is added to public files. The educational tracer retains its existing supported Python subset.

TaskTimes records approximate active task/correction seconds separately. Focus, visibility, a 90-second idle threshold and suspended-clock bounds pause counting. Bounded idempotent pulses, server elapsed-time checks and a browser tab lease limit duplicate counting. This is descriptive self-reported activity, not a grade or productivity metric. Unmeasured old work shows no fabricated duration; abrupt browser/session loss can lose unsent time. TaskTimes is tenant/pupil scoped, included in missing-only backups and pupil purge. Deploy matching Rules before SITE files. Spark remains supported. See UPDATE_11_7_KK.txt.


## 11.8 four-part learning flow and formative conclusion

The pupil flow is now Understand, Plan, Code and test, Conclusion. Code and testing share one editor/workspace and retain the existing prediction, execution, comparison and explanation record. Their duplicated stage questionnaires are removed: actual pupil code/prediction and pupil-authored comparison/explanation are saved as the existing evidence dimensions. All 31 source tasks have two bilingual conclusion questions (62 total). Selecting an option immediately shows the correct answer and explanation. First and latest choices are retained separately. This is formative feedback, not an independent controlled assessment; it never automatically awards teacher marks or XP.

Existing submitted originals and grades remain unchanged. Previously saved in-progress conclusion explanations are retained separately when the quiz is adopted. Teachers see first/latest quiz responses. The 15-point contract remains 3 + 3 + (3 code + 3 checking) + 3 conclusion. Existing Firebase Rules and core schemas are unchanged; publish SITE files without a database migration. See UPDATE_11_8_KK.txt.

