# Kerala Relief Connect

Relief Camp Verification Platform — Product Requirements Document

Version: 1.0 Date: 4 August 2026 Status: Draft for review Scope: Functional and data requirements only. UI/visual specification to be supplied separately.

1. Document control

Field Value Product owner Daliya Related prior work Kerala flood data aggregator (v1, official sources only, brief dated 1 Aug 2026) Supersedes Nothing. This is the crowdsourced layer deliberately cut from v1. Excluded from this document UI design, visual language, component specs, layout, typography Referenced requirement IDs DM-* data model, PUB-* public app, ADM-* admin portal, NFR-* non-functional, GUARD-* safety guardrails

2. Problem statement

During an active flood event in Kerala, the location, operating status and contact details of relief camps are not available anywhere in a reliable, current, machine-readable form.

What exists today:

District collectorate PDFs listing proposed relief camps — pre-designated buildings, published pre-monsoon, not updated during an event. Example: pathanamthitta.nic.in/en/relief-camps/ publishes taluk-wise PDFs.

KSDMA press releases and CM's office statements giving aggregate counts only (e.g. 209 camps, 5,792 people, 2 Aug 2026). No per-camp detail.

Third-party aggregators such as keralafloodwatch.in, which presents camp counts and details but carries internally inconsistent figures and describes itself as an official state portal.

The gap is not data display. Multiple products already display camp data. The gap is verified provenance: knowing that a specific camp exists, is open right now, and that a named human confirmed it.

2.1 Product thesis

This product's differentiator is the verification chain, not the feature list. Every camp record must be able to answer: who reported this, when, who confirmed it, when, and by what method. If we cannot answer those four questions for a record, the record is labelled as unconfirmed — visibly and without softening language.

2.2 Competitive note

A product already occupies this space with a broader feature set than our v1. Competing on features is not viable and not the point. Competing on trustworthiness is. Two implications for the build:

We never describe ourselves as official, government-backed, or KSDMA-integrated unless that is contractually true.

Every number on every screen carries a timestamp and a named source. No exceptions.

3. Goals and non-goals

3.1 Goals

ID Goal Success signal G1 A person in a flood-affected area can find their nearest open camp in under 30 seconds Nearest-camp result renders within 3s of location grant G2 A member of the public can report a camp in under 3 minutes on a poor mobile connection Median submission completion time; drop-off rate per step G3 An admin can verify or reject a submission in under 60 seconds Median time from submission to admin decision G4 No unconfirmed record is ever mistakable for a confirmed one Zero instances found in review of camp detail screens G5 Duplicate reports of the same camp do not pollute the public list Duplicate rate reaching public list < 2%

3.2 Non-goals for v1

Deferred item Reason Camp requirements and supplies inventory (food, medicine, bedding, sanitary needs) Explicitly deferred by product owner. Needs its own data model and an update cadence we cannot yet staff. Occupancy and capacity numbers (inmates, families) Changes hourly. Publishing a stale occupancy figure is worse than publishing none. Revisit when camp-side users exist. Rescue request / SOS dispatch Requires official coordination. Out of scope. Users are routed to 1070/112. Admin roles and permissions Single admin account in v1, per product owner. Donation or volunteer matching Separate product. Push notifications Deferred to v2. Road closures, hospital directory, river/dam data Covered by the separate v1 aggregator. Do not duplicate.

4. Users

User Description Authentication Primary need Public seeker Person affected by flooding, or a relative searching on their behalf. Often on mobile data, low battery, high stress. None Find the nearest open camp and its phone number Public reporter Volunteer, resident, camp worker or local official reporting a camp Phone OTP + name. No account, no password. Submit a camp report quickly and be believed Admin / verifier Our internal team member Single shared admin login (email/username + password) Clear the verification queue accurately

Note: the public reporter and public seeker are the same application. There is no separate "submission portal" as a distinct product — reporting is a flow inside the public app.

5. Core concepts

5.1 Verification state

Every camp record carries exactly one verification state.

State Set by Publicly visible Meaning unverified System, on submission Yes — labelled clearly Reported by the public, not yet confirmed by our team verified Admin Yes An admin confirmed this by a recorded method duplicate_held System, automatically No Auto-flagged as a duplicate of an existing camp. Visible in admin queue only. Admin may override. rejected Admin No Admin determined the report is false, unclear or unusable removed Admin No Soft-deleted. Record retained for audit, hidden everywhere public.

Product owner decision, recorded: unverified camps are shown publicly. This is deliberate — during an active event, a probable camp is more useful than no camp. It is also the single largest risk in this product. See GUARD-1 through GUARD-5.

5.2 Operational status

