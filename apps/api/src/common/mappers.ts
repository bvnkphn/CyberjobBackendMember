import {
  EmploymentType as PrismaEmploymentType,
  ExperienceLevel as PrismaExperienceLevel,
  WorkStyle as PrismaWorkStyle,
  type Company as CompanyRow,
  type Job as JobRow,
  type JobQuestion as JobQuestionRow,
} from '@prisma/client';
import type {
  Company,
  EmploymentType,
  ExperienceLevel,
  Job,
  WorkStyle,
} from '@cyberjob/shared';

/* ------------------------------------------------------------------ */
/* enum: Prisma  ⇄  shared                                             */
/* ------------------------------------------------------------------ */

const WORK_STYLE_TO_API: Record<PrismaWorkStyle, WorkStyle> = {
  ONSITE: 'onsite',
  HYBRID: 'hybrid',
  REMOTE: 'remote',
};

const WORK_STYLE_TO_DB: Record<WorkStyle, PrismaWorkStyle> = {
  onsite: 'ONSITE',
  hybrid: 'HYBRID',
  remote: 'REMOTE',
};

const EMPLOYMENT_TO_API: Record<PrismaEmploymentType, EmploymentType> = {
  FULLTIME: 'fulltime',
  PARTTIME: 'parttime',
  CONTRACT: 'contract',
  TEMPORARY: 'temporary',
  INTERNSHIP: 'internship',
};

const EMPLOYMENT_TO_DB: Record<EmploymentType, PrismaEmploymentType> = {
  fulltime: 'FULLTIME',
  parttime: 'PARTTIME',
  contract: 'CONTRACT',
  temporary: 'TEMPORARY',
  internship: 'INTERNSHIP',
};

const EXPERIENCE_TO_API: Record<PrismaExperienceLevel, ExperienceLevel> = {
  NONE: '0',
  ONE_TWO: '1-2',
  THREE_FIVE: '3-5',
  SIX_TEN: '6-10',
  TEN_PLUS: '10+',
};

const EXPERIENCE_TO_DB: Record<ExperienceLevel, PrismaExperienceLevel> = {
  '0': 'NONE',
  '1-2': 'ONE_TWO',
  '3-5': 'THREE_FIVE',
  '6-10': 'SIX_TEN',
  '10+': 'TEN_PLUS',
};

export const toDbWorkStyle = (v: WorkStyle) => WORK_STYLE_TO_DB[v];
export const toDbEmploymentType = (v: EmploymentType) => EMPLOYMENT_TO_DB[v];
export const toDbExperienceLevel = (v: ExperienceLevel) => EXPERIENCE_TO_DB[v];

/* ------------------------------------------------------------------ */
/* row → DTO ที่ frontend ใช้ (ตรงกับ types ใน @cyberjob/shared)         */
/* ------------------------------------------------------------------ */

export function toCompanyDto(row: CompanyRow): Company {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    legalName: row.legalName,
    logoText: row.logoText,
    logoColor: row.logoColor,
    verified: row.verified,
    businessType: row.businessType,
    employeeCount: row.employeeCount ?? undefined,
    about: row.about,
    contact: {
      email: row.email,
      phone: row.phone,
      website: row.website,
      address: row.address,
    },
    province: row.province,
    district: row.district ?? undefined,
    coverImage: row.coverImage ?? undefined,
    gallery: row.gallery,
    logoUrl: row.logoUrl ?? undefined,
    location:
      row.lat !== null && row.lng !== null
        ? { lat: row.lat, lng: row.lng }
        : undefined,
  };
}

export const QUESTION_TYPE_TO_API = {
  SINGLE: 'single',
  DATE: 'date',
  SHORT: 'short',
  MULTI: 'multi',
  LONG: 'long',
} as const;

export function toJobDto(
  row: JobRow & { company: CompanyRow; questions?: JobQuestionRow[] },
): Job {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    company: toCompanyDto(row.company),
    category: row.category,
    subcategory: row.subcategory ?? undefined,
    province: row.province,
    district: row.district ?? undefined,
    workStyle: WORK_STYLE_TO_API[row.workStyle],
    employmentType: EMPLOYMENT_TO_API[row.employmentType],
    experienceLevel: EXPERIENCE_TO_API[row.experienceLevel],
    salaryMin: row.salaryMin,
    salaryMax: row.salaryMax,
    salaryNegotiable: row.salaryNegotiable,
    postedAt: row.postedAt.toISOString(),
    isUrgent: row.isUrgent,
    summary: row.summary,
    description: row.description,
    requirements: row.requirements,
    additionalQualifications: row.additionalQualifications,
    employerAnswers: row.employerAnswers,
    benefits: row.benefits,
    skills: row.skills,
    openings: row.openings,
    coverImage: row.coverImage ?? undefined,
    questions: row.questions?.map((question) => ({
      id: question.id,
      type: QUESTION_TYPE_TO_API[question.type],
      text: question.text,
      options: question.options,
      required: question.required,
    })),
  };
}
