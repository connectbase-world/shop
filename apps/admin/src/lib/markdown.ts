/**
 * 경량 Markdown → HTML 변환기
 * 지원: 제목, 볼드, 이탤릭, 링크, 이미지, 리스트, 코드블록, 인라인코드, 수평선, 인용문
 */
export function markdownToHtml(md: string): string {
  const lines = md.split('\n')
  const html: string[] = []
  let inCodeBlock = false
  let inList: 'ul' | 'ol' | null = null

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]

    // 코드 블록
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        html.push('</code></pre>')
        inCodeBlock = false
      } else {
        closeList()
        const lang = line.trim().slice(3).trim()
        html.push(`<pre><code${lang ? ` class="language-${lang}"` : ''}>`)
        inCodeBlock = true
      }
      continue
    }
    if (inCodeBlock) {
      html.push(escapeHtml(line))
      continue
    }

    // 빈 줄
    if (line.trim() === '') {
      closeList()
      continue
    }

    // 제목
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      closeList()
      const level = headingMatch[1].length
      html.push(`<h${level}>${inline(headingMatch[2])}</h${level}>`)
      continue
    }

    // 수평선
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      closeList()
      html.push('<hr />')
      continue
    }

    // 인용문
    if (line.startsWith('>')) {
      closeList()
      html.push(`<blockquote><p>${inline(line.slice(1).trim())}</p></blockquote>`)
      continue
    }

    // 비순서 리스트
    const ulMatch = line.match(/^[-*+]\s+(.+)$/)
    if (ulMatch) {
      if (inList !== 'ul') {
        closeList()
        html.push('<ul>')
        inList = 'ul'
      }
      html.push(`<li>${inline(ulMatch[1])}</li>`)
      continue
    }

    // 순서 리스트
    const olMatch = line.match(/^\d+\.\s+(.+)$/)
    if (olMatch) {
      if (inList !== 'ol') {
        closeList()
        html.push('<ol>')
        inList = 'ol'
      }
      html.push(`<li>${inline(olMatch[1])}</li>`)
      continue
    }

    // 일반 문단
    closeList()
    html.push(`<p>${inline(line)}</p>`)
  }

  closeList()
  if (inCodeBlock) html.push('</code></pre>')

  return html.join('\n')

  function closeList() {
    if (inList === 'ul') html.push('</ul>')
    else if (inList === 'ol') html.push('</ol>')
    inList = null
  }

  function inline(text: string): string {
    return text
      // 이미지
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
      // 링크
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      // 볼드+이탤릭
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      // 볼드
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // 이탤릭
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // 인라인 코드
      .replace(/`([^`]+)`/g, '<code>$1</code>')
  }

  function escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
}
