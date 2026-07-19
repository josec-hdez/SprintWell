/**
 * Prisma seed (issue #42) — an admin plus a ready-to-plan demo dataset that
 * makes the equity comparison compelling.
 *
 * The dataset mirrors the "Apollo" case study (thesis ch. 7,
 * benchmarks/instances/case-study.json): 10 members, 24 tasks and 16 rules,
 * designed so the three equity modes give *different* plans. In particular the
 * junior, **Hugo**, improves under max-min / Nash versus utilitarian — the
 * "equity matters" story the demo and video rely on.
 *
 * Passwords are hashed with **argon2** (the verifier LoginUseCase uses), so the
 * seeded users can log in. The seed is **idempotent**: it wipes the demo domain
 * data and repopulates it, then upserts the admin. Manually created data is
 * reset on each run — this is a demo seed by design.
 *
 * Run with: `npm run prisma:seed` (after `prisma migrate deploy`).
 * Login: admin@sprintwell.local / changeme · members: <name>@sprintwell.local / changeme
 */
import * as argon2 from 'argon2';

import { Prisma, PrismaClient, Role, RuleType, TaskCategory, TaskStatus } from '@prisma/client';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@sprintwell.local';
const DEV_PASSWORD = 'changeme';

// --- Demo dataset (Apollo case study) --------------------------------------

const SKILLS = ['backend', 'frontend', 'mobile', 'devops', 'qa', 'design', 'data', 'security'];
const skillId = (name: string): string => `s-${name}`;

interface DemoMember {
  key: string;
  name: string;
  skills: Array<[string, number]>; // [skill, level]
}

const MEMBERS: DemoMember[] = [
  {
    key: 'ana',
    name: 'Ana Restrepo',
    skills: [
      ['backend', 5],
      ['security', 4],
      ['data', 3],
    ],
  },
  {
    key: 'beto',
    name: 'Beto Salas',
    skills: [
      ['frontend', 5],
      ['design', 3],
    ],
  },
  {
    key: 'carla',
    name: 'Carla Méndez',
    skills: [
      ['mobile', 5],
      ['frontend', 3],
      ['design', 3],
    ],
  },
  {
    key: 'diego',
    name: 'Diego Fuentes',
    skills: [
      ['devops', 5],
      ['security', 4],
      ['backend', 3],
    ],
  },
  {
    key: 'elena',
    name: 'Elena Park',
    skills: [
      ['qa', 5],
      ['backend', 2],
    ],
  },
  {
    key: 'faruk',
    name: 'Faruk Aydın',
    skills: [
      ['data', 5],
      ['backend', 3],
      ['frontend', 2],
    ],
  },
  {
    key: 'gabi',
    name: 'Gabi Torres',
    skills: [
      ['design', 5],
      ['frontend', 3],
    ],
  },
  {
    key: 'hugo',
    name: 'Hugo Lima',
    skills: [
      ['frontend', 3],
      ['backend', 2],
    ],
  },
  {
    key: 'ines',
    name: 'Inés Ferrer',
    skills: [
      ['security', 5],
      ['devops', 4],
    ],
  },
  {
    key: 'jon',
    name: 'Jon Okafor',
    skills: [
      ['backend', 4],
      ['data', 3],
      ['qa', 3],
    ],
  },
];
const userId = (key: string): string => `u-${key}`;
const userEmail = (key: string): string => `${key}@sprintwell.local`;

interface DemoTask {
  key: string;
  name: string;
  effort: number;
  category: TaskCategory;
  domain: string;
  deadline?: number;
  skills?: string[];
  deps?: string[];
}

