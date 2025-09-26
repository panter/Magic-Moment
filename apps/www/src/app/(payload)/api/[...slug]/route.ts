import config from '@payload-config'
import '@payloadcms/next/css'
import { REST_GET, REST_POST, REST_DELETE, REST_PATCH } from '@payloadcms/next/routes'

export const GET = REST_GET(config)
export const POST = REST_POST(config)
export const DELETE = REST_DELETE(config)
export const PATCH = REST_PATCH(config)