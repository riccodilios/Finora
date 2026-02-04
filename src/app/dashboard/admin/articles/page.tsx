"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  AlertCircle,
  FileText,
  Calendar,
  User,
  Clock,
  Tag,
  Globe,
  Shield
} from "lucide-react";
import { Id } from "../../../../../convex/_generated/dataModel";

const ADMIN_USER_ID = "user_38vftq2ScgNF9AEmYVnswcUuVpH";

export default function AdminArticlesPage() {
  const { user, isLoaded } = useUser();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Id<"articles"> | null>(null);
  const [formData, setFormData] = useState({
    language: "en" as "en" | "ar",
    title: "",
    excerpt: "",
    content: "",
    author: "",
    publishedAt: new Date().toISOString().split("T")[0],
    readTime: 5,
    category: "",
    tags: [] as string[],
    region: "",
    riskProfile: "" as "conservative" | "moderate" | "aggressive" | "",
    financialLevel: "" as "beginner" | "intermediate" | "advanced" | "",
    plan: "free" as "free" | "pro",
  });
  const [tagInput, setTagInput] = useState("");

  const articles = useQuery(api.functions.getAllArticles);
  const createArticle = useMutation(api.functions.createArticle);
  const updateArticle = useMutation(api.functions.updateArticle);
  const deleteArticle = useMutation(api.functions.deleteArticle);
  const seedArticles = useMutation(api.functions.seedArticles);
  const [isSeeding, setIsSeeding] = useState(false);

  const isAdmin = user?.id === ADMIN_USER_ID;

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800">
          <CardContent className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              This page is only accessible to administrators.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleOpenDialog = (articleId?: Id<"articles">) => {
    if (articleId && articles) {
      const article = articles.find((a) => a._id === articleId);
      if (article) {
        setEditingArticle(articleId);
        setFormData({
          language: (article.language || "en") as "en" | "ar",
          title: article.title,
          excerpt: article.excerpt,
          content: article.content,
          author: article.author,
          publishedAt: article.publishedAt.split("T")[0],
          readTime: article.readTime,
          category: article.category || "",
          tags: article.tags || [],
          region: article.region || "",
          riskProfile: article.riskProfile || "",
          financialLevel: article.financialLevel || "",
          plan: article.plan || "free",
        });
      }
    } else {
      setEditingArticle(null);
      setFormData({
        language: "en",
        title: "",
        excerpt: "",
        content: "",
        author: "",
        publishedAt: new Date().toISOString().split("T")[0],
        readTime: 5,
        category: "",
        tags: [],
        region: "",
        riskProfile: "",
        financialLevel: "",
        plan: "free",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingArticle(null);
    setTagInput("");
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const articleData = {
        language: formData.language,
        title: formData.title,
        excerpt: formData.excerpt,
        content: formData.content,
        author: formData.author,
        publishedAt: new Date(formData.publishedAt).toISOString(),
        readTime: formData.readTime,
        category: formData.category || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        region: formData.region || undefined,
        riskProfile: formData.riskProfile || undefined,
        financialLevel: formData.financialLevel || undefined,
        plan: formData.plan,
      };

      if (editingArticle) {
        await updateArticle({ articleId: editingArticle, ...articleData });
      } else {
        await createArticle(articleData);
      }
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving article:", error);
      alert("Failed to save article. Please try again.");
    }
  };

  const handleDelete = async (articleId: Id<"articles">) => {
    if (!confirm("Are you sure you want to delete this article? This action cannot be undone.")) {
      return;
    }
    try {
      await deleteArticle({ articleId });
    } catch (error) {
      console.error("Error deleting article:", error);
      alert("Failed to delete article. Please try again.");
    }
  };

  return (
    <div className="space-y-6 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Article Management
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Create, edit, and manage financial education articles
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={async () => {
              setIsSeeding(true);
              try {
                await seedArticles({});
                alert("Articles seeded successfully! Refresh the page to see them.");
              } catch (error) {
                console.error("Error seeding articles:", error);
                alert("Failed to seed articles. They may already exist.");
              } finally {
                setIsSeeding(false);
              }
            }}
            disabled={isSeeding}
            variant="outline"
            className="border-gray-300 dark:border-slate-700"
          >
            {isSeeding ? "Seeding..." : "Seed Articles"}
          </Button>
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-emerald-600 hover:bg-emerald-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Article
          </Button>
        </div>
      </div>

      {/* Articles List */}
      {articles === undefined ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800">
              <CardContent className="p-6">
                <Skeleton className="h-4 w-3/4 mb-3 bg-gray-200 dark:bg-white/10" />
                <Skeleton className="h-3 w-1/2 mb-4 bg-gray-200 dark:bg-white/10" />
                <Skeleton className="h-20 w-full mb-4 bg-gray-200 dark:bg-white/10" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <Card className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800">
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h2 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
              No Articles Yet
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Get started by creating your first article.
            </p>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Article
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <Card
              key={article._id}
              className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 hover:shadow-md transition-all"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {article.category && (
                      <span className="px-2 py-1 text-xs font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded">
                        {article.category}
                      </span>
                    )}
                    {article.plan === "pro" && (
                      <span className="px-2 py-1 text-xs font-medium bg-emerald-600 text-white rounded">
                        Pro
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                  {article.title}
                </h3>

                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                  {article.excerpt}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {article.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {article.readTime} min
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDialog(article._id)}
                    className="flex-1 border-gray-300 dark:border-slate-700"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(article._id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-300 dark:border-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#1e293b]">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">
              {editingArticle ? "Edit Article" : "Create New Article"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Language *
                </label>
                <select
                  value={formData.language}
                  onChange={(e) =>
                    setFormData({ ...formData, language: e.target.value as "en" | "ar" })
                  }
                  className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
                >
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Author *
                </label>
                <input
                  type="text"
                  required
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Excerpt *
              </label>
              <textarea
                required
                rows={3}
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
                placeholder="Short summary for list view"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Content *
              </label>
              <textarea
                required
                rows={10}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 font-mono text-sm"
                placeholder="Full article content"
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Published Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.publishedAt}
                  onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Read Time (min) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.readTime}
                  onChange={(e) => setFormData({ ...formData, readTime: parseInt(e.target.value) || 5 })}
                  className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
                  placeholder="e.g., Investing"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Plan *
                </label>
                <select
                  value={formData.plan}
                  onChange={(e) => setFormData({ ...formData, plan: e.target.value as "free" | "pro" })}
                  className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Region
                </label>
                <input
                  type="text"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
                  placeholder="e.g., saudi, global"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Risk Profile
                </label>
                <select
                  value={formData.riskProfile}
                  onChange={(e) => setFormData({ ...formData, riskProfile: e.target.value as any })}
                  className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
                >
                  <option value="">None</option>
                  <option value="conservative">Conservative</option>
                  <option value="moderate">Moderate</option>
                  <option value="aggressive">Aggressive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Financial Level
                </label>
                <select
                  value={formData.financialLevel}
                  onChange={(e) => setFormData({ ...formData, financialLevel: e.target.value as any })}
                  className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
                >
                  <option value="">None</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1 p-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
                  placeholder="Add tag and press Enter"
                />
                <Button
                  type="button"
                  onClick={handleAddTag}
                  variant="outline"
                  className="border-gray-300 dark:border-slate-700"
                >
                  Add
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                className="border-gray-300 dark:border-slate-700"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500">
                <Save className="w-4 h-4 mr-2" />
                {editingArticle ? "Update" : "Create"} Article
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
