import React from 'react'

const HOUSE_BANNER = '/sponsor_banners/house_banner.png'
const HOUSE_BANNER_LINK = '/advertise'

export default function Banner() {
  const [banner] = React.useState({
    imageUrl: '/sponsor_banners/banner-1.png',
    clickUrl: HOUSE_BANNER_LINK,
    label: 'Sponsored'
  })

  return (
    <div style={{
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      margin: '12px 0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: '#fafbfc',
      boxShadow: '0 2px 8px #eee',
      minHeight: 68
    }}>
      <div style={{
        border: '1px solid #eee',
        borderRadius: 6,
        background: '#fafbfc',
        padding: 4,
        minWidth: 320,
        maxWidth: 700,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        <span style={{ fontWeight: 600, color: '#888', fontSize: 13, marginRight: 8 }}>{banner.label}</span>
        <a href={banner.clickUrl} target="_blank" rel="noopener" style={{ flex: 1, display: 'block' }}>
          <img
            src={banner.imageUrl}
            alt={banner.label}
            style={{ maxHeight: 60, maxWidth: '100%', objectFit: 'contain', display: 'block', margin: '0 auto' }}
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement
              img.src = HOUSE_BANNER
            }}
          />
        </a>
      </div>
    </div>
  )
}
