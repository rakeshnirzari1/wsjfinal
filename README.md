# 🏢 Western Sydney Jobs

A modern, responsive job board platform specifically designed for Western Sydney's growing job market. Built with React, TypeScript, and Supabase.

## 🌟 Live Website

**🌐 [westernsydneyjobs.com.au](https://westernsydneyjobs.com.au)**

## ✨ Features

### For Job Seekers
- 🔍 **Advanced Job Search** - Filter by location, category, job type, and salary
- 📍 **Location-Based Search** - Find jobs in specific Western Sydney suburbs
- 🏢 **Company Profiles** - Explore top employers in the region
- 📱 **Mobile-First Design** - Optimized for all devices
- 💼 **Job Categories** - Browse by industry and role type

### For Employers
- 📝 **Easy Job Posting** - Simple form to post job listings
- 💳 **Payment Integration** - Stripe-powered payment system
- 📊 **Dashboard** - Manage your job postings
- ⭐ **Featured Listings** - Highlight your most important positions
- 📈 **Analytics** - Track application metrics

### Technical Features
- ⚡ **Fast Loading** - Optimized performance with Vite
- 🔒 **Secure Authentication** - Supabase-powered auth system
- 🎨 **Modern UI** - Beautiful design with Tailwind CSS
- 📱 **Responsive** - Works perfectly on all screen sizes
- 🔍 **SEO Optimized** - Search engine friendly

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (optional - works with mock data)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/rakeshnirzari1/wsjfinal.git
cd wsjfinal
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables** (optional)
```bash
# Create .env file
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Start development server**
```bash
npm run dev
```

5. **Open your browser**
Visit `http://localhost:5173`

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **Deployment**: Netlify
- **Version Control**: Git + GitHub

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── JobCard.tsx     # Job listing card
│   ├── JobsPage.tsx    # Main jobs listing page
│   └── ...
├── hooks/              # Custom React hooks
│   ├── useAuth.ts      # Authentication hook
│   └── useSubscription.ts
├── lib/                # Utility libraries
│   └── supabase.ts     # Supabase configuration
├── data/               # Mock data and constants
├── types/              # TypeScript definitions
└── main.tsx           # Application entry point
```

## 🌐 Deployment

### Automatic Deployment
This project is configured for automatic deployment to Netlify:

1. **Push to main branch** → Automatic deployment
2. **Pull requests** → Preview deployments
3. **Custom domain** → westernsydneyjobs.com.au

### Manual Deployment
```bash
npm run build
# Upload 'dist' folder to your hosting provider
```

## 🔧 Configuration

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Setup
1. Create a Supabase project
2. Run the migrations in `supabase/migrations/`
3. Set up your environment variables
4. Configure Stripe webhooks (optional)

## 📊 Performance

- ⚡ **Lighthouse Score**: 95+ across all metrics
- 🚀 **First Contentful Paint**: < 1.5s
- 📱 **Mobile Optimized**: Perfect mobile experience
- 🔄 **Caching**: Optimized cache headers

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** for the backend infrastructure
- **Tailwind CSS** for the beautiful styling
- **Vite** for the lightning-fast build tool
- **React** for the amazing frontend framework

## 📞 Support

- **Website**: [westernsydneyjobs.com.au](https://westernsydneyjobs.com.au)
- **Email**: support@westernsydneyjobs.com.au
- **GitHub Issues**: [Report a bug](https://github.com/rakeshnirzari1/wsjfinal/issues)

---

**🎉 Ready to find your dream job in Western Sydney? Visit [westernsydneyjobs.com.au](https://westernsydneyjobs.com.au) today!**