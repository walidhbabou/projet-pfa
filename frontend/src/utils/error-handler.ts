import { toast } from "@/components/ui/use-toast";

/**
 * Gère les erreurs de l'application
 * @param error - L'erreur à gérer
 */
export const handleError = (error: unknown) => {
  console.error('Error:', error);
  
  let errorMessage = "Une erreur est survenue. Veuillez réessayer.";
  
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }
  
  toast({
    title: "Erreur",
    description: errorMessage,
    variant: "destructive"
  });
}; 