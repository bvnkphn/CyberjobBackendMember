/**
 * Smart Matching Engine (Owner Feature 5)
 * คะแนนความเข้ากันระหว่างเรซูเม่กับประกาศงาน 0–100 จากการจับคู่คำสำคัญและเงื่อนไข
 *   ทักษะ 40 · ตำแหน่ง 25 · อายุงาน 20 · เงินเดือน 15
 * ทุกคะแนนมีคำอธิบายประกอบ (Matching Explanation) เพื่อให้เห็นที่มาของตัวเลข
 */

export interface MatchCandidate {
  skills: string[];
  positions: string[];
  experienceYears: number;
  salary: { min: number; max: number | null } | null;
}

export interface MatchJob {
  id: string;
  title: string;
  skills: string[];
  experienceYears: number | null;
  salaryMin: number;
  salaryMax: number;
}

export interface MatchFactor {
  key: "skills" | "position" | "experience" | "salary";
  label: string;
  score: number;
  max: number;
  detail: string;
}

export interface MatchResult {
  score: number;
  job: { id: string; title: string };
  factors: MatchFactor[];
  explanation: string[];
}

const WEIGHTS = { skills: 40, position: 25, experience: 20, salary: 15 } as const;

/** คำไทยที่มักอยู่ในตำแหน่งงาน → คำอังกฤษ เพื่อให้ "นักพัฒนา Backend" จับคู่กับ "Backend Developer" ได้ */
const THAI_TERMS: Array<[string, string[]]> = [
  ["นักพัฒนา", ["developer"]],
  ["วิศวกร", ["engineer"]],
  ["นักวิเคราะห์", ["analyst"]],
  ["ความปลอดภัย", ["security"]],
  ["ไซเบอร์", ["cyber", "security"]],
  ["ข้อมูล", ["data"]],
  ["เครือข่าย", ["network"]],
  ["ระบบ", ["system"]],
  ["ผู้ดูแล", ["admin"]],
  ["ผู้เชี่ยวชาญ", ["specialist"]],
  ["ซอฟต์แวร์", ["software"]],
  ["ออกแบบ", ["designer"]],
  ["การตลาด", ["marketing"]],
];

const STOP_WORDS = new Set(["and", "the", "of", "for", "จำกัด"]);

function normalise(value: string): string {
  return value.toLowerCase().replace(/[()\[\]/.,:+]/g, " ").replace(/\s+/g, " ").trim();
}

function tokens(value: string): Set<string> {
  const lower = value.toLowerCase();
  const result = new Set(
    normalise(value)
      .split(" ")
      .filter((token) => token.length >= 2 && !STOP_WORDS.has(token) && /[a-z0-9]/.test(token)),
  );
  for (const [thai, english] of THAI_TERMS) {
    if (lower.includes(thai)) english.forEach((word) => result.add(word));
  }
  return result;
}

function skillMatches(jobSkill: string, candidateSkills: string[]): boolean {
  const target = normalise(jobSkill);
  return candidateSkills.some((skill) => {
    const own = normalise(skill);
    return own === target || (target.length >= 3 && own.includes(target)) || (own.length >= 3 && target.includes(own));
  });
}

const baht = (value: number) => value.toLocaleString("th-TH");

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

