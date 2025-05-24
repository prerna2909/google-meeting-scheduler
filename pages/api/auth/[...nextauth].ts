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
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/calendar'
        }
      }
    })
  ],
  callbacks: {
     async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token as string | undefined
        token.refreshToken = account.refresh_token as string | undefined
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.refreshToken = token.refreshToken
      return session
    }
  },
  pages: {
    signIn: '/',
  }
})