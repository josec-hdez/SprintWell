/**
 * AUTO-GENERATED from shared/openapi.json by scripts/generate-api.ts.
 * Do not edit by hand — run `npm run generate:api` to refresh.
 */

export interface paths {
    "/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["AuthController_loginUser"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["HealthController_check"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/members": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["MembersController_list"];
        put?: never;
        post: operations["MembersController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/members/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["MembersController_remove"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/members/{id}/skills": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["MembersController_assign"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/skills": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["SkillsController_list"];
        put?: never;
        post: operations["SkillsController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/skills/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["SkillsController_remove"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/sprints": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["SprintPublicController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/sprints/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["SprintPublicController_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/sprints": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["SprintAdminController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/sprints/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["SprintAdminController_remove"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/sprints/{id}/tasks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["SprintAdminController_addSprintTask"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/sprints/{id}/tasks/{taskId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["SprintAdminController_removeSprintTask"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/sprints/{id}/tasks/{taskId}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["SprintAdminController_changeStatus"];
        trace?: never;
    };
    "/tasks/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["TaskStatusController_changeStatus"];
        trace?: never;
    };
    "/me/tasks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["MyTasksController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/rules": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["MemberRulesController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/rules/conflicts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["MemberRulesController_conflicts"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/rules/{ruleId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["MemberRulesController_upsert"];
        post?: never;
        delete: operations["MemberRulesController_remove"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/members/{ownerId}/rules/{ruleId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["AdminRulesController_upsert"];
        post?: never;
        delete: operations["AdminRulesController_remove"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/members/{ownerId}/rules": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["PublicRulesController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/sprints/{sprintId}/planning-runs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["PlanningAdminController_launch"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/planning-runs/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["PlanningPublicController_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/sprints/{sprintId}/planning-runs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["PlanningPublicController_listForSprint"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        LoginDto: {
            /**
             * Format: email
             * @example admin@sprintwell.dev
             */
            email: string;
            /** @example correct horse battery staple */
            password: string;
        };
        LoginResponseDto: {
            /** @description Signed JWT for the Authorization: Bearer header. */
            accessToken: string;
        };
        CreateMemberDto: {
            /**
             * Format: email
             * @example alice@example.com
             */
            email: string;
            /** @example Alice */
            name: string;
            /**
             * @example MEMBER
             * @enum {string}
             */
            role: "MEMBER" | "ADMIN";
            /** @example changeme123 */
            initialPassword: string;
        };
        MemberResponseDto: {
            id: string;
            email: string;
            name: string;
            role: string;
        };
        AssignSkillDto: {
            /** @example skill-uuid */
            skillId: string;
            /** @example 3 */
            level: number;
        };
        CreateSkillDto: {
            /** @example Python */
            name: string;
        };
        SkillResponseDto: {
            id: string;
            name: string;
        };
        TaskResponseDto: {
            id: string;
            name: string;
            effortDays: number;
            category: string;
            domain: string;
            deadlineDay: number | null;
            requiredSkills: string[];
            dependsOn: string[];
            status: string;
        };
        SprintResponseDto: {
            id: string;
            name: string;
            startDate: string;
            durationDays: number;
            tasks: components["schemas"]["TaskResponseDto"][];
        };
        CreateSprintDto: {
            /** @example Sprint 12 */
            name: string;
            /**
             * @description ISO date (YYYY-MM-DD).
             * @example 2026-05-04
             */
            startDate: string;
            /** @example 10 */
            durationDays: number;
        };
        AddTaskDto: {
            /** @example Implement login */
            name: string;
            /** @example 2 */
            effortDays: number;
            /**
             * @example FEATURE
             * @enum {string}
             */
            category: "FEATURE" | "BUG" | "INFRA" | "SRE" | "ON_CALL" | "DOCS" | "RESEARCH";
            /** @example auth */
            domain: string;
            /** @example 4 */
            deadlineDay?: number;
            /**
             * @example [
             *       "skill-1"
             *     ]
             */
            requiredSkills?: string[];
            /**
             * @example [
             *       "task-1"
             *     ]
             */
            dependsOn?: string[];
        };
        ChangeTaskStatusDto: {
            /**
             * @example IN_PROGRESS
             * @enum {string}
             */
            status: "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED";
        };
        MyTaskResponseDto: {
            sprintId: string;
            sprintName: string;
            taskId: string;
            taskName: string;
            category: string;
            effortDays: number;
            startDay: number;
            status: string;
        };
        UpsertRuleDto: {
            /**
             * @example PREFER_CATEGORY
             * @enum {string}
             */
            type: "PREFER_SKILL" | "AVOID_SKILL" | "PREFER_CATEGORY" | "AVOID_CATEGORY" | "PREFER_DOMAIN" | "PREFER_WEEKDAY" | "AVOID_WEEKDAY" | "BLACKOUT_DATE" | "MAX_TASKS_PER_SPRINT" | "FOCUS_PREFERENCE" | "COOLDOWN_AFTER" | "LEARN_SKILL";
            /**
             * @example {
             *       "category": "feature"
             *     }
             */
            params: {
                [key: string]: unknown;
            };
            /** @example 30 */
            weight: number;
            /** @example false */
            isHard: boolean;
            /** @example true */
            enabled?: boolean;
        };
        LaunchPlanningDto: {
            /**
             * @example CPSAT
             * @enum {string}
             */
            algorithm: "CPSAT" | "RANDOM" | "GREEDY";
            /**
             * @example UTILITARIAN
             * @enum {string}
             */
            equityMode: "UTILITARIAN" | "MAX_MIN" | "NASH";
            /** @example 30 */
            timeBudgetSeconds?: number;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    AuthController_loginUser: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LoginDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LoginResponseDto"];
                };
            };
        };
    };
    HealthController_check: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MembersController_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MemberResponseDto"][];
                };
            };
        };
    };
    MembersController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateMemberDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MemberResponseDto"];
                };
            };
        };
    };
    MembersController_remove: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MembersController_assign: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AssignSkillDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    SkillsController_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SkillResponseDto"][];
                };
            };
        };
    };
    SkillsController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateSkillDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SkillResponseDto"];
                };
            };
        };
    };
    SkillsController_remove: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    SprintPublicController_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SprintResponseDto"][];
                };
            };
        };
    };
    SprintPublicController_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SprintResponseDto"];
                };
            };
        };
    };
    SprintAdminController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateSprintDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SprintResponseDto"];
                };
            };
        };
    };
    SprintAdminController_remove: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    SprintAdminController_addSprintTask: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AddTaskDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TaskResponseDto"];
                };
            };
        };
    };
    SprintAdminController_removeSprintTask: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
                taskId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    SprintAdminController_changeStatus: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
                taskId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ChangeTaskStatusDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    TaskStatusController_changeStatus: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ChangeTaskStatusDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MyTasksController_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MyTaskResponseDto"][];
                };
            };
        };
    };
    MemberRulesController_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>[];
                };
            };
        };
    };
    MemberRulesController_conflicts: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>[];
                };
            };
        };
    };
    MemberRulesController_upsert: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                ruleId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpsertRuleDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MemberRulesController_remove: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                ruleId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminRulesController_upsert: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                ownerId: string;
                ruleId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpsertRuleDto"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminRulesController_remove: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                ownerId: string;
                ruleId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PublicRulesController_list: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                ownerId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>[];
                };
            };
        };
    };
    PlanningAdminController_launch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                sprintId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LaunchPlanningDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
        };
    };
    PlanningPublicController_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
        };
    };
    PlanningPublicController_listForSprint: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                sprintId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>[];
                };
            };
        };
    };
}
