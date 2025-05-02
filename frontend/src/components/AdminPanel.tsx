import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Save, X, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { faqService, FAQ } from "../utils/faqService";

const AdminPanel = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const categoryOptions = [
    { value: "exams", label: "Examens" },
    { value: "programs", label: "Filières" },
    { value: "professors", label: "Enseignants" },
    { value: "procedures", label: "Procédures" },
    { value: "orientation", label: "Orientation" },
    { value: "general", label: "Général" },
  ];

  useEffect(() => {
    loadFAQs();
  }, []);
  
  const loadFAQs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await faqService.getAllFAQs();
      
      if (!Array.isArray(data)) {
        console.error('Les données reçues ne sont pas un tableau:', data);
        setError("Format de données invalide");
        setFaqs([]);
        return;
      }
      
      setFaqs(data);
    } catch (error) {
      console.error('Erreur lors du chargement des FAQs:', error);
      setError("Impossible de charger les FAQs");
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  };
  

  const handleEdit = (faq: FAQ) => {
    setEditingFaq({ ...faq });
    setIsAdding(false);
  };

  const handleCancel = () => {
    setEditingFaq(null);
    setIsAdding(false);
  };

  const handleSave = async () => {
    if (!editingFaq?.question || !editingFaq?.answer) {
      toast({
        title: "Erreur",
        description: "La question et la réponse sont requises.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      if (isAdding) {
        // Ajouter une nouvelle FAQ
        const newFaq = await faqService.addFAQ({
          question: editingFaq.question,
          answer: editingFaq.answer,
          category: editingFaq.category
        });
        // Mettre à jour la liste des FAQs immédiatement
        setFaqs(prevFaqs => [...prevFaqs, newFaq]);
        toast({
          title: "FAQ ajoutée",
          description: "La nouvelle FAQ a été ajoutée avec succès.",
        });
      } else {
        // Mettre à jour une FAQ existante
        const updatedFaq = await faqService.updateFAQ(editingFaq._id, {
          question: editingFaq.question,
          answer: editingFaq.answer,
          category: editingFaq.category
        });
        // Mettre à jour la liste des FAQs immédiatement
        setFaqs(prevFaqs => prevFaqs.map(faq => 
          faq._id === updatedFaq._id ? updatedFaq : faq
        ));
        toast({
          title: "FAQ mise à jour",
          description: "La FAQ a été mise à jour avec succès.",
        });
      }
      setEditingFaq(null);
      setIsAdding(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingFaq({
      _id: "",
      question: "",
      answer: "",
      category: "general",
    });
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await faqService.deleteFAQ(id);
      // Mettre à jour la liste des FAQs immédiatement
      setFaqs(prevFaqs => prevFaqs.filter(faq => faq._id !== id));
      toast({
        title: "Succès",
        description: "FAQ supprimée avec succès",
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la FAQ",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredFaqs = React.useMemo(() => {
    if (!Array.isArray(faqs)) {
      return [];
    }
    return currentCategory === "all" 
      ? faqs 
      : faqs.filter(faq => faq.category === currentCategory);
  }, [faqs, currentCategory]);

  const updateEditingFaq = (field: keyof FAQ, value: string) => {
    if (editingFaq) {
      setEditingFaq({
        ...editingFaq,
        [field]: value
      });
    }
  };

  const startEdit = (faq: FAQ) => {
    setEditingFaq({ ...faq });
    setIsAdding(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4">Chargement des FAQs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center text-red-500">
          <p>{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.href = '/login'}
          >
            Se connecter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Panneau d'administration</CardTitle>
          <CardDescription>
            Gérez les questions fréquemment posées et leurs réponses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" onValueChange={setCurrentCategory}>
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger key="all" value="all">Tous</TabsTrigger>
                {categoryOptions.map(cat => (
                  <TabsTrigger key={`cat-${cat.value}`} value={cat.value}>
                    {cat.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              <Button onClick={handleAdd} disabled={isAdding || !!editingFaq}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Ajouter
              </Button>
            </div>
            
            <TabsContent key="all-content" value="all" className="space-y-4">
              {filteredFaqs.map(faq => (
                <FaqItem
                  key={`faq-${faq._id}`}
                  faq={faq}
                  isEditing={editingFaq?._id === faq._id}
                  editingFaq={editingFaq}
                  updateEditingFaq={updateEditingFaq}
                  handleEdit={handleEdit}
                  handleSave={handleSave}
                  handleCancel={handleCancel}
                  handleDelete={handleDelete}
                  categoryOptions={categoryOptions}
                />
              ))}
              {filteredFaqs.length === 0 && (
                <p key="no-faqs-all" className="text-center py-8 text-muted-foreground">
                  Aucune FAQ dans cette catégorie
                </p>
              )}
            </TabsContent>
            
            {categoryOptions.map(cat => (
              <TabsContent key={`content-${cat.value}`} value={cat.value} className="space-y-4">
                {filteredFaqs.length > 0 ? (
                  filteredFaqs.map(faq => (
                    <FaqItem
                      key={`faq-${faq._id}-${cat.value}`}
                      faq={faq}
                      isEditing={editingFaq?._id === faq._id}
                      editingFaq={editingFaq}
                      updateEditingFaq={updateEditingFaq}
                      handleEdit={handleEdit}
                      handleSave={handleSave}
                      handleCancel={handleCancel}
                      handleDelete={handleDelete}
                      categoryOptions={categoryOptions}
                    />
                  ))
                ) : (
                  <p key={`no-faqs-${cat.value}`} className="text-center py-8 text-muted-foreground">
                    Aucune FAQ dans cette catégorie
                  </p>
                )}
              </TabsContent>
            ))}
          </Tabs>
          
          {isAdding && (
            <Card className="mt-4 border-2 border-primary">
              <CardHeader>
                <CardTitle>Ajouter une nouvelle FAQ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Catégorie</label>
                    <Select
                      value={editingFaq?.category}
                      onValueChange={(value) => updateEditingFaq('category', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Question</label>
                    <Input
                      value={editingFaq?.question || ""}
                      onChange={(e) => updateEditingFaq('question', e.target.value)}
                      placeholder="Entrez la question"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Réponse</label>
                    <Textarea
                      value={editingFaq?.answer || ""}
                      onChange={(e) => updateEditingFaq('answer', e.target.value)}
                      placeholder="Entrez la réponse"
                      rows={5}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  <X className="mr-2 h-4 w-4" />
                  Annuler
                </Button>
                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </Button>
              </CardFooter>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

interface FaqItemProps {
  faq: FAQ;
  isEditing: boolean;
  editingFaq: FAQ | null;
  updateEditingFaq: (field: keyof FAQ, value: string) => void;
  handleEdit: (faq: FAQ) => void;
  handleSave: () => void;
  handleCancel: () => void;
  handleDelete: (id: string) => void;
  categoryOptions: { value: string; label: string }[];
}

const FaqItem = ({
  faq,
  isEditing,
  editingFaq,
  updateEditingFaq,
  handleEdit,
  handleSave,
  handleCancel,
  handleDelete,
  categoryOptions,
}: FaqItemProps) => {
  const isCurrentFaqEditing = isEditing && editingFaq?._id === faq._id;

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          {isCurrentFaqEditing ? (
            <Input
              key={`input-${faq._id}`}
              value={editingFaq?.question || ''}
              onChange={(e) => updateEditingFaq('question', e.target.value)}
              placeholder="Question"
            />
          ) : (
            <span key={`question-${faq._id}`}>{faq.question}</span>
          )}
          <div className="flex space-x-2">
            {!isCurrentFaqEditing && (
              <Button
                key={`edit-${faq._id}`}
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(faq)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            <Button
              key={`delete-${faq._id}`}
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(faq._id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          {isCurrentFaqEditing ? (
            <Select
              key={`select-${faq._id}`}
              value={editingFaq?.category || 'general'}
              onValueChange={(value) => updateEditingFaq('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={`option-${option.value}-${faq._id}`} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span key={`category-${faq._id}`}>
              {categoryOptions.find(opt => opt.value === faq.category)?.label || faq.category}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isCurrentFaqEditing ? (
          <Textarea
            key={`textarea-${faq._id}`}
            value={editingFaq?.answer || ''}
            onChange={(e) => updateEditingFaq('answer', e.target.value)}
            placeholder="Réponse"
            className="min-h-[100px]"
          />
        ) : (
          <p key={`answer-${faq._id}`}>{faq.answer}</p>
        )}
      </CardContent>
      {isCurrentFaqEditing && (
        <CardFooter key={`footer-${faq._id}`} className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleCancel}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Enregistrer
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default AdminPanel;
