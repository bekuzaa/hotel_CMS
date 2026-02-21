import { useState, useRef } from "react";
import CMSDashboardLayout from "@/components/CMSDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Upload, Trash2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function MediaGallery() {
  const { user } = useAuth();
  const hotelId = user?.hotelId;
  const isSuperAdmin = user?.role === "superAdmin";
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mediaList = trpc.mediaUpload.list.useQuery({ hotelId }, { enabled: !!hotelId || isSuperAdmin });
  const mediaStats = trpc.mediaUpload.getStats.useQuery({ hotelId }, { enabled: !!hotelId || isSuperAdmin });
  const registerUpload = trpc.mediaUpload.registerUpload.useMutation({
    onSuccess: () => {
      toast.success("Media file registered successfully");
      mediaList.refetch();
      mediaStats.refetch();
      setUploadProgress(0);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMedia = trpc.mediaUpload.delete.useMutation({
    onSuccess: () => {
      toast.success("Media file deleted successfully");
      mediaList.refetch();
      mediaStats.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 30;
        });
      }, 200);

      // In a real implementation, you would upload to S3 here
      // For now, we'll simulate the upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Register the upload in the database
      if (!hotelId && !isSuperAdmin) {
        toast.error("No hotel assigned");
        return;
      }
      
      await registerUpload.mutateAsync({
        hotelId: hotelId!,
        fileName: file.name,
        fileKey: `media/${Date.now()}/${file.name}`,
        fileUrl: URL.createObjectURL(file),
        fileType: file.type.startsWith('image') ? 'image' : 'video',
        mimeType: file.type,
        fileSize: file.size,
      });

      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast.error("Upload failed");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const copyToClipboard = (url: string, id: number) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("URL copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <CMSDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Media Gallery</h2>
            <p className="text-slate-600 mt-1">Upload and manage images and videos for your hotel TV system</p>
          </div>
          <Button onClick={() => fileInputRef.current?.click()} className="gap-2" disabled={isUploading}>
            <Upload className="w-4 h-4" />
            {isUploading ? `Uploading... ${Math.round(uploadProgress)}%` : "Upload Media"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Uploading...</span>
                  <span className="text-sm text-slate-600">{Math.round(uploadProgress)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900">{mediaList.data?.length || 0}</div>
                <p className="text-slate-600 mt-1">Total Files</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900">
                  {mediaStats.data ? formatFileSize(mediaStats.data.totalSize) : '0 Bytes'}
                </div>
                <p className="text-slate-600 mt-1">Total Storage Used</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Media Grid */}
        <div>
          {mediaList.isLoading ? (
            <div className="text-center py-8 text-slate-600">Loading media...</div>
          ) : mediaList.data && mediaList.data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mediaList.data.map((media) => (
                <Card key={media.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-48 bg-slate-200 overflow-hidden">
                    {media.fileType === 'image' ? (
                      <img
                        src={media.fileUrl}
                        alt={media.fileName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={media.fileUrl}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full font-medium">
                        {media.fileType}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium text-slate-900 truncate mb-1">{media.fileName}</h3>
                    <p className="text-xs text-slate-600 mb-3">{formatFileSize(media.fileSize || 0)}</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 bg-slate-100 p-2 rounded text-xs">
                        <input
                          type="text"
                          value={media.fileUrl}
                          readOnly
                          className="flex-1 bg-transparent outline-none text-slate-600"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(media.fileUrl, media.id)}
                        >
                          {copiedId === media.id ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-red-600 hover:text-red-700"
                        onClick={() => deleteMedia.mutate({ id: media.id })}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Upload className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">No media files yet</p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  Upload Your First File
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </CMSDashboardLayout>
  );
}
