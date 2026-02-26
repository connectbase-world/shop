export type TrackingConfig = {
  gtm_id: string
  ga4_id: string
  meta_pixel_id: string
  naver_analytics_id: string
  kakao_pixel_id: string
  gtm_enabled: boolean
  ga4_enabled: boolean
  meta_pixel_enabled: boolean
  naver_analytics_enabled: boolean
  kakao_pixel_enabled: boolean
  custom_head_scripts: string
  custom_body_scripts: string
}

let injected = false

export function injectTrackingScripts(config: TrackingConfig): void {
  if (injected) return
  injected = true

  if (config.gtm_enabled && config.gtm_id) injectGTM(config.gtm_id)
  if (config.ga4_enabled && config.ga4_id) injectGA4(config.ga4_id)
  if (config.meta_pixel_enabled && config.meta_pixel_id) injectMetaPixel(config.meta_pixel_id)
  if (config.naver_analytics_enabled && config.naver_analytics_id) injectNaverAnalytics(config.naver_analytics_id)
  if (config.kakao_pixel_enabled && config.kakao_pixel_id) injectKakaoPixel(config.kakao_pixel_id)
  if (config.custom_head_scripts) injectCustomHTML(config.custom_head_scripts, document.head)
  if (config.custom_body_scripts) injectCustomHTML(config.custom_body_scripts, document.body)
}

function injectGTM(id: string): void {
  const script = document.createElement('script')
  script.textContent = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${id}');`
  document.head.appendChild(script)

  const noscript = document.createElement('noscript')
  const iframe = document.createElement('iframe')
  iframe.src = `https://www.googletagmanager.com/ns.html?id=${id}`
  iframe.height = '0'
  iframe.width = '0'
  iframe.style.display = 'none'
  iframe.style.visibility = 'hidden'
  noscript.appendChild(iframe)
  document.body.prepend(noscript)
}

function injectGA4(id: string): void {
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`
  document.head.appendChild(script)

  const inline = document.createElement('script')
  inline.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');`
  document.head.appendChild(inline)
}

function injectMetaPixel(id: string): void {
  const script = document.createElement('script')
  script.textContent = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${id}');fbq('track','PageView');`
  document.head.appendChild(script)

  const noscript = document.createElement('noscript')
  const img = document.createElement('img')
  img.height = 1
  img.width = 1
  img.style.display = 'none'
  img.src = `https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`
  noscript.appendChild(img)
  document.body.appendChild(noscript)
}

function injectNaverAnalytics(id: string): void {
  const script = document.createElement('script')
  script.src = 'https://wcs.naver.net/wcslog.js'
  script.async = true
  script.onload = () => {
    const inline = document.createElement('script')
    inline.textContent = `if(!window.wcs_add)window.wcs_add={};wcs_add["wa"]="${id}";if(window.wcs)wcs_do();`
    document.head.appendChild(inline)
  }
  document.head.appendChild(script)
}

function injectKakaoPixel(id: string): void {
  const script = document.createElement('script')
  script.src = 'https://t1.daumcdn.net/kas/static/kp.js'
  script.async = true
  script.onload = () => {
    const inline = document.createElement('script')
    inline.textContent = `kakaoPixel('${id}').pageView();`
    document.head.appendChild(inline)
  }
  document.head.appendChild(script)
}

function injectCustomHTML(html: string, target: HTMLElement): void {
  const temp = document.createElement('div')
  temp.innerHTML = html
  Array.from(temp.childNodes).forEach((node) => {
    if (node instanceof HTMLScriptElement) {
      // script tags inserted via innerHTML don't execute; recreate them
      const script = document.createElement('script')
      Array.from(node.attributes).forEach((attr) => script.setAttribute(attr.name, attr.value))
      script.textContent = node.textContent
      target.appendChild(script)
    } else {
      target.appendChild(node.cloneNode(true))
    }
  })
}
