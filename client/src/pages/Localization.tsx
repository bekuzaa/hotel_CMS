import { useState } from "react";
import CMSDashboardLayout from "@/components/CMSDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Globe, Plus, Edit2, Trash2, Check } from "lucide-react";
import { toast } from "sonner";

export default function Localization() {
  const [selectedLanguage, setSelectedLanguage] = useState<string>("th");
  const [editingLanguage, setEditingLanguage] = useState<string | null>(null);
  const [newLanguageName, setNewLanguageName] = useState("");

  const allLanguages = trpc.localization.getAll.useQuery();
  const translations = trpc.localization.getTranslations.useQuery({ languageCode: selectedLanguage });
  const defaultStructure = trpc.localization.getDefaultStructure.useQuery();
  const updateLocalization = trpc.localization.update.useMutation({
    onSuccess: () => {
      toast.success("Language settings updated");
      allLanguages.refetch();
      setEditingLanguage(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSetDefault = (languageCode: string) => {
    updateLocalization.mutate({
      languageCode,
      isDefault: true,
    });
  };

  const handleToggleActive = (languageCode: string, isActive: boolean) => {
    updateLocalization.mutate({
      languageCode,
      isActive: !isActive,
    });
  };

  return (
    <CMSDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Localization</h2>
          <p className="text-slate-600 mt-1">Manage languages and translations</p>
        </div>

        {/* Languages List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Supported Languages
              </CardTitle>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Language
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {allLanguages.isLoading ? (
              <div className="text-center py-8 text-slate-600">Loading languages...</div>
            ) : allLanguages.data && allLanguages.data.length > 0 ? (
              <div className="space-y-3">
                {allLanguages.data.map((lang) => (
                  <div key={lang.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {lang.languageCode === "th" ? "🇹🇭" : lang.languageCode === "en" ? "🇬🇧" : "🌐"}
                        </span>
                        <div>
                          <div className="font-medium text-slate-900">{lang.languageName}</div>
                          <div className="text-sm text-slate-600">{lang.languageCode}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {lang.isDefault && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                          Default
                        </span>
                      )}
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-medium ${
                          lang.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {lang.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLanguage(lang.languageCode)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      {!lang.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(lang.languageCode)}
                        >
                          <Check className="w-4 h-4 text-blue-600" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(lang.languageCode, lang.isActive)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-600">No languages found</div>
            )}
          </CardContent>
        </Card>

        {/* Translations Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Translations Preview - {selectedLanguage.toUpperCase()}</CardTitle>
          </CardHeader>
          <CardContent>
            {translations.isLoading ? (
              <div className="text-center py-8 text-slate-600">Loading translations...</div>
            ) : translations.data ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(translations.data).map(([key, value]) => (
                  <div key={key} className="p-3 border border-slate-200 rounded-lg">
                    <div className="text-xs font-mono text-slate-600 mb-1">{key}</div>
                    <div className="text-sm font-medium text-slate-900">{value}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-600">No translations available</div>
            )}
          </CardContent>
        </Card>

        {/* Translation Keys Reference */}
        <Card>
          <CardHeader>
            <CardTitle>Available Translation Keys</CardTitle>
          </CardHeader>
          <CardContent>
            {defaultStructure.isLoading ? (
              <div className="text-center py-8 text-slate-600">Loading...</div>
            ) : defaultStructure.data ? (
              <div className="space-y-4">
                <div className="text-sm text-slate-600 mb-4">
                  These are all available translation keys that can be used in the system:
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {Object.entries(defaultStructure.data).map(([key, value]) => (
                    <div key={key} className="p-2 bg-slate-50 rounded border border-slate-200">
                      <div className="text-xs font-mono text-slate-600">{key}</div>
                      <div className="text-xs text-slate-700 mt-1">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Language Support Info */}
        <Card>
          <CardHeader>
            <CardTitle>Language Support Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Currently Supported Languages</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Thai (ไทย)</strong> - th</li>
                  <li>• <strong>English</strong> - en</li>
                </ul>
              </div>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2">How to Add New Language</h3>
                <p className="text-sm text-green-800">
                  To add a new language, use the "Add Language" button above and provide the language code and name. 
                  You can then set it as the default language for the system.
                </p>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h3 className="font-medium text-amber-900 mb-2">Translation Keys</h3>
                <p className="text-sm text-amber-800">
                  Each translation key follows a namespace pattern (e.g., "nav.dashboard", "common.save"). 
                  This helps organize translations by feature and makes them easy to find.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CMSDashboardLayout>
  );
}
