'use client'

interface TimeRangeFilterProps {
  currentRange: '24h' | '7d' | '30d'
  onRangeChange: (range: '24h' | '7d' | '30d') => void
}

export default function TimeRangeFilter({ currentRange, onRangeChange }: TimeRangeFilterProps) {
  const ranges = [
    { value: '24h', label: 'Last 24 Hours', description: 'Recent activity' },
    { value: '7d', label: 'Last 7 Days', description: 'Weekly view' },
    { value: '30d', label: 'Last 30 Days', description: 'Monthly view' }
  ] as const

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600 font-medium">Time Range:</span>
      <div className="flex bg-gray-100 rounded-lg p-1">
        {ranges.map((range) => (
          <button
            key={range.value}
            onClick={() => onRangeChange(range.value)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              currentRange === range.value
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            title={range.description}
          >
            {range.label}
          </button>
        ))}
      </div>
    </div>
  )
}





