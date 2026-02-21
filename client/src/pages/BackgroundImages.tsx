import { useState } from "react";
import CMSDashboardLayout from "@/components/CMSDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Plus, Edit2, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function BackgroundImages() {
  const { user } = useAuth();
  const hotelId = user?.hotelId;
  const isSuperAdmin = user?.role === "superAdmin";
  
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    imageUrl: "",
    displayMode: "single" as "single" | "slideshow",
    displayDuration: 5000,
  });

  const imagesList = trpc.backgroundImages.list.useQuery({ hotelId }, { enabled: !!hotelId || isSuperAdmin });

  const createImage = trpc.backgroundImages.create.useMutation({
    onSuccess: () => {
      toast.success("Background image added successfully");
      setFormData({
        name: "",
        imageUrl: "",
        displayMode: "single",
        displayDuration: 5000,
      });
      setIsAddingNew(false);
      imagesList.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteImage = trpc.backgroundImages.delete.useMutation({
    onSuccess: () => {
      toast.success("Background image deleted successfully");
      imagesList.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.imageUrl) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!hotelId && !isSuperAdmin) {
      toast.error("No hotel assigned");
      return;
    }
    createImage.mutate({
      hotelId: hotelId!,
      ...formData,
    });
  };

  return (
    <CMSDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Background Images</h2>
            <p className="text-slate-600 mt-1">Manage home screen background images and slideshow</p>
          </div>
          <Button onClick={() => setIsAddingNew(!isAddingNew)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Image
          </Button>
        </div>

        {/* Add New Image Form */}
        {isAddingNew && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle>Add New Background Image</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Image Name *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Hotel Lobby"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Display Mode
                    </label>
                    <select
                      value={formData.displayMode}
                      onChange={(e) => setFormData({ ...formData, displayMode: e.target.value as "single" | "slideshow" })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    >
                      <option value="single">Single Image</option>
                      <option value="slideshow">Slideshow</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Image URL *
                    </label>
                    <Input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  {formData.displayMode === "slideshow" && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Display Duration (ms)
                      </label>
                      <Input
                        type="number"
                        value={formData.displayDuration}
                        onChange={(e) => setFormData({ ...formData, displayDuration: parseInt(e.target.value) })}
                        placeholder="5000"
                      />
                    </div>
                  )}
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createImage.isPending}>
                    {createImage.isPending ? "Adding..." : "Add Image"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Images Grid */}
        <div>
          {imagesList.isLoading ? (
            <div className="text-center py-8 text-slate-600">Loading images...</div>
          ) : imagesList.data && imagesList.data.data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {imagesList.data.data.map((image) => (
                <Card key={image.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-48 bg-slate-200 overflow-hidden">
                    <img
                      src={image.imageUrl}
                      alt={image.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full font-medium">
                        {image.displayMode === "single" ? "Single" : "Slideshow"}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium text-slate-900 mb-2">{image.name}</h3>
                    {image.displayMode === "slideshow" && (
                      <p className="text-xs text-slate-600 mb-3">
                        Duration: {image.displayDuration}ms
                      </p>
                    )}
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteImage.mutate({ id: image.id })}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-slate-600">
                No background images yet. Add one to get started!
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </CMSDashboardLayout>
  );
}
