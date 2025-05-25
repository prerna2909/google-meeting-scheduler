import { useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../store'
import { addMeeting, setLoading, setError } from '../store'
import { format } from 'date-fns'

export default function Home() {
 const { data: session, status } = useSession()

    // Add debugging - remove this after fixing
    console.log('Client session:', {
    status,
    hasSession: !!session,
    hasAccessToken: !!session?.accessToken,
    userEmail: session?.user?.email
    })
  const dispatch = useDispatch()
  const { meetings, loading, error } = useSelector((state: RootState) => state.meetings)
  
  const [scheduledTitle, setScheduledTitle] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')

  // Get current date and time for validation
  const now = new Date()
  const currentDate = now.toISOString().split('T')[0] // YYYY-MM-DD format
  const currentTime = now.toTimeString().slice(0, 5) // HH:MM format

  const createInstantMeeting = async () => {
    dispatch(setLoading(true))
    dispatch(setError(null))

    try {
      const response = await fetch('/api/create-meeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Instant Meeting',
          isInstant: true
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create meeting')
      }

      const meetingData = await response.json()
      dispatch(addMeeting(meetingData))
    } catch (err) {
      dispatch(setError(err instanceof Error ? err.message : 'Failed to create meeting'))
    } finally {
      dispatch(setLoading(false))
    }
  }

  const validateScheduledTime = () => {
    if (!scheduledDate || !scheduledTime) {
      return 'Please select both date and time'
    }

    const selectedDateTime = new Date(`${scheduledDate}T${scheduledTime}`)
    const now = new Date()

    if (selectedDateTime <= now) {
      return 'Please select a future date and time'
    }

    return null
  }

  const createScheduledMeeting = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!scheduledTitle.trim()) {
      dispatch(setError('Please enter a meeting title'))
      return
    }

    const timeValidationError = validateScheduledTime()
    if (timeValidationError) {
      dispatch(setError(timeValidationError))
      return
    }

    // Combine date and time - this will be in user's local timezone
    const scheduledDateTime = `${scheduledDate}T${scheduledTime}`

    dispatch(setLoading(true))
    dispatch(setError(null))

    try {
      const response = await fetch('/api/create-meeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: scheduledTitle,
          scheduledTime: scheduledDateTime,
          isInstant: false
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create scheduled meeting')
      }

      const meetingData = await response.json()
      dispatch(addMeeting(meetingData))
      setScheduledTitle('')
      setScheduledDate('')
      setScheduledTime('')
    } catch (err) {
      dispatch(setError(err instanceof Error ? err.message : 'Failed to create meeting'))
    } finally {
      dispatch(setLoading(false))
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Meeting link copied to clipboard!')
  }

  // Get user's timezone for display
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  if (status === 'loading') {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <div className="simple-card" style={{ maxWidth: '400px', margin: '0 auto' }}>
          <h1>Meeting Scheduler</h1>
          <p>Sign in with Google to create and schedule meetings</p>
          <button
            onClick={() => signIn('google')}
            className="simple-button primary"
            style={{ width: '100%' }}
          >
            Sign in with Google
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Simple Header */}
      <div className="simple-header" style={{ backgroundColor: 'white', padding: '15px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0 }}>Meeting Scheduler</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span>Welcome, {session.user?.name}</span>
            <button
              onClick={() => signOut()}
              className="simple-button"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Timezone Info */}
        <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#e8f4fd', borderRadius: '4px', fontSize: '14px' }}>
          <strong>Timezone:</strong> {userTimezone} | All times are in your local timezone
        </div>

        {error && (
          <div className="simple-alert">
            {error}
          </div>
        )}

        {/* Meeting Creation Grid */}
        <div className="simple-grid">
          {/* Instant Meeting */}
          <div className="simple-card">
            <div className="card-content">
              <h2>Instant Meeting</h2>
              <p>Create a meeting link that can be used immediately</p>
              <p style={{ fontSize: '14px', color: '#666', fontStyle: 'italic' }}>
                Note: Instant meetings are not added to your calendar
              </p>
              <div className="card-button-container">
                <button
                  onClick={createInstantMeeting}
                  disabled={loading}
                  className="simple-button success"
                  style={{ width: '100%' }}
                >
                  {loading ? 'Creating Meeting...' : 'Create Instant Meeting'}
                </button>
              </div>
            </div>
          </div>

          {/* Scheduled Meeting */}
          <div className="simple-card">
            <div className="card-content">
              <h2>Schedule Meeting</h2>
              <p style={{ fontSize: '14px', color: '#666', fontStyle: 'italic', marginBottom: '15px' }}>
                Creates a calendar event with Google Meet link
              </p>
              <form onSubmit={createScheduledMeeting} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '15px' }}>
                    <label className="simple-label">Meeting Title</label>
                    <input
                      type="text"
                      value={scheduledTitle}
                      onChange={(e) => setScheduledTitle(e.target.value)}
                      className="simple-input"
                      placeholder="Enter meeting title"
                      required
                    />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label className="simple-label">Date</label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => {
                        setScheduledDate(e.target.value)
                        // Clear error when user changes date
                        if (error && error.includes('future')) {
                          dispatch(setError(null))
                        }
                      }}
                      min={currentDate}
                      className="simple-input"
                      required
                    />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label className="simple-label">Time</label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => {
                        setScheduledTime(e.target.value)
                        // Clear error when user changes time
                        if (error && error.includes('future')) {
                          dispatch(setError(null))
                        }
                      }}
                      min={scheduledDate === currentDate ? currentTime : undefined}
                      className="simple-input"
                      required
                    />
                  </div>
                </div>
                <div className="card-button-container">
                  <button
                    type="submit"
                    disabled={loading}
                    className="simple-button primary"
                    style={{ width: '100%' }}
                  >
                    {loading ? 'Scheduling Meeting...' : 'Schedule Meeting'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Meetings List */}
        {meetings.length > 0 && (
          <div className="simple-card" style={{ marginTop: '30px' }}>
            <h2>Your Meetings ({meetings.length})</h2>
            {meetings.map((meeting) => (
              <div key={meeting.id} className="meeting-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <h3 style={{ margin: '0 0 5px 0' }}>{meeting.title}</h3>
                  <span className={`meeting-badge ${meeting.isInstant ? 'instant' : 'scheduled'}`}>
                    {meeting.isInstant ? 'Instant' : 'Scheduled'}
                  </span>
                </div>
                {meeting.scheduledTime && (
                  <p style={{ margin: '5px 0', color: '#666' }}>
                    Scheduled for: {format(new Date(meeting.scheduledTime), 'PPp')}
                  </p>
                )}
                {meeting.isInstant && (
                  <p style={{ margin: '5px 0', color: '#666', fontSize: '14px', fontStyle: 'italic' }}>
                    Available for immediate use (not on calendar)
                  </p>
                )}
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <a
                    href={meeting.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="simple-button primary"
                    style={{ textDecoration: 'none' }}
                  >
                    Join Meeting
                  </a>
                  <button
                    onClick={() => copyToClipboard(meeting.meetLink)}
                    className="simple-button"
                  >
                    Copy Link
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {meetings.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <h3>No meetings yet</h3>
            <p>Create your first meeting using the options above</p>
          </div>
        )}
      </div>
    </div>
  )
}