# Edupaila Community Platform

## Overview
The Edupaila Community Platform is a web application designed to facilitate communication and collaboration among users. This project includes an admin authentication system that utilizes email login and OTP (One-Time Password) verification for enhanced security.

## Features
- Admin login using email and OTP verification.
- User registration and management.
- Q&A functionality for community engagement.
- Responsive design for both desktop and mobile users.

## Project Structure
```
smtpemail
├── src
│   ├── app
│   │   ├── api
│   │   │   └── admin
│   │   │       └── auth
│   │   │           ├── request-otp
│   │   │           │   └── route.ts
│   │   │           └── verify-otp
│   │   │               └── route.ts
│   │   ├── admin
│   │   │   ├── login
│   │   │   │   └── page.tsx
│   │   │   └── verify
│   │   │       └── page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components
│   │   ├── AdminLoginForm.tsx
│   │   ├── AdminOTPVerification.tsx
│   │   └── AdminPanel.tsx
│   ├── lib
│   │   ├── mailer.ts
│   │   └── otp.ts
│   ├── models
│   │   ├── Admin.ts
│   │   └── Email.ts
│   ├── middleware
│   │   └── adminAuth.ts
│   └── utils
│       └── rateLimiter.ts
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   cd smtpemail
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` and fill in the required values, including SMTP settings and secret keys.

## Usage
1. Start the development server:
   ```
   npm run dev
   ```

2. Access the application at `http://localhost:3000`.

## Admin Authentication
- Admins can log in using their email address.
- An OTP will be sent to the registered email for verification.
- After entering the OTP, admins will gain access to the admin panel.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.