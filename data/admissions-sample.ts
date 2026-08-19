/**
 * Demonstration data for the admissions features.
 *
 * READ THIS BEFORE ADDING TO IT.
 *
 * The applicant outcomes and essays below are **invented**. They exist so the
 * heatmap, the profile view and the essay list have something to render before
 * anyone has imported a real dataset, and every row carries `isSample: true` so
 * the UI can badge it. A student must never be able to mistake one of these for
 * a real admissions result — that would be worse than an empty screen, because
 * they would calibrate their own chances against a number somebody made up.
 *
 * Replace them with real, consented, de-identified data through
 * `POST /api/admin/bulk-import`, then delete the sample rows:
 *
 *     DELETE FROM applicant_profiles WHERE is_sample = true;
 *     DELETE FROM essays WHERE is_sample = true;
 *
 * The activity tiers are different: they are a reference taxonomy — kinds of
 * involvement, not things a particular student did — so they are not marked as
 * samples and are safe to ship as real reference content.
 */

export interface SampleApplicant {
  applicantKey: string;
  university: string;
  status: "ACCEPTED" | "REJECTED" | "WAITLISTED";
  year: number;
  satScore: number;
  actScore?: number;
  gpaUnweighted: number;
  gpaWeighted?: number;
  major: string;
  demographics: { state: string; schoolType: string; firstGen: boolean };
  extracurriculars: Array<{
    title: string;
    role?: string;
    hours?: number;
    description?: string;
  }>;
  awards: Array<{ title: string; level: string; year?: number }>;
}

/*
 * Nine applicants, each with two to four decisions, which is what makes the
 * profile view's "where else did they apply" card meaningful. Scores are spread
 * across the plausible range on purpose: a heatmap where everyone scored 1550
 * teaches nothing.
 */
