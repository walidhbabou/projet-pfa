from pymongo import MongoClient
from datetime import datetime
import os
import json

def import_faqs():
    try:
        # Connexion à MongoDB
        client = MongoClient('mongodb://localhost:27017/')
        db = client['fsts_chatbot']
        faq_collection = db['faqs']
        
        # Données des FAQs
        faqs = [
            {
                "question": "Quand commencent les examens du semestre actuel?",
                "answer": "Les examens du semestre actuel commenceront le 15 juin 2025. Veuillez consulter le calendrier académique sur le site de la FSTS pour les informations spécifiques à votre filière.",
                "category": "exams",
                "created_at": datetime.utcnow()
            },
            {
                "question": "Comment puis-je m'inscrire à la filière LST Informatique?",
                "answer": "Pour vous inscrire à la LST Informatique, vous devez d'abord compléter votre inscription administrative en ligne, puis déposer un dossier de candidature pendant la période annoncée (généralement en juillet). Une sélection est effectuée sur dossier et entretien.",
                "category": "procedures",
                "created_at": datetime.utcnow()
            },
            {
                "question": "Qui est le responsable de la filière MST Génie Logiciel?",
                "answer": "Le responsable de la filière MST Génie Logiciel est Dr. Mohammed Benali. Vous pouvez le contacter par email à m.benali@fsts.ac.ma ou le rencontrer pendant ses heures de permanence le mardi de 14h à 16h au Bureau B204.",
                "category": "professors",
                "created_at": datetime.utcnow()
            },
            {
                "question": "Quelles sont les débouchés après une LST en Biologie?",
                "answer": "Les débouchés après une LST en Biologie incluent: poursuivre en Master ou MST dans des domaines spécialisés, travailler dans des laboratoires d'analyses, l'industrie pharmaceutique, la recherche, l'enseignement, ou dans des organismes de protection de l'environnement.",
                "category": "orientation",
                "created_at": datetime.utcnow()
            },
            {
                "question": "Comment déposer mon mémoire de fin d'études?",
                "answer": "Pour déposer votre mémoire de fin d'études, vous devez soumettre 3 exemplaires imprimés au secrétariat de votre département, ainsi qu'une version électronique (PDF) par email, au moins 2 semaines avant la date de soutenance prévue.",
                "category": "procedures",
                "created_at": datetime.utcnow()
            }
        ]
        
        # Suppression des FAQs existantes
        faq_collection.delete_many({})
        print("Anciennes FAQs supprimées")
        
        # Insertion des nouvelles FAQs
        result = faq_collection.insert_many(faqs)
        print(f"{len(result.inserted_ids)} FAQs importées avec succès")
        
        # Vérification
        count = faq_collection.count_documents({})
        print(f"Nombre total de FAQs dans la base de données: {count}")
        
    except Exception as e:
        print(f"Erreur lors de l'importation des FAQs: {str(e)}")
    finally:
        client.close()

if __name__ == "__main__":
    import_faqs() 