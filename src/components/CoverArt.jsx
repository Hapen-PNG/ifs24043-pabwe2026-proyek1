import { useEffect, useState } from 'react'

function getInitials(title = '') {
  const words = title.trim().split(/\s+/).filter(Boolean)
  if (words.length > 1) return words.map((word) => word[0]).join('').slice(0, 3).toLocaleUpperCase()
  return (words[0] ?? '♫').slice(0, 2).toLocaleUpperCase()
}

function CoverArt({ song, className = '' }) {
  const [imageFailed, setImageFailed] = useState(false)
  const image = song?.cover

  useEffect(() => {
    setImageFailed(false)
  }, [song?.id, image])

  return (
    <div className={`overflow-hidden ${className}`}>
      {image && !imageFailed ? (
        <img
          src={image}
          alt={`Cover ${song?.title ?? 'lagu'}`}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div
          role="img"
          aria-label={`Cover ${song?.title ?? 'lagu'} belum tersedia`}
          className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-violet-600 via-indigo-700 to-fuchsia-800 text-violet-50"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 opacity-80">
            <path d="M12 3v12.3a4 4 0 1 1-2-3.46V7l10-2v10.3a4 4 0 1 1-2-3.46V3z" />
          </svg>
          <span className="text-2xl font-bold tracking-[0.16em]">
            {getInitials(song?.title)}
          </span>
        </div>
      )}
    </div>
  )
}

export default CoverArt