export const SAMPLE_APPLICANTS: SampleApplicant[] = [
  {
    applicantKey: "sample-01",
    university: "Massachusetts Institute of Technology",
    status: "ACCEPTED",
    year: 2025,
    satScore: 1570,
    actScore: 35,
    gpaUnweighted: 3.98,
    gpaWeighted: 4.42,
    major: "Computer Science",
    demographics: { state: "Tashkent", schoolType: "Public", firstGen: true },
    extracurriculars: [
      {
        title: "International Olympiad in Informatics",
        role: "National team",
        hours: 15,
        description: "Two years on the national training squad; bronze in 2024.",
      },
      {
        title: "Open-source scheduling library",
        role: "Maintainer",
        hours: 8,
        description: "1.2k stars, used by three local universities.",
      },
      {
        title: "Coding club for girls",
        role: "Founder",
        hours: 6,
        description: "Weekly sessions for 40 students across two schools.",
      },
    ],
    awards: [
      { title: "IOI Bronze Medal", level: "International", year: 2024 },
      { title: "Republic Informatics Olympiad, 1st", level: "National", year: 2023 },
    ],
  },
  {
    applicantKey: "sample-01",
    university: "Stanford University",
    status: "WAITLISTED",
    year: 2025,
    satScore: 1570,
    gpaUnweighted: 3.98,
    major: "Computer Science",
    demographics: { state: "Tashkent", schoolType: "Public", firstGen: true },
    extracurriculars: [],
    awards: [],
  },
  {
    applicantKey: "sample-02",
    university: "Massachusetts Institute of Technology",
    status: "REJECTED",
    year: 2025,
    satScore: 1520,
    gpaUnweighted: 3.9,
    major: "Physics",
    demographics: { state: "Samarkand", schoolType: "Private", firstGen: false },
    extracurriculars: [
      { title: "Physics tutoring", role: "Tutor", hours: 5 },
      { title: "School newspaper", role: "Editor", hours: 4 },
    ],
    awards: [{ title: "Regional Physics Olympiad, 2nd", level: "Regional", year: 2024 }],
  },
  {
    applicantKey: "sample-03",
    university: "Massachusetts Institute of Technology",
    status: "ACCEPTED",
    year: 2024,
    satScore: 1540,
    gpaUnweighted: 4.0,
    gpaWeighted: 4.6,
    major: "Mechanical Engineering",
    demographics: { state: "Bukhara", schoolType: "Public", firstGen: true },
    extracurriculars: [
      {
        title: "FIRST Robotics",
        role: "Team captain",
        hours: 12,
        description: "Led an eight-person build team to a regional final.",
      },
      { title: "Village solar project", role: "Volunteer", hours: 6 },
    ],
    awards: [{ title: "FIRST Regional Finalist", level: "International", year: 2023 }],
  },
  {
    applicantKey: "sample-04",
    university: "Massachusetts Institute of Technology",
    status: "REJECTED",
    year: 2025,
    satScore: 1480,
    gpaUnweighted: 3.85,
    major: "Economics",
    demographics: { state: "Tashkent", schoolType: "Public", firstGen: false },
    extracurriculars: [{ title: "Debate club", role: "Member", hours: 4 }],
    awards: [],
  },
  {
    applicantKey: "sample-05",
    university: "Yale University",
    status: "ACCEPTED",
    year: 2025,
    satScore: 1530,
    gpaUnweighted: 3.96,
    major: "Political Science",
    demographics: { state: "Tashkent", schoolType: "Private", firstGen: false },
    extracurriculars: [
      {
        title: "Model United Nations",
        role: "Secretary-General",
        hours: 10,
        description: "Ran a 300-delegate conference across three schools.",
      },
      { title: "Legal aid translation", role: "Volunteer", hours: 5 },
    ],
    awards: [{ title: "Best Delegate, Regional MUN", level: "Regional", year: 2024 }],
  },
  {
    applicantKey: "sample-06",
    university: "Yale University",
    status: "REJECTED",
    year: 2025,
    satScore: 1490,
    gpaUnweighted: 3.8,
    major: "History",
    demographics: { state: "Fergana", schoolType: "Public", firstGen: true },
    extracurriculars: [{ title: "Local history archive", role: "Researcher", hours: 6 }],
    awards: [],
  },
  {
    applicantKey: "sample-07",
    university: "Yale University",
    status: "WAITLISTED",
    year: 2024,
    satScore: 1510,
    gpaUnweighted: 3.92,
    major: "English",
    demographics: { state: "Tashkent", schoolType: "Public", firstGen: false },
    extracurriculars: [
      { title: "Literary magazine", role: "Founder", hours: 7 },
      { title: "Uzbek–English translation blog", role: "Author", hours: 4 },
    ],
    awards: [{ title: "National Essay Contest, 3rd", level: "National", year: 2023 }],
  },
  {
    applicantKey: "sample-08",
    university: "New York University Abu Dhabi",
    status: "ACCEPTED",
    year: 2025,
    satScore: 1460,
    gpaUnweighted: 3.88,
    major: "Social Research and Public Policy",
    demographics: { state: "Namangan", schoolType: "Public", firstGen: true },
    extracurriculars: [
      {
        title: "Community water survey",
        role: "Project lead",
        hours: 9,
        description: "Mapped supply gaps in twelve neighbourhoods; used by the local council.",
      },
      { title: "School debate team", role: "Captain", hours: 5 },
    ],
    awards: [{ title: "Regional Youth Policy Award", level: "Regional", year: 2024 }],
  },
  {
    applicantKey: "sample-09",
    university: "New York University Abu Dhabi",
    status: "REJECTED",
    year: 2025,
    satScore: 1380,
    gpaUnweighted: 3.7,
    major: "Business",
    demographics: { state: "Tashkent", schoolType: "Private", firstGen: false },
    extracurriculars: [{ title: "Family business", role: "Weekend work", hours: 10 }],
    awards: [],
  },
  {
    applicantKey: "sample-08",
    university: "Yale University",
    status: "REJECTED",
    year: 2025,
    satScore: 1460,
    gpaUnweighted: 3.88,
    major: "Social Research and Public Policy",
    demographics: { state: "Namangan", schoolType: "Public", firstGen: true },
    extracurriculars: [],
    awards: [],
  },
  {
    applicantKey: "sample-03",
    university: "Columbia University",
    status: "ACCEPTED",
    year: 2024,
    satScore: 1540,
    gpaUnweighted: 4.0,
    major: "Mechanical Engineering",
    demographics: { state: "Bukhara", schoolType: "Public", firstGen: true },
    extracurriculars: [],
    awards: [],
  },
];

