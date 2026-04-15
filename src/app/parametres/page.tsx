'use client'

import Link from 'next/link'
import ApiKeysPanel from '@/components/settings/ApiKeysPanel'
import UnitsPanel from '@/components/settings/UnitsPanel'
import MapPanel from '@/components/settings/MapPanel'
import TracePanel from '@/components/settings/TracePanel'
import type { ReactNode } from 'react'

function SectionCard({ title, description, children }: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="bg-white rounded-xl border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">{title}</h2>
        {description && (
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  )
}

export default function ParametresPage() {
  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      {/* Barre supérieure */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour à la carte
          </Link>
          <span className="text-gray-200 select-none">|</span>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h1 className="font-semibold text-gray-900">Paramètres</h1>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <SectionCard
          title="Clés API"
          description="Déverrouillez les fonds de carte premium (IGN, Thunderforest, GraphHopper)."
        >
          <ApiKeysPanel />
        </SectionCard>

        <SectionCard title="Unités">
          <UnitsPanel />
        </SectionCard>

        <SectionCard
          title="Carte"
          description="Position et zoom affichés à l'ouverture de l'application."
        >
          <MapPanel />
        </SectionCard>

        <SectionCard
          title="Affichage des traces"
          description="Valeurs appliquées aux nouvelles traces importées."
        >
          <TracePanel />
        </SectionCard>

        <p className="text-center text-xs text-gray-400 pb-4">
          MapsGPS — toutes les données restent dans votre navigateur.
        </p>
      </div>
    </div>
  )
}
