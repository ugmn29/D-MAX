'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

interface DynamicTrackingTagsProps {
  clinicId: string
}

interface TrackingTags {
  gtm_container_id: string
  gtm_enabled: boolean
  ga4_measurement_id: string
  ga4_enabled: boolean
  google_ads_conversion_id: string
  google_ads_conversion_label: string
  google_ads_enabled: boolean
  meta_pixel_id: string
  meta_pixel_enabled: boolean
  clarity_project_id: string
  clarity_enabled: boolean
}

export function DynamicTrackingTags({ clinicId }: DynamicTrackingTagsProps) {
  const [tags, setTags] = useState<TrackingTags | null>(null)

  useEffect(() => {
    const loadTags = async () => {
      try {
        const res = await fetch(`/api/tracking-tags?clinic_id=${clinicId}`)
        if (res.ok) {
          const json = await res.json()
          setTags(json.data)
        }
      } catch (error) {
        console.error('トラッキングタグ読み込みエラー:', error)
      }
    }

    loadTags()
  }, [clinicId])

  if (!tags) return null

  return (
    <>
      {/* Google Tag Manager */}
      {tags.gtm_enabled && tags.gtm_container_id && (
        <>
          <Script id="gtm-script" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${tags.gtm_container_id}');
            `}
          </Script>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${tags.gtm_container_id}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        </>
      )}

      {/* Google Analytics 4 */}
      {tags.ga4_enabled && tags.ga4_measurement_id && !tags.gtm_enabled && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${tags.ga4_measurement_id}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-script" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${tags.ga4_measurement_id}');
            `}
          </Script>
        </>
      )}

      {/* Google Ads */}
      {tags.google_ads_enabled && tags.google_ads_conversion_id && !tags.gtm_enabled && (
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${tags.google_ads_conversion_id}`}
          strategy="afterInteractive"
        />
      )}

      {/* META Pixel */}
      {tags.meta_pixel_enabled && tags.meta_pixel_id && !tags.gtm_enabled && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${tags.meta_pixel_id}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      {/* Microsoft Clarity (Heatmap) */}
      {tags.clarity_enabled && tags.clarity_project_id && (
        <Script id="ms-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${tags.clarity_project_id}");
          `}
        </Script>
      )}
    </>
  )
}
