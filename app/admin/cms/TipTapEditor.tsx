'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { useEffect, useState } from 'react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'

import dynamic from 'next/dynamic'
import MediaPickerModal from '../components/MediaPickerModal'

export default function TipTapEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [StarterKit, Underline, Link.configure({ openOnClick: true }), Image],
    content: value || '',
    immediatelyRender: false,
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
  })
  const [showMedia, setShowMedia] = useState(false)

  useEffect(() => {
    if (editor && typeof value === 'string') {
      // Update content without triggering update loop
      const current = editor.getHTML()
      if (current !== value) editor.commands.setContent(value, { emitUpdate: false })
    }
  }, [value, editor])

  if (!editor) return null

  const addImage = () => setShowMedia(true)

  return (
    <div className="border rounded">
      <div className="flex flex-wrap gap-2 p-2 border-b bg-gray-50">
        <button onClick={() => editor.chain().focus().toggleBold().run()} className="px-2 py-1 text-sm border rounded">B</button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className="px-2 py-1 text-sm border rounded">I</button>
        <button onClick={() => editor.chain().focus().toggleUnderline().run()} className="px-2 py-1 text-sm border rounded">U</button>
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className="px-2 py-1 text-sm border rounded">• Lijst</button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className="px-2 py-1 text-sm border rounded">1. Lijst</button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className="px-2 py-1 text-sm border rounded">H2</button>
        <button onClick={addImage} className="px-2 py-1 text-sm border rounded">Afbeelding</button>
        <button onClick={() => editor.chain().focus().setHorizontalRule().run()} className="px-2 py-1 text-sm border rounded">HR</button>
        <button onClick={() => editor.commands.unsetAllMarks()} className="px-2 py-1 text-sm border rounded">Clear</button>
      </div>
      <EditorContent editor={editor} className="p-3 min-h-[280px]" />
      <MediaPickerModal
        isOpen={showMedia}
        onClose={() => setShowMedia(false)}
        onSelect={(url) => {
          editor.chain().focus().setImage({ src: url }).run()
        }}
      />
    </div>
  )
}


