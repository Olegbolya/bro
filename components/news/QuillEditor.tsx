'use client'

import { useEffect, useRef } from 'react'
import 'quill/dist/quill.snow.css'

interface Props {
  initialValue?: string
  onChange: (html: string) => void
}

export default function QuillEditor({ initialValue = '', onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange })

  useEffect(() => {
    if (!containerRef.current) return
    let destroyed = false

    const load = async () => {
      const { default: Quill } = await import('quill')
      if (destroyed || !containerRef.current) return

      const quill = new Quill(containerRef.current, {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ header: [2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link'],
            ['clean'],
          ],
        },
      })

      if (initialValue) quill.root.innerHTML = initialValue
      quill.on('text-change', () => { onChangeRef.current(quill.root.innerHTML) })
    }

    load()
    return () => { destroyed = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={containerRef} />
}
