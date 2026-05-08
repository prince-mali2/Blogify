# BLOGIFY - The Ultimate Creator Platform

Blogify is a modern, full-stack content creation platform that combines professional blogging, real-time live streaming, and AI-powered tools into a single, seamless experience. It's designed to empower creators with state-of-the-art tools for audience engagement and performance tracking.

---

## 🌟 Key Features

### 📝 Professional Blogging
- **Rich Text Editor**: A premium writing experience for long-form content.
- **AI Writing Assistant**: Powered by Groq, help generate drafts, optimize SEO, and refine content.
- **Social Features**: Like, comment, and share functionality to build a community.
- **SEO Optimized**: Automatic metadata generation for better search visibility.

### 🎥 Real-Time Live Streaming
- **WebRTC Technology**: Direct Peer-to-Peer streaming for ultra-low latency.
- **Live Chat**: Real-time engagement with viewers during broadcasts.
- **Cross-Instance Signaling**: Powered by Upstash Redis to ensure reliable connections globally.
- **Studio Mode**: A dedicated broadcaster dashboard to manage camera, mic, and stream status.

### 📊 Advanced Analytics
- **Creator Dashboard**: Comprehensive overview of performance.
- **Data Visualization**: Interactive charts for views, likes, and follower growth.
- **Insight Generation**: Analyze which content resonates most with your audience.

### 🔐 Secure Infrastructure
- **Firebase Authentication**: Support for Email/Password, Google, and GitHub logins.
- **JWT Protection**: Secure server-side validation for all API routes.
- **Persistent Storage**: Robust PostgreSQL database hosted on Neon.

---

## 🛠 Tech Stack

- **Frontend**: [Next.js 15+](https://nextjs.org/) (App Router, React 19)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Lucide React](https://lucide.dev/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (via [Neon DB](https://neon.tech/))
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: [Firebase Auth](https://firebase.google.com/products/auth)
- **Real-Time Signaling**: [Upstash Redis](https://upstash.com/)
- **AI Engine**: [Groq Cloud API](https://groq.com/)
- **Streaming**: WebRTC (STUN/TURN)

---

## 🚀 How It Works (Technical Overview)

### 1. Database Architecture
The project utilizes Prisma as an ORM to communicate with a Neon PostgreSQL database. This ensures high availability and scalability. The schema includes robust models for Users, Blogs, LiveStreams, Comments, and Analytics.

### 2. Authentication Flow
Blogify uses a hybrid authentication model:
1. User authenticates via **Firebase** (Client-side).
2. Firebase token is sent to `/api/auth/firebase-sync`.
3. The server validates the token, upserts the user into the **PostgreSQL** database, and issues a **Custom JWT**.
4. This JWT is then used for all subsequent secure API calls.

### 3. Live Streaming Signaling
Since the app is deployed on Vercel (Serverless), standard in-memory signaling fails as requests hit different server instances.
- **The Solution**: We implemented a signaling layer using **Upstash Redis**.
- **The Flow**: Broadcasters and Viewers exchange WebRTC "Offers," "Answers," and "ICE Candidates" by reading/writing to a shared Redis Sorted Set. This allows WebRTC handshakes to complete even when users are on different continents or server instances.

### 4. AI Integration
The blogging suite integrates with Groq's high-speed LLMs. When a user requests "AI Optimization," the server sends the blog content to Groq with specific prompts to improve readability, suggest keywords, and generate SEO-friendly excerpts.

---

## ⚙️ Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/prince-mali2/Blogify.git
   cd Blogify_live
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file with the following keys:
   ```env
   DATABASE_URL="your_neon_db_url"
   NEXT_PUBLIC_FIREBASE_API_KEY="..."
   # ... (Add other Firebase, Groq, and Redis keys)
   UPSTASH_REDIS_REST_URL="..."
   UPSTASH_REDIS_REST_TOKEN="..."
   JWT_SECRET="..."
   ```

4. **Initialize Database**:
   ```bash
   npx prisma db push
   ```

5. **Run the development server**:
   ```bash
   npm run dev
   ```

---

## 📈 Future Roadmap
- [ ] Direct video recording and VOD (Video on Demand) storage.
- [ ] Subscription-based premium content for creators.
- [ ] Collaborative blogging with real-time editing.

---

*Developed with ❤️ for the Creator Community.*
