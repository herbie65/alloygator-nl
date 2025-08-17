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
  const [editorReady, setEditorReady] = useState(false)
  
  const editor = useEditor({
    extensions: [StarterKit, Underline, Link.configure({ openOnClick: true }), Image],
    content: value || '',
    immediatelyRender: false,
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
    onCreate() {
      setEditorReady(true)
    },
  })
  
  const [showMedia, setShowMedia] = useState(false)

  // Alleen initialiseren bij mount of wanneer editor inhoud echt achterloopt.
  useEffect(() => {
    if (!editor) return
    if (typeof value !== 'string') return
    const current = editor.getHTML()
    // Vergelijk op stringbasis; als identiek, doe niets.
    if (current !== value) {
      editor.commands.setContent(value, { emitUpdate: false })
    }
  }, [editor, value])

  if (!editor || !editorReady) {
    return (
      <div className="p-4 text-gray-500 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto mb-2"></div>
        Editor laden...
      </div>
    )
  }

  const addImage = () => setShowMedia(true)

  return (
    <div className="border rounded">
      <div className="flex flex-wrap gap-2 p-2 border-b bg-gray-50">
        <button 
          onClick={() => editor.chain().focus().toggleBold().run()} 
          className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button 
          onClick={() => editor.chain().focus().toggleItalic().run()} 
          className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
          title="Italic"
        >
          <em>I</em>
        </button>
        <button 
          onClick={() => editor.chain().focus().toggleUnderline().run()} 
          className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
          title="Underline"
        >
          <u>U</u>
        </button>
        <button 
          onClick={() => editor.chain().focus().toggleBulletList().run()} 
          className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
          title="Bullet List"
        >
          • Lijst
        </button>
        <button 
          onClick={() => editor.chain().focus().toggleOrderedList().run()} 
          className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
          title="Ordered List"
        >
          1. Lijst
        </button>
        <button 
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
          className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
          title="Heading 2"
        >
          H2
        </button>
        <button 
          onClick={addImage} 
          className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
          title="Add Image"
        >
          🖼️
        </button>
        <button 
          onClick={() => editor.chain().focus().setHorizontalRule().run()} 
          className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
          title="Horizontal Rule"
        >
          HR
        </button>
        <button 
          onClick={() => editor.commands.unsetAllMarks()} 
          className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
          title="Clear Formatting"
        >
          Clear
        </button>
      </div>
      <EditorContent editor={editor} className="p-3 min-h-[200px] prose max-w-none" />
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


