'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { useEffect, useState } from 'react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'

import dynamic from 'next/dynamic'

// Dynamische import van MediaPickerModal met error handling
const MediaPickerModal = dynamic(() => import('../components/MediaPickerModal'), { 
  ssr: false,
  loading: () => <div className="p-2 text-sm text-gray-500">Media picker laden...</div>
})

export default function TipTapEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const [editorReady, setEditorReady] = useState(false)
  const [showMedia, setShowMedia] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const editor = useEditor({
    extensions: [
      StarterKit, 
      Underline, 
      Link.configure({ openOnClick: true }), 
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto'
        }
      })
    ],
    content: value || '',
    immediatelyRender: false,
    onUpdate({ editor }) {
      try {
        onChange(editor.getHTML())
      } catch (error) {
        console.error('Error in editor update:', error)
        setError('Fout bij het bijwerken van content')
      }
    },
    onCreate() {
      try {
        setEditorReady(true)
      } catch (error) {
        console.error('Error in editor creation:', error)
        setError('Fout bij het maken van editor')
      }
    },

  })

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

  if (error) {
    return (
      <div className="p-4 text-red-500 text-center border border-red-200 rounded bg-red-50">
        <div className="text-sm font-medium mb-2">Er is een fout opgetreden</div>
        <div className="text-xs mb-3">{error}</div>
        <div className="space-y-2">
          <button 
            onClick={() => setError(null)} 
            className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 mr-2"
          >
            Opnieuw proberen
          </button>
          <button 
            onClick={() => {
              setError(null)
              // Fallback naar eenvoudige textarea
              setShowMedia(false)
            }} 
            className="px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
          >
            Gebruik eenvoudige editor
          </button>
        </div>
      </div>
    )
  }

  if (!editor || !editorReady) {
    return (
      <div className="p-4 text-gray-500 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto mb-2"></div>
        <div className="mb-3">TipTap Editor laden...</div>
        <div className="text-xs text-gray-400">
          Als de editor niet laadt, probeer de pagina te verversen
        </div>
      </div>
    )
  }

  const addImage = () => {
    try {
      if (!editor) {
        setError('Editor is niet beschikbaar')
        return
      }
      
      // Controleer of de Image extensie beschikbaar is
      if (!editor.can().setImage({ src: '' })) {
        // Fallback: direct een URL vragen en HTML invoegen
        const url = prompt('Voer de URL van de afbeelding in:')
        if (url) {
          const imgHTML = `<img src="${url}" alt="Afbeelding" class="max-w-full h-auto" />`
          editor.chain().focus().insertContent(imgHTML).run()
        }
        return
      }
      
      setShowMedia(true)
    } catch (error) {
      console.error('Error opening media picker:', error)
      setError('Fout bij het openen van media picker')
      // Fallback: direct een URL vragen
      const url = prompt('Voer de URL van de afbeelding in:')
      if (url) {
        try {
          const imgHTML = `<img src="${url}" alt="Afbeelding" class="max-w-full h-auto" />`
          editor.chain().focus().insertContent(imgHTML).run()
        } catch (imgError) {
          console.error('Error inserting image:', imgError)
          setError('Fout bij het invoegen van afbeelding')
        }
      }
    }
  }

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
          onClick={() => editor.chain().focus().toggleCode().run()} 
          className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
          title="Inline code"
        >
          <code>code</code>
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
          onClick={() => editor.chain().focus().toggleBlockquote().run()} 
          className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
          title="Quote toevoegen"
        >
          💬 Quote
        </button>
        <button 
          onClick={() => editor.chain().focus().toggleCodeBlock().run()} 
          className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
          title="Code blok toevoegen"
        >
          💻 Code
        </button>
        <button 
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
          className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
          title="Heading 2"
        >
          H2
        </button>
        <button 
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} 
          className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
          title="Heading 3"
        >
          H3
        </button>
        <button 
          onClick={addImage} 
          className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
          title="Afbeelding toevoegen"
        >
          🖼️ Afbeelding
        </button>
        <button 
          onClick={() => {
            const url = prompt('Voer de URL in:')
            if (url) {
              editor.chain().focus().setLink({ href: url }).run()
            }
          }} 
          className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
          title="Link toevoegen"
        >
          🔗 Link
        </button>
        <button 
          onClick={() => editor.chain().focus().setHorizontalRule().run()} 
          className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
          title="Horizontal Rule"
        >
          HR
        </button>
        <button 
          onClick={() => {
            const tableHTML = '<table class="border-collapse border border-gray-300 w-full"><thead><tr><th class="border border-gray-300 px-4 py-2 bg-gray-100">Kolom 1</th><th class="border border-gray-300 px-4 py-2 bg-gray-100">Kolom 2</th></tr></thead><tbody><tr><td class="border border-gray-300 px-4 py-2">Rij 1, Cel 1</td><td class="border border-gray-300 px-4 py-2">Rij 1, Cel 2</td></tr><tr><td class="border border-gray-300 px-4 py-2">Rij 2, Cel 1</td><td class="border border-gray-300 px-4 py-2">Rij 2, Cel 2</td></tr></tbody></table>'
            editor.chain().focus().insertContent(tableHTML).run()
          }} 
          className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
          title="Tabel toevoegen"
        >
          📊 Tabel
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
      {showMedia && (
        <div className="p-4 border-t bg-gray-50">
          <div className="mb-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Afbeelding toevoegen</h4>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Voer de URL van de afbeelding in..."
                className="flex-1 px-3 py-2 border rounded text-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const url = e.currentTarget.value.trim()
                    if (url) {
                                              try {
                          if (!editor) {
                            setError('Editor is niet beschikbaar')
                            return
                          }
                          
                          // Probeer eerst setImage, anders fallback naar insertContent
                          if (editor.can().setImage({ src: '' })) {
                            try {
                              editor.chain().focus().setImage({ src: url }).run()
                              setShowMedia(false)
                            } catch (imgError) {
                              console.error('Error with setImage, trying insertContent:', imgError)
                              // Fallback: voeg HTML img tag toe
                              const imgHTML = `<img src="${url}" alt="Afbeelding" class="max-w-full h-auto" />`
                              editor.chain().focus().insertContent(imgHTML).run()
                              setShowMedia(false)
                            }
                          } else {
                            // Image extensie niet beschikbaar, gebruik HTML fallback
                            const imgHTML = `<img src="${url}" alt="Afbeelding" class="max-w-full h-auto" />`
                            editor.chain().focus().insertContent(imgHTML).run()
                            setShowMedia(false)
                          }
                        } catch (error) {
                          console.error('Error inserting image:', error)
                          setError('Fout bij het invoegen van afbeelding')
                        }
                    }
                  }
                }}
              />
              <button
                onClick={() => setShowMedia(false)}
                className="px-3 py-2 text-sm border rounded hover:bg-gray-100"
              >
                Annuleren
              </button>
            </div>
          </div>
          
          {/* Probeer MediaPickerModal te laden, maar toon fallback als het niet lukt */}
          <div className="border-t pt-3">
            <div className="text-xs text-gray-500 mb-2">Of kies uit bestaande media:</div>
            <MediaPickerModal
              isOpen={showMedia}
              onClose={() => setShowMedia(false)}
              onSelect={(url) => {
                try {
                  if (!editor) {
                    setError('Editor is niet beschikbaar')
                    return
                  }
                  
                  // Probeer eerst setImage, anders fallback naar insertContent
                  if (editor.can().setImage({ src: '' })) {
                    try {
                      editor.chain().focus().setImage({ src: url }).run()
                      setShowMedia(false)
                    } catch (imgError) {
                      console.error('Error with setImage, trying insertContent:', imgError)
                      // Fallback: voeg HTML img tag toe
                      const imgHTML = `<img src="${url}" alt="Afbeelding" class="max-w-full h-auto" />`
                      editor.chain().focus().insertContent(imgHTML).run()
                      setShowMedia(false)
                    }
                  } else {
                    // Image extensie niet beschikbaar, gebruik HTML fallback
                    const imgHTML = `<img src="${url}" alt="Afbeelding" class="max-w-full h-auto" />`
                    editor.chain().focus().insertContent(imgHTML).run()
                    setShowMedia(false)
                  }
                } catch (error) {
                  console.error('Error inserting image:', error)
                  setError('Fout bij het invoegen van afbeelding')
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}


