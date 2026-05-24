export default function Divider({ label = 'or' }) {
  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200 dark:border-gray-700" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white dark:bg-black px-3 text-xs text-gray-400 uppercase tracking-wider">
          {label}
        </span>
      </div>
    </div>
  );
}