export interface SampleEssay {
  applicantKey?: string;
  university?: string;
  prompt: string;
  content: string;
  topicTags: string[];
  year: number;
  isPremium: boolean;
}

/*
 * The prompts are the real, public Common App and supplement questions. The
 * essays themselves are written for this repository — they are craft
 * demonstrations, not anybody's admission essay, and the UI badges them as
 * samples.
 */
export const SAMPLE_ESSAYS: SampleEssay[] = [
  {
    applicantKey: "sample-01",
    prompt:
      "Some students have a background, identity, interest, or talent so meaningful they believe their application would be incomplete without it. If this sounds like you, please share your story.",
    topicTags: ["Personal Identity", "Community", "Technology"],
    year: 2025,
    isPremium: false,
    content: `The first program I wrote was a bus timetable.

Not a good one. It was four hundred lines of if-statements and it only knew about route 78, the one my mother took to the hospital where she cleaned floors on the night shift. The city's own timetable existed, technically. It was a PDF from 2016, and the buses had stopped agreeing with it some time around 2019.

So I did what a thirteen-year-old with too much confidence does: I stood at the stop with a notebook for eleven evenings and wrote down when buses actually came. Then I put the numbers in a file, and the file in a program, and the program on my phone. My mother stopped leaving forty minutes early to be safe.

I tell this story badly if I make it sound like a triumph. What I remember is the eleventh evening, when a woman my grandmother's age asked what I was writing. I explained. She said, in the flat way people say obvious things, that the 78 had been late for years and nobody had ever asked her about it.

That is the part I did not expect. Not that the data was missing, but that the people who had it had never been asked.

The program is on GitHub now and other people have added their routes. Twelve hundred stars, which sounds impressive until you realise that means twelve hundred cities have the same broken PDF. I have spent three years since then learning to write code that other people can read, because the notebook does not scale and I am one person.

What I want from a university is not the language or the framework. It is the eleventh evening, repeated: rooms full of people who know something nobody has thought to ask them about, and the tools to ask properly.`,
  },
  {
    applicantKey: "sample-05",
    prompt:
      "Reflect on a time when you questioned or challenged a belief or idea. What prompted your thinking? What was the outcome?",
    topicTags: ["Failure", "Leadership", "Growth"],
    year: 2025,
    isPremium: false,
    content: `I used to believe that a good argument wins.

I was very good at winning. Two years of debate, a shelf that embarrassed my father into building a second shelf, and a reputation at school for being the person you did not want on the other side. I could find the weak joint in anyone's reasoning in about ninety seconds, and I enjoyed it more than I am comfortable admitting now.

Then I ran the conference.

Three hundred delegates, eleven committees, and a crisis on the second morning: two schools threatened to walk out over a resolution about water rights. I did what I knew how to do. I found the weak joint. I explained, precisely and at some length, why their objection did not hold.

They walked out anyway.

It took me the whole afternoon to understand that I had answered a question nobody had asked. Their objection was not about the resolution. It was that they had been placed in the smallest room, given the fewest speaking slots, and told by a seventeen-year-old with a clipboard that their concern was procedurally invalid. Every word I said was correct. All of it was beside the point.

I went and sat with them. I did not argue. I asked what the day had been like from their side, and then I moved their committee into the assembly hall, which meant moving mine out of it.

The resolution passed. I am not sure it was a better resolution. But eleven committees finished the weekend instead of nine.

I still think a good argument matters. I no longer think it is the first thing that matters. Most of the time the disagreement in the room is not the one being spoken aloud, and the skill I spent two years building — finding the flaw and naming it — is useless until somebody believes you are on their side.`,
  },
  {
    applicantKey: "sample-08",
    university: "New York University Abu Dhabi",
    prompt:
      "NYU Abu Dhabi is a community of learners drawn from over a hundred nations. What will you bring to it?",
    topicTags: ["Community", "Service", "Place"],
    year: 2025,
    isPremium: true,
    content: `In my neighbourhood the water comes on at six and goes off at nine, and everybody knows this, and nobody has written it down.

I wrote it down. Twelve neighbourhoods, four months, a clipboard and my cousin's bicycle. When is the water on. How many households on your line. What do you do on the days it does not come. It was not a research project when I started — I wanted to know why our street was worse than the next one over, and the only way to find out was to ask the next street over.

The council has the map now. Two of the twelve neighbourhoods have a second supply window because of it. I would like to claim that as a victory but the honest version is smaller: the map made a thing visible that everyone already knew, and being visible turned out to be enough to move it.

What I want to bring is that habit. Not water, specifically — the habit of assuming the people living inside a problem already understand it, and that the missing piece is usually not insight but a written record and somebody willing to carry it into the right room.

I expect Abu Dhabi to be full of people who have carried something into a room. I would like to find out what they learned about the carrying.`,
  },
];