Independent of verification state.

Status Meaning active Camp is open and receiving people inactive Camp has closed, or was pre-designated but never opened

A camp can be verified + inactive (we confirmed it closed) or unverified + active (reported open, unconfirmed). The two axes never collapse into one badge.

5.3 Urgency

Level Meaning normal Default high Camp needs attention — e.g. reported overcrowding, access route flooding, supplies running out critical Immediate attention — e.g. camp being evacuated, structural risk, medical emergency

Setting rules:

A public reporter may flag urgency, but must supply a free-text reason (min 10 characters). A reporter-set urgency is recorded as reported_urgency and displayed as reported, not confirmed.

Only an admin can set the authoritative urgency field.

Admin urgency overrides reported_urgency on display once set.

Rationale: if the public can set the authoritative urgency, everything becomes critical within an hour and the field stops carrying information.

5.4 Source

Where a camp record originated. Distinct from the reporter — the reporter is a person, the source is a channel.

Source type Notes public_submission Via our app official_pdf Seeded from a district collectorate list ksdma_release From a KSDMA / district control room communication news_report Media report whatsapp_group Community group phone_tipoff Called in to our team internal_volunteer Our own person on the ground

Every camp links to at least one source. A camp may accumulate multiple sources over time (see DM-7, corroboration).

6. Data model

DM-1 · Geography

Kerala's administrative hierarchy, used for both filtering and address drill-down.

State (Kerala)
 └── District (14)
      └── Taluk (78)
           └── Local Self Government body — one of:
                ├── Grama Panchayat (941)
                ├── Municipality (87)
                └── Corporation (6)
                     └── Village / Ward / locality (free text in v1)


Fields on every camp:

Field Type Required Notes district enum, 14 values Yes Complete, authoritative list taluk enum, cascades from district Yes Complete, authoritative list lsg_type enum: panchayat | municipality | corporation Yes lsg_name string Yes See implementation note below village_or_locality string, free text No Finest-grain drill-down landmark string, free text No "Behind the old bus stand" — often more useful than an address

Implementation note on LSG data: the district and taluk lists must be loaded complete and correct. The full LSG list is ~1,034 entries (941 + 87 + 6) and must come from an authoritative source — the Kerala Local Self Government Department or lsgkerala.gov.in. Do not generate or approximate LSG names. Until the verified list is loaded, lsg_name is a free-text field with autocomplete against whatever LSG values already exist in the database. A wrong panchayat name in a life-safety tool is a routing failure, not a cosmetic bug.

Example cascade: Pathanamthitta → Ranni → Panchayat → Ranni-Pazhavangadi → (village) Vadasserikkara

DM-2 · Camp

Field Type Required Notes id uuid Yes name string Yes Camp name, usually a school or public building name_ml string No Malayalam name if supplied building_type enum: school | college | community_hall | place_of_worship | government_building | other No Geography fields see DM-1 latitude decimal(9,6) No Captured from device or map pin longitude decimal(9,6) No location_accuracy_m integer No From device geolocation API camp_incharge_name string No camp_phone_primary string, E.164 No The number a seeker will actually call camp_phone_secondary string, E.164 No verification_state enum, see 5.1 Yes Default unverified status enum: active | inactive Yes Default active urgency enum, see 5.3 Yes Default normal. Admin-set only. reported_urgency enum No Reporter-set reported_urgency_reason text No Required if reported_urgency != normal created_at timestamp Yes updated_at timestamp Yes Drives the freshness display status_last_confirmed_at timestamp No Distinct from updated_at. When did a human last confirm this camp is still open? Drives staleness warnings. verified_at timestamp No verified_by admin id No verification_method enum: phone_call | official_document | site_visit | known_contact | cross_reference No Required when transitioning to verified verification_note text No Required when unverifying or rejecting duplicate_of camp id No Set when auto-flagged report_count integer Yes Number of independent reports for this camp. Default 1.

DM-3 · Report (submission)

A camp may have many reports. The first report creates the camp; subsequent reports corroborate or update it.

Field Type Required id uuid Yes camp_id uuid Yes reporter_name string Yes reporter_phone_primary string, E.164 Yes — OTP verified reporter_phone_secondary string, E.164 No — not OTP verified reporter_gender enum: male | female | other | prefer_not_to_say No reporter_relationship enum: resident | volunteer | camp_staff | official | other No phone_verified_at timestamp Yes submitted_lat / submitted_lng decimal No — captured automatically where permitted device_location_granted boolean Yes submitted_at timestamp Yes ip_hash string Yes — hashed, for abuse detection only images relation, 2–4 Yes, minimum 2 auto_flags json array Yes — output of automated checks

