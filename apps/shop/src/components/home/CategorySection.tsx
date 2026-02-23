import { Link } from '@tanstack/react-router'
import { CATEGORIES } from '@/lib/constants'
import { useI18n } from '@/hooks/useI18n'
import { getCategoryLabel } from '@/lib/i18n'

export function CategorySection() {
  const { t } = useI18n()
  const categories = CATEGORIES.filter((c) => c.key !== 'all')

  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <h2 className="text-lg font-bold mb-8">{t.home.shopByCategory}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {categories.map((category) => (
          <Link
            key={category.key}
            to="/products"
            search={{ category: category.key }}
            className="flex items-center justify-center h-24 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium rounded-sm"
          >
            {getCategoryLabel(category.key, t)}
          </Link>
        ))}
      </div>
    </section>
  )
}
