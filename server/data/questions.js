// Format: [level, question, ideal-answer-points]   level: easy | medium | hard
const L = (rows) => rows.map(([level, q, a]) => ({ level, q, a }));

const general = {
  hr: L([
    ['easy', 'Tell me about yourself.', 'Present → Past → Future: current role/education, 2 key projects with impact, skills relevant to this role, and why you want this opportunity. Keep it 90 seconds to 2 minutes.'],
    ['easy', 'Why do you want to work for our company?', 'Research the company: products, culture, recent news. Connect 2 of their values/problems to your skills and goals. Avoid generic answers like "good brand".'],
    ['easy', 'What are your greatest strengths?', 'Pick 2-3 role-relevant strengths and back each with a short real example with a measurable result.'],
    ['medium', 'What is your biggest weakness?', 'Name a real, non-critical weakness, show what you are actively doing to improve it, and share measurable progress.'],
    ['easy', 'Where do you see yourself in 5 years?', 'Show ambition aligned with the company: deepen expertise, take ownership, mentor others. Avoid saying you will leave or start a company.'],
    ['medium', 'Why should we hire you?', 'Three points: skill match, proof via a project/result, and cultural fit/enthusiasm. Be specific, confident and concise.'],
    ['medium', 'Describe a conflict with a teammate and how you resolved it.', 'Use STAR. Stay objective, show listening and empathy, focus on the shared goal and the positive outcome - never blame.'],
    ['medium', 'Tell me about a time you failed. What did you learn?', 'Choose a real failure with ownership (no excuses), explain the lesson, and show what you changed afterwards with a result.'],
    ['medium', 'Tell me about a time you worked under a tight deadline.', 'STAR: how you prioritised, cut scope smartly, communicated early, and what you delivered. Add numbers (hours, users, delivery time).'],
    ['medium', 'Describe a time you took initiative without being asked.', 'Situation where you noticed a gap, the action you took on your own, and the measurable benefit to team/product.'],
    ['medium', 'How do you handle criticism or negative feedback?', 'Listen without defending, ask clarifying questions, apply the feedback, and give a real example where feedback improved your work.'],
    ['easy', 'How do you stay updated with new technologies?', 'Mention concrete habits: docs, YouTube/courses, side projects, GitHub, communities. Give one recent thing you learned and applied.'],
    ['hard', 'Tell me about the toughest decision you made in a project.', 'Explain options, trade-offs, data you used, the decision, the outcome and what you would do differently.'],
    ['easy', 'Do you have any questions for us?', 'Ask about team structure, tech stack, onboarding/training, success in first 90 days, and growth path. Never ask only about salary/leave.'],
  ]),
  technical: L([
    ['easy', 'Explain Object-Oriented Programming and its four pillars with examples.', 'Encapsulation (hide data), Inheritance (reuse), Polymorphism (many forms - overloading/overriding), Abstraction (hide complexity). Give a real-world example for each.'],
    ['easy', 'What is the difference between SQL and NoSQL databases?', 'SQL: structured schema, ACID, joins, vertical scale. NoSQL: flexible schema, horizontal scale, eventual consistency. Choose based on data shape and scale.'],
    ['easy', 'What is a REST API? Explain HTTP methods and status codes.', 'Stateless client-server architecture over HTTP; GET/POST/PUT/PATCH/DELETE; resources via URLs; status codes 2xx success, 4xx client error, 5xx server error; JSON payloads.'],
    ['easy', 'What is the time complexity of binary search and why?', 'O(log n) because search space halves each step; needs sorted data; O(1) space iteratively.'],
    ['medium', 'What happens when you type a URL in the browser and press Enter?', 'DNS lookup → TCP handshake (+TLS) → HTTP request → server processing → response → browser parses HTML, fetches CSS/JS, builds DOM/CSSOM, renders.'],
    ['medium', 'How does a HashMap work internally?', 'Hash function maps key to bucket index; collisions handled by chaining/open addressing; average O(1) get/put; resize when load factor is exceeded.'],
    ['medium', 'Difference between process and thread?', 'Process has its own memory space; threads share memory within a process and are lighter to create/switch; need synchronisation to avoid race conditions.'],
    ['medium', 'Git merge vs rebase - when would you use each?', 'Merge keeps history with a merge commit (safe for shared branches). Rebase rewrites history to make it linear (good for local feature branches, never on shared ones).'],
    ['medium', 'What is caching? Explain strategies and invalidation.', 'Store frequently used data closer/faster (memory, Redis, CDN). Strategies: cache-aside, write-through, write-back; invalidate via TTL, events or versioning.'],
    ['hard', 'Explain unit, integration and end-to-end testing and the testing pyramid.', 'Many fast unit tests, fewer integration tests, very few slow E2E tests. Mention mocking, CI, coverage and what to test first.'],
  ]),
};

