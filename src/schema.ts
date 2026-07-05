import { z } from 'zod';

export const StageTypeSchema = z.enum(["single", "double", "free", "none"]);

const BaseStageSchema = z.object({
	id: z.number().int().nonnegative("ID 必须是非负整数"), 
	title: z.string().min(1, "阶段标题不能为空")
});

export const SingleStageSchema = BaseStageSchema.extend({
	type: z.literal(StageTypeSchema.enum.single),
	timeLimit: z.number().int().min(0, "时间限制不能小于0")
});

export const DoubleStageSchema = BaseStageSchema.extend({
	type: z.literal(StageTypeSchema.enum.double),
	leftTimeLimit: z.number().int().min(0),
	rightTimeLimit: z.number().int().min(0)
});

export const FreeStageSchema = BaseStageSchema.extend({
	type: z.literal(StageTypeSchema.enum.free),
	leftTimeLimit: z.number().int().min(0),
	rightTimeLimit: z.number().int().min(0),
	start: z.enum(["left", "right"], "自由辩论必须指定由左方或右方开始")
});

export const NoneStageSchema = BaseStageSchema.extend({
	type: z.literal(StageTypeSchema.enum.none)
});

export const DebateStageSchema = z.discriminatedUnion("type", [
	SingleStageSchema,
	DoubleStageSchema,
	FreeStageSchema,
	NoneStageSchema
]);

export const DebateStagesSchema = z.object({
	id: z.string().min(1, "赛制ID不能为空"),
	name: z.string().min(1, "赛制名称不能为空"),
	stages: z.array(DebateStageSchema)
});

export type StageType = z.infer<typeof StageTypeSchema>;

export type SingleStage = z.infer<typeof SingleStageSchema>;
export type DoubleStage = z.infer<typeof DoubleStageSchema>;
export type FreeStage = z.infer<typeof FreeStageSchema>;
export type NoneStage = z.infer<typeof NoneStageSchema>;

export type DebateStage = z.infer<typeof DebateStageSchema>;
export type DebateStages = z.infer<typeof DebateStagesSchema>;

// Room Event
export const RoomEventTargetSchema = z.enum(["left", "right", "none"]);

export const RoomEventSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("sync"),
		stage: z.number().int().min(0),
		activeSide: z.enum(["left", "right", "none"]),
		leftTime: z.number().int().nonnegative().optional(),
		rightTime: z.number().int().nonnegative().optional()
	}),
	z.object({
		type: z.literal("end")
	})
])

export type RoomEvent = z.infer<typeof RoomEventSchema>;

// Settings
export const OtherSettingsSchema = z.object({
	apiKey: z.string().default(""),
	model: z.string().default("gemini-2.5-flash"),
	autoCreateRoom: z.boolean().default(false),
	saveDir: z.string().default("")
});

export const TimerSettingsSchema = z.object({
	background: z.string().default(""),
	singleRing: z.string().default(""),
	doubleRing: z.string().default(""),
	ticking: z.string().default(""),
	font: z.string().default(""),
	fontColor: z.string().default("#ffffffff"),
	timerFont: z.string().default(""),
	timerEndingColor: z.string().default("#ff0000")
});

export const HotKeysSettingsSchema = z.object({
	isDisplaying: z.boolean().default(true),
	prev: z.string().default("ArrowLeft"),
	next: z.string().default("ArrowRight"),
	startSwapPause: z.string().default("Space"),
	startLeft: z.string().default("Comma"),
	startRight: z.string().default("Period"),
	fullscreen: z.string().default("F11"),
	miniWindow: z.string().default("Shift+F11"),
	exit: z.string().default("Escape")
});

export const AppSettingsSchema = z.object({
	Other: OtherSettingsSchema.default(OtherSettingsSchema.parse({})),
	Timer: TimerSettingsSchema.default(TimerSettingsSchema.parse({})),
	HotKeys: HotKeysSettingsSchema.default(HotKeysSettingsSchema.parse({}))
});

export type AppSettings = z.infer<typeof AppSettingsSchema>;