export interface SampleActivity {
  tier: string;
  category: string;
  title: string;
  titleUz: string;
  description: string;
  descriptionUz: string;
  order: number;
}

/*
 * The activity ladder — a reference taxonomy, not anyone's record.
 *
 * Five tiers, from "you turned up" to "you changed something at national
 * scale". The point is not to rank students but to answer the question every
 * applicant actually has: what does the next rung look like from here?
 */
export const SAMPLE_ACTIVITIES: SampleActivity[] = [
  // --- Bronze I: participation -------------------------------------------
  { tier: "Bronze I", category: "Leadership", title: "Club member", titleUz: "To'garak a'zosi", description: "Regular attendance at a school club, without a formal role.", descriptionUz: "Maktab to'garagida rasmiy lavozimsiz muntazam qatnashish.", order: 1 },
  { tier: "Bronze I", category: "Service", title: "Occasional volunteering", titleUz: "Vaqti-vaqti bilan ko'ngillilik", description: "A few days a year with a local organisation.", descriptionUz: "Yiliga bir necha kun mahalliy tashkilotda.", order: 2 },
  { tier: "Bronze I", category: "STEM", title: "Personal blog or channel", titleUz: "Shaxsiy blog yoki kanal", description: "Writing or posting about a subject you like, small audience.", descriptionUz: "O'zingiz yoqtirgan mavzuda yozish, auditoriya kichik.", order: 3 },
  { tier: "Bronze I", category: "Athletics", title: "School team member", titleUz: "Maktab jamoasi a'zosi", description: "Plays for a school team without selection beyond the school.", descriptionUz: "Maktab jamoasida o'ynaydi, maktabdan tashqari saralashsiz.", order: 4 },
  { tier: "Bronze I", category: "Arts", title: "School performance", titleUz: "Maktab tadbirida ishtirok", description: "Appeared in a school concert, play or exhibition.", descriptionUz: "Maktab konserti, spektakli yoki ko'rgazmasida qatnashgan.", order: 5 },

  // --- Bronze II: sustained involvement ------------------------------------
  { tier: "Bronze II", category: "Leadership", title: "Committee member", titleUz: "Qo'mita a'zosi", description: "Named role in a club: treasurer, secretary, section lead.", descriptionUz: "To'garakda aniq lavozim: xazinachi, kotib, bo'lim boshlig'i.", order: 1 },
  { tier: "Bronze II", category: "Service", title: "Weekly volunteering", titleUz: "Haftalik ko'ngillilik", description: "A standing commitment over at least one school year.", descriptionUz: "Kamida bir o'quv yili davomida doimiy majburiyat.", order: 2 },
  { tier: "Bronze II", category: "STEM", title: "National Honor Society", titleUz: "NHS a'zoligi", description: "Selected on grades and service; membership, not office.", descriptionUz: "Baho va xizmat asosida tanlangan a'zolik.", order: 3 },
  { tier: "Bronze II", category: "STEM", title: "Science fair entrant", titleUz: "Ilmiy ko'rgazma ishtirokchisi", description: "Completed and presented an independent project.", descriptionUz: "Mustaqil loyihani tugatib, taqdim etgan.", order: 4 },
  { tier: "Bronze II", category: "Research", title: "Summer programme", titleUz: "Yozgi dastur", description: "Attended a competitive academic summer programme.", descriptionUz: "Tanlov asosidagi yozgi akademik dasturda qatnashgan.", order: 5 },

  // --- Silver: leadership and local impact --------------------------------
  { tier: "Silver", category: "Leadership", title: "Club president", titleUz: "To'garak rahbari", description: "Runs a club: sets the programme, recruits, answers for it.", descriptionUz: "To'garakni boshqaradi: dastur tuzadi, a'zo yig'adi, javob beradi.", order: 1 },
  { tier: "Silver", category: "Leadership", title: "Founded a school club", titleUz: "Maktabda to'garak ochgan", description: "Started something that outlived your first year running it.", descriptionUz: "Siz ketganingizdan keyin ham davom etgan narsani boshlagan.", order: 2 },
  { tier: "Silver", category: "STEM", title: "Regional olympiad placement", titleUz: "Viloyat olimpiadasida o'rin", description: "Top three at regional level in a subject olympiad.", descriptionUz: "Fan olimpiadasida viloyat bosqichida uchlikda.", order: 3 },
  { tier: "Silver", category: "Service", title: "Organised a local project", titleUz: "Mahalliy loyiha tashkil qilgan", description: "Planned and delivered something with a measurable result.", descriptionUz: "O'lchanadigan natijasi bor ishni rejalab, amalga oshirgan.", order: 4 },
  { tier: "Silver", category: "Athletics", title: "Regional competitor", titleUz: "Viloyat darajasidagi sportchi", description: "Selected to represent a school or city beyond school level.", descriptionUz: "Maktab yoki shaharni maktabdan yuqori darajada vakillik qilgan.", order: 5 },
  { tier: "Silver", category: "Arts", title: "Published or exhibited", titleUz: "Nashr etilgan yoki ko'rgazmada", description: "Work chosen by an editor or curator outside your school.", descriptionUz: "Maktabdan tashqari muharrir yoki kurator tanlagan ish.", order: 6 },

  // --- Gold: distinction beyond the school --------------------------------
  { tier: "Gold", category: "STEM", title: "National olympiad medal", titleUz: "Respublika olimpiadasi medali", description: "Placed at the national round of a subject olympiad.", descriptionUz: "Fan olimpiadasining respublika bosqichida o'rin olgan.", order: 1 },
  { tier: "Gold", category: "Research", title: "Published research", titleUz: "Chop etilgan tadqiqot", description: "Named on a paper, preprint or conference poster.", descriptionUz: "Maqola, preprint yoki konferentsiya posterida muallif sifatida.", order: 2 },
  { tier: "Gold", category: "Leadership", title: "Founded a registered organisation", titleUz: "Rasmiy tashkilot tuzgan", description: "A non-profit or initiative with real structure and funding.", descriptionUz: "Haqiqiy tuzilmasi va mablag'i bor notijorat tashabbus.", order: 3 },
  { tier: "Gold", category: "Service", title: "Project with measured reach", titleUz: "O'lchangan qamrovli loyiha", description: "Hundreds of people served, with numbers you can defend.", descriptionUz: "Yuzlab odamga yetgan, raqamlari isbotlanadigan loyiha.", order: 4 },
  { tier: "Gold", category: "Arts", title: "National competition finalist", titleUz: "Respublika tanlovi finalisti", description: "Reached the final of a juried national competition.", descriptionUz: "Hakamlar hay'ati bor respublika tanlovi finaliga chiqqan.", order: 5 },

  // --- Platinum: national or international recognition --------------------
  { tier: "Platinum", category: "STEM", title: "International olympiad team", titleUz: "Xalqaro olimpiada terma jamoasi", description: "Selected for a national team at IMO, IOI, IPhO and the like.", descriptionUz: "IMO, IOI, IPhO kabi olimpiadalarga terma jamoaga tanlangan.", order: 1 },
  { tier: "Platinum", category: "Research", title: "First-author publication", titleUz: "Birinchi muallif sifatida nashr", description: "Led the work on a peer-reviewed paper.", descriptionUz: "Taqrizdan o'tgan maqolada asosiy muallif bo'lgan.", order: 2 },
  { tier: "Platinum", category: "Leadership", title: "National-scale initiative", titleUz: "Respublika miqyosidagi tashabbus", description: "Built something that operates across the country.", descriptionUz: "Butun mamlakat bo'ylab ishlaydigan narsa qurgan.", order: 3 },
  { tier: "Platinum", category: "Arts", title: "International recognition", titleUz: "Xalqaro e'tirof", description: "Award, exhibition or performance outside your country.", descriptionUz: "Mamlakatdan tashqarida mukofot, ko'rgazma yoki chiqish.", order: 4 },
];