const domains = {
  mern: L([
    ['easy', 'What is the Node.js event loop? Why is Node single-threaded yet scalable?', 'Single JS thread with non-blocking I/O offloaded to libuv/OS; the event loop processes callback queues (timers, I/O, microtasks). Great for I/O-bound, not CPU-bound work (use worker threads).'],
    ['easy', 'What is middleware in Express? Give examples.', 'Functions (req, res, next) that run in sequence: logging, auth, body parsing, CORS, error handling. Order matters; call next() or end the response.'],
    ['medium', 'Explain the Virtual DOM and how React reconciliation works.', 'React keeps a lightweight tree, diffs old vs new on state change, and patches only changed real DOM nodes. Keys help identify list items efficiently.'],
    ['medium', 'Difference between useEffect, useMemo and useCallback?', 'useEffect: side effects after render. useMemo: memoise a computed value. useCallback: memoise a function reference. Use only to avoid expensive recalculation or unnecessary child re-renders.'],
    ['medium', 'How do you implement JWT authentication in a MERN app? Where do you store the token?', 'Login → server verifies password (bcrypt) → signs JWT → client sends in Authorization header; middleware verifies. Storage: httpOnly cookie is safer against XSS; localStorage is simpler but XSS-prone. Add expiry/refresh.'],
    ['medium', 'What is CORS and how do you fix a CORS error?', 'Browser security rule blocking cross-origin requests unless server allows via headers. Fix on the server with allowed origins, methods, headers and credentials - not on the client.'],
    ['medium', 'MongoDB: embedding vs referencing - how do you decide?', 'Embed for one-to-few, data read together; reference for one-to-many/unbounded growth or shared data. Consider document size limit (16MB) and query patterns.'],
    ['medium', 'What are MongoDB indexes? How do they improve performance?', 'Data structures (B-tree) that avoid full collection scans; compound indexes follow query order; trade-off is extra write cost/memory. Use explain() to verify.'],
    ['hard', 'How do you optimise a slow React application?', 'Profile first (React DevTools); memoisation, code splitting/lazy loading, list virtualisation, avoid unnecessary state in parents, debounce inputs, optimise images and bundle size.'],
    ['hard', 'How would you deploy a MERN app to production? (Vercel + Render + Atlas)', 'Frontend build on Vercel with env for API URL; backend on Render with env secrets; MongoDB Atlas with IP allow-list and least-privilege user; CORS restricted to frontend origin; HTTPS, logging, health checks.'],
  ]),
  python: L([
    ['easy', 'Explain Django MTV architecture.', 'Model (DB layer/ORM), Template (presentation), View (business logic handling request → response). URLs route requests to views.'],
    ['easy', 'Difference between list, tuple, set and dict in Python?', 'List: ordered mutable. Tuple: ordered immutable. Set: unordered unique items. Dict: key-value pairs with O(1) average lookup.'],
    ['medium', 'What is the Django ORM? Explain select_related vs prefetch_related.', 'ORM maps models to tables. select_related uses SQL JOIN for FK/one-to-one; prefetch_related does separate queries and joins in Python for many-to-many/reverse FK - both solve N+1.'],
    ['medium', 'What are Python decorators and generators?', 'Decorator wraps a function to extend behaviour without modifying it. Generator uses yield to produce values lazily, saving memory.'],
    ['medium', 'Explain Django middleware and the request-response cycle.', 'Request passes through middleware chain → URL resolver → view → response travels back through middleware. Used for auth, sessions, CSRF, security headers.'],
    ['medium', 'How does Django REST Framework serialization and authentication work?', 'Serializers convert model instances to JSON and validate input; ViewSets/Routers expose CRUD; auth via Token/JWT/Session with permission classes.'],
    ['hard', 'What is the GIL in Python and how does it affect multithreading?', 'Global Interpreter Lock lets one thread execute bytecode at a time; CPU-bound threads do not run in parallel. Use multiprocessing or async/IO for concurrency.'],
    ['hard', 'How do you secure a Django application?', 'Keep DEBUG off, SECRET_KEY in env, CSRF/XSS protection, HTTPS, ALLOWED_HOSTS, parameterised ORM queries, password hashing, rate limiting, dependency updates.'],
  ]),
  dsa: L([
    ['easy', 'Two Sum: find two numbers that add up to a target. Optimise for O(n).', 'One pass with a HashMap storing value→index; for each element check whether (target - element) exists. O(n) time, O(n) space.'],
    ['easy', 'Check if a string of brackets is valid.', 'Use a stack: push opening brackets, on closing pop and match; valid if stack is empty at the end. O(n).'],
    ['medium', 'Reverse a linked list (iterative and recursive).', 'Iterative: keep prev, curr, next pointers and flip links. Recursive: reverse the rest then fix head.next.next. O(n) time.'],
    ['medium', 'Detect a cycle in a linked list.', "Floyd's tortoise and hare: slow moves 1, fast moves 2; they meet if a cycle exists. O(n) time, O(1) space."],
    ['medium', 'BFS vs DFS - when do you use which?', 'BFS (queue) for shortest path in unweighted graphs/level order. DFS (stack/recursion) for exhaustive search, topological sort, connected components.'],
    ['medium', 'Merge overlapping intervals.', 'Sort by start, then iterate merging if current.start <= last.end. O(n log n).'],
    ['hard', 'Implement an LRU Cache with O(1) get and put.', 'HashMap + doubly linked list: move accessed node to front, evict from tail when capacity is exceeded.'],
    ['hard', 'Solve the 0/1 Knapsack problem. What is the complexity?', 'Dynamic programming dp[i][w] = max(skip, take); O(n*W) time, optimisable to O(W) space with a 1D array.'],
  ]),
  corecs: L([
    ['easy', 'What are ACID properties in databases?', 'Atomicity (all or nothing), Consistency (valid state), Isolation (concurrent transactions do not interfere), Durability (committed data persists).'],
    ['easy', 'Explain normalisation: 1NF, 2NF, 3NF.', '1NF: atomic values. 2NF: no partial dependency on a composite key. 3NF: no transitive dependency. Reduces redundancy; sometimes denormalise for read speed.'],
    ['medium', 'What is a deadlock? What are the four necessary conditions?', 'Mutual exclusion, hold and wait, no pre-emption, circular wait. Prevent by breaking one condition, e.g. ordered resource acquisition.'],
    ['medium', 'TCP vs UDP and explain the TCP three-way handshake.', 'TCP: reliable, ordered, connection-based (SYN → SYN-ACK → ACK). UDP: fast, connectionless, no guarantee - used for streaming/gaming/DNS.'],
    ['medium', 'Explain types of SQL joins.', 'INNER (matching rows), LEFT/RIGHT (all from one side + matches), FULL (all rows), CROSS (cartesian product). Give a small example.'],
    ['medium', 'What is virtual memory and paging?', 'Gives each process a large logical address space mapped to physical memory in fixed-size pages; page faults load pages from disk; enables isolation and over-commit.'],
    ['medium', 'Mutex vs semaphore?', 'Mutex: ownership-based lock for mutual exclusion (one thread). Semaphore: counter allowing N concurrent accesses, used for signalling/resource pools.'],
    ['hard', 'How do database indexes (B+ trees) work and when can they hurt?', 'Sorted tree structure for O(log n) lookups and range scans; hurt when too many indexes slow writes or low-cardinality columns give little benefit.'],
  ]),
  system: L([
    ['medium', 'Design a URL shortening service like bit.ly.', 'Requirements → API (create/redirect) → Base62 ID generation (counter/hash) → DB mapping → Redis cache for hot links → 301/302 redirects → analytics, expiry, rate limiting, horizontal scaling.'],
    ['medium', 'Explain the CAP theorem with real examples.', 'In a partition you choose Consistency or Availability. CP: HBase, ZooKeeper, MongoDB (default). AP: Cassandra, DynamoDB. Partition tolerance is mandatory in distributed systems.'],
    ['medium', 'Horizontal vs vertical scaling and how load balancing works.', 'Vertical: bigger machine. Horizontal: more machines behind a load balancer (round robin, least connections, consistent hashing) with stateless services and shared data stores.'],
    ['hard', 'Design a rate limiter.', 'Token bucket / sliding window counters stored in Redis keyed by user/IP; return 429 with Retry-After; consider distributed consistency and burst handling.'],
    ['hard', 'Design a chat application like WhatsApp.', 'WebSockets for real-time, message queue, delivery states (sent/delivered/read), offline storage + push notifications, sharding by user/chat id, media in object storage, E2E encryption.'],
    ['hard', 'Design a news feed like Instagram.', 'Fan-out on write vs read (hybrid for celebrities), feed cache per user, ranking service, media via CDN, pagination with cursors, eventual consistency.'],
  ]),
};