DM-4 · Image

Field Type Notes id uuid report_id uuid storage_url string file_size_bytes integer Post-compression. Hard ceiling 1,048,576 (1 MB). width / height integer sha256 string For exact-duplicate detection blur_score float Laplacian variance or equivalent brightness_score float exif_lat / exif_lng decimal, nullable If present in EXIF exif_captured_at timestamp, nullable quality_status enum: pass | warn | fail quality_reasons json array e.g. ["too_blurry", "resolution_low"]

DM-5 · Source

Field Type id uuid type enum, see 5.4 label string — e.g. "Ranni Taluk Office", "Pathanamthitta Collectorate PDF 03/06/2021" contact_name string, optional contact_phone string, optional url_or_reference string, optional reliability_note text, optional

camp_sources is a many-to-many join between camps and sources.

DM-6 · Audit log

Every state-changing action, without exception.

Field Type id, timestamp actor_type enum: admin | public | system actor_id admin id, report id, or system entity_type / entity_id action e.g. verify, unverify, reject, remove, edit, override_duplicate, set_urgency before / after json diff note text

The audit log is append-only. It is the product's actual asset — the verification chain lives here.

DM-7 · Corroboration

When a new report matches an existing camp within the duplicate threshold, we do not discard the information. We:

Increment camp.report_count

Attach the new report to the existing camp

Set status_last_confirmed_at to now if the reporter says the camp is open

Surface the new report in the admin queue as "Corroborating report", not as spam

Three independent reports of the same camp is a strong trust signal and should be visible to admins. This is the cheapest verification signal available to us and we should not throw it away.

DM-8 · Emergency contacts

Static, per district, plus statewide. No live feed needed, near-zero staleness risk, and during a flood likely the most useful data in the product.

Field Type scope enum: state | district district nullable label string label_ml string phone string sort_order integer

Statewide seed set — every number to be re-verified against sdma.kerala.gov.in before launch:

Number Service 1070 State Emergency Operations Centre 1077 District Emergency Operations Centre 112 Emergency Response Support System (all-in-one) 101 Fire and Rescue 108 Ambulance 1098 Childline 1091 Women's helpline

Per-district: District Collectorate control room, District Police control room, District Fire station. These must be sourced from each collectorate site and dated.

7. Public application requirements

7.1 Location and nearest camp

ID Requirement PUB-1 On first open, request device location permission with a plain-language explanation of why. PUB-2 If granted: show the nearest active camps ranked by straight-line distance, nearest first. Show distance in km to one decimal place. PUB-3 If denied or unavailable: fall back to a district selector. Never leave the user on an empty screen. Location denial is a normal path, not an error. PUB-4 Nearest-camp calculation must include both verified and unverified camps, each clearly labelled. PUB-5 If a camp has no coordinates, it cannot appear in distance-ranked results but must still appear in district/taluk browse and search. PUB-6 Allow manual location re-selection at any time without losing the current view.

7.2 Browse, search and filter

ID Requirement PUB-7 Filter by district. PUB-8 Filter by taluk, cascading from selected district. PUB-9 Filter by LSG, cascading from selected taluk. PUB-10 Filter by status: active (default) / inactive / all. PUB-11 Filter by verification: all (default) / verified only. "Verified only" must be a single tap — some users will want exactly this. PUB-12 Free-text search across camp name, LSG name, village, landmark. Must tolerate transliteration variance (e.g. "Ranni" / "Ranny", "Kozhencherry" / "Kozhenchery"). PUB-13 Filters are combinable and reflected in the URL so a state can be shared over WhatsApp. PUB-14 Result count always visible.

7.3 Camp list item

Deliberately minimal. Only these fields:

Camp name

Location breadcrumb: district › taluk › LSG › village

Verification badge

Status badge

Urgency badge, only when not normal

Distance, when available

Last confirmed timestamp

ID Requirement PUB-15 Sort order: urgency critical first, then high, then by distance ascending, then by status_last_confirmed_at descending. PUB-16 A camp whose status_last_confirmed_at is older than 24 hours displays a staleness indicator.

7.4 Camp detail

ID Requirement PUB-17 Show all camp fields from DM-2 that are populated, plus report count. PUB-18 Camp phone numbers render as tap-to-call. PUB-19 Show report_count as plain language — "Reported by 3 people" — because it is a trust signal the user can reason about. PUB-20 Embedded map showing the camp location with an animated/pulsing marker. Read-only. PUB-21 "Get directions" action opening the device's native map application. Must detect platform and offer the appropriate handler — Google Maps and Apple Maps at minimum — using a geo URI or platform-specific deep link. If coordinates are absent, fall back to a place-name query. PUB-22 Show the district's emergency contact list on the camp detail screen. PUB-23 Show a "Call before you travel" prompt on every camp detail screen, and prominently on unverified camps. PUB-24 Show submitted images, if any, with the reporter's identity withheld. PUB-25 Allow a user to report a correction on an existing camp — closed, wrong number, wrong location. Correction reports enter the same admin queue.

