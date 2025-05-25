# Google SSO Meeting Scheduler

A Next.js application that allows users to create instant and scheduled Google Meet meetings through Google SSO authentication. Users can create meetings directly in their Google Calendar with automatic Google Meet links.

## 🚀 Live Application

**Working application accessible via URL**: https://google-meeting-scheduler.vercel.app/.

## Features

- **Google SSO Authentication** - Secure sign-in with Google accounts
- **Instant Meetings** - Create meetings that start immediately
- **Scheduled Meetings** - Plan meetings for future dates and times
- **Google Calendar Integration** - Meetings are automatically added to your Google Calendar
- **Google Meet Links** - Automatic generation of Google Meet conference links
- **Meeting Management** - View all created meetings with join and copy link options
- **Responsive Design** - Clean, simple interface that works on all devices

## Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **Authentication**: NextAuth.js with Google Provider
- **State Management**: Redux Toolkit
- **Styling**: TailwindCSS with custom CSS
- **APIs**: Google Calendar API, Google OAuth2
- **Date Handling**: date-fns library

## Setup and Deployment Instructions

### Prerequisites

- Node.js 18+ installed
- Google Cloud Console account
- Git repository (GitHub/GitLab/Bitbucket)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone [your-repo-url]
   cd google-sso-meeting-scheduler
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Google OAuth**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google Calendar API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

4. **Environment Variables**
   Create a `.env.local` file in the root directory:
   ```env
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

### Production Deployment on Vercel

1. **Prepare for deployment**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel**
   - Connect your Git repository to Vercel
   - Vercel auto-detects Next.js configuration
   - Add environment variables in Vercel dashboard
   - Deploy automatically triggers

3. **Update Google OAuth settings**
   - Add your Vercel URL to authorized redirect URIs
   - Format: `https://your-app.vercel.app/api/auth/callback/google`

4. **Environment Variables for Production**
   ```env
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=https://your-app.vercel.app
   ```

## Architectural Decisions and Assumptions

### Architecture Decisions

1. **Next.js Framework Choice**
   - Chosen for its built-in API routes, SSR capabilities, and excellent developer experience
   - TypeScript integration provides type safety and better development experience

2. **NextAuth.js for Authentication**
   - Industry-standard authentication library for Next.js
   - Simplifies OAuth flow implementation with Google
   - Handles token management and session persistence

3. **Redux Toolkit for State Management**
   - Provides predictable state management for meeting data
   - Simplifies complex state updates with built-in immutability
   - Easy to debug and test

4. **Google Calendar API Integration**
   - Direct integration ensures meetings are properly scheduled in user's calendar
   - Automatic Google Meet link generation through conferenceData
   - Utilizes user's existing Google ecosystem

5. **Component Structure**
   - Single-page application design for simplicity
   - Separation of concerns with API routes handling business logic
   - Reusable styling patterns with CSS classes

### Assumptions Made

1. **User Requirements**
   - Users have Google accounts and are comfortable with Google SSO
   - Meetings default to 1-hour duration (can be easily modified)
   - Users primarily need basic meeting scheduling functionality

2. **Technical Assumptions**
   - Modern browser support (ES6+, modern JavaScript APIs)
   - Users have stable internet connection for API calls
   - Google Calendar API remains stable and accessible

3. **Business Logic Assumptions**
   - Instant meetings start immediately upon creation
   - All meetings are automatically added to primary calendar
   - Meeting links remain valid as long as Google Meet supports them
   - UTC timezone handling for consistent scheduling

4. **Scope Limitations**
   - No meeting editing functionality in current MVP
   - No meeting deletion from the application
   - No invitation management system
   - No recurring meeting support

## Limitations of the MVP Scope

### Current Limitations

1. **Meeting Management**
   - Cannot edit existing meetings from the application
   - Cannot delete meetings through the interface
   - No bulk operations for multiple meetings

2. **User Experience**
   - No real-time notifications for upcoming meetings
   - Limited meeting duration options (fixed 1-hour)
   - No meeting reminder system

3. **Advanced Features**
   - No recurring meeting support
   - No meeting invitation management
   - No integration with other calendar systems
   - No meeting analytics or reporting

4. **Scalability Considerations**
   - Client-side state management (meetings not persisted in database)
   - No user role management or admin features
   - Limited error handling for edge cases

5. **Mobile Optimization**
   - Basic responsive design but not fully mobile-optimized
   - No native mobile app version

### Future Enhancement Opportunities

- Database integration for meeting persistence
- Meeting editing and deletion functionality
- Advanced scheduling options (recurring meetings, multiple durations)
- Integration with other calendar providers
- Real-time notifications and reminders
- Meeting analytics and usage reports
- Enhanced mobile experience
- Team collaboration features

## API Endpoints

- `POST /api/create-meeting` - Creates instant or scheduled meetings
- `GET /api/auth/[...nextauth]` - Handles Google OAuth authentication

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is private and proprietary.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