export function matchCandidateToJob(candidate: MatchCandidate, job: MatchJob): MatchResult {
  const factors: MatchFactor[] = [];

  // ---- ทักษะ ----
  if (job.skills.length) {
    const matched = job.skills.filter((skill) => skillMatches(skill, candidate.skills));
    const missing = job.skills.filter((skill) => !matched.includes(skill));
    factors.push({
      key: "skills",
      label: "ทักษะ",
      score: round((matched.length / job.skills.length) * WEIGHTS.skills),
      max: WEIGHTS.skills,
      detail: matched.length
        ? `มีทักษะที่ประกาศต้องการ ${matched.length}/${job.skills.length} (${matched.join(", ")})${missing.length ? ` ยังขาด ${missing.join(", ")}` : ""}`
        : `ยังไม่มีทักษะที่ประกาศต้องการ (${job.skills.join(", ")})`,
    });
  } else {
    factors.push({ key: "skills", label: "ทักษะ", score: WEIGHTS.skills / 2, max: WEIGHTS.skills, detail: "ประกาศงานไม่ได้ระบุทักษะ ให้คะแนนครึ่งหนึ่ง" });
  }

  // ---- ตำแหน่ง ----
  const jobTokens = tokens(job.title);
  const candidateTokens = new Set(candidate.positions.flatMap((position) => [...tokens(position)]));
  const overlap = [...jobTokens].filter((token) => candidateTokens.has(token));
  const positionRatio = jobTokens.size ? Math.min(1, overlap.length / Math.min(jobTokens.size, 2)) : 0;
  factors.push({
    key: "position",
    label: "ตำแหน่งงาน",
    score: round(positionRatio * WEIGHTS.position),
    max: WEIGHTS.position,
    detail: candidate.positions.length
      ? positionRatio > 0
        ? `ตำแหน่งที่ต้องการ "${candidate.positions[0]}" ใกล้เคียงกับ "${job.title}"`
        : `ตำแหน่งที่ต้องการ "${candidate.positions[0]}" ไม่ตรงกับ "${job.title}"`
      : "ผู้สมัครยังไม่ได้ระบุตำแหน่งที่ต้องการ",
  });

  // ---- อายุงาน ----
  const required = job.experienceYears ?? 0;
  const experienceRatio = required <= 0 ? 1 : Math.min(1, candidate.experienceYears / required);
  factors.push({
    key: "experience",
    label: "อายุงาน",
    score: round(experienceRatio * WEIGHTS.experience),
    max: WEIGHTS.experience,
    detail:
      required <= 0
        ? "ประกาศไม่กำหนดประสบการณ์ขั้นต่ำ"
        : candidate.experienceYears >= required
          ? `มีประสบการณ์ ${candidate.experienceYears} ปี ครบตามที่ต้องการ ${required} ปี`
          : `มีประสบการณ์ ${candidate.experienceYears} ปี น้อยกว่าที่ต้องการ ${required} ปี`,
  });

  // ---- เงินเดือน ----
  let salaryScore: number;
  let salaryDetail: string;
  if (!candidate.salary) {
    salaryScore = WEIGHTS.salary / 2;
    salaryDetail = "ผู้สมัครไม่ได้ระบุเงินเดือนที่คาดหวัง ให้คะแนนครึ่งหนึ่ง";
  } else if (candidate.salary.min <= job.salaryMax) {
    salaryScore = WEIGHTS.salary;
    salaryDetail = `เงินเดือนที่คาดหวังเริ่มต้น ${baht(candidate.salary.min)} บาท อยู่ในงบ ${baht(job.salaryMin)}–${baht(job.salaryMax)} บาท`;
  } else {
    const over = (candidate.salary.min - job.salaryMax) / Math.max(job.salaryMax, 1);
    salaryScore = Math.max(0, WEIGHTS.salary * (1 - over * 2));
    salaryDetail = `เงินเดือนที่คาดหวัง ${baht(candidate.salary.min)} บาท สูงกว่างบสูงสุด ${baht(job.salaryMax)} บาท`;
  }
  factors.push({ key: "salary", label: "เงินเดือน", score: round(salaryScore), max: WEIGHTS.salary, detail: salaryDetail });

  const score = Math.round(factors.reduce((sum, factor) => sum + factor.score, 0));
  return {
    score,
    job: { id: job.id, title: job.title },
    factors,
    explanation: factors.map((factor) => `${factor.label} ${factor.score}/${factor.max}: ${factor.detail}`),
  };
}

/** เทียบกับทุกประกาศที่เปิดรับอยู่ แล้วคืนประกาศที่เข้ากันที่สุด */
export function bestMatch(candidate: MatchCandidate, jobs: MatchJob[]): MatchResult | null {
  let best: MatchResult | null = null;
  for (const job of jobs) {
    const result = matchCandidateToJob(candidate, job);
    if (!best || result.score > best.score) best = result;
  }
  return best;
}