7.5 Report submission flow

Ordered steps. Each step must be independently resumable if the connection drops.

ID Requirement PUB-26 Step 1 — capture location automatically. Prefill district/taluk/LSG by reverse geocoding where possible; always allow manual correction. If location is denied, require manual geography selection. PUB-27 Step 2 — camp details: name (required), building type, village/locality, landmark, camp in-charge name, camp phone. PUB-28 Step 3 — status and urgency: is the camp open now (required); urgency flag with mandatory reason if raised. PUB-29 Step 4 — images. Minimum 2, maximum 4. See section 8. PUB-30 Step 5 — reporter identity: name (required), primary phone (required), secondary phone (optional), gender (optional), relationship to camp (optional). PUB-31 Step 6 — OTP to primary phone. Submission is blocked until verified. See section 9. PUB-32 On success: confirmation screen stating the report is now publicly listed as unverified, that our team may call to confirm, and giving a reference id the reporter can quote. PUB-33 Progress must be preserved locally across a page reload or connection loss for at least 24 hours. PUB-34 The whole flow must be completable on a 2G connection. Total payload before images under 500 KB.

7.6 Platform behaviours

Listed here because they are functional, not visual. Appearance is out of scope for this document.

ID Requirement PUB-35 Light and dark mode, following system preference by default, with a manual override that persists. PUB-36 Global "last updated" timestamp with date and time in IST, visible on every screen. PUB-37 Manual refresh available on every screen, plus automatic refresh every 5 minutes while the app is foregrounded. PUB-38 Emergency helpline access reachable from every screen without scrolling. PUB-39 Back-to-top control appears after the user scrolls past one viewport height. PUB-40 Language toggle: Malayalam and English. See section 11. PUB-41 Current weather for the user's district or selected district. See section 12. PUB-42 Works as an installable PWA with an offline shell. A cached camp list is better than a blank screen when the network drops. PUB-43 Cached data displayed offline must be marked with its cache time and an offline indicator.

8. Image requirements

Two images minimum per report, per product owner.

8.1 Size and format

ID Requirement IMG-1 Accept image/jpeg, image/png, image/webp, image/heic. HEIC must be converted (iPhone default). IMG-2 Accept an original upload up to 12 MB, then compress client-side before transmission. Uploading 12 MB over flood-degraded mobile data will fail. IMG-3 Post-compression hard ceiling: 1 MB (1,048,576 bytes) per image. IMG-4 Compression targets: longest edge 1,600 px, JPEG/WebP quality ~0.8, iterate quality downward until under ceiling. IMG-5 Reject if post-compression longest edge is under 640 px — the source was too small to be useful. IMG-6 Strip EXIF from the stored public-facing copy, but extract and retain GPS and capture-time to the report record first.

8.2 Automated quality checks

Run client-side where possible for instant feedback, re-validated server-side.

ID Check Threshold On failure IMG-7 Blur — Laplacian variance Below threshold (tune on real samples; ~100 is a common starting point) warn, ask reporter to retake, allow override IMG-8 Too dark / blown out — mean brightness outside acceptable band Tune on samples warn IMG-9 Exact duplicate — SHA-256 matches another image in the same report Match fail, hard block. Two copies of one photo is not two photos. IMG-10 Exact duplicate against images in other reports Match warn, flag to admin — possible recycled photo IMG-11 EXIF GPS present and more than 2 km from submitted location Mismatch warn, flag to admin IMG-12 EXIF capture time more than 48 hours old Stale warn, flag to admin IMG-13 Aspect ratio suggests a screenshot Heuristic warn, flag to admin

Design principle: automated checks inform the admin, they do not auto-reject a report. A blurry photo taken in the rain at night by someone standing in floodwater is still evidence. Only IMG-9 hard-blocks. Every other failure is a flag the admin sees.

8.3 Image privacy

ID Requirement IMG-14 Before the camera opens, show guidance: photograph the building, signage and surroundings — not people's faces, and never children. IMG-15 Provide a "report this image" control on public camp detail so an image showing identifiable people can be flagged for takedown. IMG-16 Admin must be able to remove an individual image without rejecting the whole camp record.

Displaced people in a relief camp have not consented to being photographed and published. Minors especially. This is a legal and ethical exposure, not a nice-to-have.