const SPRINT_ID = 'sprint-apollo';
const TASKS: DemoTask[] = [
  {
    key: 'api-auth',
    name: 'OAuth login API',
    effort: 3,
    category: 'FEATURE',
    domain: 'auth',
    deadline: 8,
    skills: ['backend', 'security'],
  },
  {
    key: 'ui-auth',
    name: 'Login screen',
    effort: 2,
    category: 'FEATURE',
    domain: 'auth',
    skills: ['frontend'],
    deps: ['api-auth'],
  },
  {
    key: 'mobile-auth',
    name: 'Mobile login flow',
    effort: 2,
    category: 'FEATURE',
    domain: 'mobile',
    skills: ['mobile'],
    deps: ['api-auth'],
  },
  {
    key: 'api-billing',
    name: 'Billing charge API',
    effort: 3,
    category: 'FEATURE',
    domain: 'billing',
    deadline: 10,
    skills: ['backend'],
  },
  {
    key: 'ui-billing',
    name: 'Billing dashboard',
    effort: 3,
    category: 'FEATURE',
    domain: 'billing',
    skills: ['frontend'],
    deps: ['api-billing'],
  },
  {
    key: 'billing-bug',
    name: 'Fix double-charge bug',
    effort: 2,
    category: 'BUG',
    domain: 'billing',
    deadline: 5,
    skills: ['backend'],
  },
  {
    key: 'payments-api',
    name: 'Payments webhook',
    effort: 2,
    category: 'FEATURE',
    domain: 'payments',
    skills: ['backend', 'security'],
  },
  {
    key: 'payments-recon',
    name: 'Reconciliation job',
    effort: 2,
    category: 'FEATURE',
    domain: 'payments',
    skills: ['data', 'backend'],
  },
  {
    key: 'data-pipeline',
    name: 'Events ETL pipeline',
    effort: 3,
    category: 'FEATURE',
    domain: 'data',
    skills: ['data'],
  },
  {
    key: 'data-dashboard',
    name: 'Analytics dashboard',
    effort: 2,
    category: 'FEATURE',
    domain: 'data',
    skills: ['data', 'frontend'],
    deps: ['data-pipeline'],
  },
  {
    key: 'infra-k8s',
    name: 'Migrate to k8s',
    effort: 3,
    category: 'INFRA',
    domain: 'infra',
    skills: ['devops'],
  },
  {
    key: 'infra-ci',
    name: 'Speed up CI',
    effort: 2,
    category: 'INFRA',
    domain: 'infra',
    skills: ['devops'],
  },
  {
    key: 'infra-secrets',
    name: 'Secrets rotation',
    effort: 2,
    category: 'INFRA',
    domain: 'infra',
    skills: ['devops', 'security'],
  },
  {
    key: 'sre-alerts',
    name: 'Tune alerting rules',
    effort: 2,
    category: 'SRE',
    domain: 'infra',
    skills: ['devops'],
  },
  {
    key: 'sre-runbook',
    name: 'On-call runbook',
    effort: 1,
    category: 'ON_CALL',
    domain: 'infra',
    skills: ['devops'],
  },
  {
    key: 'sec-audit',
    name: 'Security audit',
    effort: 3,
    category: 'RESEARCH',
    domain: 'auth',
    deadline: 12,
    skills: ['security'],
  },
  {
    key: 'sec-pentest',
    name: 'Pen-test fixes',
    effort: 2,
    category: 'BUG',
    domain: 'auth',
    skills: ['security', 'backend'],
    deps: ['sec-audit'],
  },
  {
    key: 'qa-regression',
    name: 'Regression suite',
    effort: 3,
    category: 'BUG',
    domain: 'billing',
    skills: ['qa'],
  },
  {
    key: 'qa-e2e',
    name: 'E2E test harness',
    effort: 2,
    category: 'BUG',
    domain: 'payments',
    skills: ['qa', 'backend'],
  },
  {
    key: 'design-system',
    name: 'Design system v2',
    effort: 3,
    category: 'FEATURE',
    domain: 'mobile',
    skills: ['design'],
  },
  {
    key: 'design-mobile',
    name: 'Mobile UI polish',
    effort: 2,
    category: 'FEATURE',
    domain: 'mobile',
    skills: ['design', 'mobile'],
    deps: ['design-system'],
  },
  {
    key: 'docs-api',
    name: 'API reference docs',
    effort: 1,
    category: 'DOCS',
    domain: 'auth',
    skills: ['backend'],
  },
  {
    key: 'docs-onboard',
    name: 'Onboarding guide',
    effort: 1,
    category: 'DOCS',
    domain: 'infra',
    skills: [],
  },
  {
    key: 'research-ml',
    name: 'ML ranking spike',
    effort: 2,
    category: 'RESEARCH',
    domain: 'data',
    skills: ['data'],
  },
];
const taskId = (key: string): string => `t-${key}`;

interface DemoRule {
  owner: string;
  type: RuleType;
  params: Record<string, unknown>;
  weight: number;
  isHard?: boolean;
}

