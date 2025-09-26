'use server'

import { getPayload } from 'payload'
import configPromise from '../../../payload.config'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function login(email: string, password: string) {
  const payload = await getPayload({ config: configPromise })

  try {
    const result = await payload.login({
      collection: 'users',
      data: { email, password },
    })

    if (result.token) {
      ;(await cookies()).set('payload-token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      })
    }

    return { success: true, user: result.user }
  } catch (error) {
    return { success: false, error: 'Invalid email or password' }
  }
}

export async function logout() {
  ;(await cookies()).delete('payload-token')
  redirect('/')
}

export async function register(email: string, password: string) {
  const payload = await getPayload({ config: configPromise })

  try {
    const user = await payload.create({
      collection: 'users',
      data: {
        email,
        password,
        role: 'user',
      },
    })

    const loginResult = await login(email, password)
    return { success: true, user: loginResult.user }
  } catch (error) {
    return { success: false, error: 'Registration failed' }
  }
}

export async function getCurrentUser() {
  const payload = await getPayload({ config: configPromise })
  const token = (await cookies()).get('payload-token')

  if (!token) {
    return null
  }

  try {
    const headers = new Headers()
    headers.set('cookie', `payload-token=${token.value}`)
    const { user } = await payload.auth({ headers })
    return user
  } catch (error) {
    return null
  }
}