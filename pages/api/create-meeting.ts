// pages/api/create-meeting.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'
import { google } from 'googleapis'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session?.accessToken) {
      return res.status(401).json({ message: 'Not authenticated' })
    }

    const { title, scheduledTime, isInstant } = req.body

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )
    oauth2Client.setCredentials({
      access_token: session.accessToken
    })

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    interface EventData {
      summary: string
      conferenceData: {
        createRequest: {
          requestId: string
          conferenceSolutionKey: {
            type: string
          }
        }
      }
      attendees: Array<{
        email: string | null | undefined
      }>
      start: {
        dateTime: string
        timeZone: string
      }
      end: {
        dateTime: string
        timeZone: string
      }
    }

    let startTime: Date
    let endTime: Date

    if (isInstant) {
      // For instant meetings, start in 2 minutes to avoid validation issues
      const now = new Date()
      startTime = new Date(now.getTime() + 120000) // Start in 2 minutes
      endTime = new Date(startTime.getTime() + 3600000) // 1 hour duration
    } else {
      // Scheduled meetings
      startTime = new Date(scheduledTime)
      endTime = new Date(startTime.getTime() + 3600000) // 1 hour duration
    }

    const eventData: EventData = {
      summary: title,
      conferenceData: {
        createRequest: {
          requestId: `meeting-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      },
      attendees: [
        {
          email: session.user?.email
        }
      ],
      start: {
        dateTime: startTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    }

    const response = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      requestBody: eventData
    })

    const event = response.data
    
    const meetLink = event.conferenceData?.entryPoints?.find(
      (entry) => entry.entryPointType === 'video'
    )?.uri

    if (!meetLink) {
      throw new Error('Failed to generate Google Meet link')
    }

    const meetingData = {
      id: event.id,
      title: event.summary,
      meetLink: meetLink,
      scheduledTime: isInstant ? null : scheduledTime,
      isInstant: isInstant,
      calendarEventId: event.id
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