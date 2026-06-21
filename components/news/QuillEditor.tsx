'use client'

import { useEffect, useRef } from 'react'
import type Quill from 'quill'
import 'quill/dist/quill.snow.css'

interface Props {
  initialValue?: string
  onChange: (html: string) => void
}

export default function QuillEditor({ initialValue = '', onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onChangeRef = useRef(onChange)
  const quillRef = useRef<InstanceType<typeof Quill> | null>(null)
  useEffect(() => { onChangeRef.current = onChange })

  useEffect(() => {
    if (!containerRef.current) return
    let destroyed = false

    const load = async () => {
      const { default: QuillClass } = await import('quill')
      if (destroyed || !containerRef.current || quillRef.current) return

      const quill = new QuillClass(containerRef.current, {
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
      quillRef.current = quill

      if (initialValue) quill.root.innerHTML = initialValue
      quill.on('text-change', () => { onChangeRef.current(quill.root.innerHTML) })
    }

    load()
    return () => {
      destroyed = true
      if (quillRef.current) {
        quillRef.current.off('text-change')
        quillRef.current = null
        if (containerRef.current) containerRef.current.innerHTML = ''
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={containerRef} />
}
