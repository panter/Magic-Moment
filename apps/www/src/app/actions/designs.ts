'use server'

import { getPayload } from 'payload'
import configPromise from '../../../payload.config'
import { cookies } from 'next/headers'

export async function getUserDesigns() {
  const payload = await getPayload({ config: configPromise })
  const token = (await cookies()).get('payload-token')

  if (!token) {
    throw new Error('Not authenticated')
  }

  const headers = new Headers()
  headers.set('cookie', `payload-token=${token.value}`)
  const { user } = await payload.auth({ headers })

  if (!user) {
    throw new Error('Not authenticated')
  }

  const designs = await payload.find({
    collection: 'postcard-designs',
    where: {
      createdBy: {
        equals: user.id,
      },
    },
    sort: '-createdAt',
  })

  return designs
}

export async function createDesign(data: any) {
  const payload = await getPayload({ config: configPromise })
  const token = (await cookies()).get('payload-token')

  if (!token) {
    throw new Error('Not authenticated')
  }

  const headers = new Headers()
  headers.set('cookie', `payload-token=${token.value}`)
  const { user } = await payload.auth({ headers })

  if (!user) {
    throw new Error('Not authenticated')
  }

  const design = await payload.create({
    collection: 'postcard-designs',
    data: {
      ...data,
      createdBy: user.id,
    },
  })

  return design
}

export async function updateDesign(id: string, data: any) {
  const payload = await getPayload({ config: configPromise })
  const token = (await cookies()).get('payload-token')

  if (!token) {
    throw new Error('Not authenticated')
  }

  const design = await payload.update({
    collection: 'postcard-designs',
    id,
    data,
  })

  return design
}

export async function deleteDesign(id: string) {
  const payload = await getPayload({ config: configPromise })
  const token = (await cookies()).get('payload-token')

  if (!token) {
    throw new Error('Not authenticated')
  }

  await payload.delete({
    collection: 'postcard-designs',
    id,
  })

  return { success: true }
}

export async function getDesignById(id: string) {
  const payload = await getPayload({ config: configPromise })

  const design = await payload.findByID({
    collection: 'postcard-designs',
    id,
  })

  return design
}

export async function getDesign(id: string) {
  const payload = await getPayload({ config: configPromise })
  const token = (await cookies()).get('payload-token')

  if (!token) {
    throw new Error('Not authenticated')
  }

  const headers = new Headers()
  headers.set('cookie', `payload-token=${token.value}`)
  const { user } = await payload.auth({ headers })

  if (!user) {
    throw new Error('Not authenticated')
  }

  const design = await payload.findByID({
    collection: 'postcard-designs',
    id,
    depth: 1, // Include related media
  })

  // Add image URL if frontImage exists
  let frontImageUrl = null
  if (design.frontImage && typeof design.frontImage === 'object') {
    frontImageUrl = design.frontImage.url
  }

  return {
    ...design,
    frontImageUrl,
  }
}