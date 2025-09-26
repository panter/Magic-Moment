'use server'

import { getPayload } from 'payload'
import configPromise from '../../../payload.config'
import { cookies } from 'next/headers'

export async function uploadImage(formData: FormData) {
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

  const file = formData.get('file') as File
  if (!file) {
    throw new Error('No file provided')
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  const media = await payload.create({
    collection: 'media',
    data: {
      alt: file.name,
    },
    file: {
      data: buffer,
      mimetype: file.type,
      name: file.name,
      size: file.size,
    },
  })

  return media
}