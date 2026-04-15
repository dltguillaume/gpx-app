'use client'

import dynamic from 'next/dynamic'
import Sidebar from '@/components/sidebar/Sidebar'
import FileDropZone from '@/components/dropzone/FileDropZone'
import TileLayerControl from '@/components/map/TileLayerControl'

const MapContainer = dynamic(() => import('@/components/map/MapContainer'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 animate-pulse" />,
})

export default function Home() {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 relative min-w-0">
        <FileDropZone>
          <MapContainer />
        </FileDropZone>
        <TileLayerControl />
      </div>
    </div>
  )
}
