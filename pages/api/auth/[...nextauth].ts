import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

declare module "next-auth" {
  interface Session {
    accessToken?: string
    refreshToken?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    refreshToken?: string
  }
}

export default NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/calendar',
          access_type: 'offline', // This is crucial for getting refresh tokens
          prompt: 'select_account consent', // Force account selection and consent every time
        }
      }
    })
  ],
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  callbacks: {
    async jwt({ token, account }) {
      console.log('JWT Callback - Token exists:', !!token, 'Account exists:', !!account)
      if (account) {
        console.log('JWT Callback - Account data:', {
          hasAccessToken: !!account.access_token,
          hasRefreshToken: !!account.refresh_token,
          scope: account.scope
        })
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
      }
      console.log('JWT Callback - Final token:', {
        hasAccessToken: !!token.accessToken,
        hasRefreshToken: !!token.refreshToken
      })
      return token
    },
    async session({ session, token }) {
      console.log('Session Callback - Input:', {
        hasSession: !!session,
        hasToken: !!token,
        tokenHasAccess: !!token.accessToken,
        tokenHasRefresh: !!token.refreshToken
      })
      session.accessToken = token.accessToken
      session.refreshToken = token.refreshToken
      console.log('Session Callback - Final session:', {
        hasAccessToken: !!session.accessToken,
        hasRefreshToken: !!session.refreshToken
      })
      return session
    }
  },
  pages: {
    signIn: '/',
  }
})