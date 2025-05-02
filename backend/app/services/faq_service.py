import json
from datetime import datetime
import os
from bson import ObjectId

class FAQService:
    def __init__(self, faq_collection):
        self.faq_collection = faq_collection
        print("FAQService initialisé avec la collection:", faq_collection.name)

    def init_faq_database(self):
        try:
            # Vérifier si la collection est vide
            if self.faq_collection.count_documents({}) == 0:
                print("La collection FAQ est vide, initialisation des données...")
                # Chemin absolu vers le fichier faq_data.json
                current_dir = os.path.dirname(os.path.abspath(__file__))
                faq_file_path = os.path.join(current_dir, '..', '..', 'faq_data.json')
                
                if os.path.exists(faq_file_path):
                    with open(faq_file_path, 'r', encoding='utf-8') as f:
                        faq_data = json.load(f)
                        if faq_data:
                            # Ajouter les champs de métadonnées
                            for faq in faq_data:
                                faq['created_at'] = datetime.utcnow()
                                faq['updated_at'] = datetime.utcnow()
                            
                            result = self.faq_collection.insert_many(faq_data)
                            print(f"✅ {len(result.inserted_ids)} FAQs initialisées avec succès")
                else:
                    print(f"❌ Fichier faq_data.json non trouvé à {faq_file_path}")
            else:
                print("✅ La collection FAQ contient déjà des données")
        except Exception as e:
            print(f"❌ Erreur lors de l'initialisation de la base de données FAQ: {e}")
            raise

    def get_all_faqs(self):
        try:
            print("Début de la récupération des FAQs...")
            # Vérification de la connexion à la collection
            print(f"Collection utilisée: {self.faq_collection.name}")
            print(f"Nombre de documents dans la collection: {self.faq_collection.count_documents({})}")
            
            # Récupération de toutes les FAQs avec l'ID
            faqs = list(self.faq_collection.find())
            print(f"Nombre de FAQs récupérées: {len(faqs)}")
            
            # Conversion des ObjectId en string et affichage des détails
            for faq in faqs:
                faq['_id'] = str(faq['_id'])
                print(f"FAQ trouvée - ID: {faq['_id']}, Question: {faq['question']}")
            
            return faqs
        except Exception as e:
            print(f"Erreur détaillée lors de la récupération des FAQs: {str(e)}")
            raise

    def add_faq(self, faq_data):
        try:
            print("Tentative d'ajout d'une FAQ avec les données:", faq_data)
            # Suppression de l'ID s'il est présent dans les données
            if 'id' in faq_data:
                del faq_data['id']
            
            # Préparation de l'objet FAQ
            faq = {
                'question': faq_data['question'],
                'answer': faq_data['answer'],
                'category': faq_data['category'],
                'created_at': datetime.utcnow()
            }
            print("FAQ préparée:", faq)
            
            # Insertion dans la base de données
            result = self.faq_collection.insert_one(faq)
            print("Résultat de l'insertion:", result.inserted_id)
            
            # Récupération de la FAQ créée avec son ID MongoDB
            created_faq = self.faq_collection.find_one({'_id': result.inserted_id})
            if created_faq:
                # Conversion de l'ObjectId en string pour le JSON
                created_faq['_id'] = str(created_faq['_id'])
                return created_faq
            return None
        except Exception as e:
            print("Erreur lors de l'ajout de la FAQ:", str(e))
            raise

    def update_faq(self, faq_id, question, answer, category, updated_by):
        try:
            # Convertir l'ID en ObjectId
            try:
                faq_id = ObjectId(faq_id)
            except Exception as e:
                print(f"Erreur de conversion de l'ID: {e}")
                return None

            update_data = {
                "question": question,
                "answer": answer,
                "category": category,
                "updated_by": updated_by,
                "updated_at": datetime.utcnow()
            }
            result = self.faq_collection.find_one_and_update(
                {"_id": faq_id},
                {"$set": update_data},
                return_document=True
            )
            if result:
                print(f"FAQ mise à jour avec succès: {faq_id}")
                # Convertir l'ObjectId en string pour le JSON
                result['_id'] = str(result['_id'])
            else:
                print(f"FAQ non trouvée: {faq_id}")
            return result
        except Exception as e:
            print(f"Erreur lors de la mise à jour de la FAQ: {e}")
            raise

    def delete_faq(self, faq_id):
        try:
            # Convertir l'ID en ObjectId
            try:
                faq_id = ObjectId(faq_id)
            except Exception as e:
                print(f"Erreur de conversion de l'ID: {e}")
                return None

            result = self.faq_collection.delete_one({"_id": faq_id})
            if result.deleted_count > 0:
                print(f"FAQ supprimée avec succès: {faq_id}")
            else:
                print(f"FAQ non trouvée pour suppression: {faq_id}")
            return result
        except Exception as e:
            print(f"Erreur lors de la suppression de la FAQ: {e}")
            raise

    def search_faqs(self, query):
        try:
            results = list(self.faq_collection.find(
                {"$text": {"$search": query}},
                {"score": {"$meta": "textScore"}}
            ).sort([("score", {"$meta": "textScore"})]))
            print(f"Recherche FAQ: {len(results)} résultats trouvés pour '{query}'")
            return results
        except Exception as e:
            print(f"Erreur lors de la recherche de FAQs: {e}")
            raise 