9. Phone verification and abuse control

ID Requirement OTP-1 6-digit numeric OTP to reporter_phone_primary via SMS. OTP-2 Validity 10 minutes. OTP-3 Maximum 5 verification attempts per OTP, then invalidate and require a resend. OTP-4 Resend allowed after 60 seconds, maximum 3 resends per number per hour. OTP-5 Maximum 5 successful submissions per verified number per 24 hours. Beyond that, submissions are accepted but auto-flagged high_volume_reporter for admin attention rather than blocked — during a real event, one dedicated volunteer may legitimately report many camps. OTP-6 Accept Indian mobile numbers, +91, 10 digits, normalised and stored E.164. OTP-7 Secondary phone is stored without verification and labelled as unverified internally. OTP-8 Rate-limit by hashed IP as a second axis: maximum 20 OTP requests per IP per hour. OTP-9 Reporter phone numbers are never displayed publicly, only to the admin. OTP-10 Provide a fallback path if SMS delivery fails twice: accept the submission, mark it phone_unverified, and route it to a separate admin queue. Do not let a failing SMS gateway silence a real report during an emergency.

10. Duplicate detection

Product owner decision: if a new report matches an existing camp's location, reject it by default, but show it to the admin, who may override and approve.

Implemented as follows.

ID Requirement DUP-1 On submission, evaluate against existing camps: (a) geodesic distance under 150 m, OR (b) same LSG and normalised camp-name similarity above 0.85 (Levenshtein or token-set ratio). DUP-2 Both thresholds must be configurable without a code change. 150 m is a starting value to be tuned — schools and community halls cluster tightly in Kerala's settlement pattern. DUP-3 On match, set verification_state = duplicate_held and duplicate_of = <existing camp id>. Record does not appear publicly. DUP-4 The report is still stored in full and attached to the matched camp as a corroborating report (DM-7). No submitted information is discarded. DUP-5 Admin queue shows held duplicates in a dedicated view with a side-by-side comparison of the new report against the matched camp. DUP-6 Admin actions on a held duplicate: merge (fold details into the existing camp), override (promote to a separate camp — genuinely a different camp nearby), or reject. DUP-7 Normalisation before name comparison must strip common prefixes and abbreviations: "Govt", "Government", "GHSS", "GVHSS", "HS", "HSS", "LPS", "UPS", "St.", "Saint". DUP-8 Transliteration variance must be tolerated in matching. DUP-9 If a held duplicate carries a status contradicting the existing camp — reported closed when we have it as active — escalate it in the admin queue rather than leaving it buried among duplicates. A contradiction is information.

11. Localisation

ID Requirement L10N-1 Two locales: en and ml. Full parity of interface text, labels, validation messages, error states and helper copy. L10N-2 Default to ml when the device locale is Malayalam, otherwise en. Manual override persists. L10N-3 Malayalam is the priority locale for the public app, not an afterthought — the users are Keralite residents in an emergency. L10N-4 User-entered content (camp names, landmarks, notes) is stored exactly as entered and never machine-translated. A mistranslated place name misroutes people. L10N-5 Where a camp has both name and name_ml, show the locale-appropriate one and the other as secondary. L10N-6 Numerals: Latin digits in both locales for phone numbers, distances and times. L10N-7 District, taluk and LSG names require a Malayalam label set, sourced from official transliteration, not generated. L10N-8 Emergency contact labels localised (DM-8 label_ml).

12. Weather

ID Requirement WX-1 Show current conditions and short-term rainfall for the user's district or selected district. WX-2 Minimum fields: current temperature, current condition, rainfall in the last 24 hours, forecast rainfall for the next 24 hours. WX-3 Every weather value carries its source name and observation timestamp. WX-4 Recommended source: Open-Meteo — free, no API key, CORS-permissive, suitable for direct client-side fetch. Where IMD data is available it is authoritative for warnings and should be preferred for alert-level information. WX-5 Weather is supplementary context, never presented as a warning or an alert. Official alerts come from IMD and KSDMA only, and we link out rather than restate. WX-6 If the weather source fails, hide the weather module. Do not show stale or placeholder weather.

13. Data freshness

ID Requirement FRESH-1 Every screen displays a global "last updated" date and time in IST. FRESH-2 Every camp displays status_last_confirmed_at, not merely updated_at. Editing a phone number is not the same as confirming a camp is open. FRESH-3 Staleness thresholds: over 24 hours since last confirmation shows a caution indicator; over 72 hours shows a stronger warning and drops the camp below fresher records of equal urgency. FRESH-4 Admin queue surfaces camps not confirmed in over 48 hours as a re-confirmation task. FRESH-5 Never display a value without a timestamp. This is the product's core discipline, given the competitive context in section 2.2.

