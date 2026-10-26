import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import jwt from "jsonwebtoken";
import { User, Job, Transaction, UserRole, Application } from "./src/types";

const JWT_SECRET = "laborlink-secret-key";

// Mock Database
const db = {
  users: [] as User[],
  jobs: [] as Job[],
  transactions: [] as Transaction[],
  applications: [] as Application[],
  messages: [] as any[],
  notifications: [] as any[],
};

// Initial Data
db.users.push({
  id: "admin-1",
  email: "admin@laborlink.com",
  role: "admin",
  profile: {
    name: "System Admin",
    phone: "1234567890",
    address: "Admin HQ",
    city: "Bangalore",
    state: "Karnataka",
    zip: "560001",
    dob: "1980-01-01",
    gender: "Other",
    nationality: "Indian",
    emergencyContact: "100",
    skills: [],
    yearsOfExperience: 10,
    onboarded: true,
    lat: 12.9716,
    lng: 77.5946
  }
});

const indianCities = [
  { name: "Bangalore", lat: 12.9716, lng: 77.5946 },
  { name: "Mumbai", lat: 19.0760, lng: 72.8777 },
  { name: "Delhi", lat: 28.6139, lng: 77.2090 },
  { name: "Chennai", lat: 13.0827, lng: 80.2707 },
  { name: "Hyderabad", lat: 17.3850, lng: 78.4867 },
  { name: "Kolkata", lat: 22.5726, lng: 88.3639 },
  { name: "Vellore", lat: 12.9165, lng: 79.1325 }
];

const mockSkills = ["Plumbing", "Electrical", "Painting", "Carpentry", "Masonry", "Welding", "Cleaning", "Gardening", "Driving", "Security"];
const jobTitles = [
  "Senior Plumber", "Emergency Electrician", "Residential Painter", "Custom Furniture Carpenter", 
  "Bricklayer for New Build", "Industrial Welder", "Office Cleaning Crew", "Landscape Gardener", 
  "Delivery Driver", "Night Security Guard", "Kitchen Fitter", "Roofing Specialist", 
  "AC Technician", "Tiler for Bathroom", "Pool Maintenance", "Fence Installer", 
  "Window Cleaner", "Pest Control Specialist", "Handyman for Apartment Complex", "Flooring Expert"
];

