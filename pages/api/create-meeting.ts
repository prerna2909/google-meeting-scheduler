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

    // For scheduled meetings, validate the time is in the future
    if (!isInstant && scheduledTime) {
      const scheduledDate = new Date(scheduledTime)
      const now = new Date()
      
      if (scheduledDate <= now) {
        return res.status(400).json({ 
          message: 'Scheduled time must be in the future'
        })
      }
    }

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

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    // If refresh token is missing, proceed anyway (for testing)
    if (!token.refreshToken) {
      console.log('WARNING: No refresh token - tokens may expire')
    }

    let meetingData;

    if (isInstant) {
      // For instant meetings, just create a Meet link without calendar event
      console.log('Creating instant meeting without calendar event...')
      
      // Generate a simple meeting ID for instant meetings
      const meetingId = Math.random().toString(36).substring(7)
      
      meetingData = {
        id: `instant_${meetingId}`,
        title: title || 'Instant Meeting',
        meetLink: `https://meet.google.com/${meetingId}`, // Simple Meet link
        scheduledTime: null,
        isInstant: true,
        createdAt: new Date().toISOString()
      }
      
      console.log('Instant meeting created (no calendar event)')
    } else {
      // For scheduled meetings, create calendar event with Meet link
      console.log('Creating scheduled meeting with calendar event...')
      
      const startTime = new Date(scheduledTime)
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000) // 1 hour duration

      const event = {
        summary: title || 'Scheduled Meeting',
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'UTC', // Store in UTC, but will display in user's timezone
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

      // Create the calendar event
      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        conferenceDataVersion: 1
      })

      meetingData = {
        id: response.data.id,
        title: event.summary,
        meetLink: response.data.conferenceData?.entryPoints?.[0]?.uri || response.data.hangoutLink,
        scheduledTime: startTime.toISOString(),
        isInstant: false,
        createdAt: new Date().toISOString()
      }
      
      console.log('Scheduled meeting created with calendar event')
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