14. Admin portal requirements

14.1 Authentication

ID Requirement ADM-1 Single admin account. Username/email plus password. No public registration, no self-service signup. ADM-2 Session expiry after 12 hours of inactivity. ADM-3 Password minimum 12 characters, stored using a modern password hash (bcrypt/argon2). ADM-4 Even with one account, every action writes verified_by / actor_id to the audit log. The schema must support multiple admins from day one so adding roles in v2 requires no migration. ADM-5 Rate-limit login attempts: 5 failures triggers a 15-minute lockout.

14.2 Verification queue

ID Requirement ADM-6 Default view: all unverified camps, oldest first, so nothing is starved. ADM-7 Separate views: held duplicates, phone-unverified fallback submissions, flagged images, corroborating reports, re-confirmation due. ADM-8 Queue item shows: all camp fields, all reporter details including phone numbers, all images at full size, all auto_flags, report count, and the matched camp for duplicates. ADM-9 Tap-to-call on the reporter's phone number and the camp phone number — phone verification is the primary method and must be one tap. ADM-10 Badge counts per queue.

14.3 Camp actions

ID Requirement ADM-11 Verify — requires selecting a verification_method. Optional note. Sets verified_at, verified_by, status_last_confirmed_at. ADM-12 Unverify — requires a mandatory note. Returns the camp to unverified; it remains publicly visible. ADM-13 Reject — requires a mandatory reason. Camp is hidden publicly. ADM-14 Remove — soft delete with mandatory reason. Hidden everywhere public; record and audit trail retained permanently. No hard delete in the interface. ADM-15 Edit — any camp field. Every edit produces a before/after audit entry. ADM-16 Set status — active / inactive, with an optional note. Updates status_last_confirmed_at. ADM-17 Set urgency — normal / high / critical, with a mandatory reason for high and critical. ADM-18 Add camp — full manual entry for camps we source ourselves. Admin-created camps may be marked verified immediately if the method is recorded. ADM-19 Merge camps — combine two records, retaining all reports and sources against the surviving record. ADM-20 Remove individual image without affecting the camp record. ADM-21 Bulk actions on multi-select: set status, set urgency. Bulk verify is deliberately not supported — verification is per-camp by definition, and a bulk verify button destroys the product's only real asset.

14.4 Masters management

Product owner: "we get to see the masters of those."

ID Requirement ADM-22 Manage sources: create, edit, deactivate. View all camps attributed to a source. ADM-23 Manage emergency contacts per district: create, edit, reorder, deactivate. Each carries a last_verified_at. ADM-24 View geography masters — districts, taluks, LSGs. Add or correct LSG entries, since v1 begins with an incomplete LSG list. ADM-25 Manage configurable thresholds: duplicate distance radius, name-similarity threshold, blur threshold, staleness windows, rate limits.

14.5 Admin overview

ID Requirement ADM-26 Counts by verification state, by status, by urgency, and by district. ADM-27 Pending verification count and median age of the oldest pending item. ADM-28 Submissions in the last 24 hours, with a trend. ADM-29 Camps overdue for re-confirmation. ADM-30 Reports per source, to reveal which channels are reliable. ADM-31 Export all camps to CSV, with every field including verification metadata. If we are ever asked to hand data to a district administration, this is the handoff. ADM-32 Audit log viewer, filterable by entity, actor and action.

15. Safety guardrails

These exist because we publish unconfirmed information about a life-safety matter during an active disaster. They are requirements, not recommendations.

ID Requirement GUARD-1 An unverified camp must be labelled unambiguously as not confirmed, using plain language in both locales. Not a subtle colour difference. Not a small icon. The words. GUARD-2 Every camp detail screen carries "Call the camp before you travel." Displayed prominently on unverified camps. GUARD-3 A persistent, non-dismissible disclaimer: this is a community-sourced platform, it is not an official government source, and official instructions from the District Collector and Kerala Police take precedence. GUARD-4 We do not use the words "official", "government", "KSDMA" or "authorised" to describe our own platform in any copy, metadata, page title, or social preview, unless a written arrangement exists that makes it true. This is a hard rule. The nearest comparable product violates it and that is a liability, not a template. GUARD-5 Statewide emergency numbers must remain reachable even when the app's own data layer fails. Hard-code them into the offline shell. GUARD-6 Never show a camp as active without a confirmation timestamp attached. GUARD-7 No rescue, medical or evacuation advice anywhere in the product. Route to 1070, 1077 and 112. GUARD-8 Reporter personal data is never public. Name, phone, gender and location are admin-only. GUARD-9 A published takedown path for anyone who wants their image or a camp record removed, with a response target of 24 hours during an active event. GUARD-10 Do not restate IMD or KSDMA alert levels inside our interface. Link to them. Restating creates a second source of truth that will go stale and could contradict the official one.