for (let i = 0; i < 60; i++) {
  const title = jobTitles[i % jobTitles.length];
  const skill = mockSkills[i % mockSkills.length];
  const city = indianCities[i % indianCities.length];
  db.jobs.push({
    id: `job-${i}`,
    recruiterId: `recruiter-${i % 3}`,
    title: `${title} - ${i + 1}`,
    description: `We are looking for a skilled ${title.toLowerCase()} to join our team for a project in ${city.name}. Must have at least ${i % 5 + 1} years of experience in ${skill}.`,
    requiredSkills: [skill, "General Labor"],
    yearsOfExperienceRequired: i % 5 + 1,
    location: {
      lat: city.lat + (Math.random() - 0.5) * 0.05,
      lng: city.lng + (Math.random() - 0.5) * 0.05,
      address: `${100 + i} MG Road, ${city.name}`
    },
    salary: `₹${(20 + i) * 100}/day`,
    type: i % 3 === 0 ? 'Full-time' : i % 3 === 1 ? 'Part-time' : 'Contract',
    createdAt: new Date(Date.now() - i * 3600000).toISOString(),
    adminStatus: i % 5 === 0 ? 'pending' : 'approved',
    bannerImage: `https://picsum.photos/seed/job${i}/800/400`
  });
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use(cors());

  // --- Auth Routes ---
  app.post("/api/auth/register", (req, res) => {
    const { email, password, role } = req.body;
    if (db.users.find(u => u.email === email)) {
      return res.status(400).json({ error: "User already exists" });
    }
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      role,
      profile: {
        onboarded: false,
        name: "",
        phone: "",
        address: "",
        city: "Bangalore",
        state: "Karnataka",
        zip: "",
        dob: "",
        gender: "Male",
        nationality: "Indian",
        emergencyContact: "",
        skills: [],
        yearsOfExperience: 0,
        lat: 12.9716,
        lng: 77.5946,
        lastLogin: new Date().toISOString()
      }
    };
    db.users.push(newUser);
    const token = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET);
    res.json({ user: newUser, token });
  });

  app.post("/api/auth/admin-login", (req, res) => {
    const { email, password } = req.body;
    const user = db.users.find(u => u.email === email && u.role === 'admin');
    if (!user) return res.status(401).json({ error: "Admin access denied" });
    
    // Mock password check
    if (password !== "admin123") {
      return res.status(401).json({ error: "Invalid admin password" });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
    res.json({ user, token });
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const userIndex = db.users.findIndex(u => u.email === email);
    if (userIndex === -1) return res.status(401).json({ error: "Invalid credentials" });
    
    if (db.users[userIndex].isSuspended) {
      return res.status(403).json({ error: "Your account has been suspended by an administrator." });
    }

    // Update last login
    db.users[userIndex].profile = {
      ...db.users[userIndex].profile!,
      lastLogin: new Date().toISOString()
    };

    const user = db.users[userIndex];
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
    res.json({ user, token });
  });

  // --- User Routes ---
  app.put("/api/users/:id", (req, res) => {
    const { id } = req.params;
    const userIndex = db.users.findIndex(u => u.id === id);
    if (userIndex === -1) return res.status(404).json({ error: "User not found" });
    
    db.users[userIndex].profile = { ...db.users[userIndex].profile, ...req.body, onboarded: true };
    
    // If recruiter, ensure organization fields are set
    if (db.users[userIndex].role === 'recruiter') {
      db.users[userIndex].profile = {
        ...db.users[userIndex].profile!,
        organizationName: req.body.organizationName || db.users[userIndex].profile?.organizationName,
        organizationDescription: req.body.organizationDescription || db.users[userIndex].profile?.organizationDescription,
        additionalRequirements: req.body.additionalRequirements || db.users[userIndex].profile?.additionalRequirements,
      };
    }
    
    res.json(db.users[userIndex]);
  });

  // --- Job Routes ---
  app.get("/api/jobs", (req, res) => {
    const { workerId, recruiterId, search, skill, minExperience, maxSalary, location, adminView } = req.query;
    let jobs = [...db.jobs];

    // Workers only see approved jobs
    if (!adminView && !recruiterId) {
      jobs = jobs.filter(j => j.adminStatus === 'approved');
    }

    if (recruiterId) {
      jobs = jobs.filter(j => j.recruiterId === recruiterId);
      jobs = jobs.map(j => ({
        ...j,
        applicantCount: db.applications.filter(a => a.jobId === j.id).length
      }));
    }

    if (search) {
      const s = String(search).toLowerCase();
      jobs = jobs.filter(j => j.title.toLowerCase().includes(s) || j.description.toLowerCase().includes(s));
    }

    if (skill) {
      const sk = String(skill).toLowerCase();
      jobs = jobs.filter(j => j.requiredSkills.some(s => s.toLowerCase().includes(sk)));
    }

    if (location) {
      const loc = String(location).toLowerCase();
      jobs = jobs.filter(j => j.location.address.toLowerCase().includes(loc));
    }

    if (minExperience) {
      jobs = jobs.filter(j => j.yearsOfExperienceRequired >= Number(minExperience));
    }

    if (maxSalary) {
      // Extract number from ₹.../day
      jobs = jobs.filter(j => {
        const salary = parseInt(j.salary.replace(/[^\d]/g, ''));
        return salary <= Number(maxSalary);
      });
    }

    if (workerId) {
      const worker = db.users.find(u => u.id === workerId);
      if (worker && worker.role === 'worker' && worker.profile) {
        jobs = jobs.map(job => {
          const hasMatchingSkill = job.requiredSkills.some(skill => 
            worker.profile?.skills.map(s => s.toLowerCase()).includes(skill.toLowerCase())
          );
          
          const workerCity = worker.profile?.city?.toLowerCase() || '';
          const jobAddress = job.location.address?.toLowerCase() || '';
          const hasMatchingLocation = workerCity && jobAddress.includes(workerCity);

          return {
            ...job,
            status: (hasMatchingSkill || hasMatchingLocation) ? "Applicable" : "Not Applicable"
          };
        });
      }
    }
    res.json(jobs);
  });

  app.post("/api/jobs", (req, res) => {
    const job: Job = {
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      adminStatus: 'approved',
      ...req.body
    };
    db.jobs.push(job);
    res.json(job);
  });

  app.put("/api/jobs/:id", (req, res) => {
    const { id } = req.params;
    const index = db.jobs.findIndex(j => j.id === id);
    if (index === -1) return res.status(404).json({ error: "Job not found" });
    
    db.jobs[index] = { ...db.jobs[index], ...req.body };
    res.json(db.jobs[index]);
  });

  app.delete("/api/jobs/:id", (req, res) => {
    const { id } = req.params;
    db.jobs = db.jobs.filter(j => j.id !== id);
    db.applications = db.applications.filter(a => a.jobId !== id);
    res.json({ success: true });
  });

  // --- Admin Management Routes ---
  app.put("/api/admin/jobs/:id/status", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const index = db.jobs.findIndex(j => j.id === id);
    if (index === -1) return res.status(404).json({ error: "Job not found" });
    
    db.jobs[index].adminStatus = status;
    res.json(db.jobs[index]);
  });

  app.put("/api/admin/users/:id/suspend", (req, res) => {
    const { id } = req.params;
    const { suspended } = req.body;
    const index = db.users.findIndex(u => u.id === id);
    if (index === -1) return res.status(404).json({ error: "User not found" });
    
    db.users[index].isSuspended = suspended;
    res.json(db.users[index]);
  });

  app.post("/api/admin/users/:id/reset-password", (req, res) => {
    const { id } = req.params;
    // In a real app, this would send an email or return a temporary password
    res.json({ message: "Password reset link has been sent to the user's email." });
  });

  // --- Application Routes ---
  app.get("/api/applications", (req, res) => {
    const { workerId, jobId, recruiterId } = req.query;
    let applications = [...db.applications];

    if (workerId) {
      applications = applications.filter(a => a.workerId === workerId);
      applications = applications.map(a => ({
        ...a,
        jobTitle: db.jobs.find(j => j.id === a.jobId)?.title
      }));
    }

    if (jobId) {
      applications = applications.filter(a => a.jobId === jobId);
      applications = applications.map(a => ({
        ...a,
        workerProfile: db.users.find(u => u.id === a.workerId)?.profile
      }));
    }

    if (recruiterId) {
      applications = applications.filter(a => a.recruiterId === recruiterId);
    }

    res.json(applications);
  });

  app.post("/api/applications", (req, res) => {
    const { jobId, workerId } = req.body;
    const job = db.jobs.find(j => j.id === jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });

    const existing = db.applications.find(a => a.jobId === jobId && a.workerId === workerId);
    if (existing) return res.status(400).json({ error: "Already applied" });

    const application: Application = {
      id: Math.random().toString(36).substr(2, 9),
      jobId,
      workerId,
      recruiterId: job.recruiterId,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    db.applications.push(application);

    // Create transaction for application fee
    const transaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      jobId,
      workerId,
      recruiterId: job.recruiterId,
      amount: 50.00, // Charge ₹50 from both
      status: 'completed',
      timestamp: new Date().toISOString(),
      type: 'application_fee',
      description: `Application fee for ${job.title}`
    };
    db.transactions.push(transaction);

    // Create notification for recruiter
    db.notifications.push({
      id: Math.random().toString(36).substr(2, 9),
      userId: job.recruiterId,
      title: "New Application",
      content: `A worker has applied for your job: ${job.title}`,
      timestamp: new Date().toISOString(),
      isRead: false,
      type: 'application'
    });

    res.json(application);
  });

  app.put("/api/applications/:id", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const index = db.applications.findIndex(a => a.id === id);
    if (index === -1) return res.status(404).json({ error: "Application not found" });
    
    db.applications[index].status = status;

    // Create notification for worker
    db.notifications.push({
      id: Math.random().toString(36).substr(2, 9),
      userId: db.applications[index].workerId,
      title: `Application ${status}`,
      content: `Your application for ${db.jobs.find(j => j.id === db.applications[index].jobId)?.title} has been ${status}.`,
      timestamp: new Date().toISOString(),
      isRead: false,
      type: 'application'
    });

    res.json(db.applications[index]);
  });

  // --- Transaction Routes ---
  app.post("/api/transactions", (req, res) => {
    const { jobId, workerId } = req.body;
    const job = db.jobs.find(j => j.id === jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });

    const transaction: Transaction = {
      id: Math.random().toString(36).substring(2, 11),
      jobId,
      workerId,
      recruiterId: job.recruiterId,
      amount: 5.00, // Fixed micro-transaction fee
      status: 'completed',
      timestamp: new Date().toISOString(),
      type: 'application_fee',
      description: `Application fee for ${job.title}`
    };
    db.transactions.push(transaction);
    res.json(transaction);
  });

  app.get("/api/admin/stats", (req, res) => {
    const totalRevenue = db.transactions.reduce((acc, t) => acc + (t.amount * 2), 0); // Collected from both
    const acceptedJobsCount = db.applications.filter(a => a.status === 'accepted').length;
    const pendingJobsCount = db.jobs.filter(j => j.adminStatus === 'pending').length;
    res.json({
      totalUsers: db.users.length,
      totalJobs: db.jobs.length,
      acceptedJobsCount,
      pendingJobsCount,
      totalTransactions: db.transactions.length,
      totalRevenue,
      recentTransactions: db.transactions.slice(-10).reverse(),
      allTransactions: db.transactions,
      allUsers: db.users,
      allJobs: db.jobs
    });
  });

  // --- Messaging Routes ---
  app.get("/api/messages/:userId", (req, res) => {
    const { userId } = req.params;
    const messages = db.messages.filter(m => m.senderId === userId || m.receiverId === userId);
    res.json(messages);
  });

  app.post("/api/messages", (req, res) => {
    const { senderId, receiverId, content } = req.body;
    const sender = db.users.find(u => u.id === senderId);
    const message = {
      id: Math.random().toString(36).substr(2, 9),
      senderId,
      receiverId,
      content,
      timestamp: new Date().toISOString(),
      isRead: false,
      senderName: sender?.profile?.name || sender?.email
    };
    db.messages.push(message);

    // Create notification for receiver
    db.notifications.push({
      id: Math.random().toString(36).substr(2, 9),
      userId: receiverId,
      title: "New Message",
      content: `You have a new message from ${message.senderName}`,
      timestamp: new Date().toISOString(),
      isRead: false,
      type: 'message'
    });

    res.json(message);
  });

  // --- Notification Routes ---
  app.get("/api/notifications/:userId", (req, res) => {
    const { userId } = req.params;
    const notifications = db.notifications.filter(n => n.userId === userId);
    res.json(notifications);
  });

  app.put("/api/notifications/:id/read", (req, res) => {
    const { id } = req.params;
    const index = db.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      db.notifications[index].isRead = true;
    }
    res.json({ success: true });
  });

  // --- Recruiter Specific Routes ---
  app.get("/api/workers", (req, res) => {
    const workers = db.users.filter(u => u.role === 'worker' && u.profile?.onboarded);
    res.json(workers);
  });

  app.get("/api/jobs/:id/applicants", (req, res) => {
    const { id } = req.params;
    const applications = db.applications.filter(a => a.jobId === id);
    const applicants = applications.map(a => {
      const worker = db.users.find(u => u.id === a.workerId);
      return {
        ...a,
        workerProfile: worker?.profile,
        workerEmail: worker?.email
      };
    });
    res.json(applicants);
  });

  app.get("/api/transactions/:userId", (req, res) => {
    const { userId } = req.params;
    const transactions = db.transactions.filter(t => t.workerId === userId || t.recruiterId === userId);
    res.json(transactions);
  });

  app.get("/api/jobs/recommendations/:userId", (req, res) => {
    const { userId } = req.params;
    const user = db.users.find(u => u.id === userId);
    if (!user || !user.profile) return res.json([]);

    const userSkills = user.profile.skills || [];
    const userExp = user.profile.yearsOfExperience || 0;

    // Simple matching logic for recommendation
    // In a real app, this would use Gemini or a more complex algorithm
    const recommended = db.jobs
      .filter(j => j.adminStatus === 'approved')
      .map(job => {
        let score = 0;
        // Skill match
        const matchingSkills = job.requiredSkills.filter(s => userSkills.includes(s));
        score += matchingSkills.length * 15;
        
        // Location match
        const userCity = user.profile?.city?.toLowerCase() || '';
        const jobAddress = job.location.address?.toLowerCase() || '';
        if (userCity && jobAddress.includes(userCity)) {
          score += 50; // Give high weight to location
        }

        // Experience match
        if (userExp >= job.yearsOfExperienceRequired) {
          score += 10;
        }

        return { ...job, recommendationScore: score };
      })
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, 6);

    res.json(recommended);
  });

  app.get("/api/worker/stats/:userId", (req, res) => {
    const { userId } = req.params;
    const applications = db.applications.filter(a => a.workerId === userId);
    const activeJobs = db.jobs.filter(j => j.adminStatus === 'approved').length;
    
    res.json({
      activeJobsCount: activeJobs,
      applicationsCount: applications.length,
      profileViews: Math.floor(Math.random() * 100) // Mock profile views
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
