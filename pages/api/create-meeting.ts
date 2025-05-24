import { NextApiRequest, NextApiResponse } from 'next'
import { getToken } from 'next-auth/jwt'
import { google } from 'googleapis'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const token = await getToken({ req })
    
    if (!token || !token.accessToken) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { title, scheduledTime, isInstant } = req.body

    // Set up Google Calendar API
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )

    oauth2Client.setCredentials({
      access_token: token.accessToken as string,
      refresh_token: token.refreshToken as string
    })

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

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

    // Create the event
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      conferenceDataVersion: 1
    })

    const meetingData = {
      id: response.data.id,
      title: event.summary,
      meetLink: response.data.conferenceData?.entryPoints?.[0]?.uri || response.data.hangoutLink,
      scheduledTime: isInstant ? null : startTime,
      isInstant,
      createdAt: new Date()
    }

    res.status(200).json(meetingData)
  } catch (error) {
    console.error('Error creating meeting:', error)
    res.status(500).json({ 
      message: 'Failed to create meeting',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}