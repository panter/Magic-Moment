'use client'

import Link from 'next/link'
import { deleteDesign } from '@/app/actions/designs'
import { useRouter } from 'next/navigation'

export default function DesignCard({ design }: { design: any }) {
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this design?')) return

    try {
      await deleteDesign(design.id)
      router.refresh()
    } catch (error) {
      console.error('Failed to delete design:', error)
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
        <h3 className="font-semibold text-lg text-gray-900 mb-1">{design.name}</h3>
        {design.description && (
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{design.description}</p>
        )}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span className="bg-gray-100 px-2 py-1 rounded-full capitalize">
            {design.category}
          </span>
          <span>{new Date(design.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/designs/${design.id}/edit`}
            className="flex-1 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition duration-200 text-sm font-medium"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="flex-1 text-center bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg transition duration-200 text-sm font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}