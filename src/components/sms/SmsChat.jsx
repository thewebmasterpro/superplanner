import { useState, useEffect, useRef } from 'react'
import {
  MessageSquare, Send, Search, Phone, ArrowLeft,
  Loader2, User, ChevronRight
} from 'lucide-react'
import { useSmsConversations, useSmsConversation, useSmsMessages } from '../../hooks/useSms'
import { format } from 'date-fns'
import { cn } from '../../lib/utils'

export function SmsChat() {
  const [selectedPhone, setSelectedPhone] = useState(null)
  const [search, setSearch] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)

  return (
    <div className="card bg-base-100 shadow-md overflow-hidden" style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}>
      <div className="flex h-full">
        {/* Conversation List - hide on mobile when chat is open */}
        <div className={cn(
          "w-full md:w-80 border-r border-base-200 flex flex-col",
          selectedPhone && "hidden md:flex"
        )}>
          <ConversationList
            search={search}
            setSearch={setSearch}
            selectedPhone={selectedPhone}
            onSelect={setSelectedPhone}
            showNewChat={showNewChat}
            setShowNewChat={setShowNewChat}
            newPhone={newPhone}
            setNewPhone={setNewPhone}
          />
        </div>

        {/* Chat Area */}
        <div className={cn(
          "flex-1 flex flex-col",
          !selectedPhone && "hidden md:flex"
        )}>
          {selectedPhone ? (
            <ChatArea
              phone={selectedPhone}
              onBack={() => setSelectedPhone(null)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-base-content/40">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">Sélectionnez une conversation</p>
                <p className="text-sm mt-1">ou démarrez une nouvelle discussion</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ConversationList({ search, setSearch, selectedPhone, onSelect, showNewChat, setShowNewChat, newPhone, setNewPhone }) {
  const { data: conversations, isLoading } = useSmsConversations()

  const filtered = (conversations || []).filter(c =>
    !search || c.contact_name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  )

  const handleNewChat = () => {
    if (!newPhone.trim()) return
    onSelect(newPhone.trim())
    setShowNewChat(false)
    setNewPhone('')
  }

  return (
    <>
      <div className="p-3 border-b border-base-200">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="input input-bordered input-sm w-full pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowNewChat(!showNewChat)}
            className="btn btn-primary btn-sm btn-square"
            title="Nouveau message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {showNewChat && (
          <div className="mt-2 flex gap-2">
            <input
              type="tel"
              placeholder="+33 6 ..."
              className="input input-bordered input-sm flex-1"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNewChat()}
              autoFocus
            />
            <button onClick={handleNewChat} className="btn btn-primary btn-sm">
              OK
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-sm text-base-content/40">
            Aucune conversation
          </div>
        ) : (
          filtered.map(conv => (
            <button
              key={conv.phone}
              onClick={() => onSelect(conv.phone)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 hover:bg-base-200/50 transition-colors text-left",
                selectedPhone === conv.phone && "bg-primary/10"
              )}
            >
              <div className="avatar placeholder">
                <div className="bg-base-300 text-base-content/60 rounded-full w-10 h-10">
                  <User className="w-5 h-5" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm truncate">{conv.contact_name}</span>
                  <span className="text-xs text-base-content/40 shrink-0">
                    {format(new Date(conv.lastDate), 'HH:mm')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-base-content/50 truncate">
                    {conv.direction === 'outbound' && '↗ '}
                    {conv.lastMessage}
                  </p>
                  {conv.unread > 0 && (
                    <span className="badge badge-primary badge-xs">{conv.unread}</span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </>
  )
}

function ChatArea({ phone, onBack }) {
  const { data: messages, isLoading } = useSmsConversation(phone)
  const { sendMessage, isSending } = useSmsMessages()
  const [text, setText] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!text.trim()) return
    sendMessage({ recipient: phone, body: text.trim(), contact_name: phone })
    setText('')
  }

  return (
    <>
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-base-200 flex items-center gap-3">
        <button onClick={onBack} className="btn btn-ghost btn-sm btn-circle md:hidden">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="avatar placeholder">
          <div className="bg-primary/10 text-primary rounded-full w-9 h-9">
            <Phone className="w-4 h-4" />
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-sm">{phone}</h3>
          <p className="text-xs text-base-content/50">SMS</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (messages || []).length === 0 ? (
          <div className="text-center py-10 text-sm text-base-content/40">
            Aucun message. Envoyez le premier !
          </div>
        ) : (
          (messages || []).map(msg => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.direction === 'outbound' ? "justify-end" : "justify-start"
              )}
            >
              <div className={cn(
                "max-w-[75%] rounded-2xl px-4 py-2",
                msg.direction === 'outbound'
                  ? "bg-primary text-primary-content rounded-br-md"
                  : "bg-base-200 rounded-bl-md"
              )}>
                <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                <div className={cn(
                  "flex items-center gap-1 mt-1",
                  msg.direction === 'outbound' ? "justify-end" : "justify-start"
                )}>
                  <span className={cn(
                    "text-xs",
                    msg.direction === 'outbound' ? "text-primary-content/60" : "text-base-content/40"
                  )}>
                    {format(new Date(msg.created), 'HH:mm')}
                  </span>
                  {msg.direction === 'outbound' && msg.status === 'delivered' && (
                    <span className="text-xs text-primary-content/60">✓✓</span>
                  )}
                  {msg.direction === 'outbound' && msg.status === 'sent' && (
                    <span className="text-xs text-primary-content/60">✓</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-base-200">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Tapez votre message..."
            className="input input-bordered flex-1"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || isSending}
            className="btn btn-primary btn-circle"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  )
}
