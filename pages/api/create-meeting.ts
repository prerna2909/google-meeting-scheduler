import { NextApiRequest, NextApiResponse } from 'next'
import { getToken } from 'next-auth/jwt'
import { google } from 'googleapis'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== API CALL START ===')
  console.log('Method:', req.method)

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    console.log('Token result:', {
      exists: !!token,
      hasAccessToken: !!token?.accessToken,
      hasRefreshToken: !!token?.refreshToken,
      email: token?.email
    })

    if (!token || !token.accessToken) {
      console.log('ERROR: No access token found')
      return res.status(401).json({ 
        message: 'Unauthorized - No access token found'
      })
    }

    const { title, scheduledTime, isInstant } = req.body
    console.log('Request body:', { title, scheduledTime, isInstant })

    // Set up Google Calendar API with automatic token refresh
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/api/auth/callback/google` : 'http://localhost:3000/api/auth/callback/google'
    )

    console.log('Setting credentials with refresh capability...')
    oauth2Client.setCredentials({
      access_token: token.accessToken as string,
      refresh_token: token.refreshToken as string
    })

    // Set up automatic token refresh
    oauth2Client.on('tokens', (tokens) => {
      console.log('New tokens received:', {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token
      })
      // Note: In a real app, you'd want to save these new tokens back to the session/database
    })

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    // Test the credentials first by making a simple API call
    console.log('Testing credentials...')
    try {
      await calendar.calendarList.list({ maxResults: 1 })
      console.log('Credentials are valid')
    } catch (credError) {
      console.log('Credential test failed:', credError instanceof Error ? credError.message : 'Unknown error')
      console.log('Attempting refresh...')
      
      // Try to refresh the token
      try {
        const { credentials } = await oauth2Client.refreshAccessToken()
        oauth2Client.setCredentials(credentials)
        console.log('Token refreshed successfully')
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError)
        return res.status(401).json({ 
          message: 'Authentication failed - please sign in again',
          error: 'Token refresh failed'
        })
      }
    }

    // Prepare event data
    const startTime = isInstant ? new Date() : new Date(scheduledTime)
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000) // 1 hour duration

    const event = {
      summary: title || (isInstant ? 'Instant Meeting' : 'Scheduled Meeting'),
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'UTC',
      },
      conferenceData: {
        createRequest: {
          requestId: Math.random().toString(36).substring(7),
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      }
    }

    console.log('Creating calendar event...')
    // Create the event
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      conferenceDataVersion: 1
    })

    console.log('Calendar event created successfully')
    const meetingData = {
      id: response.data.id,
      title: event.summary,
      meetLink: response.data.conferenceData?.entryPoints?.[0]?.uri || response.data.hangoutLink,
      scheduledTime: isInstant ? null : startTime,
      isInstant,
      createdAt: new Date()
    }

    console.log('=== API CALL SUCCESS ===')
    res.status(200).json(meetingData)
  } catch (error) {
    console.error('=== API CALL ERROR ===')
    console.error('Error details:', error)
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error')
    
    res.status(500).json({ 
      message: 'Failed to create meeting',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}