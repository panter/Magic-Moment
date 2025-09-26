import { getUserDesigns } from '@/app/actions/designs'
import Link from 'next/link'
import DesignCard from './design-card'

export default async function DesignsPage() {
  const { docs: designs } = await getUserDesigns()

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Postcard Designs</h1>
          <Link
            href="/designs/new"
            className="bg-[#ffcc02] hover:bg-[#e6b800] text-black px-6 py-3 rounded-lg transition duration-200 font-semibold shadow-lg"
          >
            Create New Design
          </Link>
        </div>

        {designs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-lg">
            <svg
              className="mx-auto h-24 w-24 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No designs yet</h2>
            <p className="text-gray-600 mb-6">Create your first postcard design to get started!</p>
            <Link
              href="/designs/new"
              className="inline-block bg-[#ffcc02] hover:bg-[#e6b800] text-black px-6 py-3 rounded-lg transition duration-200"
            >
              Create Your First Design
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {designs.map((design: any) => (
              <DesignCard key={design.id} design={design} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}