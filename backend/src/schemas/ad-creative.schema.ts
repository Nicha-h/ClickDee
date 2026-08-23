// Deliberately import z from plain 'zod' (not '@hono/zod-openapi') here —
// the .openapi() extension is still available via this side-effect import
// (it augments zod's ZodType globally), but going through
// @hono/zod-openapi's own re-exported z hits a real type-inference bug with
// this zod/hono-zod-openapi version pair: nested array-of-object fields
// (e.g. childAttachments below) silently collapse to `any` instead of their
// real element type, which then breaks discriminated-union narrowing in
// ad-creative.service.ts. Confirmed isolated repro before adding this.
import '@hono/zod-openapi'
import { z } from 'zod'

export const CreativeFormatEnum = z.enum([
  'IMAGE_POST',
  'VIDEO_POST',
  'REELS',
  'CAROUSEL',
  'STORY',
])

export const CallToActionTypeEnum = z.enum([
  'SHOP_NOW',
  'LEARN_MORE',
  'SIGN_UP',
  'BOOK_TRAVEL',
  'CONTACT_US',
  'DOWNLOAD',
  'GET_OFFER',
  'SUBSCRIBE',
  'WATCH_MORE',
  'MESSAGE_PAGE',
  'CALL_NOW',
  'GET_QUOTE',
])

// Base fields every format shares (Task 3): page_id is required, IG user id
// is optional (only needed for IG placements incl. Reels) — always
// instagram_user_id, never the deprecated instagram_actor_id.
const BaseCreativeFields = {
  name: z.string().min(1),
  pageId: z.string().min(1),
  instagramUserId: z.string().min(1).optional(),
}

// mediaAssetId references our own MediaAsset row (not a raw Meta
// image_hash/video_id directly) — the service layer resolves it to the
// actual Meta identifier at push time. This is the "thin abstraction": the
// frontend/AI layer only ever needs an already-uploaded local media asset id
// plus format-specific copy, never Meta's object_story_spec shape.

export const CreateImagePostCreativeSchema = z
  .object({
    ...BaseCreativeFields,
    format: z.literal('IMAGE_POST'),
    mediaAssetId: z.string().min(1),
    link: z.string().url(),
    message: z.string().min(1).max(2000),
    callToActionType: CallToActionTypeEnum,
  })
  .openapi('CreateImagePostCreativeInput')

export const CreateVideoPostCreativeSchema = z
  .object({
    ...BaseCreativeFields,
    format: z.literal('VIDEO_POST'),
    mediaAssetId: z.string().min(1),
    title: z.string().max(200).optional(),
    message: z.string().min(1).max(2000),
    callToActionType: CallToActionTypeEnum,
    ctaLink: z.string().url(),
    // Auto-fetched by Meta if omitted, per Task 3.
    thumbnailUrl: z.string().url().optional(),
  })
  .openapi('CreateVideoPostCreativeInput')

export const CreateReelsCreativeSchema = z
  .object({
    ...BaseCreativeFields,
    format: z.literal('REELS'),
    mediaAssetId: z.string().min(1),
    title: z.string().max(200).optional(),
    message: z.string().min(1).max(2000),
    callToActionType: CallToActionTypeEnum,
    ctaLink: z.string().url(),
    // Same video_data object_story_spec as VIDEO_POST (Task 3) — Reels
    // just adds placement/aspect-ratio constraints on top, not a shape
    // difference, so it shares these optional fields too.
    thumbnailUrl: z.string().url().optional(),
  })
  .openapi('CreateReelsCreativeInput')

const CarouselCardSchema = z.object({
  mediaAssetId: z.string().min(1),
  link: z.string().url(),
  name: z.string().min(1).max(200),
  description: z.string().max(200).optional(),
})

export const CreateCarouselCreativeSchema = z
  .object({
    ...BaseCreativeFields,
    format: z.literal('CAROUSEL'),
    // 2-10 cards per Task 3.
    childAttachments: z.array(CarouselCardSchema).min(2).max(10),
    message: z.string().max(2000).optional(),
    callToActionType: CallToActionTypeEnum,
  })
  .openapi('CreateCarouselCreativeInput')

export const CreateStoryCreativeSchema = z
  .object({
    ...BaseCreativeFields,
    format: z.literal('STORY'),
    // Stories reuse link_data/video_data depending on the underlying asset
    // type — placement (facebook_stories/instagram_stories) is what makes it
    // a "story" ad, not a distinct object_story_spec shape.
    mediaType: z.enum(['IMAGE', 'VIDEO']),
    mediaAssetId: z.string().min(1),
    link: z.string().url().optional(),
    message: z.string().max(2000).optional(),
    callToActionType: CallToActionTypeEnum.optional(),
    ctaLink: z.string().url().optional(),
  })
  .openapi('CreateStoryCreativeInput')

