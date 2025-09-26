'use client'

import Link from 'next/link'
import { deleteDesign, createVariant } from '@/app/actions/designs'
import { useRouter } from 'next/navigation'
import { Button } from '@repo/ui'
import { useState } from 'react'

export default function DesignCard({ design }: { design: any }) {
  const router = useRouter()
  const [creatingVariant, setCreatingVariant] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this design?')) return

    try {
      await deleteDesign(design.id)
      router.refresh()
    } catch (error) {
      console.error('Failed to delete design:', error)
    }
  }

  const handleCreateVariant = async () => {
    setCreatingVariant(true)
    try {
      await createVariant(design.id)
      // Navigate to the edit page to see the new variant
      router.push(`/designs/${design.id}/edit`)
    } catch (error) {
      console.error('Failed to create variant:', error)
      setCreatingVariant(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      {design.frontImage ? (
        <img
          src={design.frontImage.url}
          alt={design.frontImage.alt || design.name}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <svg
            className="h-16 w-16 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900">{design.name}</h3>
            {design.imageVariants && design.imageVariants.length > 0 && (
              <span className="inline-flex items-center text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full mt-1">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                </svg>
                {design.imageVariants.length} variant{design.imageVariants.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        {design.description && (
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{design.description}</p>
        )}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span className="bg-gray-100 px-2 py-1 rounded-full capitalize">
            {design.category}
          </span>
          <span>{new Date(design.createdAt).toLocaleDateString()}</span>
        </div>

        {/* Magic Button */}
        <div className="mb-3">
          <Button
            onClick={handleCreateVariant}
            variant="primary"
            size="sm"
            className="w-full"
            loading={creatingVariant}
            disabled={creatingVariant}
          >
            {creatingVariant ? (
              'Creating Magic Variant...'
            ) : (
              <>
                <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                Create Magic Variant
              </>
            )}
          </Button>
        </div>

        <div className="flex gap-2">
          <Link href={`/designs/${design.id}/edit`} className="flex-1">
            <Button variant="secondary" size="sm" className="w-full">
              Edit
            </Button>
          </Link>
          <Button
            onClick={handleDelete}
            variant="danger"
            size="sm"
            className="flex-1"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}