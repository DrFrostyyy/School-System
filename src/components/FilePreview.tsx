import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, FileText, Image, File, Eye } from 'lucide-react'

interface FilePreviewProps {
  fileUrl: string
  fileName: string
  mimeType?: string
  onClose: () => void
}

export default function FilePreview({ fileUrl, fileName, mimeType, onClose }: FilePreviewProps) {
  const [error, setError] = useState(false)

  const isImage = mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName)
  const isPDF = mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')
  const isVideo = mimeType?.startsWith('video/') || /\.(mp4|webm|ogg)$/i.test(fileName)
  const isAudio = mimeType?.startsWith('audio/') || /\.(mp3|wav|ogg)$/i.test(fileName)

  const getFileIcon = () => {
    if (isImage) return <Image className="w-12 h-12 text-gold-500" />
    if (isPDF) return <FileText className="w-12 h-12 text-red-500" />
    return <File className="w-12 h-12 text-charcoal-400" />
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = fileName
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-charcoal-200">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {getFileIcon()}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-serif font-bold text-charcoal-900 truncate">
                  {fileName}
                </h3>
                <p className="text-sm text-charcoal-500">{mimeType || 'Unknown type'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownload}
                className="p-2 text-charcoal-600 hover:text-gold-600 transition-smooth"
                title="Download"
              >
                <Download className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 text-charcoal-600 hover:text-red-600 transition-smooth"
                title="Close"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4 bg-charcoal-50">
            {isImage && (
              <div className="flex items-center justify-center min-h-[400px]">
                {error ? (
                  <div className="text-center text-charcoal-500">
                    <Image className="w-16 h-16 mx-auto mb-2 text-charcoal-300" />
                    <p>Failed to load image</p>
                  </div>
                ) : (
                  <img
                    src={fileUrl}
                    alt={fileName}
                    className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                    onError={() => setError(true)}
                  />
                )}
              </div>
            )}

            {isPDF && (
              <div className="w-full h-[70vh]">
                {error ? (
                  <div className="flex flex-col items-center justify-center h-full text-charcoal-500">
                    <FileText className="w-16 h-16 mb-2 text-charcoal-300" />
                    <p className="mb-4">Failed to load PDF</p>
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-smooth"
                    >
                      Open in New Tab
                    </a>
                  </div>
                ) : (
                  <iframe
                    src={fileUrl}
                    className="w-full h-full border-0 rounded-lg"
                    title={fileName}
                    onError={() => setError(true)}
                  />
                )}
              </div>
            )}

            {isVideo && (
              <div className="flex items-center justify-center min-h-[400px]">
                <video
                  src={fileUrl}
                  controls
                  className="max-w-full max-h-[70vh] rounded-lg shadow-lg"
                  onError={() => setError(true)}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}

            {isAudio && (
              <div className="flex items-center justify-center min-h-[200px]">
                <div className="w-full max-w-md">
                  <div className="bg-white rounded-lg p-6 shadow-lg">
                    <div className="flex items-center gap-4 mb-4">
                      <File className="w-12 h-12 text-gold-500" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-charcoal-900">{fileName}</h4>
                        <p className="text-sm text-charcoal-500">{mimeType}</p>
                      </div>
                    </div>
                    <audio
                      src={fileUrl}
                      controls
                      className="w-full"
                      onError={() => setError(true)}
                    >
                      Your browser does not support the audio tag.
                    </audio>
                  </div>
                </div>
              </div>
            )}

            {!isImage && !isPDF && !isVideo && !isAudio && (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-charcoal-500">
                <FileText className="w-16 h-16 mb-4 text-charcoal-300" />
                <p className="mb-2">Preview not available for this file type</p>
                <p className="text-sm text-charcoal-400 mb-4">{mimeType || 'Unknown file type'}</p>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-smooth"
                >
                  <Download className="w-4 h-4" />
                  <span>Download File</span>
                </a>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

