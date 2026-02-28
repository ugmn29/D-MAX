import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'HubDent',
    short_name: 'HubDent',
    description: '歯科医院管理システム',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    icons: [
      {
        src: '/api/icon?size=192',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/api/icon?size=512',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