const companies = {
  google: {
    hr: L([
      ['easy', 'Tell me about yourself and why you want to join Google.', "Education/background, 2 impactful projects, skills relevant to Google, and genuine passion for Google's products, scale and mission."],
      ['medium', 'Describe a time you worked in an ambiguous situation.', 'Googleyness: how you clarified goals, made assumptions explicit, took small experiments and delivered despite unclear requirements.'],
      ['medium', 'Tell me about a time you disagreed with a teammate and what happened.', 'STAR with emotional intelligence: data-driven discussion, willingness to be wrong, outcome that helped the team.'],
      ['medium', 'Why Google over other big tech companies?', 'Scale of problems, engineering culture, open-source and research contributions, learning opportunities - be specific, not flattering.'],
    ]),
    technical: L([
      ['medium', 'Find the longest palindromic substring.', 'Expand around center O(n²) handling odd/even length; mention Manacher O(n) as an optimisation.'],
      ['hard', 'Design a URL shortening service like bit.ly.', 'API, Base62 key generation, DB mapping, cache, CDN, analytics, collision handling, scaling.'],
      ['medium', 'Given a sorted array rotated at an unknown pivot, search for a target.', 'Modified binary search: determine which half is sorted at each step. O(log n).'],
      ['hard', 'Design Google Docs real-time collaboration at a high level.', 'Operational Transform or CRDT for conflict-free merges, WebSockets, versioning, presence, persistence and offline sync.'],
    ]),
  },
  amazon: {
    hr: L([
      ['medium', 'Tell me about a time you showed Customer Obsession.', 'LP#1 with STAR: start from the customer pain, action beyond expectation, measurable customer impact.'],
      ['medium', 'Describe a situation where you delivered results under a tight deadline.', 'LP Deliver Results: prioritise, cut scope smartly, communicate risks, deliver core value with numbers.'],
      ['hard', 'Tell me about a time you disagreed with your manager.', 'Disagree and Commit: voice concern with data, listen, then fully commit to the final decision.'],
      ['medium', 'Give an example of when you invented or simplified something.', 'Invent and Simplify: quantify impact - hours saved, cost reduced, errors removed.'],
    ]),
    technical: L([
      ['hard', "Design Amazon's product recommendation system.", 'Collect behaviour data, collaborative + content-based filtering, hybrid ranking, offline training + online serving, A/B testing, cold-start handling.'],
      ['hard', 'Implement an LRU cache.', 'HashMap + doubly linked list, O(1) get/put, move to front on access, evict tail.'],
      ['medium', 'Find the kth largest element in an unsorted array.', 'Min-heap of size k O(n log k) or QuickSelect O(n) average.'],
      ['medium', 'How would you design a parking lot system (OOD)?', 'Classes: ParkingLot, Level, Spot, Vehicle, Ticket, Payment; use enums/strategy for pricing; discuss extensibility.'],
    ]),
  },
  microsoft: {
    hr: L([
      ['easy', 'Why Microsoft?', 'Mission to empower every person, products you use, Azure/AI scale, inclusive culture and growth mindset.'],
      ['medium', 'Tell me about a time you learned a new technology quickly.', 'Growth mindset: learning plan, applying it in a project, result and what you taught others.'],
      ['medium', 'Describe a time you helped a struggling teammate.', 'Show empathy and collaboration; the support you gave and the team outcome.'],
    ]),
    technical: L([
      ['medium', 'Reverse words in a string in place.', 'Reverse the whole string then reverse each word; O(n) time, O(1) extra space.'],
      ['medium', 'Explain the difference between abstract class and interface.', 'Abstract class: partial implementation/state, single inheritance. Interface: contract, multiple implementation. Choose by is-a vs can-do.'],
      ['hard', 'Design a file storage system like OneDrive.', 'Chunked upload, metadata DB, object storage, deduplication, sync conflict handling, permissions, sharing links.'],
      ['medium', 'Lowest common ancestor of a binary tree.', 'Recursive DFS: if both sides return non-null the current node is LCA. O(n).'],
    ]),
  },
  tcs: {
    hr: L([
      ['easy', 'Tell me about yourself.', 'Name, college, degree, CGPA, key projects, skills, why TCS. Keep it 2 minutes.'],
      ['easy', 'Why do you want to join TCS?', "TCS's reputation, training programs, global exposure, innovation labs and stability."],
      ['easy', 'Are you willing to relocate?', 'Say yes confidently - show flexibility and enthusiasm for diverse exposure.'],
      ['easy', 'What are your strengths and weaknesses?', "Strength with example; weakness you're actively improving."],
    ]),
    technical: L([
      ['easy', 'Difference between ArrayList and LinkedList in Java?', 'ArrayList: O(1) random access, slow middle insert/delete. LinkedList: O(n) access, O(1) insert/delete at ends.'],
      ['easy', 'Explain OOPS concepts with examples.', 'Encapsulation, Inheritance, Polymorphism, Abstraction - each with a real-world example.'],
      ['medium', 'What is normalisation? Explain 1NF, 2NF, 3NF.', '1NF atomic values, 2NF no partial dependency, 3NF no transitive dependency.'],
      ['easy', 'Write a program to reverse a string without built-in functions.', 'Two-pointer swap from both ends. O(n) time, O(1) space.'],
    ]),
  },
  infosys: {
    hr: L([
      ['easy', 'Why Infosys?', 'Training (Mysore campus), learning culture, global clients, career growth, values.'],
      ['easy', 'Tell me about your final-year project.', 'Problem, your role, tech stack, challenges, outcome and what you would improve.'],
      ['medium', 'How do you handle pressure?', 'Prioritise, break work into steps, communicate early, example with outcome.'],
    ]),
    technical: L([
      ['easy', 'What is the difference between DELETE, TRUNCATE and DROP?', 'DELETE removes rows (can rollback, with WHERE). TRUNCATE removes all rows fast (DDL, resets identity). DROP removes the table itself.'],
      ['easy', 'What is polymorphism? Types?', 'Compile-time (overloading) and run-time (overriding) with examples.'],
      ['medium', 'Explain the SDLC and Agile vs Waterfall.', 'SDLC phases; Waterfall is sequential; Agile is iterative with sprints and continuous feedback.'],
    ]),
  },
  wipro: {
    hr: L([
      ['easy', 'Why Wipro?', 'Learning opportunities, diverse projects, values (Spirit of Wipro), growth path.'],
      ['medium', 'Tell me about a time you worked in a team.', 'Your role, how you communicated, result achieved together.'],
    ]),
    technical: L([
      ['easy', 'What is the difference between stack and queue?', 'Stack LIFO, queue FIFO; real uses: undo/recursion vs scheduling/BFS.'],
      ['easy', 'Explain primary key vs foreign key vs unique key.', 'Primary: unique identifier, not null. Foreign: references another table. Unique: unique values, can allow one NULL.'],
      ['medium', 'What is exception handling? Explain try, catch, finally.', 'Handle runtime errors gracefully; try wraps risky code, catch handles, finally always runs for cleanup.'],
    ]),
  },
  flipkart: {
    hr: L([
      ['medium', 'Why Flipkart?', 'Scale of Indian e-commerce, customer-first culture, big sale-day engineering challenges, ownership.'],
      ['medium', 'Tell me about a time you took ownership of a failing project.', 'Situation, steps to stabilise, communication, measurable recovery.'],
    ]),
    technical: L([
      ['hard', 'Design the Flipkart Big Billion Days flash sale system.', 'Handle traffic spikes: CDN, queueing, inventory with atomic decrement/Redis, rate limiting, idempotent orders, graceful degradation.'],
      ['medium', 'Design a shopping cart service (machine coding).', 'Classes for Cart, Item, Product, DiscountStrategy; add/remove/update, price calculation, extensibility.'],
      ['medium', 'Group anagrams from a list of strings.', 'Sort each word (or count array) as a hashmap key. O(n·k log k).'],
    ]),
  },
  zomato: {
    hr: L([
      ['medium', 'How would you improve the Zomato app?', 'Start from a user problem, back with data, propose 2-3 prioritised ideas with metrics for success.'],
      ['medium', 'Tell me about a time you moved fast with limited information.', 'Ownership and bias for action: assumptions, quick experiment, result and learning.'],
    ]),
    technical: L([
      ['hard', 'Design real-time delivery tracking.', 'GPS pings from partner app → streaming pipeline → geohash/partitioning → WebSocket/SSE to customers, ETA service, battery-aware sampling.'],
      ['medium', 'Design a restaurant search and ranking feature.', 'Elasticsearch/geo index, filters, ranking signals (distance, rating, popularity, personalisation), caching and pagination.'],
      ['medium', 'Find the top K frequent elements.', 'HashMap for counts + min-heap of size K or bucket sort. O(n log k).'],
    ]),
  },
  accenture: {
    hr: L([
      ['easy', 'Why Accenture?', 'Diverse industries, learning programs, global exposure, innovation (cloud/AI), inclusive culture.'],
      ['medium', 'How do you handle changing client requirements?', 'Stay calm, clarify the impact, communicate trade-offs, update plan, keep the client informed.'],
    ]),
    technical: L([
      ['easy', 'What is cloud computing? Explain IaaS, PaaS, SaaS.', 'On-demand compute/storage over the internet. IaaS: infrastructure (EC2). PaaS: platform (Heroku/App Engine). SaaS: software (Gmail).'],
      ['easy', 'What is the difference between Agile and Scrum?', 'Agile is a mindset/approach; Scrum is a framework with sprints, roles (PO, SM, team) and ceremonies.'],
      ['medium', 'What is an API gateway and why use it?', 'Single entry point for routing, auth, rate limiting, monitoring and aggregation across microservices.'],
    ]),
  },
  razorpay: {
    hr: L([
      ['medium', 'Why Razorpay / fintech?', 'Payments infrastructure impact on Indian businesses, high-reliability engineering, fast-paced ownership.'],
      ['medium', 'Tell me about a production issue you handled.', 'Detection, mitigation, root cause, fix, prevention (alerts/tests/postmortem).'],
    ]),
    technical: L([
      ['hard', 'What is idempotency and how do you make a payment API idempotent?', 'Same request repeated gives the same result; client sends an idempotency key, server stores key→response and returns it on retry.'],
      ['hard', 'Design a payment gateway at a high level.', 'Merchant API, payment orchestration, bank/UPI integrations, ledger with double-entry, webhooks with retries, reconciliation, PCI security.'],
      ['medium', 'How do you handle distributed transactions?', 'Avoid 2PC when possible; use saga pattern with compensating actions, outbox pattern and eventual consistency.'],
    ]),
  },
};

