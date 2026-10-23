function CoverArt({ song, className = '' }) {
  const image = song?.cover

  return (
    <div className={`overflow-hidden rounded-3xl bg-gradient-to-br from-violet-500/30 via-slate-800 to-fuchsia-500/20 ${className}`}>
      {image ? (
        <img
          src={image}
          alt={`Cover ${song.title}`}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-5xl text-violet-200" aria-label="Cover tidak tersedia">
          ♫
        </div>
      )}
    </div>
  )
}

export default CoverArt
