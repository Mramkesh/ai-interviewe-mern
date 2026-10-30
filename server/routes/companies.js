import { Router } from 'express';
import { COMPANIES, CATEGORIES, DOMAINS } from '../data/companies.js';
import { companyQuestions } from '../data/questions.js';

const router = Router();

router.get('/', (_req, res) => res.json({ companies: COMPANIES, categories: CATEGORIES, domains: DOMAINS }));

router.get('/:id', (req, res) => {
  const company = COMPANIES.find((c) => c.id === req.params.id.toLowerCase());
  if (!company) return res.status(404).json({ message: 'Company not found' });
  res.json({ company, questions: companyQuestions(company.id) });
});

export default router;