16. Non-functional requirements

ID Requirement NFR-1 Mobile-first. The majority of traffic will be Android on mobile data. NFR-2 First contentful paint under 2 seconds on a 3G connection. NFR-3 Camp list query response under 500 ms at 5,000 camp records. NFR-4 Must withstand a traffic spike of 100× baseline — a single viral WhatsApp forward is the realistic load event. Static assets on a CDN, camp list cached with a short TTL. NFR-5 Image storage on object storage with a CDN, never served from the application server. NFR-6 All traffic over HTTPS. Secure, httpOnly cookies for the admin session. NFR-7 Accessibility: WCAG 2.1 AA. Keyboard navigable, visible focus, reduced-motion respected, text scalable to 200%, minimum 4.5:1 contrast in both themes. NFR-8 Screen-reader labels in both locales. NFR-9 Automated daily database backup with restore tested before launch. NFR-10 Structured logging on submissions, verification actions and image processing failures. NFR-11 Reporter phone numbers encrypted at rest. NFR-12 Explicit retention policy: reports and audit records retained; reporter contact details reviewed for deletion 12 months after the event closes. NFR-13 Graceful degradation — if maps, weather or SMS fail, the camp list still works. No single third-party dependency can take down the core function.

17. Seeding strategy

The chicken-and-egg problem: an empty camp list attracts no reporters, and no reporters means an empty list. Seed it.

ID Requirement SEED-1 Import pre-designated camp buildings from district collectorate "proposed relief camps" PDFs — for example the taluk-wise lists at pathanamthitta.nic.in/en/relief-camps/. SEED-2 Imported records are created with status = inactive, verification_state = verified, source official_pdf, and the publication date of the source document recorded. They are known buildings, not known open camps. SEED-3 This gives reporters a pick-list rather than a blank field, which improves data quality and cuts duplicates substantially. SEED-4 Never present a seeded record as an open camp. status = inactive until a human confirms otherwise. SEED-5 No official live camp API exists as of 4 August 2026. Do not architect around the assumption that one will appear, but keep the source abstraction (DM-5) capable of absorbing one.

18. Deferred to v2 and beyond

Recorded so the v1 schema does not foreclose them.

Camp requirements and supplies inventory

Occupancy and capacity, with a camp-side updater role

Multiple admin accounts with roles: verifier, moderator, district lead

Push notifications

Camp-staff self-service updating with a scoped access token

Reporter trust scoring based on verification history

Public API and open data export

Two additional locales — Hindi and Tamil — for migrant worker populations

SMS and IVR access for feature phones and zero-connectivity conditions

Official partnership with KSDMA or a district administration, which would change the trust model entirely and is the real strategic objective

19. Open questions

# Question Blocking? 1 Who staffs the verification queue, and during what hours? An unverified backlog is the product's only real failure mode. This is an operational commitment, not a feature. Yes — answer before launch 2 What is the authoritative source for the ~1,034 LSG names, and who obtains it? Yes — blocks DM-1 3 Which SMS gateway, and is the sender ID approved? Indian DLT registration can take days and will block launch if left late. Yes — blocks OTP-1 4 Is 150 m the right duplicate radius for Kerala settlement density, or should it be tighter? No — tunable post-launch 5 Confirmed that a reporter may flag urgency but only an admin sets the authoritative value? No — assumption recorded in 5.3 6 Do we publish a takedown contact address, and who monitors it? Yes, for GUARD-9 7 Legal entity behind the platform, named in the disclaimer — Nyxtry, Altos & Vanes, or unbranded? Yes, for GUARD-3 8 Are we willing to approach a district collectorate for endorsement? It changes the trust proposition more than any feature in this document. No — strategic, not blocking

20. Appendix — verified reference sources

Source URL Use KSDMA sdma.kerala.gov.in Emergency numbers, official alerts, dam levels Pathanamthitta relief camps pathanamthitta.nic.in/en/relief-camps/ Seed data pattern, taluk-wise PDFs Kollam flood relief kollam.nic.in/en/flood-relief/ Seed data pattern Kerala LSG Department lsgkerala.gov.in Authoritative LSG list — to be obtained Open-Meteo open-meteo.com Weather, no key required IMD Thiruvananthapuram mausam.imd.gov.in/thiruvananthapuram/ Official rainfall warnings

