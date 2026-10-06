import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AdminCompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(status?: string, search?: string, page = 1, pageSize = 20) {
    const where: any = {};
    if (status && status !== "ALL") {
      where.verificationStatus = status;
    }
    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { legalName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { province: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, items, pendingCount, approvedCount, rejectedCount] = await Promise.all([
      this.prisma.company.count({ where }),
      this.prisma.company.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          owner: {
            select: { id: true, name: true, email: true, code: true },
          },
        },
      }),
      this.prisma.company.count({ where: { verificationStatus: "PENDING" } }),
      this.prisma.company.count({ where: { verificationStatus: "APPROVED" } }),
      this.prisma.company.count({ where: { verificationStatus: "REJECTED" } }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      counts: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        total: pendingCount + approvedCount + rejectedCount,
      },
    };
  }

  async detail(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true, code: true },
        },
        jobs: {
          select: { id: true, title: true, status: true, postedAt: true, isActive: true },
          take: 10,
        },
      },
    });
    if (!company) throw new NotFoundException("ไม่พบข้อมูลบริษัท");
    return company;
  }

  async verify(id: string, action: "APPROVED" | "REJECTED", notes?: string) {
    const isApproved = action === "APPROVED";
    return this.prisma.company.update({
      where: { id },
      data: {
        verificationStatus: action,
        verified: isApproved,
        updatedAt: new Date(),
      },
    });
  }
}
