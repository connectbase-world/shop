import { markdownToHtml } from '@/lib/markdown'

type PostContentProps = {
  content: string
  format: 'html' | 'markdown'
}

export function PostContent({ content, format }: PostContentProps) {
  const html = format === 'markdown' ? markdownToHtml(content) : content
  return (
    <div
      className="post-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