const RULES: DemoRule[] = [
  { owner: 'ana', type: 'PREFER_CATEGORY', params: { category: 'feature' }, weight: 40 },
  { owner: 'ana', type: 'MAX_TASKS_PER_SPRINT', params: { max_tasks: 4 }, weight: 50 },
  { owner: 'beto', type: 'PREFER_DOMAIN', params: { domain: 'billing' }, weight: 45 },
  { owner: 'beto', type: 'AVOID_WEEKDAY', params: { weekday: 'friday' }, weight: 30 },
  { owner: 'carla', type: 'PREFER_SKILL', params: { skill_id: skillId('mobile') }, weight: 50 },
  { owner: 'carla', type: 'FOCUS_PREFERENCE', params: {}, weight: 35 },
  { owner: 'diego', type: 'PREFER_CATEGORY', params: { category: 'infra' }, weight: 50 },
  {
    owner: 'diego',
    type: 'BLACKOUT_DATE',
    params: { dates: ['2026-05-12'] },
    weight: 0,
    isHard: true,
  },
  { owner: 'elena', type: 'PREFER_CATEGORY', params: { category: 'bug' }, weight: 55 },
  { owner: 'elena', type: 'MAX_TASKS_PER_SPRINT', params: { max_tasks: 5 }, weight: 40 },
  { owner: 'faruk', type: 'PREFER_DOMAIN', params: { domain: 'data' }, weight: 50 },
  { owner: 'gabi', type: 'PREFER_SKILL', params: { skill_id: skillId('design') }, weight: 50 },
  {
    owner: 'hugo',
    type: 'LEARN_SKILL',
    params: { skill_id: skillId('devops'), min_tasks: 2 },
    weight: 45,
  },
  { owner: 'ines', type: 'PREFER_CATEGORY', params: { category: 'sre' }, weight: 45 },
  {
    owner: 'ines',
    type: 'COOLDOWN_AFTER',
    params: { after_category: 'on_call', rest_days: 1 },
    weight: 30,
  },
  { owner: 'jon', type: 'PREFER_WEEKDAY', params: { weekday: 'monday' }, weight: 35 },
  { owner: 'jon', type: 'AVOID_CATEGORY', params: { category: 'docs' }, weight: 30 },
];

// --- Seed -------------------------------------------------------------------

async function resetDemoData(): Promise<void> {
  // Order respects foreign keys (children first). Sprint/User deletes cascade
  // to tasks, planning runs, assignments and user-skills.
  await prisma.rule.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.planningRun.deleteMany();
  await prisma.task.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.userSkill.deleteMany();
  await prisma.user.deleteMany({ where: { email: { not: ADMIN_EMAIL } } });
  await prisma.skill.deleteMany();
}

async function main(): Promise<void> {
  const passwordHash = await argon2.hash(DEV_PASSWORD);

  await resetDemoData();

  // Admin.
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { passwordHash },
    create: { email: ADMIN_EMAIL, name: 'Admin', passwordHash, role: Role.ADMIN },
  });

  // Skills.
  await prisma.skill.createMany({ data: SKILLS.map((name) => ({ id: skillId(name), name })) });

  // Members + their skill levels.
  for (const member of MEMBERS) {
    await prisma.user.create({
      data: {
        id: userId(member.key),
        email: userEmail(member.key),
        name: member.name,
        passwordHash,
        role: Role.MEMBER,
        skills: {
          create: member.skills.map(([name, level]) => ({ skillId: skillId(name), level })),
        },
      },
    });
  }

  // Sprint.
  await prisma.sprint.create({
    data: {
      id: SPRINT_ID,
      name: 'Apollo — Sprint 14',
      startDate: new Date('2026-05-04'),
      durationDays: 15,
    },
  });

  // Tasks (created first without dependencies).
  for (const task of TASKS) {
    await prisma.task.create({
      data: {
        id: taskId(task.key),
        sprintId: SPRINT_ID,
        name: task.name,
        effortDays: task.effort,
        category: task.category,
        domain: task.domain,
        deadlineDay: task.deadline ?? null,
        status: TaskStatus.TODO,
        requiredSkills: { connect: (task.skills ?? []).map((s) => ({ id: skillId(s) })) },
      },
    });
  }

  // Dependencies (second pass, now that every task exists).
  for (const task of TASKS.filter((t) => t.deps && t.deps.length > 0)) {
    await prisma.task.update({
      where: { id: taskId(task.key) },
      data: { dependsOn: { connect: (task.deps ?? []).map((d) => ({ id: taskId(d) })) } },
    });
  }

  // Member rules.
  for (const rule of RULES) {
    await prisma.rule.create({
      data: {
        ownerId: userId(rule.owner),
        type: rule.type,
        params: rule.params as Prisma.InputJsonValue,
        weight: rule.weight,
        isHard: rule.isHard ?? false,
      },
    });
  }

  console.log(
    `Seeded: admin + ${String(MEMBERS.length)} members, ${String(SKILLS.length)} skills, ` +
      `1 sprint with ${String(TASKS.length)} tasks, ${String(RULES.length)} rules.`,
  );
  console.log(
    `Login: ${ADMIN_EMAIL} / ${DEV_PASSWORD}  ·  members: <name>@sprintwell.local / ${DEV_PASSWORD}`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
