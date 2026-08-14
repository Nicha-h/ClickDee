import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { SignupSchema, UserSchema } from '../schemas/auth.schema.js'
import * as userService from '../services/user.service.js'
import { Prisma } from '../generated/prisma/client.js'
import type { UserModel } from '../generated/prisma/models.js'

const ErrorSchema = z.object({ message: z.string() }).openapi('Error')

function serializeUser(user: UserModel) {
  return {
    id: user.id,
    email: user.email,
    businessName: user.businessName,
    location: user.location,
    category: user.category,
    categoryOther: user.categoryOther,
    adExperience: user.adExperience,
    budget: user.budget,
    goal: user.goal,
    signatureProduct: user.signatureProduct,
    platforms: user.platforms,
    peakHours: user.peakHours,
    promoHighlight: user.promoHighlight,
    createdAt: user.createdAt.toISOString(),
  }
}

export const authApp = new OpenAPIHono()

const signupRoute = createRoute({
  method: 'post',
  path: '/signup',
  tags: ['Auth'],
  request: {
    body: { content: { 'application/json': { schema: SignupSchema } } },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: UserSchema } },
      description: 'Account created',
    },
    409: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Email already registered',
    },
  },
})
authApp.openapi(signupRoute, async (c) => {
  const input = c.req.valid('json')
  const existing = await userService.findUserByEmail(input.email)
  if (existing) {
    return c.json({ message: 'Email already registered' }, 409)
  }
  try {
    const user = await userService.createUser(input)
    return c.json(serializeUser(user), 201)
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      return c.json({ message: 'Email already registered' }, 409)
    }
    throw err
  }
})
