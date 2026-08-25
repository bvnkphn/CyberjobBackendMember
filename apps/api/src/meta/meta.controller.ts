import { Controller, Get } from '@nestjs/common';
import {
  CATEGORY_TREE,
  EMPLOYMENT_TYPES,
  EXPERIENCE_LEVELS,
  POSTED_WITHIN,
  PROVINCES,
  REGION_TREE,
  SALARY_RANGE,
  SORTS,
  WORK_STYLES,
} from '@cyberjob/shared';
import type { FilterMeta, TreeNode } from '@cyberjob/shared';

@Controller('meta')
export class MetaController {
  /** GET /api/meta/filters – ตัวเลือกทั้งหมดของแผงกรอง (Feature 3.1 + 3.2) */
  @Get('filters')
  filters(): FilterMeta {
    return {
      categoryTree: CATEGORY_TREE,
      regionTree: REGION_TREE,
      workStyles: WORK_STYLES,
      employmentTypes: EMPLOYMENT_TYPES,
      experienceLevels: EXPERIENCE_LEVELS,
      postedWithin: POSTED_WITHIN,
      sorts: SORTS,
      salary: SALARY_RANGE,
    };
  }

  /** GET /api/meta/categories – สาขาอาชีพแบบต้นไม้ */
  @Get('categories')
  categories(): TreeNode[] {
    return CATEGORY_TREE;
  }

  /** GET /api/meta/regions – ภาค → จังหวัด */
  @Get('regions')
  regions(): TreeNode[] {
    return REGION_TREE;
  }

  /** GET /api/meta/provinces – รายชื่อจังหวัดทั้งหมด */
  @Get('provinces')
  provinces(): string[] {
    return PROVINCES;
  }
}
