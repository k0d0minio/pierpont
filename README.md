# HORECA Pierpont - Schedule Manager

A Progressive Web Application (PWA) for managing schedules between Pierpont Golf Course reception and the bar/restaurant operations. This application facilitates communication and coordination between two separate business entities that share the same customer base.

## Features

- **Schedule Management**: View and manage daily schedules for golf course and restaurant operations
- **Mobile-First Design**: Optimized for mobile phones and tablets
- **Progressive Web App**: Installable on mobile devices with offline capabilities
- **Real-time Updates**: Live synchronization between reception and restaurant teams
- **Admin Access**: Secure admin panel for schedule modifications

## PWA Features

- **Installable**: Add to home screen on mobile devices
- **Offline Support**: Basic functionality available without internet connection
- **Responsive Design**: Works seamlessly across all device sizes
- **App-like Experience**: Full-screen mode and native app feel

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Mobile Installation

1. Open the application in your mobile browser
2. Look for the "Add to Home Screen" prompt or use your browser's menu
3. Follow the installation prompts
4. The app will be available as a native-like application on your device

## Technology Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Supabase
- **PWA**: Service Worker, Web App Manifest
- **Icons**: SVG-based responsive icons with dark/light mode support

## Environment Variables

Create a `.env.local` file with the following variables:

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_EDIT_CODE=your_admin_password
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

Private - Pierpont Golf Course