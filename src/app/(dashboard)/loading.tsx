export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 mt-16 lg:mt-0 animate-pulse">
      <div className="h-10 bg-gray-200 rounded w-1/4 mb-4"></div>
      <div className="h-6 bg-gray-200 rounded w-2/4 mb-10"></div>

      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-lg w-full"></div>
        ))}
      </div>
    </div>
  );
}
