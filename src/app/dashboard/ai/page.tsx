"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import {
  Lock,
  AlertTriangle,
  AlertCircle,
  MessageCircle,
  Send,
  Loader2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/LanguageProvider";

export default function AIPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { t, isRTL, locale, language } = useLanguage();
  
  // Ensure locale is always defined
  const safeLocale = locale || "en-US";
  
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // Get user plan status
  const subscription = useQuery(
    api.functions.getSubscription,
    isLoaded && user?.id ? { clerkUserId: user.id } : "skip"
  );
  const currentUser = useQuery(
    api.functions.getUser,
    isLoaded && user?.id ? { clerkUserId: user.id } : "skip"
  );
  
  // Conversation and chat
  const allConversations = useQuery(
    api.functions.getAllConversations,
    isLoaded && user?.id ? { clerkUserId: user.id } : "skip"
  );
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  
  // Get the selected conversation or the latest one
  const conversation = useQuery(
    api.functions.getConversation,
    isLoaded && user?.id 
      ? { 
          clerkUserId: user.id, 
          ...(selectedConversationId ? { conversationId: selectedConversationId as any } : {})
        } 
      : "skip"
  );
  
  // Set selected conversation to latest when conversations load and none is selected
  useEffect(() => {
    if (allConversations && allConversations.length > 0 && !selectedConversationId) {
      setSelectedConversationId(allConversations[0]._id);
    }
  }, [allConversations, selectedConversationId]);
  
  const sendMessage = useAction(api.functions.sendChatMessage);
  const createNewConversation = useMutation(api.functions.createNewConversation);
  
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  const handleNewChat = async () => {
    if (!user?.id) return;
    
    try {
      setMessage("");
      const newConversation = await createNewConversation({ clerkUserId: user.id });
      // Set the new conversation as selected - it will appear in the list
      if (newConversation) {
        setSelectedConversationId(newConversation._id);
      }
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (err: any) {
      console.error("Failed to create new conversation:", err);
      setError(err?.message || t("ai.failedToSend"));
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleConversationClick = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setMessage("");
    // Scroll will happen automatically when conversation changes
  };


  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2
          size={24}
          className="w-6 h-6 animate-spin text-emerald-500 dark:text-emerald-400 shrink-0"
        />
      </div>
    );
  }

  // Show loading state while subscription/user data is loading
  if (subscription === undefined || currentUser === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2
            size={24}
            className="w-6 h-6 animate-spin text-emerald-500 dark:text-emerald-400 mx-auto shrink-0"
          />
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{t("ai.loading")}</p>
        </div>
      </div>
    );
  }

  const plan = subscription?.plan || currentUser?.plan || "free";
  const isPro = plan === "pro";
  const chatsUsed = subscription?.aiChatsUsed || 0;
  const chatsLimit = isPro ? 100 : 10;
  const isLimitReached = chatsUsed >= chatsLimit;

  // Show locked state for Free users
  if (!isPro) {
    return (
      <div className={`space-y-4 sm:space-y-6 px-4 sm:px-0 ${isRTL ? "text-right" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
        <div className={isRTL ? "text-right" : "text-left"}>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t("ai.title")}</h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t("ai.subtitle")}</p>
        </div>

        <div className="bg-white dark:bg-[#1e293b] rounded-lg sm:rounded-xl shadow p-4 sm:p-8 border-2 border-gray-200 dark:border-slate-700">
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock size={24} className="w-6 h-6 text-gray-500 dark:text-gray-400 shrink-0" />
            </div>
            <h2 className="text-base font-medium text-gray-800 dark:text-gray-200 mb-2">{t("ai.locked.title")}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {t("ai.locked.description")}
            </p>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm px-6 py-3">
              <Link href="/dashboard/subscription">
                {t("ai.upgradeToPro")}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleSendMessage = async () => {
    if (!user?.id || !message.trim() || isSending || isLimitReached) return;

    setIsSending(true);
    setError(null);
    const messageToSend = message.trim();
    setMessage("");

    try {
      await sendMessage({
        clerkUserId: user.id,
        message: messageToSend,
        ...(selectedConversationId ? { conversationId: selectedConversationId as any } : {}),
      });
      // Conversation will automatically update via reactive query
    } catch (err: any) {
      const rawMessage = String(err?.message || "");
      let friendlyMessage = rawMessage || t("ai.failedToSend");

      // Map non-finance classifier error to localized, user-friendly text
      if (rawMessage.includes("NON_FINANCE_QUESTION")) {
        friendlyMessage =
          language === "ar"
            ? "مساعد فينورا مخصص للأسئلة المتعلقة بالمال الشخصي، مثل الميزانية، الادخار، الدخل، المصروفات، الديون أو الاستثمار."
            : "Finora's AI assistant focuses on personal finance topics like budgeting, saving, income, expenses, debt, and investing.";
      }

      setError(friendlyMessage);
      setMessage(messageToSend); // Restore message on error
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`space-y-4 sm:space-y-6 px-4 sm:px-0 ${isRTL ? "text-right" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
      <div className={`flex flex-col sm:flex-row ${isRTL ? "sm:flex-row-reverse" : ""} justify-between items-start gap-3 sm:gap-0`}>
        <div className={`${isRTL ? "text-right" : "text-left"} w-full sm:w-auto`}>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t("ai.title")}</h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t("ai.subtitle")}</p>
        </div>
        <div className={isRTL ? "text-left" : "text-right"}>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {t("ai.chatsUsed")} <span className="font-semibold">{chatsUsed}/{chatsLimit}</span>
          </div>
        </div>
      </div>

      {/* Limit reached CTA */}
      {isLimitReached && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-0.5">
              <AlertTriangle size={20} className="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-medium text-orange-800 dark:text-orange-300 mb-2">
                {t("ai.limitReached.title")}
              </h3>
              <p className="text-sm text-orange-700 dark:text-orange-400 mb-4">
                {t("ai.limitReached.description", { limit: String(chatsLimit), proLimit: isPro ? t("ai.limitReached.unlimited") : "100" })}
              </p>
              <Button
                asChild
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm px-6 py-3"
              >
                <Link href="/dashboard/subscription">
                  {t("ai.upgradeToPro")}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm text-red-800 dark:text-red-300">{t("ai.error")}</p>
              <p className="mt-1 text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        {/* Chat history sidebar */}
        <aside className="w-full lg:w-64 bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
          <div className={`flex ${isRTL ? "flex-row-reverse" : ""} items-center justify-between gap-2`}>
            <div className={isRTL ? "text-right" : "text-left"}>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
                {t("ai.chatHistory")}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("ai.recentQuestions")}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleNewChat}
              className="h-8 w-8 rounded-lg border-emerald-500/40 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 hover:text-emerald-400 shrink-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
            {allConversations && allConversations.length > 0 ? (
              allConversations.map((conv: any) => {
                // Get the first user message as preview
                const firstUserMessage = conv.messages?.find((m: any) => m.role === "user");
                const isSelected = selectedConversationId === conv._id;
                
                return (
                  <div
                    key={conv._id}
                    onClick={() => handleConversationClick(conv._id)}
                    className={`rounded-lg border px-3 py-2.5 text-xs line-clamp-2 transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200"
                        : "bg-gray-50 dark:bg-slate-900/60 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-900/80"
                    }`}
                  >
                    {firstUserMessage ? (
                      firstUserMessage.content
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 italic">
                        {t("ai.newConversation")}
                      </span>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">
                {t("ai.noRecentQuestions")}
              </p>
            )}
          </div>
        </aside>

        {/* Chat container */}
        <div className="flex-1 bg-white dark:bg-slate-950 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 flex flex-col h-[calc(100vh-200px)] min-h-[600px] transition-colors">
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {conversation === undefined ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 size={24} className="w-6 h-6 animate-spin text-emerald-500 dark:text-emerald-400 mx-auto shrink-0" />
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{t("ai.loadingConversation")}</p>
              </div>
            </div>
          ) : !conversation || conversation.messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle size={32} className="w-8 h-8 text-emerald-600 dark:text-emerald-400 shrink-0" />
                </div>
                <h3 className="text-base font-medium text-gray-800 dark:text-gray-200 mb-2">{t("ai.beginConsultation")}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("ai.beginDescription")}
                </p>
              </div>
            </div>
          ) : (
            <>
              {conversation.messages.map((msg: any, index: number) => (
                <div
                  key={index}
                  ref={(el) => {
                    messageRefs.current[index] = el;
                  }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                >
                  <div
                    className={`max-w-2xl rounded-2xl px-5 py-4 ${
                      msg.role === "user"
                        ? "bg-emerald-600 text-white shadow-md"
                        : "bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-slate-700 shadow-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{msg.content}</p>
                    <p className={`text-xs mt-3 ${
                      msg.role === "user" ? "text-emerald-100" : "text-gray-500 dark:text-gray-400"
                    }`}>
                      {(() => {
                        try {
                          if (!msg.timestamp) return "";
                          const timestamp = typeof msg.timestamp === "string" || typeof msg.timestamp === "number" 
                            ? msg.timestamp 
                            : String(msg.timestamp);
                          const date = new Date(timestamp);
                          if (isNaN(date.getTime())) return "";
                          return date.toLocaleTimeString(safeLocale, { hour: '2-digit', minute: '2-digit' });
                        } catch (e) {
                          console.error("Error formatting timestamp:", e);
                          return "";
                        }
                      })()}
                    </p>
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm px-5 py-4 border border-gray-200 dark:border-slate-700 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <Loader2 size={20} className="w-5 h-5 animate-spin text-emerald-500 dark:text-emerald-400 shrink-0" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{t("ai.processing")}</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
          </div>

          {/* Input area */}
          <div className="border-t border-gray-200 dark:border-slate-800 p-5 bg-gray-50 dark:bg-slate-900/50">
            <div className="flex gap-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isLimitReached ? t("ai.placeholderLimit") : t("ai.placeholder")}
                disabled={isSending || isLimitReached}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-slate-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed resize-none text-sm"
                rows={2}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || isSending || isLimitReached}
                className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm shadow-md shrink-0"
              >
                {isSending ? (
                  <>
                    <Loader2 size={16} className={`w-4 h-4 animate-spin shrink-0 ${isRTL ? "ml-2" : "mr-2"}`} />
                    <span>{t("ai.sending")}</span>
                  </>
                ) : (
                  <>
                    <Send size={16} className={`w-4 h-4 shrink-0 ${isRTL ? "ml-2" : "mr-2"}`} />
                    <span>{t("ai.send")}</span>
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              {t("ai.financialOnly")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