Competitive reference, reviewed 4 August 2026: keralafloodwatch.in. Broad feature set. Internally inconsistent camp counts across its own pages, and self-describes as an official state portal. Reviewed as a cautionary example, not a model.

I'll check whether an official camp data source exists before writing the PRD — you asked me to use one if there is.Before the PRD — one finding you need to know about, because it changes the framing.

A portal already exists doing almost exactly this. keralafloodwatch.in is a public Kerala disaster platform with relief camps, emergency contacts, live rainfall, river levels, dam storage, and a GPS feature that calculates your distance to the nearest relief camp — plus community incident reporting, a map, and EN/ML/HI/TA switching. It was live and updating this week.

But look closely at it and the case for your project gets stronger, not weaker. Its own numbers contradict each other: the header says 42 active relief camps, a panel further down says 250, and the district cards sum to 250 — while the CM's office reported 5,792 people relocated to 209 relief camps on 2 August. It brands itself "Official State Portal" and "Official KSDMA Data Integration," and its river list includes names that don't correspond to actual Kerala rivers. It looks like plausible-seeming data presented as official.

That is precisely the failure mode a verification-first product exists to prevent. It also tells you what your differentiator has to be, and it isn't features — it's provenance.

Second finding: there is no machine-readable official camp feed. District collectorates publish relief camp lists as PDFs — Pathanamthitta publishes taluk-wise proposed relief camp lists for Adoor, Konni, Kozhencherry, Mallappally, Ranni and Thiruvalla. Those are pre-designated camp buildings, not live occupancy. Useful as a seed master list, useless as live status. Which is exactly the gap your crowdsourcing fills.

Now, the PRD.Markdown rather than HTML, since this feeds into Lovable prompts next and you'll be editing it. Say the word if you want it as a styled HTML doc for sharing.

Decisions I made where you left latitude:

Urgency — reporters can flag it with a mandatory reason, but only admin sets the authoritative value. If the public can set it, everything is critical within an hour.

Duplicates — held, not discarded. Your rule (auto-reject on same location, admin can override) is implemented, but the report still attaches to the matched camp as corroboration. Three independent reports of one camp is the cheapest verification signal you'll ever get, so throwing it away would be a waste.

Image checks — only exact-duplicate hard-blocks. Everything else flags to admin. A blurry night photo taken by someone standing in floodwater is still evidence.

status_last_confirmed_at as a separate field from updated_at. Editing a phone number isn't the same as confirming a camp is open, and conflating those two is how a portal starts lying.

No bulk verify. Deliberately omitted. It's the one button that would destroy the only thing that differentiates this product.

Three things that will actually block launch, none of them code:

SMS gateway + DLT registration. Indian sender-ID approval takes days. If you start this late, OTP blocks your launch and nothing else matters.

Who staffs the verification queue, and when. An unverified backlog is this product's only real failure mode. That's an operational commitment, not a feature.

The LSG list. ~1,034 panchayats, municipalities and corporations. I did not generate these and you shouldn't let Lovable generate them either — a wrong panchayat name here misroutes a person through floodwater. District and taluk lists are safe to load complete; LSG needs the real list from lsgkerala.gov.in.

One strategic note. Given that a competitor is already claiming official status with inconsistent data, your moat isn't features — it's that you can answer "who confirmed this, when, and how" for every record. I've written that into the guardrails as a hard rule: no "official" or "KSDMA" language anywhere in your copy or metadata unless it becomes contractually true. Approaching a district collectorate for even informal endorsement would change your position more than anything else in this document.

now, some app ui references are as follows. gotta be responsive. build user facing first, then when i say, only then build admin. 

https://in.pinterest.com/pin/700872760750986834/
https://in.pinterest.com/pin/1141873680499434666/
https://in.pinterest.com/pin/695032154998593831/
https://in.pinterest.com/pin/759419555919792423/
https://in.pinterest.com/pin/553590979188465315/
https://in.pinterest.com/pin/365776800968471981/
https://in.pinterest.com/pin/766597167809888137/
https://in.pinterest.com/pin/331788697550011144/
https://in.pinterest.com/pin/760615824549042019/
https://in.pinterest.com/pin/958844576925205677/
https://in.pinterest.com/pin/21462535722380789/

 Use very few menus. When it comes to the mobile app, it should include menus. For the web or tablet version, we can have the sidebar.

There should be very few menus to avoid confusion. A language toggle is a must, and a dark/light mode toggle is essential as well.

Please understand that this is for common people .  Also, for some validations and everything, I checked for that image thing and all.

If there are any open-source and free plugins available, use those.

Make sure the whole thing is responsive

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://camp-trust-link.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b55b470e-5774-42f0-b5d0-16b739ec36db).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
