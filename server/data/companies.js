// Company metadata + process + tips. Questions alag file (questions.js) me hain.
export const COMPANIES = [
  { id: 'google', name: 'Google', logo: '🅖', color: '#4285F4', category: 'tech', desc: 'FAANG — Software Engineering, SDE roles', difficulty: 'Hard', tags: ['DSA', 'System Design', 'Googleyness'],
    rounds: ['Online Assessment', '2-3 Coding Rounds', 'System Design', 'Googleyness & Leadership'],
    tips: ['Think aloud — interviewer ko apna approach batao, sirf code mat likho.', 'Brute force se start karo, phir optimise karo with time/space complexity.', 'Googleyness ke liye ambiguity, collaboration aur learning ke real examples ready rakho.', 'Edge cases (empty input, duplicates, overflow) khud bolo.'] },
  { id: 'amazon', name: 'Amazon', logo: '📦', color: '#FF9900', category: 'tech', desc: 'FAANG — Leadership Principles focused', difficulty: 'Hard', tags: ['LPs', 'DSA', 'System Design'],
    rounds: ['Online Assessment', 'Coding + LP Rounds', 'System Design', 'Bar Raiser'],
    tips: ['16 Leadership Principles me se kam se kam 8-10 ke liye STAR stories ready rakho.', 'Har story me numbers do: "reduced latency by 40%".', '"We" nahi, "I" bolo — aapka personal contribution kya tha.', 'Bar Raiser round me honesty aur depth sabse zyada matter karti hai.'] },
  { id: 'microsoft', name: 'Microsoft', logo: '🪟', color: '#00A1F1', category: 'tech', desc: 'Azure, Office, Gaming — All tech roles', difficulty: 'Hard', tags: ['DSA', 'Culture', 'Design'],
    rounds: ['Online Test', '3-4 Technical Rounds', 'As-Appropriate (AA) Round'],
    tips: ['Growth mindset dikhao — "seekhne" wali stories batao.', 'Problem solving + clean code dono par focus hota hai.', 'Low-level design (classes, interfaces) ki practice karo.', 'Clarifying questions pucho before coding.'] },
  { id: 'tcs', name: 'TCS', logo: '🏢', color: '#1976D2', category: 'india', desc: "India's largest IT company — Entry level", difficulty: 'Easy', tags: ['Aptitude', 'HR', 'Basic Tech'],
    rounds: ['TCS NQT', 'Technical Interview', 'Managerial Round', 'HR Round'],
    tips: ['Basics strong rakho: OOPs, DBMS, OS, ek language (Java/Python/C++).', 'Resume ke har project aur skill ke baare me confident raho.', 'Relocation ke liye "Yes" — flexibility dikhao.', 'Self-introduction 2 minute me clear aur confident ho.'] },
  { id: 'infosys', name: 'Infosys', logo: '💻', color: '#007CC2', category: 'india', desc: 'IT Services — Campus & lateral hiring', difficulty: 'Easy', tags: ['Verbal', 'Aptitude', 'Tech'],
    rounds: ['Online Assessment (InfyTQ)', 'Technical Interview', 'HR Round'],
    tips: ['Communication skills par bahut dhyan — English me clearly bolo.', 'Final year project ko achhe se explain karna seekho.', 'SQL aur basic programming logic zaroor practice karo.', 'Company ke baare me thoda research karke jao.'] },
  { id: 'wipro', name: 'Wipro', logo: '🌀', color: '#008000', category: 'india', desc: 'IT Services — NLTH process', difficulty: 'Easy', tags: ['Aptitude', 'Essay', 'Tech'],
    rounds: ['Online Assessment', 'Essay Writing', 'Technical + HR'],
    tips: ['Essay/email writing me grammar aur structure dhyan se.', 'Core CS fundamentals aur ek language me strong ho.', 'Behavioral questions me teamwork ke examples do.', 'Time management — aptitude section speed se solve karo.'] },
  { id: 'flipkart', name: 'Flipkart', logo: '🛒', color: '#F8CB00', category: 'startup', desc: 'E-commerce leader — Product & Eng roles', difficulty: 'Medium', tags: ['DSA', 'Machine Coding', 'Culture'],
    rounds: ['Online Coding', 'Machine Coding', 'Problem Solving', 'Hiring Manager'],
    tips: ['Machine coding round me clean OOP design + working code chahiye.', 'Scale ke baare me sochna seekho (millions of users, sale days).', 'Customer-first mindset dikhao.', 'Trade-offs explain karo — kyun ye approach, wo kyun nahi.'] },
  { id: 'zomato', name: 'Zomato', logo: '🍔', color: '#E23744', category: 'startup', desc: 'Food-tech unicorn — Product & Tech', difficulty: 'Medium', tags: ['Product', 'DSA', 'Case Study'],
    rounds: ['Take-home / Coding', 'Problem Solving', 'Product Sense', 'Culture Fit'],
    tips: ['Product sense — user ki problem se start karo.', 'Fast execution aur ownership ke examples do.', 'Apna hi product use karke 2-3 improvement ideas ready rakho.', 'Real-time systems (delivery tracking, surge) samjho.'] },
  { id: 'accenture', name: 'Accenture', logo: '🔷', color: '#A100FF', category: 'india', desc: 'Consulting + IT Services — Associate roles', difficulty: 'Easy', tags: ['Cognitive', 'Tech', 'Communication'],
    rounds: ['Cognitive & Technical Assessment', 'Communication Assessment', 'Technical + HR Interview'],
    tips: ['Communication assessment me fluency aur clarity important hai.', 'Teamwork aur adaptability ke examples ready rakho.', 'Cloud/Agile ke basics jaan lo.', 'Client-facing mindset dikhao.'] },
  { id: 'razorpay', name: 'Razorpay', logo: '💳', color: '#3395FF', category: 'startup', desc: 'Fintech — Backend & Full-stack roles', difficulty: 'Medium', tags: ['APIs', 'DSA', 'System Design'],
    rounds: ['Coding Round', 'Machine Coding / LLD', 'System Design', 'Culture & Hiring Manager'],
    tips: ['Payments me idempotency, retries, consistency ke concepts samjho.', 'API design aur error handling pe focus.', 'Security basics (hashing, tokens, PCI) jaan lo.', 'Ownership aur speed ke examples do.'] },
];

export const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'tech', label: 'Big Tech' },
  { id: 'india', label: 'Indian IT' },
  { id: 'startup', label: 'Startups' },
];

export const DOMAINS = [
  { id: 'mern', label: 'MERN / Full-Stack' },
  { id: 'python', label: 'Python / Django' },
  { id: 'dsa', label: 'DSA & Problem Solving' },
  { id: 'corecs', label: 'Core CS (OS, DBMS, CN)' },
  { id: 'system', label: 'System Design' },
];