export const CreateAdCreativeSchema = z
  .discriminatedUnion('format', [
    CreateImagePostCreativeSchema,
    CreateVideoPostCreativeSchema,
    CreateReelsCreativeSchema,
    CreateCarouselCreativeSchema,
    CreateStoryCreativeSchema,
  ])
  .openapi('CreateAdCreativeInput')

// Inferred as an explicit union of the five variant types rather than
// z.infer<typeof CreateAdCreativeSchema> — wrapping a discriminatedUnion in
// .openapi() erases the discriminant narrowing TS needs for `switch
// (input.format)` in ad-creative.service.ts to narrow child properties like
// `childAttachments` correctly.
export type CreateImagePostCreativeInput = z.infer<
  typeof CreateImagePostCreativeSchema
>
export type CreateVideoPostCreativeInput = z.infer<
  typeof CreateVideoPostCreativeSchema
>
export type CreateReelsCreativeInput = z.infer<typeof CreateReelsCreativeSchema>
export type CreateCarouselCreativeInput = z.infer<
  typeof CreateCarouselCreativeSchema
>
export type CreateStoryCreativeInput = z.infer<typeof CreateStoryCreativeSchema>

export const AdCreativeSchema = z
  .object({
    id: z.string(),
    adSetId: z.string(),
    name: z.string(),
    format: CreativeFormatEnum,
    pageId: z.string(),
    instagramUserId: z.string().nullable(),
    aiGenerated: z.boolean(),
    aiDisclosureLabel: z.boolean(),
    // Meta's own object_story_spec shape — kept for audit/re-send, not meant
    // to be built by the frontend directly (see creativeDetails below).
    objectStorySpec: z.record(z.string(), z.unknown()),
    // Our own field names (message/link/callToActionType/mediaAssetId/...),
    // reverse-derived from objectStorySpec by
    // ad-creative.service.ts's deriveCreativeDetails — this is what the
    // frontend reads for both display and edit-prefill, keeping Meta's own
    // shape out of the frontend (same "thin abstraction" the create flow
    // already follows). Loosely typed since its actual shape varies by
    // `format`.
    creativeDetails: z.record(z.string(), z.unknown()),
    metaCreativeId: z.string().nullable(),
    metaReviewFeedback: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi('AdCreative')

// Flat, all-optional bag covering every format's editable fields — unlike
// CreateAdCreativeSchema's discriminated union, format is not resubmitted on
// PATCH (it's immutable, see ad-creative.service.ts's updateAdCreative),
// so there's no discriminant to key a union on here. Fields that don't apply
// to the creative's actual format are silently dropped when the service
// layer re-validates the merged result against the matching per-format
// Create*Schema variant.
export const UpdateAdCreativeSchema = z
  .object({
    name: z.string().min(1).optional(),
    pageId: z.string().min(1).optional(),
    instagramUserId: z.string().min(1).optional(),
    mediaAssetId: z.string().min(1).optional(),
    link: z.string().url().optional(),
    message: z.string().max(2000).optional(),
    callToActionType: CallToActionTypeEnum.optional(),
    title: z.string().max(200).optional(),
    ctaLink: z.string().url().optional(),
    thumbnailUrl: z.string().url().optional(),
    mediaType: z.enum(['IMAGE', 'VIDEO']).optional(),
    childAttachments: z.array(CarouselCardSchema).min(2).max(10).optional(),
  })
  .openapi('UpdateAdCreativeInput')

export type UpdateAdCreativeInput = z.infer<typeof UpdateAdCreativeSchema>

export const AdSetScopedParamSchema = z.object({
  campaignId: z.string().openapi({ param: { name: 'campaignId', in: 'path' } }),
  adSetId: z.string().openapi({ param: { name: 'adSetId', in: 'path' } }),
})

export const AdCreativeIdParamSchema = AdSetScopedParamSchema.extend({
  id: z.string().openapi({ param: { name: 'id', in: 'path' } }),
})

export type CreateAdCreativeInput =
  | CreateImagePostCreativeInput
  | CreateVideoPostCreativeInput
  | CreateReelsCreativeInput
  | CreateCarouselCreativeInput
  | CreateStoryCreativeInput
