import React, { useState, useEffect } from 'react';
import { faqService, FAQ } from '../utils/faqService';
import styles from './FAQManager.module.css';

const FAQManager: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'general' as const
  });

  useEffect(() => {
    loadFAQs();
  }, []);

  const loadFAQs = async () => {
    try {
      setLoading(true);
      const data = await faqService.getAllFAQs();
      setFaqs(data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des FAQs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await faqService.updateFAQ(editingId, formData);
      } else {
        await faqService.addFAQ(formData);
      }
      await loadFAQs();
      resetForm();
    } catch (err) {
      setError('Erreur lors de la sauvegarde de la FAQ');
      console.error(err);
    }
  };

  const handleEdit = (faq: FAQ) => {
    setEditingId(faq._id);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette FAQ ?')) {
      try {
        await faqService.deleteFAQ(id);
        await loadFAQs();
      } catch (err) {
        setError('Erreur lors de la suppression de la FAQ');
        console.error(err);
      }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      question: '',
      answer: '',
      category: 'general'
    });
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className={styles.container}>
      <h2>Gestion des FAQs</h2>
      
      {error && <div className={styles.error}>{error}</div>}
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label>Question:</label>
          <input
            type="text"
            name="question"
            value={formData.question}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className={styles.formGroup}>
          <label>Réponse:</label>
          <textarea
            name="answer"
            value={formData.answer}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className={styles.formGroup}>
          <label>Catégorie:</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
          >
            <option value="exams">Examens</option>
            <option value="programs">Programmes</option>
            <option value="professors">Professeurs</option>
            <option value="procedures">Procédures</option>
            <option value="orientation">Orientation</option>
            <option value="general">Général</option>
          </select>
        </div>
        
        <button type="submit">
          {editingId ? 'Mettre à jour' : 'Ajouter'}
        </button>
        {editingId && (
          <button type="button" onClick={resetForm}>
            Annuler
          </button>
        )}
      </form>
      
      <div className={styles.faqList}>
        <h3>Liste des FAQs</h3>
        {faqs.map(faq => (
          <div key={faq._id} className={styles.faqItem}>
            <div className={styles.faqContent}>
              <h4>{faq.question}</h4>
              <p>{faq.answer}</p>
              <span className={styles.category}>{faq.category}</span>
            </div>
            <div className={styles.actions}>
              <button onClick={() => handleEdit(faq)}>Modifier</button>
              <button onClick={() => handleDelete(faq._id)}>Supprimer</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQManager; 