// ---------- flatten with stable ids ----------
const ALL = new Map();
const tag = (scope, kind, arr) =>
  arr.map((x, i) => {
    const q = { id: `${scope}:${kind}:${i}`, kind, scope, level: x.level, q: x.q, a: x.a };
    ALL.set(q.id, q);
    return q;
  });

const G = { hr: tag('g', 'hr', general.hr), technical: tag('g', 'technical', general.technical) };
const D = Object.fromEntries(Object.entries(domains).map(([k, v]) => [k, tag('d-' + k, 'technical', v)]));
const C = Object.fromEntries(
  Object.entries(companies).map(([k, v]) => [k, { hr: tag('c-' + k, 'hr', v.hr), technical: tag('c-' + k, 'technical', v.technical) }])
);

const shuffle = (a) => {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const uniq = (arr) => {
  const seen = new Set();
  return arr.filter((x) => (seen.has(x.id) ? false : seen.add(x.id)));
};

const levelFilter = (arr, difficulty) => {
  if (!difficulty || difficulty === 'any') return arr;
  const exact = arr.filter((q) => q.level === difficulty);
  return exact.length >= 3 ? exact : arr;
};

// Company-specific questions ko priority milti hai, phir domain/general se fill hota hai
export function buildQuestions({ company = 'general', type = 'mixed', domain = '', difficulty = 'any', count = 5 }) {
  const c = C[String(company).toLowerCase()] || { hr: [], technical: [] };
  const hrPool = uniq([...shuffle(levelFilter(c.hr, difficulty)), ...shuffle(levelFilter(G.hr, difficulty))]);
  const techBase = domain && D[domain] ? [...shuffle(levelFilter(D[domain], difficulty)), ...shuffle(c.technical)] : [...shuffle(levelFilter(c.technical, difficulty)), ...shuffle(levelFilter(G.technical, difficulty)), ...shuffle(Object.values(D).flat().filter((q) => !domain))];
  const techPool = uniq(techBase);
  const n = Math.max(3, Math.min(Number(count) || 5, 10));
  let out = [];
  if (type === 'hr') out = hrPool.slice(0, n);
  else if (type === 'technical') out = techPool.slice(0, n);
  else {
    const h = Math.ceil(n * 0.4);
    out = shuffle([...hrPool.slice(0, h), ...techPool.slice(0, n - h)]);
  }
  return out.slice(0, n);
}

export const publicQ = (q) => ({ id: q.id, q: q.q, level: q.level, kind: q.kind });
export const getQuestion = (id) => ALL.get(id);

export function companyQuestions(id) {
  const c = C[String(id).toLowerCase()];
  const fill = (own, base) => uniq([...own, ...base.slice(0, 4)]);
  return {
    hr: fill(c?.hr || [], G.hr).map((q) => ({ id: q.id, q: q.q, a: q.a, level: q.level })),
    technical: fill(c?.technical || [], G.technical).map((q) => ({ id: q.id, q: q.q, a: q.a, level: q.level })),
  };
}

export const questionStats = () => ({ total: ALL.size });
