// WYSIWYG-редактор на базе Quill.js v2 для создания/редактирования статей.
// Quill импортируется динамически (import() внутри useEffect), потому что он
// обращается к DOM и не может работать при серверном рендеринге (SSR).
// quillRef хранит экземпляр для предотвращения двойной инициализации в React StrictMode.
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
  // onChangeRef позволяет использовать актуальный onChange без перезапуска эффекта
  // (не добавляем onChange в deps, чтобы не пересоздавать экземпляр Quill при каждом рендере)
  const onChangeRef = useRef(onChange)
  const quillRef = useRef<InstanceType<typeof Quill> | null>(null)
  useEffect(() => { onChangeRef.current = onChange })

  useEffect(() => {
    if (!containerRef.current) return
    // Флаг для корректной работы cleanup при двойном монтировании (React StrictMode)
    let destroyed = false

    const load = async () => {
      const { default: QuillClass } = await import('quill')
      // Проверяем destroyed и quillRef.current на случай, если cleanup уже сработал
      // или Quill уже инициализирован (защита от двойного вызова)
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

      // Устанавливаем начальное HTML-содержимое напрямую в root — стандартный способ для Quill v2
      if (initialValue) quill.root.innerHTML = initialValue
      quill.on('text-change', () => { onChangeRef.current(quill.root.innerHTML) })
    }

    load()
    return () => {
      destroyed = true
      // Очищаем экземпляр при размонтировании, чтобы не было утечек событий
      if (quillRef.current) {
        quillRef.current.off('text-change')
        quillRef.current = null
        if (containerRef.current) containerRef.current.innerHTML = ''
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  // Пустой массив зависимостей — инициализируем один раз; onChange обновляется через ref

  return <div ref={containerRef} />
}
