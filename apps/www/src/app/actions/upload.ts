'use server'

import { getPayload } from 'payload'
import configPromise from '../../../payload.config'
import { cookies } from 'next/headers'
import sharp from 'sharp'

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

  let buffer = Buffer.from(await file.arrayBuffer())
  let mimetype = file.type
  let filename = file.name

  // Convert HEIC/HEIF to JPEG if needed
  if (file.type.includes('heic') || file.type.includes('heif') || filename.toLowerCase().endsWith('.heic')) {
    console.log('Converting HEIC to JPEG...')
    try {
      const convertedBuffer = await sharp(buffer)
        .jpeg({ quality: 90 })
        .toBuffer()
      buffer = Buffer.from(convertedBuffer)
      mimetype = 'image/jpeg'
      filename = filename.replace(/\.heic$/i, '.jpg')
      console.log('Successfully converted HEIC to JPEG')
    } catch (error) {
      console.error('Error converting HEIC to JPEG:', error)
      // Continue with original file if conversion fails
    }
  }

  const media = await payload.create({
    collection: 'media',
    data: {
      alt: file.name,
    },
    file: {
      data: buffer,
      mimetype: mimetype,
      name: filename,
      size: buffer.length,
    },
  })

  return media
}